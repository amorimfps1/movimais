# MOVI+ — Sistema de Gestão do MCJB

Plataforma web completa para gestão operacional, pedagógica e financeira de atividades, alunos, leads, matrículas, turmas, instrutores, pagamentos, financeiro analítico, presenças e aulas do **Movimento Comunitário do Jardim Botânico (MCJB)** em Brasília-DF.

---

## 🚀 Stack Tecnológica

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **React** | 18.x | Biblioteca de interface de usuário (SPA) |
| **Vite** | 5.x | Build tool e servidor de desenvolvimento ultrarrápido |
| **TypeScript** | 5.x | Tipagem estática rigorosa e prevenção de erros |
| **Tailwind CSS** | 3.x | Framework de estilização utilitária com design system escuro |
| **Radix UI / shadcn** | — | Componentes headless e acessíveis (Dialogs, Selects, Dropdowns, Tooltips) |
| **React Router DOM** | 6.x | Roteamento dinâmico SPA com proteção por perfil e code splitting |
| **TanStack Query** | 5.x | Gerenciamento de estado e cache assíncrono |
| **Zod** | 3.x | Validação e tipagem de schemas de dados |
| **Recharts** | 2.x | Visualizações gráficas analíticas interativas (Bar, Pie, Area) |
| **Lucide React** | — | Pacote abrangente de ícones modernos |
| **Sonner / Toaster** | — | Notificações toast responsivas em tempo real |

### Backend / Banco de Dados

| Tecnologia | Função |
|---|---|
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, RLS, RPCs, Storage) |
| **PostgreSQL** | Banco de dados relacional com integridade referencial e triggers |
| **Supabase Auth** | Autenticação segura por e-mail/senha com controle de sessão |
| **Row Level Security (RLS)** | Políticas de segurança por linha granulares no banco |

### Testes & Qualidade

| Tecnologia | Função |
|---|---|
| **Vitest** | Suíte de testes unitários e de integração |
| **Testing Library** | Testes de componentes React e acessibilidade |
| **Playwright** | Testes end-to-end (E2E) em navegadores reais |
| **ESLint** | Validação de padrões de código e boas práticas |

---

## 📦 Estrutura do Projeto

