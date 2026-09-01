-- Migration: Add soft delete columns and triggers
BEGIN;

-- Add deleted_at column to each table
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.modalidades ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.instrutores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.presencas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Generic soft‑delete trigger function
CREATE OR REPLACE FUNCTION public.fn_soft_delete()
RETURNS trigger AS $$
BEGIN
  NEW.deleted_at = now();
  RETURN NULL; -- cancel original delete
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER trg_soft_delete_alunos BEFORE DELETE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_leads BEFORE DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_matriculas BEFORE DELETE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_turmas BEFORE DELETE ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_modalidades BEFORE DELETE ON public.modalidades FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_instrutores BEFORE DELETE ON public.instrutores FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_pagamentos BEFORE DELETE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_presencas BEFORE DELETE ON public.presencas FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();
CREATE TRIGGER trg_soft_delete_aulas BEFORE DELETE ON public.aulas FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();

-- Grants for authenticated role (optional columns)
GRANT SELECT, UPDATE, INSERT ON public.alunos TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.leads TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.matriculas TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.turmas TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.modalidades TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.instrutores TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.pagamentos TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.presencas TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.aulas TO authenticated;

-- Grant all privileges to service_role (optional)
GRANT ALL ON public.alunos TO service_role;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.matriculas TO service_role;
GRANT ALL ON public.turmas TO service_role;
GRANT ALL ON public.modalidades TO service_role;
GRANT ALL ON public.instrutores TO service_role;
GRANT ALL ON public.pagamentos TO service_role;
GRANT ALL ON public.presencas TO service_role;
GRANT ALL ON public.aulas TO service_role;

COMMIT;
