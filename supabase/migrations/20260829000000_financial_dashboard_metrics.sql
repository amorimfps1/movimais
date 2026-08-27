-- Migration: Financial Dashboard Metrics, RLS Policies, and Optimized Views/Functions
-- MOVI+ MCJB

-- 1. Assegurar que as políticas de RLS da tabela 'pagamentos' restrinjam acesso apenas à Secretaria e Coordenação
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin total pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "open_all" ON public.pagamentos;

CREATE POLICY "Admin total pagamentos"
  ON public.pagamentos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. View Otimizada: Arrecadação Consolidada por Modalidade
-- Regra: Consolida todo o valor pago (mensalidades, taxas de matrícula, reposições, materiais, ajustes)
CREATE OR REPLACE VIEW public.view_arrecadacao_modalidades
WITH (security_invoker = true)
AS
SELECT
  m.id AS id_modalidade,
  m.nome_modalidade,
  m.area,
  COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS total_receita,
  COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) = 'MENSALIDADE' THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS total_mensalidades,
  COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) = 'TAXA_MATRICULA' THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS total_taxas_matricula,
  COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) NOT IN ('MENSALIDADE', 'TAXA_MATRICULA') THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS total_outros,
  COUNT(p.id) FILTER (WHERE p.status_pagamento = 'PAGO')::int AS total_transacoes,
  COUNT(DISTINCT mat.id) FILTER (WHERE UPPER(mat.status_matricula) = 'ATIVA')::int AS matriculas_ativas
FROM public.modalidades m
LEFT JOIN public.matriculas mat ON mat.id_modalidade = m.id
LEFT JOIN public.pagamentos p ON p.id_matricula = mat.id
GROUP BY m.id, m.nome_modalidade, m.area;

-- 3. View Otimizada: Repasse por Professor / Instrutor
-- REGRA CRÍTICA DE NEGÓCIO:
-- O valor atribuído ao professor inclui APENAS pagamentos com tipo_lancamento = 'MENSALIDADE' e status = 'PAGO'.
-- Taxas de matrícula, materiais e outros custos são retidos pela escola e NÃO entram no repasse.
CREATE OR REPLACE VIEW public.view_repasse_professores
WITH (security_invoker = true)
AS
SELECT
  i.id AS id_instrutor,
  i.nome_completo AS nome_instrutor,
  i.email,
  i.funcao,
  -- Total de mensalidades pagas sob a responsabilidade das turmas do instrutor
  COALESCE(SUM(
    CASE 
      WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) = 'MENSALIDADE' 
      THEN COALESCE(p.valor_pago, p.valor_previsto, 0) 
      ELSE 0 
    END
  ), 0)::numeric(12,2) AS total_mensalidades_arrecadadas,
  -- Total de taxas/extras NÃO repassados ao professor (retidos pela escola)
  COALESCE(SUM(
    CASE 
      WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) <> 'MENSALIDADE' 
      THEN COALESCE(p.valor_pago, p.valor_previsto, 0) 
      ELSE 0 
    END
  ), 0)::numeric(12,2) AS total_taxas_nao_repassadas,
  COUNT(DISTINCT t.id)::int AS total_turmas,
  COUNT(DISTINCT mat.id) FILTER (WHERE UPPER(mat.status_matricula) = 'ATIVA')::int AS total_alunos_ativos,
  COUNT(p.id) FILTER (WHERE p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) = 'MENSALIDADE')::int AS total_mensalidades_pagas_count
FROM public.instrutores i
LEFT JOIN public.turmas t ON t.id_instrutor = i.id
LEFT JOIN public.matriculas mat ON mat.id_turma = t.id
LEFT JOIN public.pagamentos p ON p.id_matricula = mat.id
GROUP BY i.id, i.nome_completo, i.email, i.funcao;

