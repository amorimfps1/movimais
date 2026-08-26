import { describe, it, expect } from 'vitest';
import {
  calcularDataFimPrevista,
  calcularDataFimPrevistaBR,
  formatarDataBR,
  obterDescricaoPlano,
  isMatriculaTrancada,
  isMatriculaInadimplente,
} from '@/lib/matriculaUtils';
import { formatDateToBR } from '@/lib/utils';

describe('matriculaUtils - calcularDataFimPrevista', () => {
  it('deve calcular corretamente a data fim para plano MENSAL (1 mês)', () => {
    const dataFim = calcularDataFimPrevista('2026-01-15', 'MENSAL', 'ATIVA');
    expect(dataFim).toBe('2026-02-15');
  });

  it('deve calcular corretamente a data fim para plano TRIMESTRAL (3 meses)', () => {
    const dataFim = calcularDataFimPrevista('2026-01-15', 'TRIMESTRAL', 'ATIVA');
    expect(dataFim).toBe('2026-04-15');
  });

  it('deve calcular corretamente a data fim para plano ANUAL (12 meses)', () => {
    const dataFim = calcularDataFimPrevista('2026-01-15', 'ANUAL', 'ATIVA');
    expect(dataFim).toBe('2027-01-15');
  });

  it('deve estender automaticamente a data fim em +30 dias para status SUSPENSA_30_DIAS', () => {
    const dataFimNormal = calcularDataFimPrevista('2026-01-01', 'TRIMESTRAL', 'ATIVA');
    const dataFimSuspensa = calcularDataFimPrevista('2026-01-01', 'TRIMESTRAL', 'SUSPENSA_30_DIAS');
    
    expect(dataFimNormal).toBe('2026-04-01');
    expect(dataFimSuspensa).toBe('2026-05-01');
  });

  it('deve estender a data fim em +30 dias para status TRANCADA_JUSTIFICADA', () => {
    const dataFimNormal = calcularDataFimPrevista('2026-01-01', 'ANUAL', 'ATIVA');
    const dataFimTrancada = calcularDataFimPrevista('2026-01-01', 'ANUAL', 'TRANCADA_JUSTIFICADA');

    expect(dataFimNormal).toBe('2027-01-01');
    expect(dataFimTrancada).toBe('2027-01-31');
  });

  it('deve aceitar número customizado de dias de prorrogação', () => {
    const dataFimCustom = calcularDataFimPrevista('2026-01-01', 'TRIMESTRAL', 'TRANCADA_JUSTIFICADA', 45);
    expect(dataFimCustom).toBe('2026-05-16');
  });

  it('deve retornar string vazia para data de início inválida ou vazia', () => {
    expect(calcularDataFimPrevista('', 'TRIMESTRAL')).toBe('');
    expect(calcularDataFimPrevista('data-invalida', 'TRIMESTRAL')).toBe('');
  });

  it('deve calcular e formatar a data fim no formato DD/MM/YYYY via calcularDataFimPrevistaBR', () => {
    const dataFimBR = calcularDataFimPrevistaBR('2026-01-15', 'TRIMESTRAL', 'ATIVA');
    expect(dataFimBR).toBe('15/04/2026');
  });
});

describe('formatDateToBR e formatarDataBR', () => {
  it('deve formatar string ISO no formato DD/MM/YYYY', () => {
    expect(formatDateToBR('2026-08-26')).toBe('26/08/2026');
    expect(formatarDataBR('2026-08-26')).toBe('26/08/2026');
  });

  it('deve manter string ja no formato DD/MM/YYYY', () => {
    expect(formatDateToBR('26/08/2026')).toBe('26/08/2026');
  });

  it('deve retornar "—" para valores vazios ou nulos', () => {
    expect(formatDateToBR('')).toBe('—');
    expect(formatDateToBR(null)).toBe('—');
    expect(formatDateToBR(undefined)).toBe('—');
  });
});

describe('matriculaUtils - auxiliares', () => {
  it('obterDescricaoPlano deve retornar nome amigável do plano', () => {
    expect(obterDescricaoPlano('MENSAL')).toBe('Mensal (1 mês)');
    expect(obterDescricaoPlano('TRIMESTRAL')).toBe('Trimestral (3 meses)');
    expect(obterDescricaoPlano('ANUAL')).toBe('Anual (12 meses)');
  });

  it('isMatriculaTrancada deve identificar trancamentos por saúde e suspensão', () => {
    expect(isMatriculaTrancada('SUSPENSA_30_DIAS')).toBe(true);
    expect(isMatriculaTrancada('TRANCADA_JUSTIFICADA')).toBe(true);
    expect(isMatriculaTrancada('ATIVA')).toBe(false);
  });

  it('isMatriculaInadimplente deve identificar inadimplência', () => {
    expect(isMatriculaInadimplente('BLOQUEADA_INADIMPLENCIA')).toBe(true);
    expect(isMatriculaInadimplente('ATIVA')).toBe(false);
  });
});


