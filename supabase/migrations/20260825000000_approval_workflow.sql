-- Migration: Approval Workflow para novos usuários no MOVI+ MCJB

-- 1. Criação do tipo enumerado para status do usuário se não existir
DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM ('pendente', 'aprovado', 'rejeitado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Atualizar tabela profiles com campos de aprovação
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Tabela de Notificações Internas para coordenadores
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role public.app_role,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coordenação e Secretaria leem notificações" ON public.notifications;
CREATE POLICY "Coordenação e Secretaria leem notificações"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    target_role IS NULL 
    OR public.has_role(auth.uid(), target_role)
    OR user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Coordenação e Secretaria atualizam notificações" ON public.notifications;
CREATE POLICY "Coordenação e Secretaria atualizam notificações"
  ON public.notifications FOR UPDATE TO authenticated
  USING (
    target_role IS NULL 
    OR public.has_role(auth.uid(), target_role)
    OR user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- 4. Atualizar trigger handle_new_user para registrar como 'pendente' e gerar notificação
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cria o perfil inicial sempre com status 'pendente'
  INSERT INTO public.profiles (id, email, nome, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'pendente'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    nome = COALESCE(public.profiles.nome, EXCLUDED.nome);

  -- Cria notificação para a equipe de coordenação (seguro contra falhas)
  BEGIN
    INSERT INTO public.notifications (target_role, title, message, metadata)
    VALUES (
      'coordenacao',
      'Novo cadastro aguardando aprovação',
      CONCAT('O usuário ', NEW.email, ' solicitou acesso ao sistema.'),
      jsonb_build_object('new_user_id', NEW.id, 'email', NEW.email)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Função RPC para aprovar usuário com atribuição obrigatória de papel (role)
CREATE OR REPLACE FUNCTION public.approve_user(
  _target_user_id UUID,
  _assigned_role public.app_role,
  _approver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_approver_authorized BOOLEAN;
BEGIN
  -- 1. Verifica se o autorizador é coordenador ou secretaria
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _approver_id AND role IN ('coordenacao', 'secretaria')
  ) INTO is_approver_authorized;

  IF NOT is_approver_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores ou secretários podem aprovar novos cadastros.';
  END IF;

  -- 2. Validação da role informada
  IF _assigned_role NOT IN ('coordenacao', 'instrutor', 'secretaria') THEN
    RAISE EXCEPTION 'Cargo inválido. Selecione coordenacao, instrutor ou secretaria.';
  END IF;

  -- 3. Atualiza status do perfil para aprovado
  UPDATE public.profiles
  SET 
    status = 'aprovado',
    approved_by = _approver_id,
    approved_at = now(),
    updated_at = now(),
    rejection_reason = NULL
  WHERE id = _target_user_id;

  -- 4. Insere o cargo escolhido em user_roles
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _assigned_role);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário aprovado com sucesso!',
    'user_id', _target_user_id,
    'role', _assigned_role
  );
END;
$$;

-- 6. Função RPC para rejeitar cadastro
CREATE OR REPLACE FUNCTION public.reject_user(
  _target_user_id UUID,
  _reason TEXT,
  _approver_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_approver_authorized BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _approver_id AND role IN ('coordenacao', 'secretaria')
  ) INTO is_approver_authorized;

  IF NOT is_approver_authorized THEN
    RAISE EXCEPTION 'Acesso negado: apenas coordenadores ou secretários podem rejeitar cadastros.';
  END IF;

  UPDATE public.profiles
  SET 
    status = 'rejeitado',
    rejection_reason = _reason,
    approved_by = _approver_id,
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

-- 7. Atualizar RLS de profiles para que a coordenação também gerencie e visualize todos os perfis
DROP POLICY IF EXISTS "Usuários veem o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários veem o próprio perfil"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Secretaria gerencia perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admin gerencia perfis" ON public.profiles;
CREATE POLICY "Admin gerencia perfis"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
