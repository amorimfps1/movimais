-- Centraliza mudanças de acesso e vínculo do instrutor em uma transação.
BEGIN;

CREATE TABLE IF NOT EXISTS public.user_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_access_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_access_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_access_audit TO authenticated;
DROP POLICY IF EXISTS "Administracao le auditoria de acesso" ON public.user_access_audit;
CREATE POLICY "Administracao le auditoria de acesso"
  ON public.user_access_audit FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.manage_user_access(
  p_action text,
  p_user_id uuid,
  p_role public.app_role DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_specs text[] DEFAULT NULL,
  p_instrutor_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_instrutor_id text;
  v_specs text[];
  v_modalidade_ids text[];
  v_count integer;
  v_sync_instrutor boolean := false;
  v_details jsonb := '{}'::jsonb;
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'Acesso negado: apenas secretaria e coordenação podem gerenciar usuários.';
  END IF;
  IF p_user_id IS NULL OR p_action IS NULL OR p_action NOT IN
     ('approve', 'reject', 'delete', 'add_role', 'remove_role', 'update_instructor') THEN
    RAISE EXCEPTION 'Ação ou usuário inválido.';
  END IF;
  IF p_user_id = v_actor AND p_action <> 'update_instructor' THEN
    RAISE EXCEPTION 'Você não pode alterar o próprio acesso ou excluir a própria conta.';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado.';
  END IF;

  CASE p_action
    WHEN 'approve' THEN
      IF p_role IS NULL THEN RAISE EXCEPTION 'Selecione um cargo para aprovar o usuário.'; END IF;
      DELETE FROM public.user_roles WHERE user_id = p_user_id;
      INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_role);
      UPDATE public.profiles SET status = 'aprovado', approved_by = v_actor,
        approved_at = now(), rejection_reason = NULL WHERE id = p_user_id;
      v_sync_instrutor := p_role = 'instrutor';
      v_details := jsonb_build_object('role', p_role);

    WHEN 'reject' THEN
      IF nullif(btrim(p_reason), '') IS NULL THEN
        RAISE EXCEPTION 'Informe o motivo da rejeição.';
      END IF;
      DELETE FROM public.user_roles WHERE user_id = p_user_id;
      UPDATE public.profiles SET status = 'rejeitado', rejection_reason = btrim(p_reason),
        approved_by = v_actor, approved_at = now() WHERE id = p_user_id;

    WHEN 'add_role' THEN
      IF p_role IS NULL THEN RAISE EXCEPTION 'Selecione um cargo.'; END IF;
      INSERT INTO public.user_roles (user_id, role)
      VALUES (p_user_id, p_role) ON CONFLICT (user_id, role) DO NOTHING;
      UPDATE public.profiles SET status = 'aprovado', rejection_reason = NULL,
        approved_by = v_actor, approved_at = now() WHERE id = p_user_id;
      v_sync_instrutor := p_role = 'instrutor';
      v_details := jsonb_build_object('role', p_role);

    WHEN 'remove_role' THEN
      IF p_role IS NULL THEN RAISE EXCEPTION 'Selecione um cargo.'; END IF;
      DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = p_role;
      IF NOT FOUND THEN RAISE EXCEPTION 'O usuário não possui esse cargo.'; END IF;
      IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id) THEN
        UPDATE public.profiles SET status = 'pendente' WHERE id = p_user_id;
      END IF;
      v_details := jsonb_build_object('role', p_role);

    WHEN 'update_instructor' THEN
      IF NOT public.has_role(p_user_id, 'instrutor') THEN
        RAISE EXCEPTION 'O usuário não possui o cargo de instrutor.';
      END IF;
      v_sync_instrutor := true;

    WHEN 'delete' THEN
      DELETE FROM auth.users WHERE id = p_user_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Conta de autenticação não encontrada.'; END IF;
      IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id)
         OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'A exclusão não removeu o perfil e os cargos.';
      END IF;
  END CASE;

  IF v_sync_instrutor THEN
    v_specs := coalesce(p_specs, v_profile.especialidades, '{}'::text[]);
    IF EXISTS (
      SELECT 1 FROM unnest(v_specs) AS s(nome)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.modalidades AS m WHERE m.nome_modalidade = s.nome
      )
    ) THEN
      RAISE EXCEPTION 'Há especialidades que não correspondem a uma modalidade cadastrada.';
    END IF;
    SELECT coalesce(array_agg(DISTINCT m.id ORDER BY m.id), '{}'::text[])
      INTO v_modalidade_ids
    FROM public.modalidades AS m
    WHERE m.nome_modalidade = ANY(v_specs);

    v_instrutor_id := coalesce(nullif(p_instrutor_id, ''), v_profile.id_instrutor);
    IF v_instrutor_id IS NULL THEN
      SELECT count(*), min(id) INTO v_count, v_instrutor_id
      FROM public.instrutores WHERE user_id = p_user_id;
      IF v_count > 1 THEN
        RAISE EXCEPTION 'Há mais de um cadastro de instrutor para este usuário.';
      END IF;
    END IF;

    IF v_instrutor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.instrutores
      WHERE id = v_instrutor_id AND user_id IS NOT NULL AND user_id <> p_user_id
    ) THEN
      RAISE EXCEPTION 'Este cadastro de instrutor está vinculado a outro usuário.';
    END IF;
    IF v_instrutor_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.instrutores
      WHERE user_id = p_user_id AND id <> v_instrutor_id
    ) THEN
      RAISE EXCEPTION 'O usuário já está vinculado a outro cadastro de instrutor.';
    END IF;

    IF v_instrutor_id IS NULL THEN
      v_instrutor_id := gen_random_uuid()::text;
      INSERT INTO public.instrutores (
        id, nome_completo, email, funcao, especialidades, id_modalidades, user_id, ativo
      ) VALUES (
        v_instrutor_id, coalesce(nullif(v_profile.nome, ''), split_part(v_profile.email, '@', 1)),
        v_profile.email, 'INSTRUTOR_PRINCIPAL', v_specs, v_modalidade_ids, p_user_id, true
      );
    ELSE
      UPDATE public.instrutores SET
        nome_completo = coalesce(nullif(v_profile.nome, ''), split_part(v_profile.email, '@', 1)),
        email = v_profile.email, especialidades = v_specs,
        id_modalidades = v_modalidade_ids, user_id = p_user_id, ativo = true
      WHERE id = v_instrutor_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro de instrutor selecionado não encontrado.'; END IF;
    END IF;

    UPDATE public.profiles SET id_instrutor = v_instrutor_id, especialidades = v_specs
    WHERE id = p_user_id;
    v_details := v_details || jsonb_build_object('instrutor_id', v_instrutor_id);
  END IF;

  INSERT INTO public.user_access_audit (actor_id, target_user_id, action, details)
  VALUES (v_actor, p_user_id, p_action, v_details);

  RETURN jsonb_build_object('success', true, 'action', p_action, 'user_id', p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.manage_user_access(text, uuid, public.app_role, text, text[], text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_user_access(text, uuid, public.app_role, text, text[], text)
  TO authenticated;

-- O navegador pode editar dados comuns do próprio perfil, mas não os campos
-- que representam aprovação, atribuição ou vínculo administrativo.
CREATE OR REPLACE FUNCTION public.protect_profile_access_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (
       NEW.status IS DISTINCT FROM OLD.status
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.id_instrutor IS DISTINCT FROM OLD.id_instrutor
       OR NEW.especialidades IS DISTINCT FROM OLD.especialidades
     ) THEN
    RAISE EXCEPTION 'Mudanças de acesso devem ser realizadas pela gestão de usuários.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_access_fields ON public.profiles;
CREATE TRIGGER protect_profile_access_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_access_fields();
REVOKE ALL ON FUNCTION public.protect_profile_access_fields() FROM PUBLIC, anon, authenticated;

REVOKE INSERT, DELETE ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;

-- Os caminhos antigos de aprovação, rejeição e exclusão deixam de ser públicos.
REVOKE ALL ON FUNCTION public.approve_user(uuid, public.app_role, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_user(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_user_account(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

COMMIT;
