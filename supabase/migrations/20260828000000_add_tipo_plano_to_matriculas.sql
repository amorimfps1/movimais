-- Migration: Add tipo_plano to matriculas table
ALTER TABLE public.matriculas 
ADD COLUMN IF NOT EXISTS tipo_plano text DEFAULT 'TRIMESTRAL';

