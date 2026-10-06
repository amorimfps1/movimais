import { readFileSync } from 'node:fs';

const config = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter(line => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);

const base = config.VITE_SUPABASE_URL;
const key = config.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!base || !key) throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY ausentes');

const resources = [
  'alunos', 'matriculas', 'turmas', 'instrutores', 'presencas',
  'aulas', 'leads', 'pagamentos', 'profiles', 'user_roles',
  'alunos_diario', 'matriculas_diario', 'user_access_audit',
  'presencas_duplicadas_arquivo', 'aulas_duplicadas_arquivo',
];

for (const resource of resources) {
  const url = new URL(`/rest/v1/${resource}`, base);
  url.searchParams.set('select', 'id');
  url.searchParams.set('limit', '1');
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { apikey: key, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.text();
    let code = '';
    try { code = JSON.parse(body)?.code ?? ''; } catch { /* response is not JSON */ }
    console.log(`${resource}: HTTP ${response.status}${code ? ` (${code})` : ''}`);
  } catch (error) {
    console.log(`${resource}: ${error.cause?.code ?? error.name ?? 'erro de conexão'}`);
  }
}
