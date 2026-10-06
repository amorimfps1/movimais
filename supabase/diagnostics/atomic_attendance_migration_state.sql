-- Consulta somente leitura. Execute no mesmo projeto e SQL Editor da migração.
-- A chave abaixo é a que o índice informou como duplicada.
SELECT
  current_database() AS banco,
  current_user AS usuario_sql,
  current_setting('row_security') AS row_security,
  (SELECT count(*) FROM public.presencas
   WHERE id_turma = 'TURMA_BAL_T2'
     AND data_aula = DATE '2026-06-22'
     AND id_matricula = 'A44E52E5') AS linhas_desta_chave,
  (SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'presenca', presenca, 'id_aluno', id_aluno,
      'tipo_registro', tipo_registro, 'created_at', created_at
    ) ORDER BY created_at, id)
   FROM public.presencas
   WHERE id_turma = 'TURMA_BAL_T2'
     AND data_aula = DATE '2026-06-22'
     AND id_matricula = 'A44E52E5') AS registros_desta_chave,
  to_regclass('public.presencas_duplicadas_arquivo') AS arquivo_criado,
  to_regclass('public.presencas_uma_por_matricula_aula') AS indice_criado,
  to_regprocedure('public.salvar_chamada(text,date,jsonb)') AS rpc_criada;
