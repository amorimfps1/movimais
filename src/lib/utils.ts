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