-- 4. View Otimizada: Matrículas Ativas por Modalidade
CREATE OR REPLACE VIEW public.view_matriculas_ativas_modalidades
WITH (security_invoker = true)
AS
SELECT
  m.id AS id_modalidade,
  m.nome_modalidade,
  m.area,
  COUNT(mat.id) FILTER (WHERE UPPER(mat.status_matricula) = 'ATIVA')::int AS matriculas_ativas,
  COUNT(mat.id)::int AS matriculas_total,
  ROUND(
    CASE 
      WHEN (SELECT COUNT(*) FROM public.matriculas WHERE UPPER(status_matricula) = 'ATIVA') > 0
      THEN (COUNT(mat.id) FILTER (WHERE UPPER(mat.status_matricula) = 'ATIVA')::numeric / (SELECT COUNT(*) FROM public.matriculas WHERE UPPER(status_matricula) = 'ATIVA') * 100)
      ELSE 0 
    END, 2
  )::numeric AS percentual
FROM public.modalidades m
LEFT JOIN public.matriculas mat ON mat.id_modalidade = m.id
GROUP BY m.id, m.nome_modalidade, m.area
ORDER BY matriculas_ativas DESC;

-- Permissões das Views
GRANT SELECT ON public.view_arrecadacao_modalidades TO authenticated;
GRANT SELECT ON public.view_repasse_professores TO authenticated;
GRANT SELECT ON public.view_matriculas_ativas_modalidades TO authenticated;