```
movimais/
├── public/                     # Assets estáticos públicos e favicon
├── src/
│   ├── assets/                 # Logotipos e identidade visual do MCJB
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ui/                 # Componentes base (shadcn / Radix UI)
│   │   ├── AppLayout.tsx       # Layout principal com suporte a navbar superior
│   │   ├── AppNavbar.tsx       # Barra de navegação superior com abas, scroll suave e badges
│   │   ├── AppSidebar.tsx      # Sidebar colapsável alternativa
│   │   ├── CpfInput.tsx        # Campo com máscara automática e validação de CPF
│   │   ├── DataTable.tsx       # Tabela universal com busca debounced, filtros, ordenação, paginação e exportação CSV
│   │   ├── ErrorBoundary.tsx   # Tratamento e captura global de erros React
│   │   ├── MoviLogo.tsx        # Logotipo vetorial responsivo
│   │   ├── NavLink.tsx         # Link com detecção de rota ativa
│   │   ├── PageHeader.tsx      # Cabeçalho padronizado de páginas com ações e badges
│   │   ├── ProtectedRoute.tsx  # Proteção de rotas por sessão e papéis RBAC
│   │   ├── StatCard.tsx        # Cards de KPIs e métricas com tendências
│   │   └── StatusBadge.tsx     # Badges semânticos de status
│   ├── hooks/
│   │   ├── useAuth.tsx         # Contexto de autenticação, perfis (RBAC), aprovação e dados do instrutor
│   │   ├── useTable.ts         # Hook genérico de leitura reativa de tabelas Supabase
│   │   ├── use-mobile.tsx      # Detecção responsiva de telas móveis
│   │   └── use-toast.ts        # Hook para disparo de alertas e notificações
│   ├── integrations/
│   │   └── supabase/           # Cliente Supabase configurado (singleton)
│   ├── lib/
│   │   ├── store.ts            # Interfaces TypeScript, constantes de tabelas e CRUD genérico
│   │   ├── matriculaUtils.ts   # Utilitários de cálculo de planos (Mensal, Trimestral, Anual) e vencimento
│   │   └── utils.ts            # Utilitários de formatação de datas (DD/MM/YYYY), máscara de CPF e classes CSS
│   ├── types/
│   │   └── financeiro.ts       # Schemas Zod e tipos de receita por modalidade, repasse e KPIs
│   ├── pages/
│   │   ├── AuthPage.tsx        # Tela de login e cadastro com aviso de aprovação pendente
│   │   ├── Dashboard.tsx       # Painel analítico com KPIs financeiros, novos alunos e 4 gráficos Recharts
│   │   ├── AlunosPage.tsx      # Gestão e cadastro de alunos, responsáveis e observações médicas
│   │   ├── LeadsPage.tsx       # Funil de captação de leads com conversão em aluno em 1 clique e WhatsApp
│   │   ├── MatriculasPage.tsx  # Gestão de matrículas, planos, liberação rápida para aula e vigências
│   │   ├── TurmasPage.tsx      # Gestão de turmas com grade de dias da semana, horários, salas e instrutores
│   │   ├── ModalidadesPage.tsx # Catálogo de modalidades esportivas e culturais (19 pré-cadastradas)
│   │   ├── InstrutoresPage.tsx # Cadastro do corpo docente com especialidades múltiplas (1:N) e WhatsApp
│   │   ├── PagamentosPage.tsx  # Gestão de lançamentos financeiros operacionais e ação rápida "Dar Baixa"
│   │   ├── FinanceiroPage.tsx  # Painel financeiro analítico avançado, repasses de professores e receita por modalidade
│   │   ├── PresencasPage.tsx   # Diário de classe, chamada em lote por turma/data e filtros por instrutor
│   │   ├── AulasPage.tsx       # Grade e agendamento de aulas por turma e instrutor
│   │   ├── UsuariosPage.tsx    # Painel de aprovação de novos cadastros, cargos e exclusão de contas
│   │   └── NotFound.tsx        # Página de erro 404
│   ├── test/                   # Testes unitários e de integração
│   ├── App.tsx                 # Roteamento SPA dinâmico por perfil, Suspense e QueryClient
│   ├── main.tsx                # Ponto de entrada da aplicação
│   └── index.css               # Estilos globais e tokens de cores Tailwind
├── supabase/
│   ├── config.toml             # Configuração do projeto Supabase
│   └── migrations/             # Histórico versionado de migrações SQL
├── .env                        # Variáveis de ambiente locais (ignorado no git)
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
- Conta e projeto configurado no **Supabase**

### 1. Clonar e Instalar

```powershell
git clone <url-do-repositorio>
cd movimais
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> As chaves estão disponíveis no painel do Supabase em **Project Settings → API**.

### 3. Iniciar o servidor de desenvolvimento

```powershell
npm run dev
```

A aplicação estará acessível em: **`http://localhost:5173`**

---

## 🗄️ Banco de Dados & Histórico de Migrações

O banco de dados PostgreSQL é gerenciado no **Supabase** com migrações versionadas em `supabase/migrations/`:

| Migração | Descrição |
|---|---|
| `20260623184449_*.sql` | Schema completo inicial (alunos, leads, matrículas, turmas, modalidades, instrutores, pagamentos, presenças) + seed de 19 modalidades + RLS inicial |
| `20260623185538_*.sql` | Tabelas de autenticação e perfis: `profiles` e `user_roles` |
| `20260623185557_*.sql` | Ajustes complementares de políticas de segurança |
| `20260824222327_create_aulas_table.sql` | Criação da tabela `aulas` com FKs para turmas e instrutores, status e políticas RLS |
| `20260825000000_approval_workflow.sql` | Enum `user_status`, tabela `notifications`, trigger `handle_new_user`, RPC `approve_user` e RPC `reject_user` |
| `20260826000000_user_management_and_deletion.sql` | RPC `delete_user_account` para exclusão atômica de contas e regras de segurança contra auto-exclusão |
| `20260827000000_turmas_schedule_and_instructor_modalities.sql` | Grade horária em turmas (`dias_semana`, `horario_inicio`, `horario_fim`, `sala`, `id_instrutor`), especialidades múltiplas em instrutores (`especialidades: text[]`, `id_modalidades: text[]`, `user_id`) e índices de busca |
| `20260828000000_add_tipo_plano_to_matriculas.sql` | Adição da coluna `tipo_plano` na tabela `matriculas` (padrão `TRIMESTRAL`) |

### Aplicar Migrações via Supabase CLI

