import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { generateId, generateCPF, randomName, randomPhone, randomEmail, randomDate, randomItem, randomBairro, randomCEP } from './seed-helpers';
import crypto from 'crypto';

// Zero-dependency .env.seed loader
function loadEnv(filePath: string) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
}

loadEnv('.env');
loadEnv('.env.seed');

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

let SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL || SUPABASE_URL.includes('SEU_PROJECT_ID')) {
  SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lwlbnchcftvysfmpxxlp.supabase.co';
}
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'eyJ...')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("\n❌ ERRO: Nenhuma chave Supabase encontrada em .env ou .env.seed!\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: {
    fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function safeUpsert(table: string, data: any, options?: any) {
  const res = await supabase.from(table).upsert(data, options);
  if (res.error) {
    console.error(`❌ Erro ao inserir na tabela '${table}':`, res.error.message, res.error.details || '');
    throw res.error;
  }
  return res;
}

const modalidadesCatalog = [
  { id: "PIL2X001", nome: "Pilates 2X", area: "Bem-Estar" },
  { id: "PIL3X001", nome: "Pilates 3X", area: "Bem-Estar" },
  { id: "GINRIT01", nome: "Ginástica Rítmica", area: "Esportes" },
  { id: "DESPIN01", nome: "Desenho e Pintura", area: "Artes" },
  { id: "KARATE01", nome: "Karatê", area: "Artes Marciais" },
  { id: "BALLET01", nome: "Ballet", area: "Dança" },
  { id: "KICKBOX1", nome: "Kickboxing", area: "Artes Marciais" },
  { id: "JIUJITS1", nome: "Jiu-Jitsu", area: "Artes Marciais" },
  { id: "TAEKWON1", nome: "Taekwondo", area: "Artes Marciais" },
  { id: "CAPOEIR1", nome: "Capoeira", area: "Artes Marciais" },
  { id: "YOGA0001", nome: "Yoga", area: "Bem-Estar" },
  { id: "FUNCPWR1", nome: "Funcional Power", area: "Fitness" },
  { id: "TEATRO01", nome: "Teatro", area: "Artes" },
  { id: "CANTO001", nome: "Canto", area: "Artes" },
  { id: "PWRJUMP1", nome: "PowerJump", area: "Fitness" },
  { id: "BODYPMP1", nome: "BodyPump", area: "Fitness" },
  { id: "TAICHI01", nome: "TaiChiChuan", area: "Bem-Estar" },
  { id: "CROCHE01", nome: "Crochê", area: "Artesanato" },
  { id: "TRICO001", nome: "Tricô", area: "Artesanato" }
];

const modalidadesExistentes = modalidadesCatalog.map(m => m.id);

const gradesPredefinidas = [
  { dias: ["Segunda", "Quarta"], inicio: "08:00:00", fim: "09:00:00", sala: "Sala 1 - Tatame" },
  { dias: ["Segunda", "Quarta"], inicio: "09:30:00", fim: "10:30:00", sala: "Sala 2 - Dança" },
  { dias: ["Segunda", "Quarta"], inicio: "18:00:00", fim: "19:00:00", sala: "Sala 1 - Tatame" },
  { dias: ["Segunda", "Quarta"], inicio: "19:30:00", fim: "20:30:00", sala: "Espaço Fitness" },
  { dias: ["Terça", "Quinta"], inicio: "08:30:00", fim: "09:30:00", sala: "Sala 2 - Dança" },
  { dias: ["Terça", "Quinta"], inicio: "10:00:00", fim: "11:00:00", sala: "Espaço Pilates" },
  { dias: ["Terça", "Quinta"], inicio: "17:30:00", fim: "18:30:00", sala: "Sala 1 - Tatame" },
  { dias: ["Terça", "Quinta"], inicio: "19:00:00", fim: "20:00:00", sala: "Espaço Fitness" },
  { dias: ["Sexta"], inicio: "09:00:00", fim: "11:00:00", sala: "Ateliê de Artes" },
  { dias: ["Sábado"], inicio: "08:30:00", fim: "10:00:00", sala: "Área Aberta" }
];

async function run() {
  console.log("Iniciando seed...");

  // STEP 1: Create test users
  console.log("Criando usuários de teste...");
  const testUsers = [
    { email: 'secretaria@movi.test', password: 'Teste@123', role: 'secretaria', specs: [] },
    { email: 'coordenacao@movi.test', password: 'Teste@123', role: 'coordenacao', specs: [] },
    { email: 'instrutor1@movi.test', password: 'Teste@123', role: 'instrutor', specs: ['Ballet', 'Ginástica Rítmica'] },
    { email: 'instrutor2@movi.test', password: 'Teste@123', role: 'instrutor', specs: ['Jiu-Jitsu', 'Karatê'] }
  ];

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      if (error && !error.message.includes("already registered")) {
        console.error(`Erro ao criar ${user.email}:`, error);
        continue;
      }
      
      const userId = data?.user?.id;
      if (!userId) {
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser.users.find(u => u.email === user.email);
        if (found) {
            await supabase.from('profiles').update({ status: 'aprovado', especialidades: user.specs }).eq('id', found.id);
            await supabase.from('user_roles').upsert({ id: crypto.randomUUID(), user_id: found.id, role: user.role }, { onConflict: 'user_id,role' });
        }
        continue;
      }

      await supabase.from('profiles').update({ status: 'aprovado', especialidades: user.specs }).eq('id', userId);
      await supabase.from('user_roles').upsert({ id: crypto.randomUUID(), user_id: userId, role: user.role }, { onConflict: 'user_id,role' });
    } catch (e) {
      console.log(`Erro processando usuário ${user.email}`, e);
    }
  }

  // STEP 2: Create instrutores (com 1:N Especialidades)
  console.log("Criando instrutores...");
  const instrutorSpecialtiesPool = [
    { esp: ["Ballet", "Ginástica Rítmica"], ids: ["BALLET01", "GINRIT01"] },
    { esp: ["Jiu-Jitsu", "Karatê", "Capoeira"], ids: ["JIUJITS1", "KARATE01", "CAPOEIR1"] },
    { esp: ["Pilates 2X", "Pilates 3X", "Yoga"], ids: ["PIL2X001", "PIL3X001", "YOGA0001"] },
    { esp: ["Funcional Power", "BodyPump", "PowerJump"], ids: ["FUNCPWR1", "BODYPMP1", "PWRJUMP1"] },
    { esp: ["Desenho e Pintura", "Teatro", "Canto"], ids: ["DESPIN01", "TEATRO01", "CANTO001"] }
  ];

  const instrutores = Array.from({ length: 5 }).map((_, idx) => {
    const nome = randomName();
    const spec = instrutorSpecialtiesPool[idx % instrutorSpecialtiesPool.length];
    return {
      id: generateId(),
      nome_completo: nome,
      cpf: generateCPF(),
      telefone: randomPhone(),
      email: randomEmail(nome),
      funcao: "Instrutor(a)",
      especialidades: spec.esp,
      id_modalidades: spec.ids,
      ativo: true
    };
  });
  await safeUpsert('instrutores', instrutores);

  // STEP 3: Create turmas (com grade fixa e instrutor vinculado)
  console.log("Criando turmas...");
  const turmas = Array.from({ length: 10 }).map((_, i) => {
    const inst = instrutores[i % instrutores.length];
    const modId = inst.id_modalidades[i % inst.id_modalidades.length] || randomItem(modalidadesExistentes);
    const modInfo = modalidadesCatalog.find(m => m.id === modId);
    const grade = gradesPredefinidas[i % gradesPredefinidas.length];

    return {
      id: generateId(),
      id_modalidade: modId,
      id_instrutor: inst.id,
      nome_turma: `${modInfo?.nome || 'Turma'} - Turma ${i+1}`,
      faixa_etaria: i % 2 === 0 ? "6 a 14 anos" : "Livre (Adulto)",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: grade.dias,
      horario_inicio: grade.inicio,
      horario_fim: grade.fim,
      sala: grade.sala
    };
  });
  await safeUpsert('turmas', turmas);

  // STEP 4: Create alunos
  console.log("Criando alunos...");
  const alunos = Array.from({ length: 50 }).map(() => {
    const nome = randomName();
    return {
      id: generateId(),
      nome_completo: nome,
      cpf: generateCPF(),
      data_nascimento: randomDate(new Date(1980, 0, 1), new Date(2010, 11, 31)),
      telefone: randomPhone(),
      email: randomEmail(nome),
      endereco: "Rua Exemplo, 123",
      bairro: randomBairro(),
      cep: randomCEP(),
      cidade: "Brasília",
      uf: "DF",
      origem_primeiro_contato: randomItem(["INSTAGRAM", "INDICACAO", "PRESENCIAL", "WHATSAPP", "OUTRO"]),
      status_cadastral: "ATIVO"
    };
  });
  await safeUpsert('alunos', alunos);

  // STEP 5: Create leads
  console.log("Criando leads...");
  const leads = Array.from({ length: 30 }).map(() => {
    const nome = randomName();
    return {
      id: generateId(),
      data_entrada: randomDate(new Date(2023, 0, 1), new Date()),
      nome: nome,
      cpf: generateCPF(),
      telefone: randomPhone(),
      email: randomEmail(nome),
      canal_origem: randomItem(["INSTAGRAM", "INDICACAO", "PRESENCIAL", "WHATSAPP", "OUTRO"]),
      modalidade_interesse: randomItem(modalidadesExistentes),
      status_lead: randomItem(["NOVO", "EM_CONTATO", "AGENDADO", "CONVERTIDO", "NAO_CONVERTIDO", "PERDIDO"]),
      converteu_em_aluno: false
    };
  });
  await safeUpsert('leads', leads);

  // STEP 6: Create matriculas
  console.log("Criando matrículas...");
  const matriculas = Array.from({ length: 80 }).map(() => {
    const turmaEscolhida = randomItem(turmas);
    return {
      id: generateId(),
      id_aluno: randomItem(alunos).id,
      id_modalidade: turmaEscolhida.id_modalidade,
      id_turma: turmaEscolhida.id,
      tipo_matricula: randomItem(["NORMAL", "BOLSA", "DESCONTO_ESPECIAL"]),
      data_inicio: randomDate(new Date(2023, 0, 1), new Date()),
      status_matricula: randomItem(["ATIVA", "PENDENTE_LIBERACAO"]),
      valor_final: Math.floor(Math.random() * 200) + 50,
      forma_pagamento: randomItem(["PIX", "CARTAO_CREDITO", "BOLETO"])
    };
  });
  await safeUpsert('matriculas', matriculas);

  // STEP 7: Create pagamentos
  console.log("Criando pagamentos...");
  const pagamentos = Array.from({ length: 200 }).map(() => {
    const matricula = randomItem(matriculas);
    return {
      id: generateId(),
      id_matricula: matricula.id,
      id_aluno: matricula.id_aluno,
      tipo_lancamento: "MENSALIDADE",
      mes_referencia: Math.floor(Math.random() * 12) + 1,
      ano_referencia: 2024,
      data_vencimento: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
      valor_previsto: matricula.valor_final,
      valor_pago: Math.random() > 0.3 ? matricula.valor_final : null,
      status_pagamento: randomItem(["PREVISTO", "PENDENTE", "PAGO", "ATRASADO"])
    };
  });
  await safeUpsert('pagamentos', pagamentos);

  // STEP 8: Create presencas
  console.log("Criando presenças...");
  const presencas = Array.from({ length: 500 }).map(() => {
    const matricula = randomItem(matriculas);
    return {
      id: generateId(),
      data_aula: randomDate(new Date(2024, 0, 1), new Date()),
      id_turma: matricula.id_turma,
      id_matricula: matricula.id,
      id_aluno: matricula.id_aluno,
      presenca: Math.random() > 0.2,
      tipo_registro: "SISTEMA"
    };
  });
  // Batch insert presenças as it might be large
  for (let i = 0; i < presencas.length; i += 100) {
    await safeUpsert('presencas', presencas.slice(i, i + 100));
  }

  // STEP 9: Create aulas
  console.log("Criando aulas...");
  const aulas = Array.from({ length: 20 }).map(() => {
    const t = randomItem(turmas);
    return {
      id: generateId(),
      id_turma: t.id,
      id_instrutor: t.id_instrutor,
      data_aula: randomDate(new Date(2024, 0, 1), new Date()),
      horario_inicio: t.horario_inicio,
      horario_fim: t.horario_fim,
      status_aula: randomItem(["AGENDADA", "REALIZADA"])
    };
  });
  await safeUpsert('aulas', aulas);

  console.log("Seed finalizado com sucesso!");
}

run().catch(console.error);
