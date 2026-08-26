import { describe, it, expect } from 'vitest';
import {
  cpfSchema,
  alunoSchema,
  leadSchema,
  matriculaSchema,
  turmaSchema,
  modalidadeSchema,
  instrutorSchema,
  pagamentoSchema,
  presencaSchema,
  aulaSchema,
} from '@/lib/schemas';

describe('cpfSchema', () => {
  it('should pass valid CPFs', () => {
    expect(cpfSchema.safeParse('52998224725').success).toBe(true);
    expect(cpfSchema.safeParse('11144477735').success).toBe(true);
  });

  it('should fail with all same digits', () => {
    expect(cpfSchema.safeParse('11111111111').success).toBe(false);
  });

  it('should fail with wrong check digits', () => {
    expect(cpfSchema.safeParse('12345678901').success).toBe(false);
  });

  it('should fail when too short', () => {
    expect(cpfSchema.safeParse('1234').success).toBe(false);
  });

  it('should fail when too long', () => {
    expect(cpfSchema.safeParse('123456789012').success).toBe(false);
  });

  it('should fail with letters', () => {
    expect(cpfSchema.safeParse('abc12345678').success).toBe(false);
  });

  it('should fail with empty string', () => {
    expect(cpfSchema.safeParse('').success).toBe(false);
  });
});

