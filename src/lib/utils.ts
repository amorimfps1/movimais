import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Remove tudo que não seja dígito */
export function stripCPF(value: string): string {
  return value.replace(/\D/g, "");
}

/** Aplica a máscara 000.000.000-00 enquanto digita */
export function maskCPF(value: string): string {
  const digits = stripCPF(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Valida o CPF pelo algoritmo dos dígitos verificadores */
export function validateCPF(value: string): boolean {
  const cpf = stripCPF(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // sequências repetidas (11111111111, etc.)

  const calc = (digits: string, len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i]) * (len + 1 - i);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(cpf, 9) === parseInt(cpf[9]) && calc(cpf, 10) === parseInt(cpf[10]);
}

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY.
 * Aceita strings ISO (ex: "2026-08-26", "2026-08-26T00:00:00.000Z"), objetos Date, ou valores nulos/indefinidos.
 * Se o valor for inválido, nulo ou vazio, retorne "—".
 */
export function formatDateToBR(dateValue?: string | Date | number | null): string {
  if (!dateValue) return "—";

  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) return "—";
    const day = String(dateValue.getDate()).padStart(2, "0");
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const year = dateValue.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof dateValue === "number") {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof dateValue === "string") {
    const str = dateValue.trim();
    if (!str) return "—";

    // Se já estiver no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

    // Se estiver no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm...
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const datePart = str.split("T")[0];
      const [year, month, day] = datePart.split("-");
      if (year && month && day) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1000) {
          return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
        }
      }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return "—";
  }

  return "—";
}
