-- Migration: Exclusão de contas de usuários e regras de segurança para MOVI+ MCJB

-- 1. Função RPC para exclusão atômica de usuário (auth.users, profiles, user_roles, notifications)
CREATE OR REPLACE FUNCTION public.delete_user_account(
  _target_user_id UUID,
  _requester_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_requester_authorized BOOLEAN;
BEGIN
  -- 1. Validação de autorização do solicitante (deve ser 'secretaria' ou 'coordenacao')
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _requester_id AND role IN ('secretaria', 'coordenacao')
  ) INTO is_requester_authorized;

  IF NOT is_requester_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores ou secretários podem remover usuários.';
  END IF;

  -- 2. Bloqueio de auto-exclusão
  IF _target_user_id = _requester_id THEN
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

-- 2. Garantir permissões de exclusão nas tabelas profiles e user_roles para administradores
DROP POLICY IF EXISTS "Admin deleta perfis" ON public.profiles;
CREATE POLICY "Admin deleta perfis"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) AND id <> auth.uid());

DROP POLICY IF EXISTS "Admin deleta user_roles" ON public.user_roles;
CREATE POLICY "Admin deleta user_roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) AND user_id <> auth.uid());

