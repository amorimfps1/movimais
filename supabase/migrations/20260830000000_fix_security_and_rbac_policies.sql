-- ============================================================================
-- Migration: Correção Crítica de Segurança RBAC, RLS e RPCs (MOVI+ MCJB)
-- ============================================================================
-- 1. Eliminação de vulnerabilidades IDOR/BOLA nas RPCs de Usuários
-- 2. Garantia de gerenciamento de papéis em user_roles para Coordenação e Secretaria
-- ============================================================================

BEGIN;

-- 1. Corrigir RPC approve_user: remover parâmetro spoofable _approver_id e usar auth.uid()
CREATE OR REPLACE FUNCTION public.approve_user(
  _target_user_id UUID,
  _assigned_role public.app_role,
  _approver_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_authorized BOOLEAN;
BEGIN
  -- Valida se o usuário chamador é secretaria ou coordenacao
  SELECT public.is_admin(v_caller_id) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores ou secretários podem aprovar cadastros.';
  END IF;

  -- Atualiza o perfil do usuário
  UPDATE public.profiles
  SET 
    status = 'aprovado',
    approved_by = v_caller_id,
    approved_at = now(),
    updated_at = now(),
    rejection_reason = NULL
  WHERE id = _target_user_id;

  -- Insere o cargo escolhido em user_roles
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário aprovado com sucesso.',
    'user_id', _target_user_id,
    'role', _assigned_role
  );
END;
$$;

-- 2. Corrigir RPC reject_user: remover parâmetro spoofable _approver_id e usar auth.uid()
CREATE OR REPLACE FUNCTION public.reject_user(
  _target_user_id UUID,
  _reason TEXT,
  _approver_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_authorized BOOLEAN;
BEGIN
  SELECT public.is_admin(v_caller_id) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores ou secretários podem rejeitar cadastros.';
  END IF;

  UPDATE public.profiles
  SET 
    status = 'rejeitado',
    rejection_reason = _reason,
    approved_by = v_caller_id,
    approved_at = now(),
    updated_at = now()
  WHERE id = _target_user_id;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cadastro rejeitado com sucesso.',
    'user_id', _target_user_id
  );
END;
$$;

-- 3. Corrigir RPC delete_user_account: remover parâmetro spoofable _requester_id e usar auth.uid()
CREATE OR REPLACE FUNCTION public.delete_user_account(
  _target_user_id UUID,
  _requester_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_authorized BOOLEAN;
BEGIN
  -- 1. Validação de autorização do solicitante (deve ser 'secretaria' ou 'coordenacao')
  SELECT public.is_admin(v_caller_id) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores ou secretários podem remover usuários.';
  END IF;

  -- 2. Bloqueio de auto-exclusão
  IF _target_user_id = v_caller_id THEN
    RAISE EXCEPTION 'Operação inválida: você não pode excluir a sua própria conta.';
  END IF;

  -- 3. Limpeza de notificações vinculadas ao usuário
  DELETE FROM public.notifications WHERE user_id = _target_user_id;

  -- 4. Limpeza dos papéis/roles do usuário
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  -- 5. Limpeza do perfil público
  DELETE FROM public.profiles WHERE id = _target_user_id;

  -- 6. Remoção da conta do Supabase Auth (se existir)
  DELETE FROM auth.users WHERE id = _target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário e acessos removidos com sucesso.',
    'user_id', _target_user_id
  );
END;
$$;

-- 4. Atualizar RLS de user_roles para permitir que a Coordenação também gerencie papéis
DROP POLICY IF EXISTS "Secretaria gerencia papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Admin gerencia papéis" ON public.user_roles;
CREATE POLICY "Admin gerencia papéis"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. Garantir Grants de execução
GRANT EXECUTE ON FUNCTION public.approve_user(UUID, public.app_role, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID, UUID) TO authenticated;

COMMIT;

