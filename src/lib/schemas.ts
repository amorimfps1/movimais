import { z } from 'zod';
import { validateCPF, stripCPF } from './utils';

export const sanitizeInput = (val: string) => val.replace(/<[^>]*>?/gm, '');
const checkXSS = (val: string) => !/<script/i.test(val);

export const cpfSchema = z
  .string()
  .transform((val) => stripCPF(val))
  .refine((val) => validateCPF(val), 'CPF inválido');

export const alunoSchema = z.object({
  id: z.string().min(1),
  nome_completo: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .refine(checkXSS, 'Conteúdo não permitido'),
  cpf: cpfSchema,
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .or(z.literal(''))
    .optional(),
  telefone: z.string().max(20).optional().default(''),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional().default(''),
  endereco: z.string().max(300).optional().default(''),
  bairro: z.string().max(100).optional().default(''),
  cep: z.string().max(10).optional().default(''),
  cidade: z.string().max(100).optional().default('Brasília'),
  uf: z
    .enum([
      'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
    ])
    .optional()
    .default('DF'),
  nome_responsavel: z.string().max(200).optional().default(''),
  cpf_responsavel: z
    .string()
    .optional()
    .default('')
    .refine((val) => {
      if (val && stripCPF(val).length >= 11) {
        return validateCPF(val);
      }
      return true;
    }, 'CPF do responsável inválido'),
  telefone_responsavel: z.string().max(20).optional().default(''),
  email_responsavel: z.string().email().or(z.literal('')).optional().default(''),
  autorizacao_imagem: z.boolean().default(false),
  aceita_comunicacao: z.boolean().default(false),
  observacoes_medicas: z.string().max(1000).optional().default(''),
  data_cadastro: z.string().optional(),
  origem_primeiro_contato: z
    .enum(['INSTAGRAM', 'INDICACAO', 'PRESENCIAL', 'WHATSAPP', 'OUTRO', ''])
    .optional()
    .default(''),
  status_cadastral: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
});
export type AlunoInput = z.infer<typeof alunoSchema>;

