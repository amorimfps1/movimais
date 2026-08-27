import { z } from "zod";

/**
 * Schema Zod e tipos para validação dos dados agregados de receita por modalidade
 */
export const ModalidadeRevenueSchema = z.object({
  id_modalidade: z.string(),
  nome_modalidade: z.string(),
  area: z.string().nullable().optional(),
  total_receita: z.number().nonnegative(),
  total_mensalidades: z.number().nonnegative(),
  total_taxas_matricula: z.number().nonnegative(),
  total_outros: z.number().nonnegative(),
  total_transacoes: z.number().int().nonnegative(),
  matriculas_ativas: z.number().int().nonnegative(),
});

export type ModalidadeRevenue = z.infer<typeof ModalidadeRevenueSchema>;

/**
 * Schema Zod e tipos para validação dos dados de repasse por professor/instrutor
 * REGRA CRÍTICA DE NEGÓCIO: Apenas pagamentos categorizados como 'MENSALIDADE' entram no repasse.
 */
export const ProfessorRepasseSchema = z.object({
  id_instrutor: z.string(),
  nome_instrutor: z.string(),
  email: z.string().nullable().optional(),
  funcao: z.string().nullable().optional(),
  // Total de receitas categorizadas estritamente como MENSALIDADE
  total_mensalidades_arrecadadas: z.number().nonnegative(),
  // Taxas e outros valores que NÃO foram repassados ao professor
  total_taxas_nao_repassadas: z.number().nonnegative(),
  // Quantidade de turmas sob responsabilidade do instrutor
  total_turmas: z.number().int().nonnegative(),
  // Quantidade de alunos com matrículas ativas em suas turmas
  total_alunos_ativos: z.number().int().nonnegative(),
  // Quantidade de pagamentos de mensalidade liquidados
  total_mensalidades_pagas_count: z.number().int().nonnegative(),
});

export type ProfessorRepasse = z.infer<typeof ProfessorRepasseSchema>;

/**
 * Schema Zod para distribuição de matrículas por modalidade
 */
export const ModalidadeMatriculasSchema = z.object({
  id_modalidade: z.string(),
  nome_modalidade: z.string(),
  area: z.string().nullable().optional(),
  matriculas_ativas: z.number().int().nonnegative(),
  matriculas_total: z.number().int().nonnegative(),
  percentual: z.number().min(0).max(100),
});

export type ModalidadeMatriculas = z.infer<typeof ModalidadeMatriculasSchema>;

/**
 * Schema Zod para os cards de resumo de KPIs no topo da página
 */
export const KpiFinancialSummarySchema = z.object({
  receita_total_mes: z.number().nonnegative(),
  total_repassar_professores_mes: z.number().nonnegative(),
  total_novas_matriculas_mes: z.number().int().nonnegative(),
  total_taxas_matricula_mes: z.number().nonnegative(),
  receita_total_acumulada: z.number().nonnegative(),
  total_repassar_acumulado: z.number().nonnegative(),
  taxa_adimplencia_mes: z.number().min(0).max(100),
  ticket_medio: z.number().nonnegative(),
  pagamentos_liquidados_mes_count: z.number().int().nonnegative(),
  pagamentos_pendentes_mes_count: z.number().int().nonnegative(),
});

export type KpiFinancialSummary = z.infer<typeof KpiFinancialSummarySchema>;

/**
 * Schema Zod para filtros do Dashboard Financeiro
 */
export const FinancialFilterSchema = z.object({
  periodo: z.enum(["mes_atual", "3m", "6m", "ano", "geral"]).default("mes_atual"),
  ano: z.number().int().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  modalidade_id: z.string().optional(),
  instrutor_id: z.string().optional(),
});

export type FinancialFilter = z.infer<typeof FinancialFilterSchema>;

/**
 * Schema para histórico mensal de receita comparando Mensalidades vs Taxas/Outros
 */
export const EvolucaoFinanceiraMensalSchema = z.object({
  mes_ano: z.string(),
  mes_label: z.string(),
  ano: z.number().int(),
  mes: z.number().int(),
  receita_total: z.number().nonnegative(),
  receita_mensalidades: z.number().nonnegative(),
  receita_taxas_extras: z.number().nonnegative(),
  repasse_professores: z.number().nonnegative(),
  total_pagamentos: z.number().int().nonnegative(),
});

export type EvolucaoFinanceiraMensal = z.infer<typeof EvolucaoFinanceiraMensalSchema>;

