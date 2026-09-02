import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LeadsPage from '@/pages/LeadsPage';
import { sanitizePayload, STORES } from '@/lib/store';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: (...args: any[]) => mockToast(...args),
}));

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

const mockLeads = [
  {
    id: 'LEAD1',
    nome: 'Carlos Eduardo',
    cpf: '123.456.789-00',
    telefone: '(61) 98888-7777',
    email: 'carlos@teste.com',
    canal_origem: 'WHATSAPP',
    modalidade_interesse: 'Pilates',
    status_lead: 'NOVO',
    data_entrada: '2026-08-01',
    data_ultimo_contato: '',
    observacoes: 'Interesse em aulas matutinas',
    converteu_em_aluno: false,
  },
  {
    id: 'LEAD2',
    nome: 'Mariana Lima',
    cpf: '987.654.321-99',
    telefone: '(61) 97777-6666',
    email: 'mariana@teste.com',
    canal_origem: 'INSTAGRAM',
    modalidade_interesse: 'Funcional',
    status_lead: 'CONVERTIDO',
    data_entrada: '2026-08-02',
    data_ultimo_contato: '2026-08-05',
    observacoes: '',
    converteu_em_aluno: true,
  },
];

const mockAlunos: any[] = [];

vi.mock('@/hooks/useTable', () => ({
  useTable: (store: string) => {
    if (store === 'leads') return { data: mockLeads, reload: vi.fn() };
    if (store === 'alunos') return { data: mockAlunos, reload: vi.fn() };
    return { data: [], reload: vi.fn() };
  },
}));

vi.mock('@/lib/store', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    remove: (...args: any[]) => mockRemove(...args),
  };
});

describe('Leads conversion & sanitizePayload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  describe('sanitizePayload', () => {
    it('converts empty date strings to null', () => {
      const payload = {
        id: '123',
        nome_completo: 'Test User',
        data_nascimento: '',
        data_cadastro: '   ',
        data_ultimo_contato: '',
        telefone: '',
      };

      const result = sanitizePayload(payload);
      expect(result.data_nascimento).toBeNull();
      expect(result.data_cadastro).toBeNull();
      expect(result.data_ultimo_contato).toBeNull();
      expect(result.telefone).toBe('');
    });

    it('converts empty foreign key / user_id strings to null', () => {
      const payload = {
        id: '123',
        id_instrutor: '',
        id_modalidade: '  ',
        id_turma: 'TURMA1',
        user_id: '',
      };

      const result = sanitizePayload(payload);
      expect(result.id_instrutor).toBeNull();
      expect(result.id_modalidade).toBeNull();
      expect(result.id_turma).toBe('TURMA1');
      expect(result.user_id).toBeNull();
    });

    it('preserves valid date strings and values', () => {
      const payload = {
        id: '123',
        data_nascimento: '1995-04-12',
        valor_final: 150,
      };

      const result = sanitizePayload(payload);
      expect(result.data_nascimento).toBe('1995-04-12');
      expect(result.valor_final).toBe(150);
    });
  });

  describe('LeadsPage converter em aluno', () => {
    it('renders convert button for non-converted leads and creates aluno with null data_nascimento', async () => {
      render(
        <BrowserRouter>
          <LeadsPage />
        </BrowserRouter>
      );

      const convertBtn = screen.getByTitle('Converter diretamente em Aluno');
      expect(convertBtn).toBeInTheDocument();

      fireEvent.click(convertBtn);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledTimes(1);
      });

      const [storeName, createdAluno] = mockCreate.mock.calls[0];
      expect(storeName).toBe(STORES.ALUNOS);
      expect(createdAluno.nome_completo).toBe('Carlos Eduardo');
      expect(createdAluno.cpf).toBe('123.456.789-00');
      expect(createdAluno.data_nascimento).toBeNull();
      expect(createdAluno.status_cadastral).toBe('ATIVO');

      expect(mockUpdate).toHaveBeenCalledWith(
        STORES.LEADS,
        expect.objectContaining({
          id: 'LEAD1',
          status_lead: 'CONVERTIDO',
          converteu_em_aluno: true,
        })
      );
    });
  });
});