export const leadSchema = z.object({
  id: z.string().min(1),
  data_entrada: z.string().optional(),
  nome: z
    .string()
    .min(2)
    .max(200)
    .refine(checkXSS, 'Conteúdo não permitido'),
  cpf: z.string().optional().default(''),
  telefone: z.string().max(20).optional().default(''),
  email: z.string().email().or(z.literal('')).optional().default(''),
  canal_origem: z
    .enum(['INSTAGRAM', 'INDICACAO', 'PRESENCIAL', 'WHATSAPP', 'OUTRO', ''])
    .optional()
    .default(''),
  modalidade_interesse: z.string().optional().default(''),
  turma_interesse: z.string().optional().default(''),
  responsavel_atendimento: z.string().optional().default(''),
  status_lead: z
    .enum(['NOVO', 'EM_CONTATO', 'AGENDADO', 'CONVERTIDO', 'NAO_CONVERTIDO', 'PERDIDO'])
    .default('NOVO'),
  data_ultimo_contato: z.string().optional().default(''),
  motivo_nao_conversao: z.string().max(500).optional().default(''),
  observacoes: z.string().max(1000).optional().default(''),
  converteu_em_aluno: z.boolean().default(false),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const matriculaSchema = z.object({
  id: z.string().min(1),
  id_aluno: z.string().min(1, 'Aluno é obrigatório'),
  id_modalidade: z.string().nullable().optional(),
  id_turma: z.string().nullable().optional(),
  tipo_matricula: z
    .enum(['NORMAL', 'BOLSA', 'DESCONTO_ESPECIAL', 'ASSOCIADO_MCJB', 'CORTESIA', 'EXPERIMENTAL_CONVERTIDA', ''])
    .optional()
    .default('NORMAL'),
  data_inicio: z.string().optional(),
  data_fim_prevista: z.string().optional(),
  status_matricula: z
    .enum([
      'PENDENTE_LIBERACAO',
      'ATIVA',
      'SUSPENSA_30_DIAS',
      'TRANCADA_JUSTIFICADA',
      'BLOQUEADA_INADIMPLENCIA',
      'EXPERIMENTAL',
      'CANCELADA',
      'CONCLUIDA',
    ])
    .default('ATIVA'),
  valor_final: z.number().min(0, 'Valor não pode ser negativo').max(99999, 'Valor excede o limite').default(0),
  forma_pagamento: z
    .enum(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'BOLETO', 'TRANSFERENCIA', ''])
    .optional()
    .default(''),
  liberado_para_aula: z.boolean().default(false),
  data_criacao: z.string().optional(),
  observacoes: z.string().max(1000).optional().default(''),
});
export type MatriculaInput = z.infer<typeof matriculaSchema>;

export const turmaSchema = z.object({
  id: z.string().min(1),
  id_modalidade: z.string().min(1, 'Modalidade é obrigatória'),
  nome_turma: z.string().min(2).max(100),
  faixa_etaria: z.string().max(50).optional().default(''),
  capacidade_maxima: z.number().int().min(0).max(500).default(0),
  status_turma: z.enum(['ATIVA', 'INATIVA']).default('ATIVA'),
  permite_experimental: z.boolean().default(false),
  dias_semana: z.array(z.string()).optional().default([]),
  horario_inicio: z.string().optional().default(''),
  horario_fim: z.string().optional().default(''),
  id_instrutor: z.string().nullable().optional(),
  sala: z.string().max(100).optional().default(''),
});
export type TurmaInput = z.infer<typeof turmaSchema>;

export const modalidadeSchema = z.object({
  id: z.string().min(1),
  nome_modalidade: z.string().min(2).max(100),
  area: z.string().max(50).optional().default(''),
  valor_padrao: z.number().min(0).max(9999).default(0),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
});
export type ModalidadeInput = z.infer<typeof modalidadeSchema>;

export const instrutorSchema = z.object({
  id: z.string().min(1),
  nome_completo: z.string().min(3).max(200),
  cpf: cpfSchema.or(z.literal('')).optional().default(''),
  telefone: z.string().max(20).optional().default(''),
  email: z.string().email().or(z.literal('')).optional().default(''),
  funcao: z.string().max(100).optional().default(''),
  especialidades: z.array(z.string()).optional().default([]),
  id_modalidades: z.array(z.string()).optional().default([]),
  user_id: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
});
export type InstrutorInput = z.infer<typeof instrutorSchema>;

export const pagamentoSchema = z.object({
  id: z.string().min(1),
  id_matricula: z.string().nullable().optional(),
  id_aluno: z.string().nullable().optional(),
  tipo_lancamento: z
    .enum(['MENSALIDADE', 'TAXA_MATRICULA', 'MATERIAL', 'REPOSICAO', 'MULTA', 'DESCONTO', 'AJUSTE', ''])
    .optional()
    .default('MENSALIDADE'),
  mes_referencia: z.number().int().min(1, 'Mês inválido').max(12, 'Mês inválido').optional(),
  ano_referencia: z.number().int().min(2020).max(2050).optional(),
  data_vencimento: z.string().optional().default(''),
  valor_previsto: z.number().min(0).max(99999).default(0),
  valor_pago: z.number().min(0).max(99999).default(0),
  data_pagamento: z.string().optional().default(''),
  status_pagamento: z
    .enum(['PREVISTO', 'PENDENTE', 'PAGO', 'ATRASADO', 'ISENTO', 'ESTORNADO', 'NEGOCIADO'])
    .default('PENDENTE'),
  forma_pagamento: z
    .enum(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'BOLETO', 'TRANSFERENCIA', ''])
    .optional()
    .default(''),
});
export type PagamentoInput = z.infer<typeof pagamentoSchema>;

export const presencaSchema = z.object({
  id: z.string().min(1),
  data_aula: z.string().min(1, 'Data da aula é obrigatória'),
  id_turma: z.string().min(1),
  id_matricula: z.string().min(1),
  id_aluno: z.string().nullable().optional(),
  presenca: z.boolean().default(false),
  tipo_registro: z.string().max(50).optional().default(''),
});
export type PresencaInput = z.infer<typeof presencaSchema>;

export const aulaSchema = z.object({
  id: z.string().min(1),
  id_turma: z.string().min(1, 'Turma é obrigatória'),
  id_instrutor: z.string().nullable().optional(),
  data_aula: z.string().min(1, 'Data da aula é obrigatória'),
  horario_inicio: z.string().optional().default(''),
  horario_fim: z.string().optional().default(''),
  status_aula: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA']).default('AGENDADA'),
  observacoes: z.string().max(1000).optional().default(''),
});
export type AulaInput = z.infer<typeof aulaSchema>;