-- 5. Função RPC Agregadora Segura para o Dashboard Financeiro
-- Permite consultar métricas consolidadas com filtro opcional de ano e mês
CREATE OR REPLACE FUNCTION public.get_financial_dashboard_metrics(
  p_ano INT DEFAULT NULL,
  p_mes INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_receita_total NUMERIC := 0;
  v_repasse_total NUMERIC := 0;
  v_taxas_total NUMERIC := 0;
  v_novas_matriculas INT := 0;
  v_pagamentos_pagos_count INT := 0;
  v_pagamentos_pendentes_count INT := 0;
  v_taxa_adimplencia NUMERIC := 100;
  v_modalidades JSONB;
  v_professores JSONB;
  v_evolucao JSONB;
  v_filtro_ano INT := COALESCE(p_ano, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
  v_filtro_mes INT := COALESCE(p_mes, EXTRACT(MONTH FROM CURRENT_DATE)::INT);
BEGIN
  -- 1. Validação de Autorização: Apenas Coordenacao e Secretaria
  SELECT public.is_admin(auth.uid()) INTO v_is_authorized;
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores e secretários podem acessar os dados financeiros.';
  END IF;

  -- 2. Cálculos do Mês Selecionado
  SELECT
    COALESCE(SUM(CASE WHEN status_pagamento = 'PAGO' THEN COALESCE(valor_pago, valor_previsto, 0) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status_pagamento = 'PAGO' AND UPPER(tipo_lancamento) = 'MENSALIDADE' THEN COALESCE(valor_pago, valor_previsto, 0) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status_pagamento = 'PAGO' AND UPPER(tipo_lancamento) = 'TAXA_MATRICULA' THEN COALESCE(valor_pago, valor_previsto, 0) ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE status_pagamento = 'PAGO'),
    COUNT(*) FILTER (WHERE status_pagamento IN ('PENDENTE', 'ATRASADO', 'PREVISTO'))
  INTO
    v_receita_total,
    v_repasse_total,
    v_taxas_total,
    v_pagamentos_pagos_count,
    v_pagamentos_pendentes_count
  FROM public.pagamentos
  WHERE 
    (ano_referencia = v_filtro_ano OR (ano_referencia IS NULL AND EXTRACT(YEAR FROM COALESCE(data_pagamento, data_vencimento)) = v_filtro_ano))
    AND (mes_referencia = v_filtro_mes OR (mes_referencia IS NULL AND EXTRACT(MONTH FROM COALESCE(data_pagamento, data_vencimento)) = v_filtro_mes));

  -- Novas Matrículas no Mês
  SELECT COUNT(*)
  INTO v_novas_matriculas
  FROM public.matriculas
  WHERE 
    EXTRACT(YEAR FROM COALESCE(data_inicio, data_criacao, created_at)) = v_filtro_ano
    AND EXTRACT(MONTH FROM COALESCE(data_inicio, data_criacao, created_at)) = v_filtro_mes;

  -- Taxa de Adimplência
  IF (v_pagamentos_pagos_count + v_pagamentos_pendentes_count) > 0 THEN
    v_taxa_adimplencia := ROUND((v_pagamentos_pagos_count::numeric / (v_pagamentos_pagos_count + v_pagamentos_pendentes_count) * 100), 1);
  ELSE
    v_taxa_adimplencia := 100;
  END IF;

  -- 3. Lista de Modalidades Agregadas
  SELECT jsonb_agg(row_to_json(m))
  INTO v_modalidades
  FROM (
    SELECT * FROM public.view_arrecadacao_modalidades ORDER BY total_receita DESC
  ) m;

  -- 4. Lista de Repasse de Professores (apenas mensalidades)
  SELECT jsonb_agg(row_to_json(p))
  INTO v_professores
  FROM (
    SELECT * FROM public.view_repasse_professores ORDER BY total_mensalidades_arrecadadas DESC
  ) p;

  -- 5. Evolução Mensal (Últimos 12 meses)
  SELECT jsonb_agg(row_to_json(e))
  INTO v_evolucao
  FROM (
    SELECT
      TO_CHAR(COALESCE(p.data_pagamento, p.data_vencimento, p.created_at::date), 'YYYY-MM') AS mes_ano,
      TO_CHAR(COALESCE(p.data_pagamento, p.data_vencimento, p.created_at::date), 'Mon/YY') AS mes_label,
      EXTRACT(YEAR FROM COALESCE(p.data_pagamento, p.data_vencimento, p.created_at::date))::INT AS ano,
      EXTRACT(MONTH FROM COALESCE(p.data_pagamento, p.data_vencimento, p.created_at::date))::INT AS mes,
      COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS receita_total,
      COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) = 'MENSALIDADE' THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS receita_mensalidades,
      COALESCE(SUM(CASE WHEN p.status_pagamento = 'PAGO' AND UPPER(p.tipo_lancamento) <> 'MENSALIDADE' THEN COALESCE(p.valor_pago, p.valor_previsto, 0) ELSE 0 END), 0)::numeric(12,2) AS receita_taxas_extras,
      COUNT(p.id) FILTER (WHERE p.status_pagamento = 'PAGO')::INT AS total_pagamentos
    FROM public.pagamentos p
    WHERE p.status_pagamento = 'PAGO'
    GROUP BY 1, 2, 3, 4
    ORDER BY 3 DESC, 4 DESC
    LIMIT 12
  ) e;

  -- Retorno Consolidado
  RETURN jsonb_build_object(
    'kpis', jsonb_build_object(
      'receita_total_mes', v_receita_total,
      'total_repassar_professores_mes', v_repasse_total,
      'total_taxas_matricula_mes', v_taxas_total,
      'total_novas_matriculas_mes', v_novas_matriculas,
      'taxa_adimplencia_mes', v_taxa_adimplencia,
      'pagamentos_liquidados_mes_count', v_pagamentos_pagos_count,
      'pagamentos_pendentes_mes_count', v_pagamentos_pendentes_count,
      'ticket_medio', CASE WHEN v_novas_matriculas > 0 THEN ROUND(v_receita_total / v_novas_matriculas, 2) ELSE 0 END
    ),
    'modalidades', COALESCE(v_modalidades, '[]'::jsonb),
    'professores_repasse', COALESCE(v_professores, '[]'::jsonb),
    'evolucao_mensal', COALESCE(v_evolucao, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_dashboard_metrics(INT, INT) TO authenticated;

