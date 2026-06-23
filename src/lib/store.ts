// Supabase-backed data store for MOVI+
import { supabase } from "@/integrations/supabase/client";

// ============ Types ============
export interface Aluno {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  nome_responsavel: string;
  cpf_responsavel: string;
  telefone_responsavel: string;
  email_responsavel: string;
  autorizacao_imagem: boolean;
  aceita_comunicacao: boolean;
  observacoes_medicas: string;
  data_cadastro: string;
  origem_primeiro_contato: string;
  status_cadastral: string;
}

export interface Lead {
  id: string;
  data_entrada: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  canal_origem: string;
  modalidade_interesse: string;
  turma_interesse: string;
  responsavel_atendimento: string;
  status_lead: string;
  data_ultimo_contato: string;
  motivo_nao_conversao: string;
  observacoes: string;
  converteu_em_aluno: boolean;
}

export interface Matricula {
  id: string;
  id_aluno: string;
  id_modalidade: string;
  id_turma: string;
  tipo_matricula: string;
  data_inicio: string;
  data_fim_prevista: string;
  status_matricula: string;
  valor_final: number;
  forma_pagamento: string;
  liberado_para_aula: boolean;
  data_criacao: string;
  observacoes: string;
}

export interface Turma {
  id: string;
  id_modalidade: string;
  nome_turma: string;
  faixa_etaria: string;
  capacidade_maxima: number;
  status_turma: string;
  permite_experimental: boolean;
}

export interface Modalidade {
  id: string;
  nome_modalidade: string;
  area: string;
  valor_padrao: number;
  status: string;
}

export interface Instrutor {
  id: string;
  nome_completo: string;
  cpf: string;
  telefone: string;
  email: string;
  funcao: string;
  ativo: boolean;
}

export interface Pagamento {
  id: string;
  id_matricula: string;
  id_aluno: string;
  tipo_lancamento: string;
  mes_referencia: number;
  ano_referencia: number;
  data_vencimento: string;
  valor_previsto: number;
  valor_pago: number;
  data_pagamento: string;
  status_pagamento: string;
  forma_pagamento: string;
}

export interface Presenca {
  id: string;
  data_aula: string;
  id_turma: string;
  id_matricula: string;
  id_aluno: string;
  presenca: boolean;
  tipo_registro: string;
}

// ============ Table names ============
export const STORES = {
  ALUNOS: "alunos",
  LEADS: "leads",
  MATRICULAS: "matriculas",
  TURMAS: "turmas",
  MODALIDADES: "modalidades",
  INSTRUTORES: "instrutores",
  PAGAMENTOS: "pagamentos",
  PRESENCAS: "presencas",
} as const;

export function generateId() {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

// ============ Generic CRUD (async) ============
export async function getAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table as any).select("*").order("created_at", { ascending: false });
  if (error) {
    console.error(`[getAll ${table}]`, error);
    return [];
  }
  return (data as T[]) || [];
}

export async function getById<T>(table: string, id: string): Promise<T | undefined> {
  const { data, error } = await supabase.from(table as any).select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error(`[getById ${table}]`, error);
    return undefined;
  }
  return (data as T) || undefined;
}

export async function create<T>(table: string, item: T): Promise<void> {
  const { error } = await supabase.from(table as any).insert(item as any);
  if (error) {
    console.error(`[create ${table}]`, error);
    throw error;
  }
}

export async function update<T extends { id: string }>(table: string, item: T): Promise<void> {
  const { id, ...rest } = item as any;
  const { error } = await supabase.from(table as any).update(rest).eq("id", id);
  if (error) {
    console.error(`[update ${table}]`, error);
    throw error;
  }
}

export async function remove(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) {
    console.error(`[remove ${table}]`, error);
    throw error;
  }
}
