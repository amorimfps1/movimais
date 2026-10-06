-- Somente leitura: por que a linha 802170C2 não saiu de presencas?
SELECT
  current_database() AS banco,
  current_user AS usuario_sql,
  (SELECT rolbypassrls FROM pg_catalog.pg_roles WHERE rolname = current_user) AS ignora_rls,
  (SELECT pg_catalog.pg_get_userbyid(c.relowner)
   FROM pg_catalog.pg_class AS c WHERE c.oid = 'public.presencas'::regclass) AS dono_tabela,
  (SELECT c.relrowsecurity
   FROM pg_catalog.pg_class AS c WHERE c.oid = 'public.presencas'::regclass) AS rls_ativo,
  (SELECT c.relforcerowsecurity
   FROM pg_catalog.pg_class AS c WHERE c.oid = 'public.presencas'::regclass) AS rls_forcado,
  (SELECT jsonb_agg(jsonb_build_object(
      'id', p.id,
      'id_esperado', p.id = '802170C2',
      'turma_esperada', p.id_turma = 'TURMA_BAL_T2',
      'data_esperada', p.data_aula = DATE '2026-06-22',
      'matricula_esperada', p.id_matricula = 'A44E52E5',
      'id_comprimento', length(p.id)
    ) ORDER BY p.id)
   FROM public.presencas AS p
   WHERE p.id_turma = 'TURMA_BAL_T2'
     AND p.data_aula = DATE '2026-06-22'
     AND p.id_matricula = 'A44E52E5') AS linhas,
  (SELECT jsonb_agg(jsonb_build_object(
      'nome', t.tgname,
      'definicao', pg_catalog.pg_get_triggerdef(t.oid)
    ))
   FROM pg_catalog.pg_trigger AS t
   WHERE t.tgrelid = 'public.presencas'::regclass
     AND NOT t.tgisinternal) AS triggers_customizados;
