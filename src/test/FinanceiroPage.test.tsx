import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import FinanceiroPage from '@/pages/FinanceiroPage';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: (...args: any[]) => mockToast(...args),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockModalidades = [
  { id: 'MOD1', nome_modalidade: 'Pilates', area: 'Bem-Estar', status: 'ATIVO', valor_padrao: 130 },
  { id: 'MOD2', nome_modalidade: 'Ballet', area: 'Dança', status: 'ATIVO', valor_padrao: 150 },
];

const mockInstrutores = [
  { id: 'INST1', nome_completo: 'Prof. Ana', email: 'ana@movi.test', funcao: 'Instrutora', ativo: true },
  { id: 'INST2', nome_completo: 'Prof. Carlos', email: 'carlos@movi.test', funcao: 'Instrutor', ativo: true },
];

const mockTurmas = [
  { id: 'TURMA1', id_modalidade: 'MOD1', id_instrutor: 'INST1', nome_turma: 'Pilates Manhã' },
  { id: 'TURMA2', id_modalidade: 'MOD2', id_instrutor: 'INST2', nome_turma: 'Ballet Noite' },
];

const mockMatriculas = [
  { id: 'MAT1', id_aluno: 'ALU1', id_modalidade: 'MOD1', id_turma: 'TURMA1', status_matricula: 'ATIVA', valor_final: 130, data_inicio: '2026-08-01' },
  { id: 'MAT2', id_aluno: 'ALU2', id_modalidade: 'MOD2', id_turma: 'TURMA2', status_matricula: 'ATIVA', valor_final: 150, data_inicio: '2026-08-01' },
];

const mockPagamentos = [
  {
    id: 'PAG1',
    id_matricula: 'MAT1',
    id_aluno: 'ALU1',
    tipo_lancamento: 'MENSALIDADE',
    mes_referencia: 8,
    ano_referencia: 2026,
    valor_pago: 130,
    status_pagamento: 'PAGO',
  },
  {
    id: 'PAG2',
    id_matricula: 'MAT1',
    id_aluno: 'ALU1',
    tipo_lancamento: 'TAXA_MATRICULA',
    mes_referencia: 8,
    ano_referencia: 2026,
    valor_pago: 50,
    status_pagamento: 'PAGO',
  },
  {
    id: 'PAG3',
    id_matricula: 'MAT2',
    id_aluno: 'ALU2',
    tipo_lancamento: 'MENSALIDADE',
    mes_referencia: 8,
    ano_referencia: 2026,
    valor_pago: 150,
    status_pagamento: 'PAGO',
  },
];

vi.mock('@/hooks/useTable', () => ({
  useTable: (store: string) => {
    if (store === 'modalidades') return { data: mockModalidades, reload: vi.fn(), loading: false };
    if (store === 'instrutores') return { data: mockInstrutores, reload: vi.fn(), loading: false };
    if (store === 'turmas') return { data: mockTurmas, reload: vi.fn(), loading: false };
    if (store === 'matriculas') return { data: mockMatriculas, reload: vi.fn(), loading: false };
    if (store === 'pagamentos') return { data: mockPagamentos, reload: vi.fn(), loading: false };
    if (store === 'alunos') return { data: [], reload: vi.fn(), loading: false };
    return { data: [], reload: vi.fn(), loading: false };
  },
}));

describe('FinanceiroPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@movi.test' },
      isAdmin: true,
      roles: ['coordenacao'],
    });
  });

  it('renders Dashboard Financeiro header and key KPIs', () => {
    render(
      <BrowserRouter>
        <FinanceiroPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Receita do Mês Atual')).toBeInTheDocument();
    expect(screen.getByText('Repasse a Professores (Mês)')).toBeInTheDocument();
    expect(screen.getByText('Taxas de Matrícula (Mês)')).toBeInTheDocument();
  });
});
