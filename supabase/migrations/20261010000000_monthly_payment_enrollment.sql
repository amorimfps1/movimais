-- A taxa de matrícula não ativa a inscrição. Somente uma mensalidade quitada
-- pode ativá-la; vencimento de mensalidade em aberto gera inadimplência.
BEGIN;

CREATE INDEX IF NOT EXISTS pagamentos_mensalidade_matricula_idx
ON public.pagamentos (id_matricula, data_vencimento)
WHERE tipo_lancamento = 'MENSALIDADE';

CREATE OR REPLACE FUNCTION public.matricula_payment_flags(_matricula_id text)
RETURNS TABLE (mensalidade_paga boolean, mensalidade_vencida boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.pagamentos p
      WHERE p.id_matricula = _matricula_id
        AND p.tipo_lancamento = 'MENSALIDADE'
        AND p.status_pagamento = 'PAGO'
        AND p.data_pagamento IS NOT NULL
        AND p.valor_previsto > 0
        AND p.valor_pago >= p.valor_previsto
    ),
    EXISTS (
      SELECT 1 FROM public.pagamentos p
      WHERE p.id_matricula = _matricula_id
        AND p.tipo_lancamento = 'MENSALIDADE'
        AND p.data_vencimento < (now() AT TIME ZONE 'America/Sao_Paulo')::date
        AND NOT COALESCE((
          p.status_pagamento = 'PAGO'
          AND p.data_pagamento IS NOT NULL
          AND p.valor_previsto > 0
          AND p.valor_pago >= p.valor_previsto
        ), false)
    );
$$;