```powershell
# Login no Supabase
supabase login

# Vincular ao seu projeto
supabase link --project-ref SEU_PROJECT_ID

# Aplicar todas as migrações pendentes
supabase db push
```

---

## 🔐 Autenticação, Perfis (RBAC) e Workflow de Aprovação

O sistema implementa uma camada de governança e controle de acesso baseada em perfis:

### Perfis de Acesso

| Perfil | Acesso aos Módulos | Destino Inicial |
|---|---|---|
| **`secretaria`** | Acesso irrestrito a todos os módulos, relatórios financeiros e gestão de acessos | `/` (Dashboard) |
| **`coordenacao`** | Gestão de alunos, leads, matrículas, turmas, modalidades, instrutores, pagamentos, financeiro analítico, presenças, aulas e aprovação de novos usuários | `/` (Dashboard) |
| **`instrutor`** | Acesso operacional às suas turmas, modalidades, diário de presenças e calendário de aulas | `/aulas` |

### Fluxo de Novos Usuários (Approval Workflow)

1. **Solicitação**: O usuário realiza o cadastro na tela `/auth`. O status inicial é definido como `pendente`.
2. **Notificação**: Uma notificação é gerada para a coordenação e secretaria informando o novo cadastro.
3. **Bloqueio Provisório**: Enquanto estiver pendente, o usuário é impedido de navegar no sistema.
4. **Aprovação / Rejeição**:
   - A equipe administrativa acessa **/usuarios**, onde visualiza a aba com badge contador de pendências.
   - Ao aprovar, define obrigatoriamente o cargo (`secretaria`, `coordenacao` ou `instrutor`) e, se for instrutor, seleciona as especialidades e modalidades lecionadas.
   - Em caso de recusa, o motivo da rejeição é registrado.
   - Administradores também podem remover contas em definitivo via exclusão atômica.

---

## 📋 Módulos e Funcionalidades

### 📊 Dashboard
- **KPIs Principais**: Total de Alunos, Matrículas Ativas, Leads no Funil, Pagamentos Pendentes, Receita Total Recebida e Novos Alunos no Mês.
- **Gráficos Analíticos (Recharts)**:
  - Comparativo de Receita Prevista vs. Recebida por Mês (Gráfico de Barras com Tooltip personalizado em padrão escuro e formatação `DD/MM/YYYY`).
  - Distribuição de Alunos por Modalidade (Gráfico de Pizza interativo).
  - Evolução de Novos Alunos ao longo do tempo (Gráfico de Área).
  - Matrículas por Status.
- **Feed Recente**: Visualização das últimas matrículas registradas com badges semânticos.

### 👥 Alunos
- Cadastro completo: dados pessoais, endereço padronizado (Brasília-DF), contato e responsável legal para menores.
- Autorização de uso de imagem, aceite de comunicações e observações médicas.
- **Ação rápida WhatsApp**: Botão de contato direto via WhatsApp com mensagem pré-formatada.
- Visualização detalhada de dados do aluno em modal dedicado.

### 🎯 Leads & Captação
- Funil de prospecção comercial: origem (WhatsApp, Instagram, Presencial, Indicação), modalidade de interesse e data do último contato.
- **Conversão em 1 Clique**: Transforma o lead diretamente em um registro na base de alunos.
- Contato rápido via WhatsApp integrado.
- Métricas de leads novos, em atendimento e taxa de conversão global.

### 📋 Matrículas
- Vínculo direto entre Aluno ↔ Modalidade ↔ Turma.
- **Tipos de Planos**: `MENSAL` (1 mês), `TRIMESTRAL` (3 meses) e `ANUAL` (12 meses).
- **Cálculo Automático de Vigência**: Determina a data de término com base no plano selecionado e estende em +30 dias para status de trancamento/suspensão (`SUSPENSA_30_DIAS` / `TRANCADA_JUSTIFICADA`).
- **Liberação Rápida para Aula**: Switch interativo para liberar ou revogar o acesso do aluno às aulas.
- Formas de pagamento (PIX, Boleto, Cartão de Crédito, Dinheiro, Transferência).

### 🏃 Turmas & Grade Horária
- Seleção de dias da semana (`Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`, `Sábado`, `Domingo`).
- Horário de início e término (`horario_inicio`, `horario_fim`), capacidade máxima e sala.
- Atribuição de instrutor responsável.
- Alternância de visualização entre **Cards Visuais** e **Tabela Completa**.
- Indicadores de ocupação em tempo real e vagas disponíveis.

