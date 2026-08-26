import fs from 'fs';
import path from 'path';
import { generateId, generateCPF, randomName, randomPhone, randomEmail, randomDate, randomItem, randomBairro, randomCEP } from './seed-helpers';

// 1. Catálogo Completo de Modalidades
const modalidadesCatalog = [
  { id: "JIUJITS1", nome: "Jiu-Jitsu", area: "Artes Marciais", valor: 140 },
  { id: "KICKBOX1", nome: "Kickboxing", area: "Artes Marciais", valor: 140 },
  { id: "KARATE01", nome: "Karatê", area: "Artes Marciais", valor: 120 },
  { id: "TAEKWON1", nome: "Taekwondo", area: "Artes Marciais", valor: 140 },
  { id: "CAPOEIR1", nome: "Capoeira", area: "Artes Marciais", valor: 110 },
  { id: "BALLET01", nome: "Ballet", area: "Dança", valor: 150 },
  { id: "GINRIT01", nome: "Ginástica Rítmica", area: "Esportes", valor: 150 },
  { id: "DESPIN01", nome: "Desenho e Pintura", area: "Artes", valor: 100 },
  { id: "CANTO001", nome: "Canto", area: "Artes", valor: 120 },
  { id: "TEATRO01", nome: "Teatro", area: "Artes", valor: 120 },
  { id: "CROCHE01", nome: "Crochê", area: "Artesanato", valor: 90 },
  { id: "TRICO001", nome: "Tricô", area: "Artesanato", valor: 90 },
  { id: "YOGA0001", nome: "Yoga", area: "Bem-Estar", valor: 130 },
  { id: "PIL2X001", nome: "Pilates 2X", area: "Bem-Estar", valor: 130 },
  { id: "PIL3X001", nome: "Pilates 3X", area: "Bem-Estar", valor: 180 },
  { id: "TAICHI01", nome: "Tai Chi Chuan", area: "Bem-Estar", valor: 130 },
  { id: "PWRJUMP1", nome: "Power Jump", area: "Fitness", valor: 140 },
  { id: "BODYPMP1", nome: "BodyPump", area: "Fitness", valor: 140 },
  { id: "FUNCPWR1", nome: "Funcional", area: "Fitness", valor: 140 },
];

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (Array.isArray(val)) {
    const items = val.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `'${items.length > 0 ? `{${items}}` : '{}'}'`;
  }
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateSqlSeed() {
  const sqlLines: string[] = [
    '-- =========================================================================',
    '-- MOVI+ MCJB - Data Seed SQL (Grade Completa com Turmas Oficiais)',
    '-- Copie e cole este script no Supabase SQL Editor para popular o banco de dados.',
    '-- =========================================================================',
    'BEGIN;',
    '',
    '-- PASSO 0: Garantir colunas necessárias',
    'ALTER TABLE public.instrutores',
    '  ADD COLUMN IF NOT EXISTS especialidades text[] DEFAULT \'{}\',',
    '  ADD COLUMN IF NOT EXISTS id_modalidades text[] DEFAULT \'{}\',',
    '  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;',
    '',
    'ALTER TABLE public.turmas',
    '  ADD COLUMN IF NOT EXISTS dias_semana text[] DEFAULT \'{}\',',
    '  ADD COLUMN IF NOT EXISTS horario_inicio time,',
    '  ADD COLUMN IF NOT EXISTS horario_fim time,',
    '  ADD COLUMN IF NOT EXISTS id_instrutor text REFERENCES public.instrutores(id) ON DELETE SET NULL,',
    '  ADD COLUMN IF NOT EXISTS sala text;',
    '',
    'ALTER TABLE public.profiles',
    '  ADD COLUMN IF NOT EXISTS especialidades text[] DEFAULT \'{}\',',
    '  ADD COLUMN IF NOT EXISTS id_instrutor text REFERENCES public.instrutores(id) ON DELETE SET NULL;',
    '',
  ];

  // 1. MODALIDADES
  sqlLines.push('-- 1. Modalidades Oficiais');
  for (const m of modalidadesCatalog) {
    sqlLines.push(
      `INSERT INTO public.modalidades (id, nome_modalidade, area, valor_padrao, status) VALUES (` +
      `${escapeSql(m.id)}, ${escapeSql(m.nome)}, ${escapeSql(m.area)}, ${m.valor}, 'ATIVO') ` +
      `ON CONFLICT (id) DO UPDATE SET nome_modalidade = EXCLUDED.nome_modalidade, area = EXCLUDED.area, valor_padrao = EXCLUDED.valor_padrao;`
    );
  }
  sqlLines.push('');

  // 2. INSTRUTORES (5 Instrutores com 1:N Especialidades)
  const instrutores = [
    {
      id: "INST0001",
      nome_completo: "Carlos Eduardo Silveira",
      cpf: "12345678901",
      telefone: "(61) 98111-2233",
      email: "carlos.artesmarciais@movi.test",
      funcao: "INSTRUTOR_PRINCIPAL",
      especialidades: ["Jiu-Jitsu", "Kickboxing", "Karatê", "Taekwondo", "Capoeira"],
      id_modalidades: ["JIUJITS1", "KICKBOX1", "KARATE01", "TAEKWON1", "CAPOEIR1"],
      ativo: true
    },
    {
      id: "INST0002",
      nome_completo: "Amanda Cristina Lima",
      cpf: "23456789012",
      telefone: "(61) 98222-3344",
      email: "amanda.danca@movi.test",
      funcao: "INSTRUTOR_PRINCIPAL",
      especialidades: ["Ballet", "Ginástica Rítmica"],
      id_modalidades: ["BALLET01", "GINRIT01"],
      ativo: true
    },
    {
      id: "INST0003",
      nome_completo: "Juliana Menezes",
      cpf: "34567890123",
      telefone: "(61) 98333-4455",
      email: "juliana.bemestar@movi.test",
      funcao: "INSTRUTOR_PRINCIPAL",
      especialidades: ["Pilates 2X", "Pilates 3X", "Yoga", "Tai Chi Chuan"],
      id_modalidades: ["PIL2X001", "PIL3X001", "YOGA0001", "TAICHI01"],
      ativo: true
    },
    {
      id: "INST0004",
      nome_completo: "Ricardo Santos",
      cpf: "45678901234",
      telefone: "(61) 98444-5566",
      email: "ricardo.fitness@movi.test",
      funcao: "INSTRUTOR_PRINCIPAL",
      especialidades: ["Power Jump", "BodyPump", "Funcional"],
      id_modalidades: ["PWRJUMP1", "BODYPMP1", "FUNCPWR1"],
      ativo: true
    },
    {
      id: "INST0005",
      nome_completo: "Beatriz Rocha",
      cpf: "56789012345",
      telefone: "(61) 98555-6677",
      email: "beatriz.artes@movi.test",
      funcao: "INSTRUTOR_PRINCIPAL",
      especialidades: ["Desenho e Pintura", "Teatro", "Canto", "Crochê", "Tricô"],
      id_modalidades: ["DESPIN01", "TEATRO01", "CANTO001", "CROCHE01", "TRICO001"],
      ativo: true
    }
  ];

  sqlLines.push('-- 2. Instrutores (Corpo Docente com 1:N Especialidades)');
  for (const inst of instrutores) {
    sqlLines.push(
      `INSERT INTO public.instrutores (id, nome_completo, cpf, telefone, email, funcao, especialidades, id_modalidades, ativo) VALUES (` +
      `${escapeSql(inst.id)}, ${escapeSql(inst.nome_completo)}, ${escapeSql(inst.cpf)}, ${escapeSql(inst.telefone)}, ${escapeSql(inst.email)}, ${escapeSql(inst.funcao)}, ` +
      `${escapeSql(inst.especialidades)}, ${escapeSql(inst.id_modalidades)}, ${inst.ativo}) ` +
      `ON CONFLICT (id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo, especialidades = EXCLUDED.especialidades, id_modalidades = EXCLUDED.id_modalidades;`
    );
  }
  sqlLines.push('');

  // 3. TURMAS (Lista Oficial Completa fornecida pelo usuário)
  const turmasOficiais = [
    // ----------------------------------------------------
    // JIU-JITSU
    // ----------------------------------------------------
    {
      id: "TURMA_JJ_T1",
      id_modalidade: "JIUJITS1",
      id_instrutor: "INST0001",
      nome_turma: "Jiu-Jitsu T1 (Infantil 07 a 12 anos)",
      faixa_etaria: "Infantil 07 a 12 anos",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "19:00:00",
      horario_fim: "20:00:00",
      sala: "Sala 1 - Tatame"
    },
    {
      id: "TURMA_JJ_T2",
      id_modalidade: "JIUJITS1",
      id_instrutor: "INST0001",
      nome_turma: "Jiu-Jitsu T2 (Juvenil/Adulto +13 anos)",
      faixa_etaria: "Juvenil/Adulto +13 anos",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "20:00:00",
      horario_fim: "21:00:00",
      sala: "Sala 1 - Tatame"
    },

    // ----------------------------------------------------
    // KICKBOXING
    // ----------------------------------------------------
    {
      id: "TURMA_KB_T1",
      id_modalidade: "KICKBOX1",
      id_instrutor: "INST0001",
      nome_turma: "Kickboxing T1 (A partir de 08 anos)",
      faixa_etaria: "A partir de 08 anos",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "20:00:00",
      horario_fim: "21:00:00",
      sala: "Sala 1 - Tatame"
    },

    // ----------------------------------------------------
    // KARATÊ
    // ----------------------------------------------------
    {
      id: "TURMA_KAR_T1",
      id_modalidade: "KARATE01",
      id_instrutor: "INST0001",
      nome_turma: "Karatê T1 (Infantil/Juvenil/Adulto)",
      faixa_etaria: "Livre",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta"],
      horario_inicio: "19:00:00",
      horario_fim: "20:00:00",
      sala: "Sala 1 - Tatame"
    },

    // ----------------------------------------------------
    // TAEKWONDO
    // ----------------------------------------------------
    {
      id: "TURMA_TKD_T1",
      id_modalidade: "TAEKWON1",
      id_instrutor: "INST0001",
      nome_turma: "Taekwondo T1 (Infantil/Juvenil a partir de 05 anos)",
      faixa_etaria: "Infantil/Juvenil a partir de 05 anos",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta"],
      horario_inicio: "16:00:00",
      horario_fim: "17:00:00",
      sala: "Sala 1 - Tatame"
    },

    // ----------------------------------------------------
    // CAPOEIRA
    // ----------------------------------------------------
    {
      id: "TURMA_CAP_T1",
      id_modalidade: "CAPOEIR1",
      id_instrutor: "INST0001",
      nome_turma: "Capoeira T1 (Juvenil/Adulto +12 anos)",
      faixa_etaria: "Juvenil/Adulto +12 anos",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "19:30:00",
      horario_fim: "20:30:00",
      sala: "Sala 1 - Tatame"
    },

    // ----------------------------------------------------
    // BALLET
    // ----------------------------------------------------
    {
      id: "TURMA_BAL_T1",
      id_modalidade: "BALLET01",
      id_instrutor: "INST0002",
      nome_turma: "Ballet T1 Infantil (4 a 10 anos)",
      faixa_etaria: "Infantil (4 a 10 anos)",
      capacidade_maxima: 18,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "09:00:00",
      horario_fim: "10:00:00",
      sala: "Sala 2 - Dança"
    },
    {
      id: "TURMA_BAL_T2",
      id_modalidade: "BALLET01",
      id_instrutor: "INST0002",
      nome_turma: "Ballet T2 Infantil (4 a 10 anos)",
      faixa_etaria: "Infantil (4 a 10 anos)",
      capacidade_maxima: 18,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "17:00:00",
      horario_fim: "18:00:00",
      sala: "Sala 2 - Dança"
    },

    // ----------------------------------------------------
    // GINÁSTICA RÍTMICA
    // ----------------------------------------------------
    {
      id: "TURMA_GR_T2",
      id_modalidade: "GINRIT01",
      id_instrutor: "INST0002",
      nome_turma: "Ginástica Rítmica T2 Infantil (4 a 8 anos)",
      faixa_etaria: "Infantil (4 a 8 anos)",
      capacidade_maxima: 18,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "16:00:00",
      horario_fim: "17:00:00",
      sala: "Sala 2 - Dança"
    },
    {
      id: "TURMA_GR_T3",
      id_modalidade: "GINRIT01",
      id_instrutor: "INST0002",
      nome_turma: "Ginástica Rítmica T3 Teen (A partir de 9 anos)",
      faixa_etaria: "Teen (A partir de 9 anos)",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "17:00:00",
      horario_fim: "18:00:00",
      sala: "Sala 2 - Dança"
    },

    // ----------------------------------------------------
    // DESENHO E PINTURA
    // ----------------------------------------------------
    {
      id: "TURMA_DES_T1",
      id_modalidade: "DESPIN01",
      id_instrutor: "INST0005",
      nome_turma: "Desenho e Pintura T1 (Infantil/Adulto)",
      faixa_etaria: "Infantil/Adulto",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça"],
      horario_inicio: "16:00:00",
      horario_fim: "18:00:00",
      sala: "Ateliê de Artes"
    },
    {
      id: "TURMA_DES_T2",
      id_modalidade: "DESPIN01",
      id_instrutor: "INST0005",
      nome_turma: "Desenho e Pintura T2 (Infantil/Adulto)",
      faixa_etaria: "Infantil/Adulto",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "16:00:00",
      horario_fim: "18:00:00",
      sala: "Ateliê de Artes"
    },
    {
      id: "TURMA_DES_T3",
      id_modalidade: "DESPIN01",
      id_instrutor: "INST0005",
      nome_turma: "Desenho e Pintura T3 (Infantil/Adulto)",
      faixa_etaria: "Infantil/Adulto",
      capacidade_maxima: 18,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Sábado"],
      horario_inicio: "08:00:00",
      horario_fim: "10:00:00",
      sala: "Ateliê de Artes"
    },
    {
      id: "TURMA_DES_T4",
      id_modalidade: "DESPIN01",
      id_instrutor: "INST0005",
      nome_turma: "Desenho e Pintura T4 (Infantil/Adulto)",
      faixa_etaria: "Infantil/Adulto",
      capacidade_maxima: 18,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Sábado"],
      horario_inicio: "10:00:00",
      horario_fim: "12:00:00",
      sala: "Ateliê de Artes"
    },

    // ----------------------------------------------------
    // CANTO
    // ----------------------------------------------------
    {
      id: "TURMA_CAN_T1",
      id_modalidade: "CANTO001",
      id_instrutor: "INST0005",
      nome_turma: "Canto T1 (Adulto +16 anos)",
      faixa_etaria: "Adulto +16 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "15:00:00",
      horario_fim: "15:50:00",
      sala: "Sala 2 - Dança / Música"
    },
    {
      id: "TURMA_CAN_T2",
      id_modalidade: "CANTO001",
      id_instrutor: "INST0005",
      nome_turma: "Canto T2 (Infantil/Juvenil 10 a 15 anos)",
      faixa_etaria: "Infantil/Juvenil 10 a 15 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "18:00:00",
      horario_fim: "18:50:00",
      sala: "Sala 2 - Dança / Música"
    },
    {
      id: "TURMA_CAN_T3",
      id_modalidade: "CANTO001",
      id_instrutor: "INST0005",
      nome_turma: "Canto T3 (Adulto +16 anos)",
      faixa_etaria: "Adulto +16 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "19:00:00",
      horario_fim: "19:50:00",
      sala: "Sala 2 - Dança / Música"
    },

    // ----------------------------------------------------
    // TEATRO
    // ----------------------------------------------------
    {
      id: "TURMA_TEA_T1",
      id_modalidade: "TEATRO01",
      id_instrutor: "INST0005",
      nome_turma: "Teatro T1 (Infantil/Adulto +08 anos)",
      faixa_etaria: "Infantil/Adulto +08 anos",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda"],
      horario_inicio: "19:00:00",
      horario_fim: "21:00:00",
      sala: "Ateliê / Sala de Artes"
    },

    // ----------------------------------------------------
    // CROCHÊ
    // ----------------------------------------------------
    {
      id: "TURMA_CRO_T1",
      id_modalidade: "CROCHE01",
      id_instrutor: "INST0005",
      nome_turma: "Crochê T1 (+13 anos)",
      faixa_etaria: "+13 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "14:00:00",
      horario_fim: "16:00:00",
      sala: "Ateliê de Artesanato"
    },
    {
      id: "TURMA_CRO_T3",
      id_modalidade: "CROCHE01",
      id_instrutor: "INST0005",
      nome_turma: "Crochê T3 (+13 anos)",
      faixa_etaria: "+13 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "19:00:00",
      horario_fim: "21:00:00",
      sala: "Ateliê de Artesanato"
    },

    // ----------------------------------------------------
    // TRICÔ
    // ----------------------------------------------------
    {
      id: "TURMA_TRI_T2",
      id_modalidade: "TRICO001",
      id_instrutor: "INST0005",
      nome_turma: "Tricô T2 (+13 anos)",
      faixa_etaria: "+13 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Quinta"],
      horario_inicio: "16:00:00",
      horario_fim: "18:00:00",
      sala: "Ateliê de Artesanato"
    },

    // ----------------------------------------------------
    // YOGA
    // ----------------------------------------------------
    {
      id: "TURMA_YOG_T1",
      id_modalidade: "YOGA0001",
      id_instrutor: "INST0003",
      nome_turma: "Yoga T1 (+15 anos)",
      faixa_etaria: "+15 anos",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta"],
      horario_inicio: "08:00:00",
      horario_fim: "08:50:00",
      sala: "Sala Bem-Estar"
    },
    {
      id: "TURMA_YOG_T2",
      id_modalidade: "YOGA0001",
      id_instrutor: "INST0003",
      nome_turma: "Yoga T2 (+15 anos)",
      faixa_etaria: "+15 anos",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta"],
      horario_inicio: "19:10:00",
      horario_fim: "20:00:00",
      sala: "Sala Bem-Estar"
    },

    // ----------------------------------------------------
    // PILATES
    // ----------------------------------------------------
    {
      id: "TURMA_PIL_T1",
      id_modalidade: "PIL2X001",
      id_instrutor: "INST0003",
      nome_turma: "Pilates T1 (2x semana - Manhã)",
      faixa_etaria: "Juvenil/Adulto +10 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta"],
      horario_inicio: "09:00:00",
      horario_fim: "10:00:00",
      sala: "Espaço Pilates"
    },
    {
      id: "TURMA_PIL_T2",
      id_modalidade: "PIL2X001",
      id_instrutor: "INST0003",
      nome_turma: "Pilates T2 (2x semana - Noite)",
      faixa_etaria: "Juvenil/Adulto +10 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta"],
      horario_inicio: "18:00:00",
      horario_fim: "19:00:00",
      sala: "Espaço Pilates"
    },
    {
      id: "TURMA_PIL_T3",
      id_modalidade: "PIL3X001",
      id_instrutor: "INST0003",
      nome_turma: "Pilates T3 (3x semana - Manhã)",
      faixa_etaria: "Juvenil/Adulto +10 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta", "Sábado"],
      horario_inicio: "09:00:00",
      horario_fim: "10:00:00",
      sala: "Espaço Pilates"
    },
    {
      id: "TURMA_PIL_T4",
      id_modalidade: "PIL3X001",
      id_instrutor: "INST0003",
      nome_turma: "Pilates T4 (3x semana - Noite/Sáb)",
      faixa_etaria: "Juvenil/Adulto +10 anos",
      capacidade_maxima: 15,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça", "Quinta", "Sábado"],
      horario_inicio: "18:00:00",
      horario_fim: "19:00:00",
      sala: "Espaço Pilates"
    },

    // ----------------------------------------------------
    // TAI CHI CHUAN
    // ----------------------------------------------------
    {
      id: "TURMA_TCC_T1",
      id_modalidade: "TAICHI01",
      id_instrutor: "INST0003",
      nome_turma: "Tai Chi Chuan T1 (Juvenil +15 anos)",
      faixa_etaria: "Juvenil +15 anos",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Sábado"],
      horario_inicio: "08:00:00",
      horario_fim: "10:00:00",
      sala: "Área Aberta / Tatame"
    },

    // ----------------------------------------------------
    // POWER JUMP & BODYPUMP & FUNCIONAL
    // ----------------------------------------------------
    {
      id: "TURMA_PJ_T1",
      id_modalidade: "PWRJUMP1",
      id_instrutor: "INST0004",
      nome_turma: "Power Jump T1 - Seg/Qua/Sex Manhã",
      faixa_etaria: "Livre (Adulto)",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta", "Sexta"],
      horario_inicio: "08:00:00",
      horario_fim: "09:00:00",
      sala: "Espaço Fitness"
    },
    {
      id: "TURMA_PJ_T2",
      id_modalidade: "PWRJUMP1",
      id_instrutor: "INST0004",
      nome_turma: "Power Jump T2 - Seg/Qua/Sex Noite",
      faixa_etaria: "Livre (Adulto)",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta", "Sexta"],
      horario_inicio: "18:30:00",
      horario_fim: "19:30:00",
      sala: "Espaço Fitness"
    },
    {
      id: "TURMA_BP_T1",
      id_modalidade: "BODYPMP1",
      id_instrutor: "INST0004",
      nome_turma: "BodyPump T1 - Seg/Qua/Sex Manhã",
      faixa_etaria: "Livre (Adulto)",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta", "Sexta"],
      horario_inicio: "09:00:00",
      horario_fim: "10:00:00",
      sala: "Espaço Fitness"
    },
    {
      id: "TURMA_BP_T2",
      id_modalidade: "BODYPMP1",
      id_instrutor: "INST0004",
      nome_turma: "BodyPump T2 - Seg/Qua/Sex Noite",
      faixa_etaria: "Livre (Adulto)",
      capacidade_maxima: 20,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Segunda", "Quarta", "Sexta"],
      horario_inicio: "19:30:00",
      horario_fim: "20:30:00",
      sala: "Espaço Fitness"
    },
    {
      id: "TURMA_FUNC_T1",
      id_modalidade: "FUNCPWR1",
      id_instrutor: "INST0004",
      nome_turma: "Funcional T1 - Terça Manhã",
      faixa_etaria: "Livre (Adulto)",
      capacidade_maxima: 25,
      status_turma: "ATIVA",
      permite_experimental: true,
      dias_semana: ["Terça"],
      horario_inicio: "07:00:00",
      horario_fim: "08:00:00",
      sala: "Espaço Fitness"
    }
  ];

  sqlLines.push('-- 3. Turmas Oficiais com Grade Horária Fixa');
  for (const t of turmasOficiais) {
    sqlLines.push(
      `INSERT INTO public.turmas (id, id_modalidade, id_instrutor, nome_turma, faixa_etaria, capacidade_maxima, status_turma, permite_experimental, dias_semana, horario_inicio, horario_fim, sala) VALUES (` +
      `${escapeSql(t.id)}, ${escapeSql(t.id_modalidade)}, ${escapeSql(t.id_instrutor)}, ${escapeSql(t.nome_turma)}, ${escapeSql(t.faixa_etaria)}, ${t.capacidade_maxima}, ${escapeSql(t.status_turma)}, ${t.permite_experimental}, ` +
      `${escapeSql(t.dias_semana)}, ${escapeSql(t.horario_inicio)}, ${escapeSql(t.horario_fim)}, ${escapeSql(t.sala)}) ` +
      `ON CONFLICT (id) DO UPDATE SET nome_turma = EXCLUDED.nome_turma, faixa_etaria = EXCLUDED.faixa_etaria, dias_semana = EXCLUDED.dias_semana, horario_inicio = EXCLUDED.horario_inicio, horario_fim = EXCLUDED.horario_fim, id_instrutor = EXCLUDED.id_instrutor, sala = EXCLUDED.sala;`
    );
  }
  sqlLines.push('');

  // 4. Alunos (70 alunos)
  const alunos = Array.from({ length: 70 }).map(() => {
    const nome = randomName();
    return {
      id: generateId(),
      nome_completo: nome,
      cpf: generateCPF(),
      data_nascimento: randomDate(new Date(1980, 0, 1), new Date(2018, 11, 31)),
      telefone: randomPhone(),
      email: randomEmail(nome),
      endereco: "Rua das Palmeiras, 100",
      bairro: randomBairro(),
      cep: randomCEP(),
      cidade: "Brasília",
      uf: "DF",
      origem_primeiro_contato: randomItem(["INSTAGRAM", "INDICACAO", "PRESENCIAL", "WHATSAPP", "OUTRO"]),
      status_cadastral: "ATIVO"
    };
  });

  sqlLines.push('-- 4. Alunos');
  for (const a of alunos) {
    sqlLines.push(
      `INSERT INTO public.alunos (id, nome_completo, cpf, data_nascimento, telefone, email, endereco, bairro, cep, cidade, uf, origem_primeiro_contato, status_cadastral) VALUES (` +
      `${escapeSql(a.id)}, ${escapeSql(a.nome_completo)}, ${escapeSql(a.cpf)}, ${escapeSql(a.data_nascimento)}, ${escapeSql(a.telefone)}, ${escapeSql(a.email)}, ${escapeSql(a.endereco)}, ${escapeSql(a.bairro)}, ${escapeSql(a.cep)}, ${escapeSql(a.cidade)}, ${escapeSql(a.uf)}, ${escapeSql(a.origem_primeiro_contato)}, ${escapeSql(a.status_cadastral)}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sqlLines.push('');

  // 5. Matrículas (120 Matrículas distribuídas nas turmas)
  const matriculas = Array.from({ length: 120 }).map(() => {
    const turmaEscolhida = randomItem(turmasOficiais);
    const modInfo = modalidadesCatalog.find(m => m.id === turmaEscolhida.id_modalidade);
    return {
      id: generateId(),
      id_aluno: randomItem(alunos).id,
      id_modalidade: turmaEscolhida.id_modalidade,
      id_turma: turmaEscolhida.id,
      tipo_matricula: randomItem(["NORMAL", "NORMAL", "BOLSA", "DESCONTO_ESPECIAL"]),
      data_inicio: randomDate(new Date(2024, 0, 1), new Date()),
      status_matricula: "ATIVA",
      valor_final: modInfo ? modInfo.valor : 130,
      forma_pagamento: randomItem(["PIX", "CARTAO_CREDITO", "BOLETO"])
    };
  });

  sqlLines.push('-- 5. Matrículas Ativas');
  for (const m of matriculas) {
    sqlLines.push(
      `INSERT INTO public.matriculas (id, id_aluno, id_modalidade, id_turma, tipo_matricula, data_inicio, status_matricula, valor_final, forma_pagamento) VALUES (` +
      `${escapeSql(m.id)}, ${escapeSql(m.id_aluno)}, ${escapeSql(m.id_modalidade)}, ${escapeSql(m.id_turma)}, ${escapeSql(m.tipo_matricula)}, ${escapeSql(m.data_inicio)}, ${escapeSql(m.status_matricula)}, ${m.valor_final}, ${escapeSql(m.forma_pagamento)}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sqlLines.push('');

  // 6. Presenças de Exemplo (400 registros)
  const presencas = Array.from({ length: 400 }).map(() => {
    const m = randomItem(matriculas);
    return {
      id: generateId(),
      data_aula: randomDate(new Date(2024, 6, 1), new Date()),
      id_turma: m.id_turma,
      id_matricula: m.id,
      id_aluno: m.id_aluno,
      presenca: Math.random() > 0.15,
      tipo_registro: "SISTEMA"
    };
  });

  sqlLines.push('-- 6. Diário de Presenças');
  for (const pr of presencas) {
    sqlLines.push(
      `INSERT INTO public.presencas (id, data_aula, id_turma, id_matricula, id_aluno, presenca, tipo_registro) VALUES (` +
      `${escapeSql(pr.id)}, ${escapeSql(pr.data_aula)}, ${escapeSql(pr.id_turma)}, ${escapeSql(pr.id_matricula)}, ${escapeSql(pr.id_aluno)}, ${pr.presenca}, ${escapeSql(pr.tipo_registro)}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sqlLines.push('');

  // 7. Aulas Realizadas / Agendadas
  const aulas = Array.from({ length: 50 }).map(() => {
    const t = randomItem(turmasOficiais);
    return {
      id: generateId(),
      id_turma: t.id,
      id_instrutor: t.id_instrutor,
      data_aula: randomDate(new Date(2024, 6, 1), new Date()),
      horario_inicio: t.horario_inicio,
      horario_fim: t.horario_fim,
      status_aula: randomItem(["AGENDADA", "REALIZADA", "REALIZADA"])
    };
  });

  sqlLines.push('-- 7. Registro de Aulas');
  for (const au of aulas) {
    sqlLines.push(
      `INSERT INTO public.aulas (id, id_turma, id_instrutor, data_aula, horario_inicio, horario_fim, status_aula) VALUES (` +
      `${escapeSql(au.id)}, ${escapeSql(au.id_turma)}, ${escapeSql(au.id_instrutor)}, ${escapeSql(au.data_aula)}, ${escapeSql(au.horario_inicio)}, ${escapeSql(au.horario_fim)}, ${escapeSql(au.status_aula)}) ` +
      `ON CONFLICT (id) DO NOTHING;`
    );
  }
  sqlLines.push('');

  sqlLines.push('COMMIT;');

  const outputPath = path.resolve(process.cwd(), 'scripts/seed.sql');
  fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf-8');
  console.log(`✅ Arquivo SQL gerado com sucesso em: ${outputPath}`);
}

generateSqlSeed();
