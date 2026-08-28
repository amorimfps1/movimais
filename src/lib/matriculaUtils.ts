import { formatDateToBR } from './utils';

export type TipoPlano = 'MENSAL' | 'TRIMESTRAL' | 'ANUAL';

export const MESES_POR_PLANO: Record<string, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  ANUAL: 12,
};

/**
 * Calcula a data fim prevista da matrícula com base na data de início, tipo de plano e status da matrícula.
 * 
 * Regras:
 * - MENSAL: +1 mês
 * - TRIMESTRAL: +3 meses
 * - ANUAL: +12 meses (1 ano)
 * - SUSPENSA_30_DIAS / TRANCADA_JUSTIFICADA: Adiciona +30 dias (ou diasProrrogacao) à data de término.
 * 
 * @param dataInicioStr Data de início no formato YYYY-MM-DD
 * @param tipoPlano MENSAL | TRIMESTRAL | ANUAL
 * @param statusMatricula Status atual da matrícula
 * @param diasProrrogacao Dias adicionais de prorrogação (opcional, padrão 30 para trancamento)
 * @returns Data final formatada como YYYY-MM-DD
 */
export function calcularDataFimPrevista(
  dataInicioStr?: string,
  tipoPlano: string = 'TRIMESTRAL',
  statusMatricula?: string,
  diasProrrogacao: number = 0
): string {
  if (!dataInicioStr) return '';

  const parts = dataInicioStr.split('-');
  if (parts.length !== 3) return '';

  const ano = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1; // 0-indexed
  const dia = parseInt(parts[2], 10);

  if (isNaN(ano) || isNaN(mes) || isNaN(dia)) return '';

  // Somar os meses do plano com ajuste para o último dia do mês alvo
  const mesesAdicionais = MESES_POR_PLANO[tipoPlano?.toUpperCase()] ?? 3;
  const targetMonthIndex = mes + mesesAdicionais;
  const targetYear = ano + Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;

  // Descobre o último dia do mês de destino para evitar overflow em meses de 30/28 dias
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(dia, lastDayOfTargetMonth);

  const date = new Date(targetYear, targetMonth, targetDay);

  // Extensão automática para trancamento por saúde / suspensão
  let diasExtras = diasProrrogacao;
  if (statusMatricula === 'SUSPENSA_30_DIAS' || statusMatricula === 'TRANCADA_JUSTIFICADA') {
    diasExtras = diasProrrogacao > 0 ? diasProrrogacao : 30;
  }

  if (diasExtras > 0) {
    date.setDate(date.getDate() + diasExtras);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Helper para calcular a data fim e retorná-la diretamente formatada como DD/MM/YYYY.
 */
export function calcularDataFimPrevistaBR(
  dataInicioStr?: string,
  tipoPlano: string = 'TRIMESTRAL',
  statusMatricula?: string,
  diasProrrogacao: number = 0
): string {
  const dataFimIso = calcularDataFimPrevista(dataInicioStr, tipoPlano, statusMatricula, diasProrrogacao);
  return formatDateToBR(dataFimIso);
}

/**
 * Helper consistente para formatação de datas de matrícula no padrão brasileiro (DD/MM/YYYY).
 */
export function formatarDataBR(dateValue?: string | Date | null): string {
  return formatDateToBR(dateValue);
}

/**
 * Retorna a descrição legível do tipo de plano.
 */
export function obterDescricaoPlano(tipoPlano?: string): string {
  switch (tipoPlano?.toUpperCase()) {
    case 'MENSAL':
      return 'Mensal (1 mês)';
    case 'TRIMESTRAL':
      return 'Trimestral (3 meses)';
    case 'ANUAL':
      return 'Anual (12 meses)';
    default:
      return tipoPlano || 'Trimestral (3 meses)';
  }
}

/**
 * Verifica se a matrícula está trancada ou suspensa.
 */
export function isMatriculaTrancada(statusMatricula?: string): boolean {
  return statusMatricula === 'SUSPENSA_30_DIAS' || statusMatricula === 'TRANCADA_JUSTIFICADA';
}

/**
 * Verifica se a matrícula está inadimplente.
 */
export function isMatriculaInadimplente(statusMatricula?: string): boolean {
  return statusMatricula === 'BLOQUEADA_INADIMPLENCIA';
}

/**
 * Verifica se a data fim informada está vencida em relação à data atual.
 */
export function isMatriculaVencida(dataFimStr?: string | Date | null): boolean {
  if (!dataFimStr) return false;
  let dateObj: Date | null = null;
  if (dataFimStr instanceof Date) {
    dateObj = dataFimStr;
  } else if (typeof dataFimStr === 'string') {
    const trimmed = dataFimStr.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [dd, mm, yyyy] = trimmed.split('/').map(Number);
      dateObj = new Date(yyyy, mm - 1, dd);
    } else {
      dateObj = new Date(trimmed);
    }
  }
  if (!dateObj || isNaN(dateObj.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
}


