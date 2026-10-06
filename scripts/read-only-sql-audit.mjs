import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const env = readFileSync(new URL('../.env.integration.local', import.meta.url), 'utf8');
const line = env.split(/\r?\n/).find(value => value.startsWith('TEST_DATABASE_URL='));
if (!line) throw new Error('TEST_DATABASE_URL ausente');
const connectionString = line.slice('TEST_DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
const url = new URL(connectionString);
const projectRef = JSON.parse(readFileSync(new URL('../supabase/.temp/linked-project.json', import.meta.url), 'utf8')).ref;
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.username || !url.password) {
  throw new Error(`TEST_DATABASE_URL precisa ser uma URL PostgreSQL com usuario e senha; protocolo recebido: ${url.protocol}`);
}

const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
console.log(`Conexao: tipo=${url.hostname.endsWith('.pooler.supabase.com') ? 'pooler' : url.hostname.startsWith('db.') ? 'direct' : 'outro'}, usuario=${url.username.startsWith('postgres.') ? 'postgres.REF' : url.username === 'postgres' ? 'postgres' : 'outro'}, ref_usuario_correta=${url.username === `postgres.${projectRef}`}, porta=${url.port || 'padrao'}, senha_presente=${Boolean(url.password)}, senha_placeholder=${/^(?:SENHA|PASSWORD|YOUR-PASSWORD|\[.*\])$/i.test(decodeURIComponent(url.password))}`);
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  await client.query("SET LOCAL statement_timeout = '15s'");
  await client.query("SET LOCAL lock_timeout = '3s'");
  const context = await client.query('SELECT current_database() AS db, current_user AS role, current_setting(\'transaction_read_only\') AS read_only');
  console.log(`Conectado: db=${context.rows[0].db}, role=${context.rows[0].role}, read_only=${context.rows[0].read_only}`);

  const migrations = await client.query(`
    SELECT version FROM supabase_migrations.schema_migrations
    WHERE version >= '20261006000000' ORDER BY version
  `);
  console.log(`Migrations recentes: ${migrations.rows.map(row => row.version).join(', ') || 'nenhuma'}`);

  const objects = await client.query(`
    SELECT n.nspname, c.relname, c.relkind, c.relrowsecurity, c.reloptions
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
    ORDER BY c.relname
  `, [[
    'alunos', 'matriculas', 'turmas', 'instrutores', 'presencas', 'aulas',
    'alunos_diario', 'matriculas_diario', 'user_access_audit',
    'presencas_duplicadas_arquivo', 'aulas_duplicadas_arquivo',
  ]]);
  for (const row of objects.rows) console.log(`Objeto ${row.relname}: kind=${row.relkind}, RLS=${row.relrowsecurity}, options=${(row.reloptions || []).join(',')}`);

  const policies = await client.query(`
    SELECT tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies WHERE schemaname = 'public'
      AND tablename = ANY($1::text[])
    ORDER BY tablename, policyname
  `, [['alunos', 'matriculas', 'turmas', 'instrutores', 'presencas', 'aulas', 'user_access_audit']]);
  for (const row of policies.rows) console.log(`Policy ${row.tablename}.${row.policyname}: ${row.cmd}, roles=${row.roles.join(',')}, using=${row.qual ?? '-'}, check=${row.with_check ?? '-'}`);

  const functions = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
      p.prosecdef, p.proconfig, has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY($1::text[])
    ORDER BY p.proname
  `, [[
    'salvar_chamada', 'manage_user_access', 'instructor_is_self',
    'instructor_can_access_turma', 'instructor_owns_turma',
    'instructor_can_manage_presence', 'alunos_diario_rows', 'matriculas_diario_rows',
    'approve_user', 'reject_user', 'delete_user_account',
  ]]);
  for (const row of functions.rows) console.log(`Funcao ${row.proname}(${row.args}): definer=${row.prosecdef}, config=${(row.proconfig || []).join(',')}, anon=${row.anon_exec}, authenticated=${row.auth_exec}`);

  const indexes = await client.query(`
    SELECT tablename, indexname, indexdef FROM pg_indexes
    WHERE schemaname='public' AND indexname = ANY($1::text[])
    ORDER BY indexname
  `, [['presencas_uma_por_matricula_aula', 'aulas_uma_por_turma_data']]);
  for (const row of indexes.rows) console.log(`Indice ${row.indexname}: ${row.indexdef}`);

  const columns = await client.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name=ANY($1::text[])
      AND column_name=ANY($2::text[])
    ORDER BY table_name, column_name
  `, [['presencas', 'profiles'], ['deleted_at', 'status', 'id_instrutor', 'especialidades']]);
  console.log(`Colunas-chave: ${columns.rows.map(row => `${row.table_name}.${row.column_name}`).join(', ')}`);

  const duplicatePresence = await client.query(`
    SELECT count(*)::int AS n FROM (
      SELECT 1 FROM public.presencas
      WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
      GROUP BY id_turma, data_aula, id_matricula HAVING count(*) > 1
    ) d
  `);
  const duplicateLessons = await client.query(`
    SELECT count(*)::int AS n FROM (
      SELECT 1 FROM public.aulas WHERE id_turma IS NOT NULL
      GROUP BY id_turma, data_aula HAVING count(*) > 1
    ) d
  `);
  console.log(`Duplicatas ativas: presencas=${duplicatePresence.rows[0].n}, aulas=${duplicateLessons.rows[0].n}`);
} catch (error) {
  console.error(`Falha SQL: ${error.message}`);
  process.exitCode = 1;
} finally {
  try { await client.query('ROLLBACK'); } catch { /* connection may have failed */ }
  await client.end().catch(() => {});
}
