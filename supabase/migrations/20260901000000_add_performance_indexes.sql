-- Migration: Criação de Índices de Performance para MOVI+ MCJB
-- Objetivo: Eliminar full table scans nas queries de filtro, JOIN e ordenação.
-- Todas as views financeiras e listagens de módulos se beneficiam destes índices.

BEGIN;

-- ============================================================
-- PAGAMENTOS (tabela mais crítica para o dashboard financeiro)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pagamentos_status_pagamento
  ON public.pagamentos(status_pagamento);

CREATE INDEX IF NOT EXISTS idx_pagamentos_tipo_lancamento
  ON public.pagamentos(tipo_lancamento);

CREATE INDEX IF NOT EXISTS idx_pagamentos_ano_mes_referencia
  ON public.pagamentos(ano_referencia, mes_referencia);

CREATE INDEX IF NOT EXISTS idx_pagamentos_id_matricula
  ON public.pagamentos(id_matricula);

CREATE INDEX IF NOT EXISTS idx_pagamentos_id_aluno
  ON public.pagamentos(id_aluno);

CREATE INDEX IF NOT EXISTS idx_pagamentos_data_vencimento
  ON public.pagamentos(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento
  ON public.pagamentos(data_pagamento);

-- Índice composto para queries de dashboard financeiro (filtro por status + tipo + período)
CREATE INDEX IF NOT EXISTS idx_pagamentos_status_tipo_periodo
  ON public.pagamentos(status_pagamento, tipo_lancamento, ano_referencia, mes_referencia);

-- ============================================================
-- MATRÍCULAS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_matriculas_status_matricula
  ON public.matriculas(status_matricula);

CREATE INDEX IF NOT EXISTS idx_matriculas_id_aluno
  ON public.matriculas(id_aluno);

CREATE INDEX IF NOT EXISTS idx_matriculas_id_modalidade
  ON public.matriculas(id_modalidade);

CREATE INDEX IF NOT EXISTS idx_matriculas_id_turma
  ON public.matriculas(id_turma);

CREATE INDEX IF NOT EXISTS idx_matriculas_data_inicio
  ON public.matriculas(data_inicio);

-- Índice composto para filtro de matrículas ativas por modalidade (View financeira)
CREATE INDEX IF NOT EXISTS idx_matriculas_status_modalidade
  ON public.matriculas(status_matricula, id_modalidade);

-- ============================================================
-- ALUNOS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_alunos_status_cadastral
  ON public.alunos(status_cadastral);

CREATE INDEX IF NOT EXISTS idx_alunos_cpf
  ON public.alunos(cpf);

CREATE INDEX IF NOT EXISTS idx_alunos_email
  ON public.alunos(email);

CREATE INDEX IF NOT EXISTS idx_alunos_nome_completo
  ON public.alunos(nome_completo);

-- ============================================================
-- LEADS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status_lead
  ON public.leads(status_lead);

CREATE INDEX IF NOT EXISTS idx_leads_canal_origem
  ON public.leads(canal_origem);

CREATE INDEX IF NOT EXISTS idx_leads_converteu_em_aluno
  ON public.leads(converteu_em_aluno);

CREATE INDEX IF NOT EXISTS idx_leads_data_entrada
  ON public.leads(data_entrada);

-- ============================================================
-- TURMAS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_turmas_id_modalidade
  ON public.turmas(id_modalidade);

CREATE INDEX IF NOT EXISTS idx_turmas_id_instrutor
  ON public.turmas(id_instrutor);

CREATE INDEX IF NOT EXISTS idx_turmas_status_turma
  ON public.turmas(status_turma);

-- ============================================================
-- MODALIDADES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_modalidades_status
  ON public.modalidades(status);

CREATE INDEX IF NOT EXISTS idx_modalidades_area
  ON public.modalidades(area);

-- ============================================================
-- INSTRUTORES
-- ============================================================
-- Nota: idx_instrutores_user_id e idx_aulas_id_instrutor já existem
-- na migração 20260827000000. Criamos apenas os ausentes:
CREATE INDEX IF NOT EXISTS idx_instrutores_email
  ON public.instrutores(email);

CREATE INDEX IF NOT EXISTS idx_instrutores_ativo
  ON public.instrutores(ativo);

-- ============================================================
-- PRESENÇAS
-- ============================================================
-- Nota: idx_presencas_data_aula, idx_presencas_id_turma já existem em outras
-- migrações. Criamos os ausentes:
CREATE INDEX IF NOT EXISTS idx_presencas_id_matricula
  ON public.presencas(id_matricula);

CREATE INDEX IF NOT EXISTS idx_presencas_id_aluno
  ON public.presencas(id_aluno);

CREATE INDEX IF NOT EXISTS idx_presencas_presenca
  ON public.presencas(presenca);

-- Índice composto para chamada por turma+data (caso de uso principal de PresencasPage)
CREATE INDEX IF NOT EXISTS idx_presencas_turma_data
  ON public.presencas(id_turma, data_aula);

-- ============================================================
-- AULAS
-- ============================================================
-- Nota: idx_aulas_id_instrutor e idx_aulas_data_aula já existem
-- na migração 20260827000000. Criamos o ausente:
CREATE INDEX IF NOT EXISTS idx_aulas_status_aula
  ON public.aulas(status_aula);

CREATE INDEX IF NOT EXISTS idx_aulas_id_turma
  ON public.aulas(id_turma);

-- Índice composto para listagem de aulas por instrutor + data (AulasPage)
CREATE INDEX IF NOT EXISTS idx_aulas_instrutor_data
  ON public.aulas(id_instrutor, data_aula);

-- ============================================================
-- PROFILES & USER_ROLES (Auth)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status
  ON public.profiles(status);

CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON public.user_roles(role);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notifications_target_role
  ON public.notifications(target_role);

CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);

COMMIT;
