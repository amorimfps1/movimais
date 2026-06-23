
-- 1. Enum de perfis
CREATE TYPE public.app_role AS ENUM ('secretaria', 'coordenacao', 'instrutor');

-- 2. Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Função has_role (security definer evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Função utilitária: usuário tem algum dos perfis administrativos?
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('secretaria', 'coordenacao')
  )
$$;

-- 6. Trigger para criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Policies profiles
CREATE POLICY "Usuários veem o próprio perfil"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Usuário atualiza próprio perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Secretaria gerencia perfis"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria'))
  WITH CHECK (public.has_role(auth.uid(), 'secretaria'));

-- 9. Policies user_roles
CREATE POLICY "Usuário lê seus próprios papéis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Secretaria gerencia papéis"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria'))
  WITH CHECK (public.has_role(auth.uid(), 'secretaria'));

-- 10. Remover policies permissivas antigas
DROP POLICY IF EXISTS open_all ON public.alunos;
DROP POLICY IF EXISTS open_all ON public.instrutores;
DROP POLICY IF EXISTS open_all ON public.leads;
DROP POLICY IF EXISTS open_all ON public.matriculas;
DROP POLICY IF EXISTS open_all ON public.modalidades;
DROP POLICY IF EXISTS open_all ON public.pagamentos;
DROP POLICY IF EXISTS open_all ON public.presencas;
DROP POLICY IF EXISTS open_all ON public.turmas;

-- 11. Policies por tabela:
-- secretaria & coordenacao: acesso total
-- instrutor: leitura em (alunos, matriculas, turmas, modalidades, instrutores) e CRUD em presencas

-- ALUNOS
CREATE POLICY "Admin total alunos" ON public.alunos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Instrutor lê alunos" ON public.alunos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'instrutor'));

-- MATRICULAS
CREATE POLICY "Admin total matriculas" ON public.matriculas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Instrutor lê matriculas" ON public.matriculas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'instrutor'));

-- TURMAS
CREATE POLICY "Admin total turmas" ON public.turmas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Instrutor lê turmas" ON public.turmas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'instrutor'));

-- MODALIDADES
CREATE POLICY "Admin total modalidades" ON public.modalidades FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Instrutor lê modalidades" ON public.modalidades FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'instrutor'));

-- INSTRUTORES
CREATE POLICY "Admin total instrutores" ON public.instrutores FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Instrutor lê instrutores" ON public.instrutores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'instrutor'));

-- LEADS — apenas admin
CREATE POLICY "Admin total leads" ON public.leads FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- PAGAMENTOS — apenas admin
CREATE POLICY "Admin total pagamentos" ON public.pagamentos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- PRESENCAS — admin total, instrutor CRUD
CREATE POLICY "Admin total presencas" ON public.presencas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Instrutor gerencia presencas" ON public.presencas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'instrutor'))
  WITH CHECK (public.has_role(auth.uid(), 'instrutor'));
