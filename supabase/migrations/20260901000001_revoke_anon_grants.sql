-- Migration: Revogação de Grants Permissivos para o Role 'anon' (MOVI+ MCJB)
-- Contexto: A migração inicial (20260623184449) concedeu SELECT, INSERT, UPDATE, DELETE
-- para o role 'anon' em todas as tabelas de negócio. Isto é uma vulnerabilidade:
-- mesmo com RLS ativo, manter grants para anon aumenta a superfície de ataque.
-- Todos os acessos ao sistema requerem autenticação — o role anon não deve ter
-- permissões de escrita (nem de leitura) em dados de negócio sensíveis.
--
-- IMPORTANTE: Este script NÃO revoga acesso ao role 'authenticated' (usuários logados).
-- O acesso de usuários autenticados é controlado pelas policies RLS existentes.

BEGIN;

-- ============================================================
-- 1. Revogar todos os grants do role 'anon' nas tabelas de negócio
-- ============================================================

REVOKE ALL PRIVILEGES ON public.alunos FROM anon;
REVOKE ALL PRIVILEGES ON public.leads FROM anon;
REVOKE ALL PRIVILEGES ON public.matriculas FROM anon;
REVOKE ALL PRIVILEGES ON public.turmas FROM anon;
REVOKE ALL PRIVILEGES ON public.modalidades FROM anon;
REVOKE ALL PRIVILEGES ON public.instrutores FROM anon;
REVOKE ALL PRIVILEGES ON public.pagamentos FROM anon;
REVOKE ALL PRIVILEGES ON public.presencas FROM anon;
REVOKE ALL PRIVILEGES ON public.aulas FROM anon;

-- ============================================================
-- 2. Revogar também das tabelas de auth/sistema (prevenção)
-- ============================================================

REVOKE ALL PRIVILEGES ON public.notifications FROM anon;
-- Nota: profiles e user_roles nunca receberam grants para anon,
-- mas incluímos por precaução:
REVOKE ALL PRIVILEGES ON public.profiles FROM anon;
REVOKE ALL PRIVILEGES ON public.user_roles FROM anon;

-- ============================================================
-- 3. Revogar acesso às Views financeiras para o role 'anon'
-- ============================================================

REVOKE ALL PRIVILEGES ON public.view_arrecadacao_modalidades FROM anon;
REVOKE ALL PRIVILEGES ON public.view_repasse_professores FROM anon;
REVOKE ALL PRIVILEGES ON public.view_matriculas_ativas_modalidades FROM anon;

-- ============================================================
-- 4. Garantir que os grants para 'authenticated' estão corretos
--    (reafirmação explícita para evitar qualquer remoção acidental)
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alunos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matriculas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turmas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modalidades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instrutores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presencas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

GRANT SELECT ON public.view_arrecadacao_modalidades TO authenticated;
GRANT SELECT ON public.view_repasse_professores TO authenticated;
GRANT SELECT ON public.view_matriculas_ativas_modalidades TO authenticated;

-- ============================================================
-- 5. Garantir acesso total para service_role (Supabase Admin/Edge Functions)
-- ============================================================

GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.matriculas TO service_role;
GRANT ALL ON public.turmas TO service_role;
GRANT ALL ON public.modalidades TO service_role;
GRANT ALL ON public.instrutores TO service_role;
GRANT ALL ON public.pagamentos TO service_role;
GRANT ALL ON public.presencas TO service_role;
GRANT ALL ON public.aulas TO service_role;
GRANT ALL ON public.notifications TO service_role;

COMMIT;