REVOKE ALL ON FUNCTION public.matricula_payment_flags(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_monthly_payment()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
DECLARE
  enrollment_student text;
BEGIN
  IF NEW.tipo_lancamento = 'MENSALIDADE' THEN
    IF NEW.id_matricula IS NULL OR NEW.data_vencimento IS NULL THEN
      RAISE EXCEPTION 'Mensalidade exige matrícula e data de vencimento.';
    END IF;
    SELECT id_aluno INTO enrollment_student
    FROM public.matriculas WHERE id = NEW.id_matricula;
    IF NEW.id_aluno IS DISTINCT FROM enrollment_student THEN
      RAISE EXCEPTION 'O aluno da mensalidade deve ser o aluno da matrícula.';
    END IF;
    IF NEW.status_pagamento = 'PAGO' AND NOT COALESCE((
      NEW.data_pagamento IS NOT NULL AND NEW.valor_previsto > 0
      AND NEW.valor_pago >= NEW.valor_previsto
    ), false) THEN
      RAISE EXCEPTION 'Mensalidade paga exige data e valor integral recebido.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_monthly_payment ON public.pagamentos;
CREATE TRIGGER trg_validate_monthly_payment
BEFORE INSERT OR UPDATE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.validate_monthly_payment();

-- Mantém as colunas gravadas coerentes quando a matrícula ou um pagamento muda.
-- Estados administrativos (cancelamento, conclusão, suspensão e experimental)
-- continuam sob controle da secretaria.
CREATE OR REPLACE FUNCTION public.enforce_matricula_payment_state()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  flags record;
BEGIN
  IF NEW.status_matricula IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')
     OR NEW.status_matricula IS NULL THEN
    SELECT * INTO flags FROM public.matricula_payment_flags(NEW.id);
    IF flags.mensalidade_vencida THEN
      NEW.status_matricula := 'BLOQUEADA_INADIMPLENCIA';
      NEW.liberado_para_aula := false;
    ELSIF flags.mensalidade_paga THEN
      IF NEW.status_matricula IN ('PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA') THEN
        NEW.liberado_para_aula := true;
      END IF;
      NEW.status_matricula := 'ATIVA';
    ELSE
      NEW.status_matricula := 'PENDENTE_LIBERACAO';
      NEW.liberado_para_aula := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_matricula_payment_state ON public.matriculas;
CREATE TRIGGER trg_enforce_matricula_payment_state
BEFORE INSERT OR UPDATE ON public.matriculas
FOR EACH ROW EXECUTE FUNCTION public.enforce_matricula_payment_state();

CREATE OR REPLACE FUNCTION public.refresh_matricula_after_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.id_matricula IS NOT NULL THEN
    UPDATE public.matriculas SET status_matricula = status_matricula
    WHERE id = OLD.id_matricula;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.id_matricula IS NOT NULL THEN
      UPDATE public.matriculas SET status_matricula = status_matricula
      WHERE id = NEW.id_matricula;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.id_matricula IS DISTINCT FROM OLD.id_matricula THEN
    IF NEW.id_matricula IS NOT NULL THEN
      UPDATE public.matriculas SET status_matricula = status_matricula
      WHERE id = NEW.id_matricula;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_matricula_after_payment ON public.pagamentos;
CREATE TRIGGER trg_refresh_matricula_after_payment
AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.refresh_matricula_after_payment();

-- Data de vencimento pode passar sem qualquer escrita. Esta view calcula a
-- situação no momento da leitura e respeita o RLS das tabelas de origem.
CREATE OR REPLACE VIEW public.matriculas_situacao
WITH (security_invoker = true, security_barrier = true)
AS
SELECT m.*,
       CASE
         WHEN m.status_matricula NOT IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')
           THEN m.status_matricula
         WHEN flags.mensalidade_vencida THEN 'BLOQUEADA_INADIMPLENCIA'
         WHEN flags.mensalidade_paga THEN 'ATIVA'
         ELSE 'PENDENTE_LIBERACAO'
       END AS situacao_atual,
       (m.liberado_para_aula IS TRUE
        AND NOT flags.mensalidade_vencida
        AND flags.mensalidade_paga
        AND m.status_matricula IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')) AS liberado_efetivo,
       flags.mensalidade_paga,
       flags.mensalidade_vencida
FROM public.matriculas m
CROSS JOIN LATERAL (
  SELECT
    EXISTS (
      SELECT 1 FROM public.pagamentos p
      WHERE p.id_matricula = m.id AND p.tipo_lancamento = 'MENSALIDADE'
        AND p.status_pagamento = 'PAGO' AND p.data_pagamento IS NOT NULL
        AND p.valor_previsto > 0 AND p.valor_pago >= p.valor_previsto
    ) AS mensalidade_paga,
    EXISTS (
      SELECT 1 FROM public.pagamentos p
      WHERE p.id_matricula = m.id AND p.tipo_lancamento = 'MENSALIDADE'
        AND p.data_vencimento < (now() AT TIME ZONE 'America/Sao_Paulo')::date
        AND NOT COALESCE((p.status_pagamento = 'PAGO' AND p.data_pagamento IS NOT NULL
                          AND p.valor_previsto > 0 AND p.valor_pago >= p.valor_previsto), false)
    ) AS mensalidade_vencida
) flags;

REVOKE ALL ON public.matriculas_situacao FROM PUBLIC, anon;
GRANT SELECT ON public.matriculas_situacao TO authenticated;

-- O diário expõe somente a situação necessária para o instrutor.
CREATE OR REPLACE FUNCTION public.matriculas_diario_rows()
RETURNS TABLE (
  id text, id_aluno text, id_turma text, status_matricula text,
  liberado_para_aula boolean, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT m.id, m.id_aluno, m.id_turma,
         CASE
           WHEN m.status_matricula NOT IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')
             THEN m.status_matricula
           WHEN flags.mensalidade_vencida THEN 'BLOQUEADA_INADIMPLENCIA'
           WHEN flags.mensalidade_paga THEN 'ATIVA'
           ELSE 'PENDENTE_LIBERACAO'
         END,
         (m.liberado_para_aula IS TRUE AND flags.mensalidade_paga
          AND NOT flags.mensalidade_vencida
          AND m.status_matricula IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')),
         m.created_at
  FROM public.matriculas m
  CROSS JOIN LATERAL public.matricula_payment_flags(m.id) flags
  WHERE auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'instrutor')
    AND public.instructor_can_access_turma(m.id_turma);
$$;

CREATE OR REPLACE FUNCTION public.matricula_eligible_for_attendance(
  _matricula_id text, _permite_experimental boolean
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT (m.status_matricula = 'EXPERIMENTAL' AND _permite_experimental IS TRUE)
      OR (m.status_matricula IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')
          AND m.liberado_para_aula IS TRUE
          AND flags.mensalidade_paga AND NOT flags.mensalidade_vencida)
    FROM public.matriculas m
    CROSS JOIN LATERAL public.matricula_payment_flags(m.id) flags
    WHERE m.id = _matricula_id
  ), false);
$$;

REVOKE ALL ON FUNCTION public.matricula_eligible_for_attendance(text, boolean)
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.salvar_chamada(
  _turma_id text,
  _data_aula date,
  _registros jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_turma public.turmas%ROWTYPE;
  v_total integer;
  v_distintos integer;
  v_elegiveis integer;
BEGIN
  IF auth.uid() IS NULL OR _turma_id IS NULL OR _data_aula IS NULL THEN
    RAISE EXCEPTION 'Turma, data e usuário autenticado são obrigatórios.';
  END IF;

  SELECT * INTO v_turma
  FROM public.turmas
  WHERE id = _turma_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada.';
  END IF;

  IF NOT public.is_admin(auth.uid())
     AND NOT (
       public.instructor_owns_turma(_turma_id)
       OR EXISTS (
         SELECT 1 FROM public.aulas AS a
         JOIN public.instrutores AS i ON i.id = a.id_instrutor
         WHERE a.id_turma = _turma_id
           AND a.data_aula = _data_aula
           AND i.user_id = auth.uid()
           AND public.has_role(auth.uid(), 'instrutor')
       )
     ) THEN
    RAISE EXCEPTION 'Sem permissão para registrar a chamada desta aula.';
  END IF;

  IF _registros IS NULL OR jsonb_typeof(_registros) <> 'array' THEN
    RAISE EXCEPTION 'A chamada deve ser uma lista de matrículas e presenças.';
  END IF;

  SELECT count(*), count(DISTINCT id_matricula)
  INTO v_total, v_distintos
  FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean);

  IF v_total = 0 OR v_total <> v_distintos OR EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean)
    WHERE r.id_matricula IS NULL OR r.presenca IS NULL
  ) THEN
    RAISE EXCEPTION 'Marque a presença de cada matrícula uma única vez.';
  END IF;

  SELECT count(*) INTO v_elegiveis
  FROM public.matriculas AS m
  WHERE m.id_turma = _turma_id
    AND public.matricula_eligible_for_attendance(m.id, v_turma.permite_experimental);

  IF v_total <> v_elegiveis OR EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean)
    LEFT JOIN public.matriculas AS m ON m.id = r.id_matricula
    WHERE m.id IS NULL OR m.id_turma IS DISTINCT FROM _turma_id
      OR NOT public.matricula_eligible_for_attendance(m.id, v_turma.permite_experimental)
  ) THEN
    RAISE EXCEPTION 'A lista de chamada mudou. Reabra a turma antes de salvar.';
  END IF;

  INSERT INTO public.presencas (
    id, data_aula, id_turma, id_matricula, id_aluno, presenca, tipo_registro
  )
  SELECT gen_random_uuid()::text, _data_aula, _turma_id,
         m.id, m.id_aluno, r.presenca, 'MANUAL'
  FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean)
  JOIN public.matriculas AS m ON m.id = r.id_matricula
  ON CONFLICT (id_turma, data_aula, id_matricula)
    WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
  DO UPDATE SET presenca = EXCLUDED.presenca;

  INSERT INTO public.aulas (
    id, id_turma, id_instrutor, data_aula, horario_inicio,
    horario_fim, status_aula
  ) VALUES (
    gen_random_uuid()::text, _turma_id, v_turma.id_instrutor,
    _data_aula, v_turma.horario_inicio, v_turma.horario_fim, 'REALIZADA'
  )
  ON CONFLICT (id_turma, data_aula) WHERE id_turma IS NOT NULL
  DO UPDATE SET status_aula = 'REALIZADA';
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_chamada(text, date, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_chamada(text, date, jsonb) TO authenticated;

-- Corrige estados legados conforme os lançamentos efetivamente vinculados.
UPDATE public.matriculas SET status_matricula = status_matricula
WHERE status_matricula IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA');

COMMIT;

