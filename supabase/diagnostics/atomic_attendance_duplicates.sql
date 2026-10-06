-- Consulta somente leitura para identificar duplicatas e divergências.
-- Execute no SQL Editor se a migração 20261007000000 for cancelada.
WITH presencas_duplicadas AS (
  SELECT 'presencas'::text AS origem, id_turma, data_aula, id_matricula,
    count(*) AS quantidade,
    count(DISTINCT jsonb_build_array(id_aluno, presenca, tipo_registro)) > 1 AS divergente,
    jsonb_agg(jsonb_build_object(
      'id', id, 'id_aluno', id_aluno, 'presenca', presenca,
      'tipo_registro', tipo_registro, 'created_at', created_at
    ) ORDER BY created_at DESC, id DESC) AS registros
  FROM public.presencas
  WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
  GROUP BY id_turma, data_aula, id_matricula
  HAVING count(*) > 1
), aulas_duplicadas AS (
  SELECT 'aulas'::text AS origem, id_turma, data_aula,
    NULL::text AS id_matricula, count(*) AS quantidade,
    count(DISTINCT jsonb_build_array(
      id_instrutor, horario_inicio, horario_fim, status_aula, observacoes
    )) > 1 AS divergente,
    jsonb_agg(jsonb_build_object(
      'id', id, 'id_instrutor', id_instrutor, 'horario_inicio', horario_inicio,
      'horario_fim', horario_fim, 'status_aula', status_aula,
      'observacoes', observacoes, 'created_at', created_at
    ) ORDER BY created_at DESC, id DESC) AS registros
  FROM public.aulas
  WHERE id_turma IS NOT NULL
  GROUP BY id_turma, data_aula
  HAVING count(*) > 1
)
SELECT * FROM presencas_duplicadas
UNION ALL
SELECT * FROM aulas_duplicadas
ORDER BY divergente DESC, origem, data_aula DESC, id_turma;