describe('alunoSchema', () => {
  it('should pass complete valid aluno object', () => {
    const aluno = {
      id: 'A1B2C3D4',
      nome_completo: 'Maria Silva',
      cpf: '52998224725',
      data_nascimento: '1990-01-01',
      telefone: '61999999999',
      email: 'maria@example.com',
      endereco: 'Rua 1',
      bairro: 'Centro',
      cep: '70000000',
      cidade: 'Brasília',
      uf: 'DF',
      nome_responsavel: '',
      cpf_responsavel: '',
      telefone_responsavel: '',
      email_responsavel: '',
      autorizacao_imagem: true,
      aceita_comunicacao: true,
      observacoes_medicas: 'Nenhuma',
      data_cadastro: '2023-10-10',
      origem_primeiro_contato: 'INSTAGRAM',
      status_cadastral: 'ATIVO',
    };
    expect(alunoSchema.safeParse(aluno).success).toBe(true);
  });

  it('should pass minimal valid object', () => {
    const minimal = {
      id: 'A1B2C3D4',
      nome_completo: 'Maria Silva',
      cpf: '52998224725',
    };
    expect(alunoSchema.safeParse(minimal).success).toBe(true);
  });

  it('should fail with empty nome_completo', () => {
    const obj = { id: 'A1', nome_completo: '', cpf: '52998224725' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should fail with nome_completo 2 chars', () => {
    const obj = { id: 'A1', nome_completo: 'Ma', cpf: '52998224725' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should fail with nome_completo 201 chars', () => {
    const obj = { id: 'A1', nome_completo: 'a'.repeat(201), cpf: '52998224725' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should pass with accents', () => {
    const obj = { id: 'A1', nome_completo: 'José da Conceição', cpf: '52998224725' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should fail with invalid CPF', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '123' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should fail email without @', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', email: 'mariaexample.com' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should pass valid email', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', email: 'maria@example.com' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should pass empty string email', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', email: '' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should fail with invalid UF', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', uf: 'XX' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should pass with valid UF', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', uf: 'DF' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should fail with invalid status_cadastral', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', status_cadastral: 'QUALQUER' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should pass with valid status_cadastral', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', status_cadastral: 'ATIVO' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should fail XSS in nome_completo', () => {
    const obj = { id: 'A1', nome_completo: '<script>alert("xss")</script>', cpf: '52998224725' };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });

  it('should pass SQL injection in nome_completo', () => {
    const obj = { id: 'A1', nome_completo: "'; DROP TABLE alunos; --", cpf: '52998224725' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should pass XSS in endereco', () => {
    // Note: We only refine name fields for XSS. Production should sanitize all inputs.
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', endereco: '<script>document.cookie</script>' };
    expect(alunoSchema.safeParse(obj).success).toBe(true);
  });

  it('should fail observacoes_medicas > 1000 chars', () => {
    const obj = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', observacoes_medicas: 'a'.repeat(1001) };
    expect(alunoSchema.safeParse(obj).success).toBe(false);
  });
});

describe('leadSchema', () => {
  it('should pass valid complete lead', () => {
    const lead = { id: 'L1', nome: 'João Lead', status_lead: 'CONVERTIDO', canal_origem: 'INSTAGRAM' };
    expect(leadSchema.safeParse(lead).success).toBe(true);
  });

  it('should fail empty nome', () => {
    const lead = { id: 'L1', nome: '' };
    expect(leadSchema.safeParse(lead).success).toBe(false);
  });

  it('should fail invalid status_lead', () => {
    const lead = { id: 'L1', nome: 'João', status_lead: 'INVALIDO' };
    expect(leadSchema.safeParse(lead).success).toBe(false);
  });

  it('should fail XSS in nome', () => {
    const lead = { id: 'L1', nome: '<script>alert(1)</script>' };
    expect(leadSchema.safeParse(lead).success).toBe(false);
  });
});

describe('matriculaSchema', () => {
  it('should pass valid complete', () => {
    const matricula = { id: 'M1', id_aluno: 'A1', valor_final: 0, status_matricula: 'ATIVA' };
    expect(matriculaSchema.safeParse(matricula).success).toBe(true);
  });

  it('should fail empty id_aluno', () => {
    const matricula = { id: 'M1', id_aluno: '' };
    expect(matriculaSchema.safeParse(matricula).success).toBe(false);
  });

  it('should fail negative valor_final', () => {
    const matricula = { id: 'M1', id_aluno: 'A1', valor_final: -10 };
    expect(matriculaSchema.safeParse(matricula).success).toBe(false);
  });

  it('should fail huge valor_final', () => {
    const matricula = { id: 'M1', id_aluno: 'A1', valor_final: 100000 };
    expect(matriculaSchema.safeParse(matricula).success).toBe(false);
  });

  it('should fail invalid status_matricula', () => {
    const matricula = { id: 'M1', id_aluno: 'A1', status_matricula: 'INEXISTENTE' };
    expect(matriculaSchema.safeParse(matricula).success).toBe(false);
  });

  it('should pass null id_modalidade', () => {
    const matricula = { id: 'M1', id_aluno: 'A1', id_modalidade: null };
    expect(matriculaSchema.safeParse(matricula).success).toBe(true);
  });
});

describe('turmaSchema', () => {
  it('should pass valid turma', () => {
    const turma = { id: 'T1', id_modalidade: 'MOD1', nome_turma: 'Turma A', capacidade_maxima: 0 };
    expect(turmaSchema.safeParse(turma).success).toBe(true);
  });

  it('should pass valid turma with full schedule and instructor', () => {
    const turma = {
      id: 'T1',
      id_modalidade: 'BALLET01',
      id_instrutor: 'INST01',
      nome_turma: 'Ballet Infantil A',
      faixa_etaria: '6 a 12 anos',
      capacidade_maxima: 20,
      dias_semana: ['Segunda', 'Quarta'],
      horario_inicio: '08:00',
      horario_fim: '09:00',
      sala: 'Sala 2 - Dança',
      status_turma: 'ATIVA',
      permite_experimental: true,
    };
    const parsed = turmaSchema.safeParse(turma);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dias_semana).toEqual(['Segunda', 'Quarta']);
      expect(parsed.data.id_instrutor).toBe('INST01');
    }
  });

  it('should fail nome_turma 1 char', () => {
    const turma = { id: 'T1', id_modalidade: 'MOD1', nome_turma: 'A' };
    expect(turmaSchema.safeParse(turma).success).toBe(false);
  });

  it('should fail negative capacidade_maxima', () => {
    const turma = { id: 'T1', id_modalidade: 'MOD1', nome_turma: 'Turma A', capacidade_maxima: -1 };
    expect(turmaSchema.safeParse(turma).success).toBe(false);
  });

  it('should fail capacidade_maxima > 500', () => {
    const turma = { id: 'T1', id_modalidade: 'MOD1', nome_turma: 'Turma A', capacidade_maxima: 501 };
    expect(turmaSchema.safeParse(turma).success).toBe(false);
  });
});

describe('modalidadeSchema', () => {
  it('should pass valid modalidade', () => {
    const mod = { id: 'MOD1', nome_modalidade: 'Dança', status: 'ATIVO' };
    expect(modalidadeSchema.safeParse(mod).success).toBe(true);
  });

  it('should fail negative valor_padrao', () => {
    const mod = { id: 'MOD1', nome_modalidade: 'Dança', valor_padrao: -1 };
    expect(modalidadeSchema.safeParse(mod).success).toBe(false);
  });

  it('should fail invalid status', () => {
    const mod = { id: 'MOD1', nome_modalidade: 'Dança', status: 'INVALIDO' };
    expect(modalidadeSchema.safeParse(mod).success).toBe(false);
  });
});

describe('instrutorSchema', () => {
  it('should pass valid instrutor', () => {
    const instrutor = { id: 'I1', nome_completo: 'Instrutor Silva', cpf: '52998224725' };
    expect(instrutorSchema.safeParse(instrutor).success).toBe(true);
  });

  it('should pass valid instrutor with multiple specialties (1:N)', () => {
    const instrutor = {
      id: 'I1',
      nome_completo: 'Carlos Eduardo Silveira',
      cpf: '52998224725',
      telefone: '(61) 99999-9999',
      email: 'carlos@example.com',
      especialidades: ['Jiu-Jitsu', 'Karatê', 'Capoeira'],
      id_modalidades: ['JIUJITS1', 'KARATE01', 'CAPOEIR1'],
      ativo: true,
    };
    const parsed = instrutorSchema.safeParse(instrutor);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.especialidades).toHaveLength(3);
      expect(parsed.data.especialidades).toContain('Jiu-Jitsu');
    }
  });

  it('should pass empty CPF', () => {
    const instrutor = { id: 'I1', nome_completo: 'Instrutor Silva', cpf: '' };
    expect(instrutorSchema.safeParse(instrutor).success).toBe(true);
  });

  it('should fail nome_completo 2 chars', () => {
    const instrutor = { id: 'I1', nome_completo: 'In' };
    expect(instrutorSchema.safeParse(instrutor).success).toBe(false);
  });
});

describe('pagamentoSchema', () => {
  it('should pass valid pagamento', () => {
    const pag = { id: 'P1', mes_referencia: 6, status_pagamento: 'PAGO', tipo_lancamento: 'MENSALIDADE' };
    expect(pagamentoSchema.safeParse(pag).success).toBe(true);
  });

  it('should fail mes_referencia 0', () => {
    const pag = { id: 'P1', mes_referencia: 0 };
    expect(pagamentoSchema.safeParse(pag).success).toBe(false);
  });

  it('should fail mes_referencia 13', () => {
    const pag = { id: 'P1', mes_referencia: 13 };
    expect(pagamentoSchema.safeParse(pag).success).toBe(false);
  });

  it('should fail ano_referencia 2019', () => {
    const pag = { id: 'P1', ano_referencia: 2019 };
    expect(pagamentoSchema.safeParse(pag).success).toBe(false);
  });

  it('should fail ano_referencia 2051', () => {
    const pag = { id: 'P1', ano_referencia: 2051 };
    expect(pagamentoSchema.safeParse(pag).success).toBe(false);
  });

  it('should fail negative valor_previsto', () => {
    const pag = { id: 'P1', valor_previsto: -10 };
    expect(pagamentoSchema.safeParse(pag).success).toBe(false);
  });
});

describe('presencaSchema', () => {
  it('should pass valid presenca', () => {
    const p = { id: 'PR1', data_aula: '2023-10-10', id_turma: 'T1', id_matricula: 'M1' };
    expect(presencaSchema.safeParse(p).success).toBe(true);
  });

  it('should fail empty data_aula', () => {
    const p = { id: 'PR1', data_aula: '', id_turma: 'T1', id_matricula: 'M1' };
    expect(presencaSchema.safeParse(p).success).toBe(false);
  });

  it('should fail empty id_turma', () => {
    const p = { id: 'PR1', data_aula: '2023-10-10', id_turma: '', id_matricula: 'M1' };
    expect(presencaSchema.safeParse(p).success).toBe(false);
  });
});

describe('aulaSchema', () => {
  it('should pass valid aula', () => {
    const a = { id: 'AU1', id_turma: 'T1', data_aula: '2023-10-10', status_aula: 'REALIZADA' };
    expect(aulaSchema.safeParse(a).success).toBe(true);
  });

  it('should fail empty id_turma', () => {
    const a = { id: 'AU1', id_turma: '', data_aula: '2023-10-10' };
    expect(aulaSchema.safeParse(a).success).toBe(false);
  });

  it('should fail empty data_aula', () => {
    const a = { id: 'AU1', id_turma: 'T1', data_aula: '' };
    expect(aulaSchema.safeParse(a).success).toBe(false);
  });

  it('should fail invalid status_aula', () => {
    const a = { id: 'AU1', id_turma: 'T1', data_aula: '2023-10-10', status_aula: 'INVALIDA' };
    expect(aulaSchema.safeParse(a).success).toBe(false);
  });
});

describe('Testes de Injeção e Segurança', () => {
  it('should pass SQL injection in nome', () => {
    // Note: Passes because only <script is checked in refine.
    const aluno = { id: 'A1', nome_completo: "Robert'); DROP TABLE alunos;--", cpf: '52998224725' };
    expect(alunoSchema.safeParse(aluno).success).toBe(true);
  });

  it('should fail XSS in nome', () => {
    const aluno = { id: 'A1', nome_completo: '<script>alert(1)</script>', cpf: '52998224725' };
    expect(alunoSchema.safeParse(aluno).success).toBe(false);
  });

  it('should fail uppercase XSS in nome', () => {
    const aluno = { id: 'A1', nome_completo: '<SCRIPT>alert(1)</SCRIPT>', cpf: '52998224725' };
    expect(alunoSchema.safeParse(aluno).success).toBe(false);
  });

  it('should pass HTML injection in observacoes', () => {
    // Note: We don't block all HTML in all fields
    const aluno = { id: 'A1', nome_completo: 'Maria', cpf: '52998224725', observacoes_medicas: '<iframe src="evil.com">' };
    expect(alunoSchema.safeParse(aluno).success).toBe(true);
  });

  it('should fail numeric overflow', () => {
    const matricula = { id: 'M1', id_aluno: 'A1', valor_final: Number.MAX_SAFE_INTEGER };
    expect(matriculaSchema.safeParse(matricula).success).toBe(false);
  });

  it('should fail type coercion for valor_final', () => {
    // @ts-expect-error Testing invalid runtime data
    const matricula = { id: 'M1', id_aluno: 'A1', valor_final: '100' };
    expect(matriculaSchema.safeParse(matricula).success).toBe(false);
  });

  it('should fail null for required field', () => {
    // @ts-expect-error Testing invalid runtime data
    const aluno = { id: 'A1', nome_completo: null, cpf: '52998224725' };
    expect(alunoSchema.safeParse(aluno).success).toBe(false);
  });

  it('should fail undefined for required field', () => {
    // @ts-expect-error Testing invalid runtime data
    const aluno = { nome_completo: 'Maria', cpf: '52998224725' };
    expect(alunoSchema.safeParse(aluno).success).toBe(false);
  });

  it('should fail object where string expected', () => {
    // @ts-expect-error Testing invalid runtime data
    const aluno = { id: 'A1', nome_completo: { name: 'Maria' }, cpf: '52998224725' };
    expect(alunoSchema.safeParse(aluno).success).toBe(false);
  });
});
