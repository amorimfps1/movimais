-- Migration: Criação da Tabela de Auditoria (audit_log) para MOVI+ MCJB
-- Objetivo: Registrar trilha imutável de operações INSERT, UPDATE, DELETE em tabelas de negócio.
-- Benefícios: Rastreabilidade, conformidade, capacidade de rollback manual e investigação de incidentes.

BEGIN;

-- ============================================================
-- 1. Tabela Principal de Auditoria
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Quem fez a ação (pode ser NULL para operações de sistema/trigger)
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    TEXT,
  -- O que aconteceu
  action        TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  -- Onde aconteceu
  table_name    TEXT NOT NULL,
  record_id     TEXT,          -- ID do registro afetado (text para compatibilidade com IDs de negócio)
  -- Como estava antes e depois
  old_data      JSONB,         -- NULL para INSERT
  new_data      JSONB,         -- NULL para DELETE
  -- Contexto adicional
  ip_address    INET,          -- Endereço IP (se disponível via header)
  user_agent    TEXT,          -- User-Agent da requisição
  changed_fields TEXT[],       -- Lista dos campos que mudaram (para UPDATE)
  metadata      JSONB,         -- Dados contextuais extras (ex: motivo da ação)
  -- Quando aconteceu
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Índices de Auditoria (para consultas de investigação)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
  ON public.audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_name
  ON public.audit_log(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_log_record_id
  ON public.audit_log(record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON public.audit_log(action);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log(created_at DESC);

-- Índice composto para a consulta mais comum: "o que aconteceu nesta tabela neste período?"
CREATE INDEX IF NOT EXISTS idx_audit_log_table_date
  ON public.audit_log(table_name, created_at DESC);

-- Índice composto para: "o que este usuário fez?"
CREATE INDEX IF NOT EXISTS idx_audit_log_user_date
  ON public.audit_log(user_id, created_at DESC);

-- ============================================================
-- 3. Row Level Security (RLS)
-- Apenas administradores (secretaria e coordenação) podem ler a trilha de auditoria.
-- NINGUÉM pode inserir, atualizar ou deletar registros de auditoria manualmente.
-- Apenas o service_role (e as funções SECURITY DEFINER) podem escrever.
-- ============================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins podem ler todos os logs
DROP POLICY IF EXISTS "Admin lê trilha de auditoria" ON public.audit_log;
CREATE POLICY "Admin lê trilha de auditoria"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Nenhum usuário autenticado pode escrever diretamente na tabela
-- (escrita é feita apenas via funções SECURITY DEFINER)
-- Não criamos policy de INSERT/UPDATE/DELETE para 'authenticated' intencionalmente.

-- ============================================================
-- 4. Grants
-- ============================================================
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

-- ============================================================
-- 5. Função Genérica de Auditoria via Trigger
-- Registra automaticamente operações nas tabelas de negócio.
-- Detecta user_id do contexto de autenticação via auth.uid().
-- Calcula automaticamente os campos alterados em UPDATEs.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_action        TEXT;
  v_record_id     TEXT;
  v_old_data      JSONB := NULL;
  v_new_data      JSONB := NULL;
  v_changed_fields TEXT[] := NULL;
  v_user_id       UUID;
  v_user_email    TEXT;
  v_key           TEXT;
  v_old_val       TEXT;
  v_new_val       TEXT;
BEGIN
  -- Determina ação
  v_action := TG_OP; -- 'INSERT', 'UPDATE' ou 'DELETE'

  -- Tenta capturar user_id do contexto Supabase Auth (pode ser NULL em operações de sistema)
  BEGIN
    v_user_id := auth.uid();
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
    v_user_email := NULL;
  END;

  -- Captura dados conforme a operação
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW);
    -- Extrai ID do registro (coluna 'id' é padrão no MOVI+)
    v_record_id := (NEW).id::TEXT;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_record_id := (NEW).id::TEXT;

    -- Calcula campos modificados
    v_changed_fields := ARRAY[]::TEXT[];
    FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
      v_old_val := v_old_data->>v_key;
      v_new_val := v_new_data->>v_key;
      IF v_old_val IS DISTINCT FROM v_new_val THEN
        -- Exclui campos de timestamp automático para reduzir ruído
        IF v_key NOT IN ('created_at', 'updated_at') THEN
          v_changed_fields := array_append(v_changed_fields, v_key);
        END IF;
      END IF;
    END LOOP;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_record_id := (OLD).id::TEXT;
  END IF;

  -- Insere o registro de auditoria
  INSERT INTO public.audit_log (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action,
    TG_TABLE_NAME,
    v_record_id,
    v_old_data,
    v_new_data,
    CASE WHEN v_changed_fields = ARRAY[]::TEXT[] THEN NULL ELSE v_changed_fields END
  );

  -- Retorna o registro correto conforme a operação
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. Aplicar Trigger de Auditoria nas Tabelas de Negócio
-- ============================================================

-- Auditoria em ALUNOS
DROP TRIGGER IF EXISTS trg_audit_alunos ON public.alunos;
CREATE TRIGGER trg_audit_alunos
  AFTER INSERT OR UPDATE OR DELETE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Auditoria em PAGAMENTOS (tabela financeira crítica)
DROP TRIGGER IF EXISTS trg_audit_pagamentos ON public.pagamentos;
CREATE TRIGGER trg_audit_pagamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Auditoria em MATRÍCULAS
DROP TRIGGER IF EXISTS trg_audit_matriculas ON public.matriculas;
CREATE TRIGGER trg_audit_matriculas
  AFTER INSERT OR UPDATE OR DELETE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Auditoria em INSTRUTORES
DROP TRIGGER IF EXISTS trg_audit_instrutores ON public.instrutores;
CREATE TRIGGER trg_audit_instrutores
  AFTER INSERT OR UPDATE OR DELETE ON public.instrutores
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Auditoria em TURMAS
DROP TRIGGER IF EXISTS trg_audit_turmas ON public.turmas;
CREATE TRIGGER trg_audit_turmas
  AFTER INSERT OR UPDATE OR DELETE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Auditoria em LEADS
DROP TRIGGER IF EXISTS trg_audit_leads ON public.leads;
CREATE TRIGGER trg_audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Nota: Presencas e Aulas NÃO são auditadas (volume alto, baixo risco)
-- Podem ser adicionadas no futuro se necessário.

COMMIT;
