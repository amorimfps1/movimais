# MOVI+ — Sistema de Gestão do MCJB

Plataforma web completa para gestão de atividades, alunos, matrículas, turmas, instrutores, pagamentos e presenças do **Movimento Comunitário do Jardim Botânico (MCJB)**.

---

## 🚀 Stack Tecnológica

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **React** | 18.x | Biblioteca de UI |
| **Vite** | 5.x | Bundler e dev server |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.x | Estilização utilitária |
| **Radix UI / shadcn** | — | Componentes acessíveis headless |
| **React Router DOM** | 6.x | Navegação SPA |
| **TanStack Query** | 5.x | Cache e gerenciamento de estado assíncrono |
| **React Hook Form + Zod** | — | Formulários e validação de dados |
| **Recharts** | 2.x | Gráficos e visualizações |
| **Lucide React** | — | Ícones modernos |
| **Sonner** | — | Notificações toast |

### Backend / Banco de Dados

| Tecnologia | Função |
|---|---|
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, RLS) |
| **PostgreSQL** | Banco de dados relacional (via Supabase) |
| **Supabase Auth** | Autenticação e gerenciamento de sessão |

### Testes

| Tecnologia | Função |
|---|---|
| **Vitest** | Testes unitários |
| **Testing Library** | Testes de componentes React |
| **Playwright** | Testes end-to-end (E2E) |

---

## 📦 Estrutura do Projeto

```
movimais/
├── public/                     # Assets estáticos públicos
├── src/
│   ├── assets/                 # Logotipo e recursos visuais
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ui/                 # Componentes base (shadcn/ui)
│   │   ├── AppLayout.tsx       # Layout principal com sidebar
│   │   ├── AppSidebar.tsx      # Sidebar responsiva com controle de roles
│   │   ├── DataTable.tsx       # Tabela genérica reutilizável
│   │   ├── NavLink.tsx         # Link de navegação com estado ativo
│   │   ├── PageHeader.tsx      # Cabeçalho padronizado de páginas
│   │   ├── ProtectedRoute.tsx  # Proteção de rotas por autenticação/roles
│   │   ├── StatCard.tsx        # Card de métricas do dashboard
│   │   └── StatusBadge.tsx     # Badge visual de status
│   ├── hooks/
│   │   ├── useAuth.tsx         # Contexto de autenticação (Supabase Auth + roles)
│   │   ├── useTable.ts         # Hook genérico para leitura de tabelas Supabase
│   │   ├── use-mobile.tsx      # Detecção de dispositivo móvel
│   │   └── use-toast.ts        # Hook de notificações
│   ├── integrations/
│   │   └── supabase/           # Cliente Supabase configurado
│   ├── lib/
│   │   ├── store.ts            # Types TypeScript + funções CRUD genéricas
│   │   └── utils.ts            # Utilitários (cn, etc.)
│   ├── pages/
│   │   ├── AuthPage.tsx        # Tela de login e cadastro
│   │   ├── Dashboard.tsx       # Visão geral com métricas e últimas matrículas
│   │   ├── AlunosPage.tsx      # CRUD completo de alunos
│   │   ├── LeadsPage.tsx       # Gestão de leads e funil de captação
│   │   ├── MatriculasPage.tsx  # Gestão de matrículas
│   │   ├── TurmasPage.tsx      # Gestão de turmas
│   │   ├── ModalidadesPage.tsx # Gestão de modalidades (atividades)
│   │   ├── InstrutoresPage.tsx # Gestão de instrutores
│   │   ├── PagamentosPage.tsx  # Gestão financeira e pagamentos
│   │   ├── PresencasPage.tsx   # Registro de presenças
│   │   ├── AulasPage.tsx       # Gestão de aulas
│   │   ├── UsuariosPage.tsx    # Administração de usuários e perfis
│   │   └── NotFound.tsx        # Página 404
│   ├── test/                   # Testes unitários e de componentes
│   ├── App.tsx                 # Roteamento SPA e provedores globais
│   ├── main.tsx                # Ponto de entrada React
│   └── index.css               # Estilos globais e variáveis Tailwind
├── supabase/
│   ├── config.toml             # Configuração do projeto Supabase
│   └── migrations/             # Histórico de migrações do banco de dados
├── .env                        # Variáveis de ambiente (não commitado)
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## 🛠️ Como Executar Localmente

### Pré-requisitos

- **Node.js** 18+ e **npm**
- Conta e projeto no **Supabase**

### 1. Clone o repositório e instale as dependências

```powershell
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> As chaves podem ser encontradas no painel do Supabase em **Project Settings → API**.

### 3. Execute em modo de desenvolvimento

```powershell
npm run dev
```

A aplicação estará disponível em: **`http://localhost:5173`**

---

## 🗄️ Banco de Dados (Supabase / PostgreSQL)

O banco de dados é gerenciado pelo **Supabase** com migrações SQL versionadas em `supabase/migrations/`.

### Tabelas Principais

