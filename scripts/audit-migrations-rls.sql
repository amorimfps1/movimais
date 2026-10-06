-- Executar em uma copia do banco apos aplicar todas as migrations.
-- Auditoria somente de leitura: falha com excecao se uma garantia nao existir.
DO $audit$
DECLARE
  table_name text;
  expected_policy text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['alunos', 'matriculas', 'turmas', 'instrutores', 'presencas', 'aulas'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = table_name AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS ausente em public.%', table_name;
    END IF;
  END LOOP;

  FOREACH expected_policy IN ARRAY ARRAY[
    'Instrutor lê suas turmas', 'Instrutor lê seu cadastro',
    'Instrutor gerencia presencas das suas aulas',
    'Instrutor lê aulas atribuidas', 'Instrutor cria aulas das suas turmas',
    'Instrutor atualiza aulas atribuidas', 'Instrutor exclui aulas atribuidas'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = expected_policy) THEN
      RAISE EXCEPTION 'Policy ausente: %', expected_policy;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND policyname IN (
      'Instrutor lê alunos', 'Instrutor lê matriculas', 'Instrutor lê turmas',
      'Instrutor lê instrutores', 'Instrutor gerencia presencas', 'Instrutor gerencia aulas'
    )
  ) THEN
    RAISE EXCEPTION 'Uma policy permissiva antiga continua ativa';
  END IF;

  IF to_regprocedure('public.salvar_chamada(text,date,jsonb)') IS NULL
    OR to_regprocedure('public.instructor_can_manage_presence(text,date,text,text)') IS NULL
    OR to_regprocedure('public.alunos_diario_rows()') IS NULL
    OR to_regprocedure('public.matriculas_diario_rows()') IS NULL
    OR to_regprocedure('public.manage_user_access(text,uuid,public.app_role,text,text[],text)') IS NULL THEN
    RAISE EXCEPTION 'RPC ou funcao do diario ausente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p WHERE p.oid = 'public.salvar_chamada(text,date,jsonb)'::regprocedure
      AND p.prosecdef AND p.proconfig @> ARRAY['search_path=']::text[]
  ) THEN
    RAISE EXCEPTION 'salvar_chamada precisa de SECURITY DEFINER e search_path vazio';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid = 'public.manage_user_access(text,uuid,public.app_role,text,text[],text)'::regprocedure
      AND p.prosecdef AND p.proconfig @> ARRAY['search_path=']::text[]
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid = 'public.profiles'::regclass
      AND t.tgname = 'protect_profile_access_fields' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'Gestao de usuarios sem RPC segura ou trigger de protecao';
  END IF;

  IF has_function_privilege('authenticated', 'public.approve_user(uuid,public.app_role,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.reject_user(uuid,text,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.delete_user_account(uuid,uuid)', 'EXECUTE')
    OR has_table_privilege('authenticated', 'public.user_roles', 'INSERT')
    OR has_table_privilege('authenticated', 'public.user_roles', 'DELETE') THEN
    RAISE EXCEPTION 'Caminho antigo de administracao ainda disponivel';
  END IF;

  IF has_table_privilege('anon', 'public.user_access_audit', 'SELECT')
    OR NOT EXISTS (
      SELECT 1 FROM pg_class c WHERE c.oid = 'public.user_access_audit'::regclass AND c.relrowsecurity
    ) THEN
    RAISE EXCEPTION 'Auditoria de acesso exposta ou sem RLS';
  END IF;

  FOREACH table_name IN ARRAY ARRAY['alunos_diario', 'matriculas_diario'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = table_name
        AND c.reloptions @> ARRAY['security_invoker=true', 'security_barrier=true']::text[]
    ) THEN
      RAISE EXCEPTION 'View % sem security_invoker ou security_barrier', table_name;
    END IF;
    IF has_table_privilege('anon', 'public.' || table_name, 'SELECT') THEN
      RAISE EXCEPTION 'anon tem acesso a %', table_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'presencas'
      AND indexname = 'presencas_uma_por_matricula_aula' AND indexdef LIKE '%UNIQUE INDEX%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'aulas'
      AND indexname = 'aulas_uma_por_turma_data' AND indexdef LIKE '%UNIQUE INDEX%'
  ) THEN
    RAISE EXCEPTION 'Indice unico de chamada ou aula ausente';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.presencas
    WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
    GROUP BY id_turma, data_aula, id_matricula HAVING count(*) > 1
  ) OR EXISTS (
    SELECT 1 FROM public.aulas WHERE id_turma IS NOT NULL
    GROUP BY id_turma, data_aula HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicatas ativas sobreviveram a migration';
  END IF;

  RAISE NOTICE 'Auditoria de catalogo, RLS e unicidade passou';
END
$audit$;
