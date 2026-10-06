-- Execute no SQL Editor antes da migração 20261010000000.
-- Mostra matrículas cujo estado gravado será ajustado e mensalidades sem vínculo.
WITH situacao AS (
  SELECT m.id, m.id_aluno, m.status_matricula, m.liberado_para_aula,
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
  FROM public.matriculas m
  WHERE m.status_matricula IN ('ATIVA', 'PENDENTE_LIBERACAO', 'BLOQUEADA_INADIMPLENCIA')
)
SELECT id, id_aluno, status_matricula AS status_atual, liberado_para_aula,
       mensalidade_paga, mensalidade_vencida,
       CASE WHEN mensalidade_vencida THEN 'BLOQUEADA_INADIMPLENCIA'
            WHEN mensalidade_paga THEN 'ATIVA'
            ELSE 'PENDENTE_LIBERACAO' END AS status_apos_migracao
FROM situacao
WHERE status_matricula IS DISTINCT FROM
      CASE WHEN mensalidade_vencida THEN 'BLOQUEADA_INADIMPLENCIA'
           WHEN mensalidade_paga THEN 'ATIVA'
           ELSE 'PENDENTE_LIBERACAO' END
   OR (liberado_para_aula IS TRUE AND (mensalidade_vencida OR NOT mensalidade_paga))
ORDER BY id;

SELECT id, id_aluno, mes_referencia, ano_referencia, data_vencimento,
       status_pagamento, valor_previsto, valor_pago
FROM public.pagamentos
WHERE tipo_lancamento = 'MENSALIDADE' AND id_matricula IS NULL
ORDER BY data_vencimento DESC NULLS LAST;
