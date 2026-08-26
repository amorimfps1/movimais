-- Migração: Grade horária fixa em turmas e múltiplas especialidades em instrutores (1:N)
BEGIN;

-- 1. Atualizar tabela turmas
ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS dias_semana text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS horario_inicio time,
  ADD COLUMN IF NOT EXISTS horario_fim time,
  ADD COLUMN IF NOT EXISTS id_instrutor text REFERENCES public.instrutores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sala text;

-- 2. Atualizar tabela instrutores
ALTER TABLE public.instrutores
  ADD COLUMN IF NOT EXISTS especialidades text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS id_modalidades text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Atualizar tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS especialidades text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS id_instrutor text REFERENCES public.instrutores(id) ON DELETE SET NULL;

-- 4. Criar índices para performance em consultas por dia e instrutor
CREATE INDEX IF NOT EXISTS idx_turmas_id_instrutor ON public.turmas(id_instrutor);
CREATE INDEX IF NOT EXISTS idx_instrutores_user_id ON public.instrutores(user_id);
CREATE INDEX IF NOT EXISTS idx_aulas_id_instrutor ON public.aulas(id_instrutor);
CREATE INDEX IF NOT EXISTS idx_aulas_data_aula ON public.aulas(data_aula);

COMMIT;

