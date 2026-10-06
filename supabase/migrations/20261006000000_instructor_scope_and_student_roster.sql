-- Instrutores acessam apenas turmas atribuídas e os dados necessários à chamada.
-- A migração requer a aplicação prévia de todas as migrações de autenticação e grade.
BEGIN;

-- Perfis já vinculados a um instrutor recebem o vínculo explícito no cadastro.
-- Vínculos ambíguos exigem correção pela administração e não são inferidos por e-mail.
UPDATE public.instrutores AS i
SET user_id = p.id
FROM public.profiles AS p
WHERE p.id_instrutor = i.id
  AND i.user_id IS NULL
  AND (SELECT count(*) FROM public.profiles WHERE id_instrutor = i.id) = 1;

CREATE OR REPLACE FUNCTION public.instructor_is_self(_instrutor_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'instrutor')
    AND EXISTS (
      SELECT 1 FROM public.instrutores AS i
      WHERE i.id = _instrutor_id AND i.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.instructor_can_access_turma(_turma_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'instrutor')
    AND EXISTS (
      SELECT 1 FROM public.instrutores AS i
      WHERE i.user_id = auth.uid()
        AND (
          EXISTS (
            SELECT 1 FROM public.turmas AS t
            WHERE t.id = _turma_id AND t.id_instrutor = i.id
          )
          OR EXISTS (
            SELECT 1 FROM public.aulas AS a
            WHERE a.id_turma = _turma_id AND a.id_instrutor = i.id
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.instructor_owns_turma(_turma_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'instrutor')
    AND EXISTS (
      SELECT 1 FROM public.turmas AS t
      JOIN public.instrutores AS i ON i.id = t.id_instrutor
      WHERE t.id = _turma_id AND i.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.instructor_can_manage_presence(
  _turma_id text, _data_aula date, _matricula_id text, _aluno_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'instrutor')
    AND EXISTS (
      SELECT 1 FROM public.matriculas AS m
      WHERE m.id = _matricula_id
        AND m.id_turma = _turma_id
        AND m.id_aluno = _aluno_id
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.turmas AS t
        JOIN public.instrutores AS i ON i.id = t.id_instrutor
        WHERE t.id = _turma_id AND i.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.aulas AS a
        JOIN public.instrutores AS i ON i.id = a.id_instrutor
        WHERE a.id_turma = _turma_id
          AND a.data_aula = _data_aula
          AND i.user_id = auth.uid()
      )
    );
$$;

REVOKE ALL ON FUNCTION public.instructor_is_self(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.instructor_can_access_turma(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.instructor_owns_turma(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.instructor_can_manage_presence(text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.instructor_is_self(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.instructor_can_access_turma(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.instructor_owns_turma(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.instructor_can_manage_presence(text, date, text, text) TO authenticated;

-- A tabela completa de alunos continua disponível somente para a administração.
DROP POLICY IF EXISTS "Instrutor lê alunos" ON public.alunos;

DROP POLICY IF EXISTS "Instrutor lê matriculas" ON public.matriculas;

DROP POLICY IF EXISTS "Instrutor lê turmas" ON public.turmas;
CREATE POLICY "Instrutor lê suas turmas"
  ON public.turmas FOR SELECT TO authenticated
  USING (public.instructor_can_access_turma(id));

DROP POLICY IF EXISTS "Instrutor lê instrutores" ON public.instrutores;
CREATE POLICY "Instrutor lê seu cadastro"
  ON public.instrutores FOR SELECT TO authenticated
  USING (public.instructor_is_self(id));

DROP POLICY IF EXISTS "Instrutor gerencia presencas" ON public.presencas;
CREATE POLICY "Instrutor gerencia presencas das suas aulas"
  ON public.presencas FOR ALL TO authenticated
  USING (public.instructor_can_manage_presence(id_turma, data_aula, id_matricula, id_aluno))
  WITH CHECK (public.instructor_can_manage_presence(id_turma, data_aula, id_matricula, id_aluno));

DROP POLICY IF EXISTS "Instrutor gerencia aulas" ON public.aulas;
CREATE POLICY "Instrutor lê aulas atribuidas"
  ON public.aulas FOR SELECT TO authenticated
  USING (public.instructor_owns_turma(id_turma) OR public.instructor_is_self(id_instrutor));
CREATE POLICY "Instrutor cria aulas das suas turmas"
  ON public.aulas FOR INSERT TO authenticated
  WITH CHECK (public.instructor_owns_turma(id_turma) AND public.instructor_is_self(id_instrutor));
CREATE POLICY "Instrutor atualiza aulas atribuidas"
  ON public.aulas FOR UPDATE TO authenticated
  USING (public.instructor_owns_turma(id_turma) OR public.instructor_is_self(id_instrutor))
  WITH CHECK (public.instructor_owns_turma(id_turma) OR public.instructor_is_self(id_instrutor));
CREATE POLICY "Instrutor exclui aulas atribuidas"
  ON public.aulas FOR DELETE TO authenticated
  USING (public.instructor_owns_turma(id_turma) OR public.instructor_is_self(id_instrutor));

-- Impede que uma atualização mova uma aula existente para outra turma ou instrutor.
CREATE OR REPLACE FUNCTION public.prevent_instructor_aula_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'instrutor') AND NOT public.is_admin(auth.uid())
     AND (NEW.id_turma IS DISTINCT FROM OLD.id_turma
          OR NEW.id_instrutor IS DISTINCT FROM OLD.id_instrutor) THEN
    RAISE EXCEPTION 'Instrutores não podem alterar a turma ou atribuição da aula.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_instructor_aula_reassignment ON public.aulas;
CREATE TRIGGER prevent_instructor_aula_reassignment
  BEFORE UPDATE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION public.prevent_instructor_aula_reassignment();
REVOKE ALL ON FUNCTION public.prevent_instructor_aula_reassignment() FROM PUBLIC, anon, authenticated;

-- View deliberadamente limitada a ID e nome para a chamada.
-- A view é criada pelo proprietário do schema; seu filtro por auth.uid() é obrigatório.
CREATE OR REPLACE VIEW public.alunos_diario
WITH (security_barrier = true)
AS
SELECT a.id, a.nome_completo, a.created_at
FROM public.alunos AS a
WHERE EXISTS (
  SELECT 1 FROM public.matriculas AS m
  WHERE m.id_aluno = a.id
    AND public.instructor_can_access_turma(m.id_turma)
);

REVOKE ALL ON public.alunos_diario FROM PUBLIC, anon;
GRANT SELECT ON public.alunos_diario TO authenticated;

-- Matrículas também são expostas apenas com os campos necessários para a chamada.
CREATE OR REPLACE VIEW public.matriculas_diario
WITH (security_barrier = true)
AS
SELECT m.id, m.id_aluno, m.id_turma, m.status_matricula,
       m.liberado_para_aula, m.created_at
FROM public.matriculas AS m
WHERE public.instructor_can_access_turma(m.id_turma);

REVOKE ALL ON public.matriculas_diario FROM PUBLIC, anon;
GRANT SELECT ON public.matriculas_diario TO authenticated;

CREATE INDEX IF NOT EXISTS idx_matriculas_id_turma ON public.matriculas(id_turma);
CREATE INDEX IF NOT EXISTS idx_matriculas_id_aluno ON public.matriculas(id_aluno);
CREATE INDEX IF NOT EXISTS idx_presencas_turma_data ON public.presencas(id_turma, data_aula);
CREATE INDEX IF NOT EXISTS idx_aulas_turma_data ON public.aulas(id_turma, data_aula);

COMMIT;
