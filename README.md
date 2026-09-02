# MOVI+ — Sistema de Gestão do MCJB

Plataforma web completa e moderna para gestão operacional, pedagógica, comunitária e financeira do **Movimento Comunitário do Jardim Botânico (MCJB)**, instituição comunitária em Brasília-DF que atende cerca de 500 alunos em atividades esportivas, artísticas, culturais e de bem-estar.

---

## 🚀 Stack Tecnológica

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **React** | 18.x | Biblioteca de interface de usuário SPA |
| **Vite** | 5.x | Build tool e servidor de desenvolvimento ultrarrápido |
| **TypeScript** | 5.x | Tipagem estática rigorosa e prevenção de erros em tempo de compilação |
| **Tailwind CSS** | 3.x | Framework utilitário de estilização com design system escuro |
| **Radix UI / shadcn** | — | Primitivas headless acessíveis (Dialogs, Selects, Dropdowns, Sheets, Tooltips) |
| **React Router DOM** | 6.x | Roteamento dinâmico SPA com proteção RBAC e code splitting |
| **TanStack Query** | 5.x | Gerenciamento de cache e estado assíncrono |
| **Zod** | 3.x | Validação rigorosa e inferência de tipos dos dados financeiros |
| **Recharts** | 2.x | Visualizações gráficas analíticas interativas (Bar, Pie, Line, Area) |
| **Lucide React** | — | Coleção abrangente de ícones modernos e consistentes |
| **Sonner / Toaster** | — | Notificações toast responsivas e feedback ao usuário |

### Backend / Banco de Dados

| Tecnologia | Função |
|---|---|
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, Row Level Security, RPCs, Storage) |
| **PostgreSQL 15+** | Banco de dados relacional com integridade referencial, triggers e views otimizadas |
| **Supabase Auth** | Autenticação segura por e-mail/senha com controle de sessão e tokens JWT |
| **Row Level Security (RLS)** | Políticas de segurança por linha granulares no banco |

### Testes & Qualidade

| Tecnologia | Função |
|---|---|
| **Vitest** | Suíte de testes unitários e de integração de alta performance |
| **Testing Library** | Testes de componentes React e acessibilidade |
| **Playwright** | Testes end-to-end (E2E) automatizados em navegadores reais |
| **ESLint** | Padronização e análise estática de código |

---

## 📦 Estrutura do Projeto

