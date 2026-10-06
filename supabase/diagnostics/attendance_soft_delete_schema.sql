-- Consulta somente leitura da regra de exclusão lógica existente no banco.
SELECT
  pg_catalog.pg_get_functiondef('public.fn_soft_delete()'::regprocedure) AS funcao_soft_delete,
  (SELECT jsonb_agg(jsonb_build_object(
      'coluna', column_name, 'tipo', data_type,
      'padrao', column_default, 'aceita_null', is_nullable
    ) ORDER BY ordinal_position)
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'presencas') AS colunas_presencas,
  (SELECT jsonb_agg(jsonb_build_object(
      'nome', indexname, 'definicao', indexdef
    ))
   FROM pg_catalog.pg_indexes
   WHERE schemaname = 'public' AND tablename = 'presencas') AS indices_presencas;
