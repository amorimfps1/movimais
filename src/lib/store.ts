// Simple localStorage-based store for all modules

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

function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function generateId() {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

// Generic CRUD
export function getAll<T>(key: string): T[] { return getStore<T>(key); }
export function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  return getStore<T>(key).find(item => item.id === id);
}
export function create<T>(key: string, item: T) {
  const items = getStore<T>(key);
  items.push(item);
  setStore(key, items);
}
export function update<T extends { id: string }>(key: string, item: T) {
  const items = getStore<T>(key).map(i => (i as any).id === item.id ? item : i);
  setStore(key, items);
}
export function remove(key: string, id: string) {
  const items = getStore<any>(key).filter((i: any) => i.id !== id);
  setStore(key, items);
}

// Store keys
export const STORES = {
  ALUNOS: 'movi_alunos',
  LEADS: 'movi_leads',
  MATRICULAS: 'movi_matriculas',
  TURMAS: 'movi_turmas',
  MODALIDADES: 'movi_modalidades',
  INSTRUTORES: 'movi_instrutores',
  PAGAMENTOS: 'movi_pagamentos',
  PRESENCAS: 'movi_presencas',
} as const;

// Seed default modalidades
export function seedDefaults() {
  if (getAll(STORES.MODALIDADES).length === 0) {
    const modalidades: Modalidade[] = [
      { id: generateId(), nome_modalidade: 'Ballet', area: 'Dança', valor_padrao: 150, status: 'ATIVO' },
      { id: generateId(), nome_modalidade: 'Judô', area: 'Artes Marciais', valor_padrao: 120, status: 'ATIVO' },
      { id: generateId(), nome_modalidade: 'Desenho e Pintura', area: 'Artes', valor_padrao: 100, status: 'ATIVO' },
      { id: generateId(), nome_modalidade: 'Yoga', area: 'Bem-Estar', valor_padrao: 130, status: 'ATIVO' },
      { id: generateId(), nome_modalidade: 'Capoeira', area: 'Artes Marciais', valor_padrao: 110, status: 'ATIVO' },
      { id: generateId(), nome_modalidade: 'Muay Thai', area: 'Artes Marciais', valor_padrao: 140, status: 'ATIVO' },
    ];
    setStore(STORES.MODALIDADES, modalidades);
  }
}