| Tabela | Descrição |
|---|---|
| `alunos` | Cadastro completo de alunos (dados pessoais, responsável, observações médicas) |
| `leads` | Funil de captação — contatos interessados que ainda não são alunos |
| `matriculas` | Vínculo aluno ↔ modalidade ↔ turma com status e controle financeiro |
| `turmas` | Agrupamento de alunos por horário e modalidade |
| `modalidades` | Atividades oferecidas (Pilates, Ballet, Karatê, etc.) |
| `instrutores` | Cadastro de professores e instrutores |
| `pagamentos` | Lançamentos financeiros — mensalidades, taxas e status de quitação |
| `presencas` | Registro de presença por aula, turma e aluno |
| `profiles` | Perfis de usuários autenticados (espelho do Supabase Auth) |
| `user_roles` | Tabela de vínculo entre usuários e perfis de acesso |

### Modalidades Pré-cadastradas

O sistema já vem com **19 modalidades** configuradas no seed inicial:

> Pilates 2X · Pilates 3X · Ginástica Rítmica · Desenho e Pintura · Karatê · Ballet · Kickboxing · Jiu-Jitsu · Taekwondo · Capoeira · Yoga · Funcional Power · Teatro · Canto · PowerJump · BodyPump · TaiChiChuan · Crochê · Tricô

### Aplicar Migrações em Projeto Próprio

```powershell
# Instalar o Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Aplicar migrações
supabase db push
```

---

## 🔐 Autenticação e Controle de Acesso (RBAC)

O sistema utiliza o **Supabase Auth** para autenticação e implementa controle de acesso baseado em perfis via tabela `user_roles`.

### Perfis de Acesso

| Perfil | Descrição | Módulos |
|---|---|---|
| **`secretaria`** | Acesso completo + gerência de usuários | Todos os módulos, incluindo Usuários |
| **`coordenacao`** | Acesso completo aos módulos operacionais | Dashboard, Alunos, Leads, Matrículas, Turmas, Modalidades, Instrutores, Pagamentos, Presenças, Aulas |
| **`instrutor`** | Leitura de turmas/alunos e gestão de presenças | Dashboard, Alunos, Matrículas, Turmas, Modalidades, Instrutores, Presenças, Aulas |

### Proteção de Rotas

- `/leads` e `/pagamentos` — exigem perfil `secretaria` ou `coordenacao`
- `/usuarios` — exclusivo para `secretaria`
- Todas as demais rotas — qualquer usuário autenticado

### Fluxo de Acesso para Novos Usuários

1. O novo usuário se **cadastra** pela tela de login (`/auth`)
2. Um administrador `secretaria` acessa **Usuários** e atribui o perfil correto via checkbox
3. O usuário faz login e o menu lateral é exibido conforme o perfil atribuído

---

## 📋 Módulos e Funcionalidades

### 📊 Dashboard
- Totais de alunos, matrículas ativas, leads e pagamentos pendentes
- Receita total recebida (soma dos pagamentos com status `PAGO`)
- Lista das 5 últimas matrículas registradas

### 👥 Alunos
- Cadastro completo: dados pessoais, endereço, responsável e observações médicas
- Controle de autorização de imagem e aceite de comunicação
- Origem do primeiro contato
- Status cadastral: `ATIVO` / `INATIVO`

### 🎯 Leads
- Funil de captação de novos interessados
- Canal de origem e modalidade de interesse
- Status: `NOVO`, `EM_CONTATO`, `CONVERTIDO`, `PERDIDO`
- Data do último contato e motivo de não-conversão

### 📋 Matrículas
- Vínculo aluno ↔ modalidade ↔ turma
- Controle de liberação para aula (`liberado_para_aula`)
- Formas e tipos de pagamento
- Status: `ATIVA`, `SUSPENSA`, `CANCELADA`, `CONCLUÍDA`

### 🏃 Turmas
- Agrupamento por horário e modalidade
- Faixa etária e capacidade máxima
- Suporte a aulas experimentais
- Status: `ATIVA` / `INATIVA`

### 🎨 Modalidades
- Catálogo de atividades (Artes Marciais, Dança, Fitness, Bem-Estar, Artes, Artesanato)
- Área temática e valor padrão de referência

### 👨‍🏫 Instrutores
- Cadastro de professores e instrutores
- CPF, telefone, e-mail e função
- Status ativo/inativo

### 💰 Pagamentos
- Lançamentos por aluno e matrícula
- Tipos: `MENSALIDADE`, `TAXA_MATRICULA`, entre outros
- Status: `PENDENTE`, `PAGO`, `ATRASADO`, `CANCELADO`
- Controle de valor previsto vs. valor efetivamente pago
- Referência de mês e ano para mensalidades

### ✅ Presenças
- Registro de presença por aula, aluno e turma
- Vinculado à matrícula

### 🗓️ Aulas
- Gestão e agendamento de aulas por turma

### 🛡️ Usuários *(somente Secretaria)*
- Visualização de todos os usuários cadastrados
- Atribuição e remoção de perfis via checkboxes

---

## 🧪 Testes

```powershell
# Testes unitários (Vitest) — execução única
npm test

# Testes unitários em modo watch
npm run test:watch

# Testes E2E (Playwright)
npx playwright test
```

---

## 🏗️ Scripts Disponíveis

```powershell
# Iniciar servidor de desenvolvimento
npm run dev

# Verificar erros de lint
npm run lint

# Gerar build de produção
npm run build

# Gerar build em modo development
npm run build:dev

# Visualizar build de produção localmente
npm run preview
```

---

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon/publishable key) do Supabase | ✅ |

---

> **MCJB — Movimento Comunitário do Jardim Botânico** · Sistema MOVI+
