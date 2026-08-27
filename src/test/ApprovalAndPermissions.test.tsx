import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PresencasPage from '@/pages/PresencasPage';
import TurmasPage from '@/pages/TurmasPage';
import ModalidadesPage from '@/pages/ModalidadesPage';
import InstrutoresPage from '@/pages/InstrutoresPage';
import AulasPage from '@/pages/AulasPage';

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: (...args: any[]) => mockToast(...args),
}));

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockTurmas = [
  { id: 'TURMA1', nome_turma: 'Turma do Prof Silva', id_instrutor: 'INST1', status_turma: 'ATIVA', dias_semana: ['Quinta'], horario_inicio: '08:00', horario_fim: '09:00' },
  { id: 'TURMA2', nome_turma: 'Turma de Outro Prof', id_instrutor: 'INST2', status_turma: 'ATIVA', dias_semana: ['Quinta'], horario_inicio: '10:00', horario_fim: '11:00' },
];

const mockInstrutores = [
  { id: 'INST1', nome_completo: 'Prof. Silva', email: 'silva@movi.test', especialidades: ['Pilates'], ativo: true },
  { id: 'INST2', nome_completo: 'Prof. Outro', email: 'outro@movi.test', especialidades: ['Ballet'], ativo: true },
];

const mockModalidades = [
  { id: 'MOD1', nome_modalidade: 'Pilates', status: 'ATIVO', valor_padrao: 100 },
];

const mockAulas = [
  { id: 'AULA1', id_turma: 'TURMA1', id_instrutor: 'INST1', data_aula: '2026-08-27', status_aula: 'AGENDADA' },
];

vi.mock('@/hooks/useTable', () => ({
  useTable: (store: string) => {
    if (store === 'turmas') return { data: mockTurmas, reload: vi.fn() };
    if (store === 'instrutores') return { data: mockInstrutores, reload: vi.fn() };
    if (store === 'modalidades') return { data: mockModalidades, reload: vi.fn() };
    if (store === 'aulas') return { data: mockAulas, reload: vi.fn() };
    return { data: [], reload: vi.fn() };
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('Approval & Permissions Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PresencasPage - Instrutor Chamada Restrictions', () => {
    it('restricts available turmas for non-admin instructor to only their assigned turmas', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'silva@movi.test' },
        isAdmin: false,
        isInstrutor: true,
        instrutorId: 'INST1',
        roles: ['instrutor'],
      });

      render(
        <BrowserRouter>
          <PresencasPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Turma do Prof Silva')).toBeInTheDocument();
      expect(screen.queryByText('Turma de Outro Prof')).not.toBeInTheDocument();
    });
  });

  describe('Management Pages - Admin Only Action Buttons', () => {
    it('hides creation and editing buttons from non-admin instructors on TurmasPage', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'silva@movi.test' },
        isAdmin: false,
        isInstrutor: true,
        instrutorId: 'INST1',
        roles: ['instrutor'],
      });

      render(
        <BrowserRouter>
          <TurmasPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('Nova Turma')).not.toBeInTheDocument();
    });

    it('shows Nova Turma button for admin users on TurmasPage', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@movi.test' },
        isAdmin: true,
        isInstrutor: false,
        roles: ['secretaria'],
      });

      render(
        <BrowserRouter>
          <TurmasPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Nova Turma')).toBeInTheDocument();
    });

    it('hides Nova Modalidade button from non-admin instructors on ModalidadesPage', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'silva@movi.test' },
        isAdmin: false,
        isInstrutor: true,
        instrutorId: 'INST1',
        roles: ['instrutor'],
      });

      render(
        <BrowserRouter>
          <ModalidadesPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('Nova Modalidade')).not.toBeInTheDocument();
    });

    it('shows Nova Modalidade button for admin users on ModalidadesPage', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'admin@movi.test' },
        isAdmin: true,
        isInstrutor: false,
        roles: ['coordenacao'],
      });

      render(
        <BrowserRouter>
          <ModalidadesPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Nova Modalidade')).toBeInTheDocument();
    });

    it('hides Novo Instrutor button from non-admin instructors on InstrutoresPage', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'silva@movi.test' },
        isAdmin: false,
        isInstrutor: true,
        instrutorId: 'INST1',
        roles: ['instrutor'],
      });

      render(
        <BrowserRouter>
          <InstrutoresPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('Novo Instrutor')).not.toBeInTheDocument();
    });

    it('hides Agendar Aula Extra button from non-admin instructors on AulasPage', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'silva@movi.test' },
        isAdmin: false,
        isInstrutor: true,
        instrutorId: 'INST1',
        roles: ['instrutor'],
      });

      render(
        <BrowserRouter>
          <AulasPage />
        </BrowserRouter>
      );

      expect(screen.queryByText('Agendar Aula Extra')).not.toBeInTheDocument();
    });
  });
});

