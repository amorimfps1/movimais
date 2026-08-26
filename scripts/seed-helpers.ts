import crypto from 'crypto';

export function generateId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

export function generateCPF(): string {
  const num = (n: number) => Math.floor(Math.random() * n);
  const n = [num(9), num(9), num(9), num(9), num(9), num(9), num(9), num(9), num(9)];
  
  let d1 = n[8]*2 + n[7]*3 + n[6]*4 + n[5]*5 + n[4]*6 + n[3]*7 + n[2]*8 + n[1]*9 + n[0]*10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1*2 + n[8]*3 + n[7]*4 + n[6]*5 + n[5]*6 + n[4]*7 + n[3]*8 + n[2]*9 + n[1]*10 + n[0]*11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n.join('')}${d1}${d2}`;
}

export function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const firstNames = ["Ana", "João", "Maria", "Pedro", "Lucas", "Beatriz", "Gabriel", "Mariana", "Matheus", "Julia", "Carlos", "Fernanda", "Rafael", "Camila", "Rodrigo", "Letícia", "Bruno", "Amanda", "Thiago", "Natália", "Marcelo", "Carolina", "Felipe", "Larissa", "Gustavo", "Bruna", "Diego", "Isabela", "Leonardo", "Paula", "Daniel", "Luana", "Eduardo", "Vanessa", "Guilherme", "Aline", "Marcos", "Patrícia", "Vinícius", "Juliana"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas", "Cardoso", "Ramos", "Gonçalves", "Santana", "Teixeira"];

export function randomName(): string {
  return `${randomItem(firstNames)} ${randomItem(lastNames)} ${randomItem(lastNames)}`;
}

export function randomPhone(): string {
  const p1 = Math.floor(Math.random() * 9000) + 1000;
  const p2 = Math.floor(Math.random() * 9000) + 1000;
  return `(61) 9${p1}-${p2}`;
}

export function randomEmail(name: string): string {
  const cleanName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
  const domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"];
  return `${cleanName}@${randomItem(domains)}`;
}

export function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

const bairros = ["Jardim Botânico", "Lago Sul", "Asa Norte", "Asa Sul", "Sudoeste", "Noroeste", "Águas Claras", "Taguatinga", "Guará", "Núcleo Bandeirante", "Park Way", "Lago Norte", "Cruzeiro", "Octogonal", "Samambaia"];

export function randomBairro(): string {
  return randomItem(bairros);
}

export function randomCEP(): string {
  const p1 = Math.floor(Math.random() * 900) + 100;
  const p2 = Math.floor(Math.random() * 900) + 100;
  return `7${p1}0-${p2}`;
}
