-- Tabela de aulas agendadas / realizadas por turma
CREATE TABLE public.aulas (
  id text PRIMARY KEY,
  id_turma text REFERENCES public.turmas(id) ON DELETE CASCADE,
  id_instrutor text REFERENCES public.instrutores(id) ON DELETE SET NULL,
  data_aula date NOT NULL,
  horario_inicio time,
  horario_fim time,
  status_aula text DEFAULT ''AGENDADA'',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aulas TO authenticated;
GRANT ALL ON public.aulas TO service_role;

-- RLS
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

-- Admin (secretaria + coordenacao): acesso total
CREATE POLICY "Admin total aulas" ON public.aulas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Instrutor: leitura e CRUD de suas proprias aulas
CREATE POLICY "Instrutor gerencia aulas" ON public.aulas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), ''instrutor''))
  WITH CHECK (public.has_role(auth.uid(), ''instrutor''));