```
movimais/
├── public/                     # Assets estáticos públicos e favicon
├── src/
│   ├── assets/                 # Logotipos e identidade visual do MCJB
│   ├── components/             # Componentes reutilizáveis
│   │   ├── dashboard/          # Componentes visuais analíticos do Dashboard
│   │   │   ├── AttendanceHeatmap.tsx       # Matriz de calor semanal de assiduidade
│   │   │   ├── BulletProgressBar.tsx       # Barra de progresso comparando realizado vs meta
│   │   │   ├── CustomChartTooltips.tsx     # Tooltips estilizados para Recharts
│   │   │   ├── DashboardGeral.tsx          # Visão 360° da gestão com Hero KPIs e funil
│   │   │   ├── DashboardFinanceiroView.tsx # Controladoria, fluxo divergente e cobrança
│   │   │   ├── DashboardCoordenacaoView.tsx# Retenção pedagógica e busca ativa de faltas
│   │   │   ├── DashboardInstrutorView.tsx  # Visão do professor, chamadas e ocupação
│   │   │   ├── DashboardComunicacaoView.tsx# Aquisição multicanal e demanda de cursos
│   │   │   ├── DivergentBarChart.tsx       # Gráfico de barras divergentes (entradas vs saídas)
│   │   │   ├── RadialGauge.tsx             # Mostrador circular analógico para metas
│   │   │   └── VisualFunnel.tsx            # Funil de conversão visual em etapas
│   │   ├── ui/                 # Componentes base (shadcn / Radix UI)
│   │   ├── AppLayout.tsx       # Layout principal com Navbar superior integrada
│   │   ├── AppNavbar.tsx       # Navbar superior com abas, scroll suave, badges e perfil
│   │   ├── AppSidebar.tsx      # Sidebar colapsável alternativa
│   │   ├── CpfInput.tsx        # Campo com máscara automática e validação de dígitos do CPF
│   │   ├── DataTable.tsx       # Tabela universal com busca debounced, filtros, ordenação, paginação e CSV
│   │   ├── ErrorBoundary.tsx   # Captura global de erros da árvore React
│   │   ├── MoviLogo.tsx        # Logotipo vetorial responsivo
│   │   ├── NavLink.tsx         # Link com detecção de rota ativa
│   │   ├── PageHeader.tsx      # Cabeçalho padronizado de páginas com ações e badges
│   │   ├── ProtectedRoute.tsx  # Proteção de rotas por sessão e papéis RBAC
│   │   ├── StatCard.tsx        # Cards de KPIs com suporte a barras de progresso e tendências
│   │   └── StatusBadge.tsx     # Badges semânticos de status com código de cores
│   ├── hooks/
│   │   ├── useAuth.tsx         # Contexto de autenticação, perfis (RBAC), aprovação e dados do instrutor
│   │   ├── useTable.ts         # Hook genérico de leitura reativa de tabelas Supabase
│   │   ├── use-mobile.tsx      # Detecção de telas móveis e breakpoints
│   │   └── use-toast.ts        # Disparo de notificações toast
│   ├── integrations/
│   │   └── supabase/           # Cliente Supabase singleton configurado
│   ├── lib/
│   │   ├── store.ts            # Interfaces TypeScript, constantes STORES e CRUD genérico com sanitização
│   │   ├── matriculaUtils.ts   # Utilitários de cálculo de planos (Mensal, Trimestral, Anual) e vigência
│   │   └── utils.ts            # Formatação de datas (DD/MM/YYYY), máscara de CPF e classes CSS
│   ├── types/
│   │   └── financeiro.ts       # Schemas Zod e tipos de receita por modalidade, repasse e KPIs
│   ├── pages/
│   │   ├── AuthPage.tsx        # Login e registro com mensagem de aprovação pendente
│   │   ├── Dashboard.tsx       # Painel de inteligência com 5 abas especializadas por cargo
│   │   ├── AlunosPage.tsx      # Cadastro de alunos, responsáveis, dados médicos e WhatsApp
│   │   ├── LeadsPage.tsx       # Funil comercial com conversão em aluno em 1 clique
│   │   ├── MatriculasPage.tsx  # Gestão de matrículas, planos, liberação de aulas e vigências
│   │   ├── TurmasPage.tsx      # Turmas com grade horária semanal, salas, ocupação e instrutores
│   │   ├── ModalidadesPage.tsx # Catálogo de modalidades esportivas e culturais (19 cadastradas)
│   │   ├── InstrutoresPage.tsx # Corpo docente com especialidades múltiplas (1:N) e WhatsApp
│   │   ├── PagamentosPage.tsx  # Lançamentos operacionais e ação rápida "Dar Baixa"
│   │   ├── FinanceiroPage.tsx  # Painel analítico de arrecadação por modalidade e repasses
│   │   ├── PresencasPage.tsx   # Diário de classe, chamada em lote e filtros por instrutor
│   │   ├── AulasPage.tsx       # Grade e agendamento de aulas por turma e instrutor
│   │   ├── UsuariosPage.tsx    # Aprovação de cadastros, papéis de acesso e exclusão segura
│   │   └── NotFound.tsx        # Página de erro 404
│   ├── test/                   # Testes unitários e de integração
│   ├── App.tsx                 # Roteamento SPA dinâmico por perfil, Suspense e QueryClient
│   ├── main.tsx                # Ponto de entrada da aplicação
│   └── index.css               # Estilos globais e tokens de cores Tailwind
├── supabase/
│   ├── config.toml             # Configuração do projeto Supabase CLI
│   └── migrations/             # Histórico versionado de migrações SQL (10 migrações)
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

- **Node.js** 18+ e **npm** (ou **bun**)
- Conta e projeto configurado no **Supabase**

### 1. Clonar o repositório e instalar as dependências

```powershell
git clone <url-do-repositorio>
cd movimais
npm install
```

### 2. Configurar as variáveis de ambiente

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

O banco de dados PostgreSQL é gerenciado no **Supabase** com 10 migrações versionadas em `supabase/migrations/`:

| Migração | Descrição |
|---|---|
| `20260623184449_*.sql` | Schema completo inicial (alunos, leads, matrículas, turmas, modalidades, instrutores, pagamentos, presenças) + seed de 19 modalidades + RLS inicial |
| `20260623185538_*.sql` | Tabelas de segurança e autenticação: `profiles` e `user_roles` |
| `20260623185557_*.sql` | Políticas complementares de segurança RLS |
| `20260824222327_create_aulas_table.sql` | Criação da tabela `aulas` com FKs para turmas e instrutores, status e políticas RLS |
| `20260825000000_approval_workflow.sql` | Enum `user_status`, tabela `notifications`, trigger `handle_new_user`, RPCs `approve_user` e `reject_user` |
| `20260826000000_user_management_and_deletion.sql` | RPC `delete_user_account` para exclusão atômica de contas e trava contra auto-exclusão |
| `20260827000000_turmas_schedule_and_instructor_modalities.sql` | Grade horária em turmas (`dias_semana`, horários, salas, `id_instrutor`), especialidades múltiplas em instrutores (`especialidades: text[]`, `id_modalidades: text[]`, `user_id`) |
| `20260828000000_add_tipo_plano_to_matriculas.sql` | Adição da coluna `tipo_plano` em `matriculas` (Mensal, Trimestral, Anual) |
| `20260829000000_financial_dashboard_metrics.sql` | Views analíticas de receita/repasse e RPC agregadora `get_financial_dashboard_metrics` |
| `20260830000000_fix_security_and_rbac_policies.sql` | Correções críticas de segurança (IDOR/BOLA) com uso de `auth.uid()` e RLS administrativo em `user_roles` |

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
| **`coordenacao`** | `/` (Dashboard) | Gestão de alunos, turmas, matrículas, presenças, pagamentos, dashboard analítico e aprovação de cadastros |
| **`instrutor`** | `/aulas` | Acesso operacional às suas turmas, modalidades, diário de presenças e calendário de aulas |

### Fluxo de Novos Usuários (Approval Workflow)

1. **Solicitação**: O usuário realiza o cadastro na tela `/auth`. O status inicial é registrado como `pendente`.
2. **Notificação**: Uma notificação é gerada para a coordenação e secretaria informando o novo cadastro.
3. **Bloqueio Provisório**: Enquanto estiver pendente, o usuário é impedido de navegar no sistema.
4. **Aprovação / Rejeição**:
   - A equipe administrativa acessa **/usuarios**, onde visualiza a aba com badge contador pulsante de pendências.
   - Ao aprovar, define obrigatoriamente o cargo (`secretaria`, `coordenacao` ou `instrutor`) e, se for instrutor, associa as modalidades e especialidades.
   - Em caso de recusa, o motivo da rejeição é registrado via modal.
   - Administradores também podem remover contas em definitivo via RPC `delete_user_account` com segurança contra auto-exclusão.

---

## 📋 Módulos e Funcionalidades

### 📊 Painel de Inteligência & Dashboard Multi-Perfil (`/`)
- **5 Visões Analíticas Especializadas**:
  1. **Geral (360°)**: Hero KPIs de alunos ativos, ocupação (meta 500 alunos), receita realizada vs prevista, funil comercial com `VisualFunnel`, balanço líquido de crescimento com `DivergentBarChart` e turmas em alerta de ocupação (<50%).
  2. **Financeiro (Controladoria)**: Fluxo de caixa mensal divergente (entradas vs saídas), receita por modalidade ranqueada, métodos de pagamento (PIX, Cartão, Boleto), impacto de bolsas sociais e cobrança de inadimplência por turma com link direto para WhatsApp.
  3. **Coordenação (Pedagógico & Retenção)**: Assiduidade média por turma (meta 75%), causa-raiz de cancelamentos (Pareto), mapa de calor semanal de frequência (`AttendanceHeatmap`), cumprimento de grade mensal (`BulletProgressBar`) e busca ativa de faltas via WhatsApp.
  4. **Instrutor (Sala de Aula)**: Painel focado nas turmas sob responsabilidade do professor, alunos ativos, taxa de lotação, evolução da assiduidade com `RadialGauge` e avisos de acolhimento para a próxima aula (com estimativa de repasse ocultável).
  5. **Comunicação (Marketing & Aquisição)**: Funil multicanal (alcance ➔ cliques ➔ leads ➔ matrículas), eficiência por canal de origem (Instagram, Indicação [líder com 71% de conversão], WhatsApp, Eventos), demanda reprimida por modalidade e termômetro de reputação comunitária (92%).

### 👥 Alunos (`/alunos`)
- Cadastro completo: dados pessoais, CPF com validação matemática e máscara, endereço do DF, contato e responsável legal para menores.
- Autorização de uso de imagem, aceite de comunicações e observações médicas.
- **Ação rápida WhatsApp**: Botão de contato direto via WhatsApp com mensagem pré-formatada.
- Modal dedicado para visualização completa de dados cadastrais.

### 🎯 Leads & Captação (`/leads`)
- Funil de prospecção comercial: canal de origem (WhatsApp, Instagram, Presencial, Indicação), modalidade de interesse e data do último contato.
- **Conversão em 1 Clique**: Transforma o lead diretamente em um registro na base de alunos.
- Contato rápido integrado via WhatsApp.

### 📋 Matrículas (`/matriculas`)
- Vínculo direto entre Aluno ↔ Modalidade ↔ Turma.
- **Tipos de Planos**: `MENSAL` (1 mês), `TRIMESTRAL` (3 meses, padrão) e `ANUAL` (12 meses).
- **Cálculo Automático de Vigência**: Determina a data de término com base no plano contratado e estende em +30 dias para status de trancamento/suspensão (`SUSPENSA_30_DIAS` / `TRANCADA_JUSTIFICADA`).
- **Liberação Rápida para Aula**: Switch interativo para liberar ou suspender o acesso do aluno às aulas.
- Formas de pagamento (PIX, Boleto, Cartão de Crédito, Dinheiro, Transferência).

### 🏃 Turmas & Grade Horária (`/turmas`)
- Seleção de dias da semana (`Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`, `Sábado`, `Domingo`).
- Horário de início e término (`horario_inicio`, `horario_fim`), capacidade máxima e sala.
- Atribuição de instrutor responsável.
- Alternância de visualização entre **Cards Visuais** e **Tabela Completa**.
- Indicadores de ocupação em tempo real e vagas disponíveis.

### 🎨 Modalidades (`/modalidades`)
- Catálogo com **19 modalidades pré-cadastradas** (Pilates 2X/3X, Karatê, Ballet, Jiu-Jitsu, Ginástica Rítmica, Funcional Power, Yoga, etc.).
- Áreas temáticas (Artes Marciais, Dança, Fitness, Bem-Estar, Artes, Artesanato, Esporte).
- Definição de valor padrão de referência e controle de status.

### 👨‍🏫 Instrutores (`/instrutores`)
- Cadastro completo do corpo docente: CPF, telefone, e-mail e função (Principal / Substituto).
- **Múltiplas Especialidades (1:N)**: Associação de múltiplas modalidades por instrutor.
- Vinculação com o usuário de acesso (`user_id`).
- Contato direto via WhatsApp.

### 💰 Pagamentos Operacionais (`/pagamentos`)
- Lançamentos vinculados por matrícula e aluno.
- Tipos de lançamento: Mensalidade, Taxa de Matrícula, Material, Reposição, Ajuste.
- **Ação "Dar Baixa"**: Quitação instantânea com registro automático da data de pagamento e valor recebido.
- Indicadores operacionais de receita recebida, valores pendentes e taxa de adimplência.

### 💳 Painel Financeiro Analítico & Repasses (`/financeiro`)
- **Arrecadação Total por Modalidade**: Soma detalhada de todas as entradas financeiras (mensalidades + taxas de matrícula + materiais + outros), com contagem de transações e alunos ativos.
- **Repasse de Professores / Instrutores (Regra de Ouro)**:
  - O cálculo de repasse contabiliza **estritamente pagamentos categorizados como `MENSALIDADE`**.
  - Taxas de matrícula, materiais, multas e reposições **não entram** no repasse aos professores, sendo retidas pela instituição e auditadas na coluna de taxas excluídas.
- **Gráficos Analíticos**: Barras empilhadas de receita por modalidade, Donut de distribuição de matrículas ativas e Barras horizontais de repasse docente.
- **Filtros Temporais Flexíveis**: Mês Atual, 3 Meses, 6 Meses, Ano Atual, Geral e Intervalo Personalizado (DD/MM/AAAA).
- **Exportação Consolidada**: Download de relatório analítico completo em formato CSV formatado para Excel (UTF-8 com BOM).
- **Validação Rigorosa com Zod**: Tipagem e validação dos dados financeiros via schemas Zod (`src/types/financeiro.ts`).

### ✅ Presenças (Diário de Classe) (`/presencas`)
- Registro de chamada por turma, data e aula.
- Detecção automática do dia da semana a partir da data informada.
- Filtros inteligentes por modalidade e instrutor (instrutores visualizam diretamente suas respectivas turmas).
- Botões de seleção em massa: **Marcar Todos Presentes** e **Marcar Todos Ausentes**.

### 🗓️ Aulas (`/aulas`)
- Calendário e controle de aulas agendadas, realizadas e canceladas.
- Rota de destino inicial direta para instrutores.

### 🛡️ Gestão de Usuários & Acessos (`/usuarios`)
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