### 🎨 Modalidades
- Catálogo com **19 modalidades pré-cadastradas** (Pilates 2X/3X, Karatê, Ballet, Jiu-Jitsu, Ginástica Rítmica, Funcional Power, Yoga, etc.).
- Áreas temáticas (Artes Marciais, Dança, Fitness, Bem-Estar, Artes, Artesanato, Esporte).
- Definição de valor padrão de referência e controle de status.

### 👨‍🏫 Instrutores
- Cadastro completo do corpo docente: CPF, telefone, e-mail e função (Principal / Substituto).
- **Múltiplas Especialidades (1:N)**: Associação de múltiplas modalidades por instrutor.
- Vinculação com o usuário de acesso (`user_id`).
- Contato direto via WhatsApp.

### 💰 Pagamentos (Lançamentos Operacionais)
- Lançamentos vinculados por matrícula e aluno.
- Tipos de lançamento: Mensalidade, Taxa de Matrícula, Material, Reposição, Ajuste.
- **Ação "Dar Baixa"**: Quitação instantânea com registro automático da data de pagamento e valor recebido.
- Indicadores operacionais de receita recebida, valores pendentes, inadimplência e taxa de adimplência.

### 💳 Painel Financeiro Analítico & Repasses (`/financeiro`)
- **Arrecadação Total por Modalidade**: Soma detalhada de todas as entradas financeiras (mensalidades + taxas de matrícula + materiais + outros), com contagem de transações e alunos ativos.
- **Repasse de Professores / Instrutores (Regra de Ouro)**:
  - O cálculo de repasse contabiliza **estritamente pagamentos categorizados como `MENSALIDADE`**.
  - Taxas de matrícula, materiais, multas e reposições **não entram** no repasse aos professores, sendo retidas pela instituição e auditadas na coluna de taxas excluídas.
- **Evolução Financeira Comparativa**: Gráficos analíticos de receita mensal comparando Mensalidades vs. Taxas/Outros vs. Repasses a Professores.
- **Distribuição de Matrículas**: Gráfico de pizza interativo com percentuais de participação de cada modalidade.
- **Filtros Temporais Flexíveis**: Mês Atual, 3 Meses, 6 Meses, Ano Atual e Geral.
- **Exportação Consolidada**: Download de relatório analítico completo em formato CSV formatado para Excel (UTF-8 com BOM).
- **Validação Rigorosa com Zod**: Tipagem e sanitização dos dados financeiros via schemas Zod (`src/types/financeiro.ts`).

### ✅ Presenças (Diário de Classe)
- Registro de chamada por turma, data e aula.
- Filtros inteligentes por modalidade e instrutor (instrutores visualizam diretamente suas respectivas turmas).
- Botões de seleção em massa: **Marcar Todos Presentes** e **Marcar Todos Ausentes**.
- Detecção automática do dia da semana a partir da data da aula.

### 🗓️ Aulas
- Calendário e controle de aulas agendadas, realizadas e canceladas.
- Rota de destino inicial direta para instrutores.

### 🛡️ Gestão de Usuários & Acessos
- Painel de aprovação com 3 abas: **Pendentes**, **Ativos & Permissões** e **Todos**.
- Modal de aprovação com seleção de cargo e especialidades para instrutores.
- Modal de rejeição com registro de justificativa.
- Exclusão segura de contas via RPC atômica (com trava de segurança contra auto-exclusão).

---

## 🧪 Testes Automatizados

```powershell
# Executar suíte de testes unitários (Vitest)
npm test

# Executar testes em modo watch (re-execução em mudanças de código)
npm run test:watch

# Executar testes end-to-end (Playwright)
npx playwright test
```

---

## 🏗️ Scripts Disponíveis

```powershell
# Iniciar ambiente de desenvolvimento
npm run dev

# Executar validação de tipos e linter
npm run lint

# Gerar build de produção otimizado
npm run build

# Gerar build de desenvolvimento
npm run build:dev

# Testar build de produção localmente
npm run preview
```

---

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (`https://xxx.supabase.co`) | ✅ Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública anônima do Supabase | ✅ Sim |

---

> **MCJB — Movimento Comunitário do Jardim Botânico** · Sistema MOVI+
