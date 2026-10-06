-- As views do diário executam com as permissões do usuário que consulta.
-- Funções específicas mantêm o acesso aos campos mínimos sem conceder
-- leitura direta das tabelas completas de alunos e matrículas ao instrutor.
BEGIN;

CREATE OR REPLACE FUNCTION public.alunos_diario_rows()
RETURNS TABLE (id text, nome_completo text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT a.id, a.nome_completo, a.created_at
  FROM public.alunos AS a
  WHERE auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'instrutor')
    AND EXISTS (
      SELECT 1 FROM public.matriculas AS m
      WHERE m.id_aluno = a.id
        AND public.instructor_can_access_turma(m.id_turma)
    );
$$;

CREATE OR REPLACE FUNCTION public.matriculas_diario_rows()
RETURNS TABLE (
  id text, id_aluno text, id_turma text, status_matricula text,
  liberado_para_aula boolean, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT m.id, m.id_aluno, m.id_turma, m.status_matricula,
         m.liberado_para_aula, m.created_at
  FROM public.matriculas AS m
  WHERE auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'instrutor')
    AND public.instructor_can_access_turma(m.id_turma);
$$;

REVOKE ALL ON FUNCTION public.alunos_diario_rows() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.matriculas_diario_rows() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.alunos_diario_rows() TO authenticated;
GRANT EXECUTE ON FUNCTION public.matriculas_diario_rows() TO authenticated;

CREATE OR REPLACE VIEW public.alunos_diario
WITH (security_barrier = true, security_invoker = true)
AS
SELECT id, nome_completo, created_at
FROM public.alunos_diario_rows();

CREATE OR REPLACE VIEW public.matriculas_diario
WITH (security_barrier = true, security_invoker = true)
AS
SELECT id, id_aluno, id_turma, status_matricula,
       liberado_para_aula, created_at
FROM public.matriculas_diario_rows();

REVOKE ALL ON public.alunos_diario FROM PUBLIC, anon;
REVOKE ALL ON public.matriculas_diario FROM PUBLIC, anon;
GRANT SELECT ON public.alunos_diario TO authenticated;
GRANT SELECT ON public.matriculas_diario TO authenticated;

COMMIT;
