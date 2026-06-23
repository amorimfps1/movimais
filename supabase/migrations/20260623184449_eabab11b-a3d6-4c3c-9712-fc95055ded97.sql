
-- MOVI+ Schema (no-auth: public access for now)

CREATE TABLE public.modalidades (
  id text PRIMARY KEY,
  nome_modalidade text NOT NULL,
  area text,
  valor_padrao numeric DEFAULT 0,
  status text DEFAULT 'ATIVO',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.turmas (
  id text PRIMARY KEY,
  id_modalidade text REFERENCES public.modalidades(id) ON DELETE SET NULL,
  nome_turma text NOT NULL,
  faixa_etaria text,
  capacidade_maxima int DEFAULT 0,
  status_turma text DEFAULT 'ATIVA',
  permite_experimental boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.instrutores (
  id text PRIMARY KEY,
  nome_completo text NOT NULL,
  cpf text,
  telefone text,
  email text,
  funcao text,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.alunos (
  id text PRIMARY KEY,
  nome_completo text NOT NULL,
  cpf text,
  data_nascimento date,
  telefone text,
  email text,
  endereco text,
  bairro text,
  cep text,
  cidade text,
  uf text,
  nome_responsavel text,
  cpf_responsavel text,
  telefone_responsavel text,
  email_responsavel text,
  autorizacao_imagem boolean DEFAULT false,
  aceita_comunicacao boolean DEFAULT false,
  observacoes_medicas text,
  data_cadastro date DEFAULT current_date,
  origem_primeiro_contato text,
  status_cadastral text DEFAULT 'ATIVO',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id text PRIMARY KEY,
  data_entrada date DEFAULT current_date,
  nome text NOT NULL,
  cpf text,
  telefone text,
  email text,
  canal_origem text,
  modalidade_interesse text,
  turma_interesse text,
  responsavel_atendimento text,
  status_lead text DEFAULT 'NOVO',
  data_ultimo_contato date,
  motivo_nao_conversao text,
  observacoes text,
  converteu_em_aluno boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.matriculas (
  id text PRIMARY KEY,
  id_aluno text REFERENCES public.alunos(id) ON DELETE CASCADE,
  id_modalidade text REFERENCES public.modalidades(id) ON DELETE SET NULL,
  id_turma text REFERENCES public.turmas(id) ON DELETE SET NULL,
  tipo_matricula text,
  data_inicio date,
  data_fim_prevista date,
  status_matricula text DEFAULT 'ATIVA',
  valor_final numeric DEFAULT 0,
  forma_pagamento text,
  liberado_para_aula boolean DEFAULT false,
  data_criacao date DEFAULT current_date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pagamentos (
  id text PRIMARY KEY,
  id_matricula text REFERENCES public.matriculas(id) ON DELETE CASCADE,
  id_aluno text REFERENCES public.alunos(id) ON DELETE SET NULL,
  tipo_lancamento text,
  mes_referencia int,
  ano_referencia int,
  data_vencimento date,
  valor_previsto numeric DEFAULT 0,
  valor_pago numeric DEFAULT 0,
  data_pagamento date,
  status_pagamento text DEFAULT 'PENDENTE',
  forma_pagamento text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.presencas (
  id text PRIMARY KEY,
  data_aula date NOT NULL,
  id_turma text REFERENCES public.turmas(id) ON DELETE CASCADE,
  id_matricula text REFERENCES public.matriculas(id) ON DELETE CASCADE,
  id_aluno text REFERENCES public.alunos(id) ON DELETE SET NULL,
  presenca boolean DEFAULT false,
  tipo_registro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTS (no auth yet: allow anon full access; tighten when auth is added)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modalidades TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turmas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instrutores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alunos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matriculas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presencas TO anon, authenticated;
GRANT ALL ON public.modalidades, public.turmas, public.instrutores, public.alunos, public.leads, public.matriculas, public.pagamentos, public.presencas TO service_role;

-- RLS: open for now (no auth in app yet)
ALTER TABLE public.modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all" ON public.modalidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.turmas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.instrutores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.alunos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.matriculas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all" ON public.presencas FOR ALL USING (true) WITH CHECK (true);

-- Seed modalidades padrão
INSERT INTO public.modalidades (
  id,
  nome_modalidade,
  area,
  valor_padrao,
  status
) VALUES
  ('PIL2X001','Pilates 2X','Bem-Estar',130,'ATIVO'),
  ('GINRIT01','Ginástica Rítmica','Esportes',150,'ATIVO'),
  ('DESPIN01','Desenho e Pintura','Artes',100,'ATIVO'),
  ('KARATE01','Karatê','Artes Marciais',120,'ATIVO'),
  ('BALLET01','Ballet','Dança',150,'ATIVO'),
  ('KICKBOX1','Kickboxing','Artes Marciais',140,'ATIVO'),
  ('JIUJITS1','Jiu-Jitsu','Artes Marciais',140,'ATIVO'),
  ('TAEKWON1','Taekwondo','Artes Marciais',140,'ATIVO'),
  ('CAPOEIR1','Capoeira','Artes Marciais',110,'ATIVO'),
  ('YOGA0001','Yoga','Bem-Estar',130,'ATIVO'),
  ('FUNCPWR1','Funcional Power','Fitness',140,'ATIVO'),
  ('TEATRO01','Teatro','Artes',120,'ATIVO'),
  ('CANTO001','Canto','Artes',120,'ATIVO'),
  ('PWRJUMP1','PowerJump','Fitness',140,'ATIVO'),
  ('BODYPMP1','BodyPump','Fitness',140,'ATIVO'),
  ('TAICHI01','TaiChiChuan','Bem-Estar',130,'ATIVO'),
  ('PIL3X001','Pilates 3X','Bem-Estar',180,'ATIVO'),
  ('CROCHE01','Crochê','Artesanato',90,'ATIVO'),
  ('TRICO001','Tricô','Artesanato',90,'ATIVO');