# CONTEXT.md — MOVI+ Contexto Técnico e de Negócio

> Este arquivo serve como referência técnica e arquitetural consolidada para desenvolvedores e agentes de IA trabalhando neste repositório.
> Descreve a arquitetura, regras de negócio, convenções de código, banco de dados, governança de acesso (RBAC) e evolução contínua do projeto.

---

## 1. Visão Geral do Projeto

**MOVI+** é uma aplicação web SPA (Single Page Application) moderna desenvolvida sob medida para o **Movimento Comunitário do Jardim Botânico (MCJB)**, instituição comunitária em Brasília-DF que oferece atividades esportivas, artísticas, culturais e de bem-estar para cerca de 500 alunos.

O sistema centraliza e automatiza a gestão operacional, pedagógica, financeira e comunitária:

- **Painel de Inteligência & Dashboard Multi-Perfil (`/`)**: 5 visões especializadas por papel (Geral 360°, Financeiro/Controladoria, Coordenação/Retenção, Instrutor/Sala de Aula e Comunicação/Marketing), com KPIs vitais, funil de conversão comercial, balanço de crescimento líquido, assiduidade e avisos de aula.
- **Alunos (`/alunos`)**: Cadastro detalhado com dados de contato, endereço do DF, responsáveis legais para menores, termos de imagem/comunicação, histórico médico e contato rápido via WhatsApp.
- **Leads & Captação Comercial (`/leads`)**: Funil comercial com rastreio de canais de aquisição, interesse por modalidade e conversão direta em Aluno em 1 clique.
- **Matrículas & Planos (`/matriculas`)**: Vínculo Aluno ↔ Modalidade ↔ Turma, planos (Mensal, Trimestral [padrão], Anual), cálculo automático de vigência com extensão por suspensão (+30 dias) e liberação rápida para aula.
- **Turmas & Grade Horária (`/turmas`)**: Gestão de grade (dias da semana, horários, salas, capacidade máxima), ocupação em tempo real, atribuição de instrutores e alternância entre Cards e Tabela.
- **Modalidades (`/modalidades`)**: Catálogo com 19 modalidades pré-cadastradas (Pilates, Ballet, Karatê, Ginástica Rítmica, Funcional, Yoga, etc.), áreas temáticas e valores de referência.
- **Instrutores (`/instrutores`)**: Cadastro do corpo docente, múltiplas especialidades (1:N), vinculação de conta Supabase (`user_id`) e contato direto via WhatsApp.
- **Pagamentos Operacionais (`/pagamentos`)**: Lançamentos financeiros vinculados por matrícula e aluno, categorização de receitas e botão de ação rápida "Dar Baixa".
- **Dashboard Financeiro & Repasses (`/financeiro`)**: Painel analítico de arrecadação por modalidade, cálculo de repasse aos professores (baseado exclusivamente em mensalidades), filtros de períodos customizados e exportação CSV formatada para Excel.
- **Presenças & Diário de Classe (`/presencas`)**: Chamada em lote por turma, data e aula, com filtros inteligentes por instrutor e marcação em massa.
- **Aulas & Calendário (`/aulas`)**: Gestão de aulas agendadas, realizadas e canceladas por turma e instrutor.
- **Gestão de Usuários & Governança (`/usuarios`)**: Workflow de aprovação de cadastros (`pendente`, `aprovado`, `rejeitado`), controle de papéis (RBAC) e exclusão segura de contas.

---

## 2. Arquitetura do Sistema

### Tipo de Aplicação
- **Frontend-only SPA** construído com React 18, Vite 5 e TypeScript 5.
- **Backend-as-a-Service (BaaS)** gerenciado via **Supabase** (PostgreSQL 15+, Auth, Row Level Security, RPCs e Storage).
- Não há servidor backend intermediário: toda regra de persistência, agregação e autorização reside no PostgreSQL/Supabase com validações rigorosas no frontend.

### Roteamento e Layout Dinâmico
- **`AppNavbar` Superior**: Barra de navegação horizontal com abas inteligentes, scroll suave com setas em overflow, badge pulsante de novos cadastros pendentes para administradores e dropdown de perfil com logout.
- **Roteamento Inteligente Inicial (`HomeRoute` em `src/App.tsx`)**:
  - Usuários com perfil exclusivo de `instrutor` são direcionados diretamente para `/aulas` (ou aba de instrutor no Dashboard).
  - Usuários administrativos (`secretaria` e `coordenacao`) acessam o Dashboard Geral (`/`).
- **Code Splitting & Resiliência**: Todas as páginas utilizam lazy loading com a função utilitária `lazyWithRetry`, que detecta chunks expirados após novos deploys e realiza auto-refresh suave.

### Fluxo de Dados & Persistência

```
Componente React
    ├── useTable<T>(STORES.TABELA)  ← Hook genérico de leitura reativa
    │       └── getAll<T>(table)    ← lib/store.ts → supabase.from(table).select().order("created_at", { ascending: false })
    │               └── Supabase PostgreSQL
    ├── Views & RPCs Agregadoras   ← supabase.rpc("get_financial_dashboard_metrics", ...)
    └── Mutação de Dados (CRUD)
            └── create / update / remove ← lib/store.ts (com sanitizePayload)
                    └── reload()         ← Re-fetch automático dos dados
```

### Gerenciamento de Estado & Validação
- **Estado Reativo Local**: `useState`, `useMemo` e `useCallback` para cálculos de KPIs, filtros multi-critério e projeções em tempo O(1) usando `Map` e `Set`.
- **`AuthContext` (`useAuth`)**: Contexto global de autenticação, monitorando sessão Supabase, papéis RBAC (`secretaria`, `coordenacao`, `instrutor`), status cadastral (`pendente`, `aprovado`, `rejeitado`) e dados do instrutor.
- **TanStack Query (React Query)**: Cache assíncrono com `staleTime: 5min` e `refetchOnWindowFocus: false`.
- **Validação de Schemas com Zod**: Schemas tipados em `src/types/financeiro.ts` para validação matemática de receitas, repasses e KPIs.

---

## 3. Padrões de Código e Convenções

### 1. Padrão de Páginas CRUD
Toda página de módulo segue uma estrutura uniforme:

```tsx
// 1. Leitura reativa de tabelas
const { data: itens, loading, reload } = useTable<ItemType>(STORES.TABELA);

// 2. Estado de formulário e modal
const [open, setOpen] = useState(false);
const [editingItem, setEditingItem] = useState<ItemType | null>(null);
const [form, setForm] = useState<ItemType>(emptyItem());

// 3. Persistência segura
const handleSave = async () => {
  if (editingItem) {
    await update(STORES.TABELA, form);
  } else {
    await create(STORES.TABELA, form);
  }
  await reload();
  setOpen(false);
};

// 4. Renderização com PageHeader, StatCards, DataTable e Dialogs
```

### 2. Geração de IDs de Negócio
- Identificadores das entidades de negócio são strings alfanuméricas de 8 caracteres geradas no frontend via `generateId()` em `lib/store.ts`:
  ```ts
  export function generateId() {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }
  ```
- Tabelas de negócio usam `id text PRIMARY KEY`.
- Tabelas de autenticação e sistema (`profiles`, `auth.users`, `notifications`, `user_roles`) utilizam `UUID`.

### 3. Sanitização de Payloads (`sanitizePayload` em `lib/store.ts`)
Evita erros de sintaxe PostgreSQL (`invalid input syntax for type date: ""`) convertendo automaticamente strings vazias em campos de data ou FKs para `null`:
- Campos `data_*`, `created_at`, `updated_at`: `""` ➔ `null`.
- Chaves estrangeiras `id_*` e `user_id`: `""` ➔ `null`.
- Valores numéricos `NaN`: `NaN` ➔ `null`.

### 4. Funções CRUD Genéricas (`src/lib/store.ts`)

| Função | Descrição |
|---|---|
| `getAll<T>(table)` | Busca todos os registros ordenados por `created_at DESC` |
| `getById<T>(table, id)` | Busca registro único por ID via `.maybeSingle()` |
| `create<T>(table, item)` | Insere registro sanitizado |
| `update<T>(table, item)` | Atualiza registro pelo campo `id` |
| `remove(table, id)` | Remove registro por ID |

### 5. Utilitários de Matrícula (`src/lib/matriculaUtils.ts`)

| Função | Descrição |
|---|---|
| `calcularDataFimPrevista(inicio, plano, status, diasProrrogacao)` | Calcula data de término: Mensal (+1 mês), Trimestral (+3 meses) ou Anual (+12 meses), somando +30 dias se houver suspensão/trancamento |
| `calcularDataFimPrevistaBR(...)` | Retorna data final formatada em `DD/MM/YYYY` |
| `isMatriculaTrancada(status)` | Detecta `SUSPENSA_30_DIAS` ou `TRANCADA_JUSTIFICADA` |
| `isMatriculaInadimplente(status)` | Detecta `BLOQUEADA_INADIMPLENCIA` |
| `isMatriculaVencida(dataFim)` | Avalia se a vigência expirou em relação à data atual |

### 6. Schemas e Tipos Financeiros (`src/types/financeiro.ts`)

| Schema / Tipo | Descrição |
|---|---|
| `ModalidadeRevenueSchema` | Validação de receita total, mensalidades, taxas de matrícula, outros lançamentos e matrículas ativas por modalidade |
| `ProfessorRepasseSchema` | Validação da base de repasse calculada **estritamente sobre mensalidades**, rastreando taxas retidas pela instituição |
| `ModalidadeMatriculasSchema` | Distribuição e percentual de matrículas ativas por atividade |
| `KpiFinancialSummarySchema` | Indicadores de receita acumulada, total a repassar, taxas, ticket médio e adimplência |
| `FinancialFilterSchema` | Filtros por período (`mes_atual`, `3m`, `6m`, `ano`, `geral`, `personalizado`) |
| `EvolucaoFinanceiraMensalSchema` | Histórico mensal comparativo de arrecadação |

---

## 4. Autenticação, Autorização e Governança RBAC

### Perfis de Acesso (`AppRole`)
Os papéis são gravados na tabela `user_roles` (`role: app_role`), associados ao `auth.users(id)`:

```ts
export type AppRole = "secretaria" | "coordenacao" | "instrutor";
export type UserStatus = "pendente" | "aprovado" | "rejeitado";
```

| Perfil | Nível Admin (`isAdmin`) | Destino Inicial | Módulos e Permissões |
|---|---|---|---|
| **`secretaria`** | ✅ Sim | `/` (Dashboard) | Acesso irrestrito a todos os módulos operacionais, financeiros, pedagógicos e aprovação de usuários |
| **`coordenacao`** | ✅ Sim | `/` (Dashboard) | Gestão de alunos, turmas, matrículas, presenças, pagamentos, dashboard analítico e aprovação de usuários |
| **`instrutor`** | ❌ Não | `/aulas` | Acesso focado em Turmas, Modalidades, Presenças (Diário) e Aulas de sua especialidade |

### Workflow de Aprovação de Novos Usuários
1. **Cadastro**: O usuário se registra na tela `/auth`. O registro é inserido em `profiles` com `status = 'pendente'`.
2. **Notificação Automática**: Trigger `handle_new_user` gera registro em `notifications` para a equipe administrativa.
3. **Bloqueio no Login**: Usuários pendentes ou rejeitados são barrados na autenticação com mensagem contextual.
4. **Avaliação em `/usuarios`**:
   - **Aprovação**: Administrador seleciona cargo obrigatório (`secretaria`, `coordenacao`, `instrutor`) e especialidades/modalidades do instrutor. Invoca a RPC segura `approve_user`.
   - **Rejeição**: Administrador insere justificativa de recusa. Invoca a RPC segura `reject_user`.
   - **Exclusão Segura**: Administrador pode remover cadastros pendentes ou desativados via RPC `delete_user_account` (bloqueada contra auto-exclusão).

---

## 5. Banco de Dados e Esquema Relacional

### Tabelas Principais (Supabase / PostgreSQL)

| Tabela | Chave Primária | Relacionamentos e Finalidade |
|---|---|---|
| `alunos` | `id text` | Dados cadastrais, endereço (Brasília-DF), responsável legal, termo de imagem e observações médicas |
| `leads` | `id text` | Funil comercial de captação; conversão em aluno em 1 clique via `converteu_em_aluno` |
| `matriculas` | `id text` | FKs para `alunos`, `modalidades`, `turmas`. Suporta `tipo_plano`, `tipo_matricula` e `liberado_para_aula` |
| `turmas` | `id text` | FKs para `modalidades` e `instrutores`. Grade com `dias_semana: text[]`, `horario_inicio`, `horario_fim`, `sala` |
| `modalidades` | `id text` | Catálogo de 19 atividades esportivas e culturais com área temática e valor base |
| `instrutores` | `id text` | FK opcional para `auth.users(id)`. Campos `especialidades: text[]`, `id_modalidades: text[]`, `funcao` |
| `pagamentos` | `id text` | FKs para `matriculas` e `alunos`. Lançamentos mensais com baixa rápida |
| `presencas` | `id text` | FKs para `turmas`, `matriculas`, `alunos`. Diário de chamada por aula e data |
| `aulas` | `id text` | FKs para `turmas` e `instrutores`. Calendário de aulas com status e observações |
| `profiles` | `id uuid` | Espelho de `auth.users` com `status`, `approved_by`, `especialidades`, `id_instrutor` |
| `user_roles` | `id uuid` | Vínculo entre usuário e papéis RBAC (`secretaria`, `coordenacao`, `instrutor`) |
| `notifications` | `id uuid` | Notificações internas de novos cadastros e alertas |

### Views Otimizadas de Inteligência Financeira
- **`view_arrecadacao_modalidades`**: Consolida toda receita paga (mensalidades + taxas + avulsos), quantidade de transações e alunos ativos por modalidade.
- **`view_repasse_professores`**: Calcula a base de repasse de cada professor considerando **exclusivamente pagamentos com `tipo_lancamento = 'MENSALIDADE'`**, isolando taxas retidas pela escola.
- **`view_matriculas_ativas_modalidades`**: Distribuição percentual de matrículas ativas por modalidade.

### Funções RPC Críticas

| RPC | Segurança | Finalidade |
|---|---|---|
| `approve_user(target_user_id, role)` | `SECURITY DEFINER` | Aprova cadastro e atribui perfil em `user_roles` usando `auth.uid()` para validação |
| `reject_user(target_user_id, reason)` | `SECURITY DEFINER` | Rejeita cadastro registrando justificativa |
| `delete_user_account(target_user_id)` | `SECURITY DEFINER` | Remove perfil, roles, notificações e conta `auth.users` com trava de auto-exclusão |
| `get_financial_dashboard_metrics(ano, mes)` | `SECURITY DEFINER` | Retorna JSON consolidado de KPIs, arrecadação, repasses e evolução mensal |

---

## 6. Histórico Completo de Migrações SQL

Localização: `supabase/migrations/`

| Migração | Descrição e Impacto |
|---|---|
| `20260623184449_*.sql` | Schema inicial completo (8 tabelas) + seed de 19 modalidades + ativação de RLS inicial |
| `20260623185538_*.sql` | Tabelas de segurança e autenticação: `profiles` e `user_roles` |
| `20260623185557_*.sql` | Políticas complementares de segurança RLS |
| `20260824222327_create_aulas_table.sql` | Criação da tabela `aulas` com FKs para turmas e instrutores |
| `20260825000000_approval_workflow.sql` | Enum `user_status`, tabela `notifications`, trigger `handle_new_user`, RPCs `approve_user` e `reject_user` |
| `20260826000000_user_management_and_deletion.sql` | RPC `delete_user_account` com proteção contra auto-exclusão |
| `20260827000000_turmas_schedule_and_instructor_modalities.sql` | Grade de turmas (`dias_semana`, horários, salas), especialidades múltiplas em instrutores (`especialidades: text[]`, `id_modalidades: text[]`, `user_id`) |
| `20260828000000_add_tipo_plano_to_matriculas.sql` | Adição da coluna `tipo_plano` em `matriculas` (Mensal, Trimestral, Anual) |
| `20260829000000_financial_dashboard_metrics.sql` | Views analíticas de receita/repasse e RPC `get_financial_dashboard_metrics` |
| `20260830000000_fix_security_and_rbac_policies.sql` | Correção de segurança IDOR nas RPCs de usuários, uso de `auth.uid()` e RLS administrativo em `user_roles` |

---

## 7. Componentes Reutilizáveis & Design System

- **`DataTable` (`src/components/DataTable.tsx`)**: Tabela universal com busca debounced (250ms), filtros multi-critério, ordenação dinâmica por coluna, paginação configurável (5 a 100 itens), confirmação de exclusão via `AlertDialog` e exportação CSV com UTF-8 BOM.
- **`StatusBadge` (`src/components/StatusBadge.tsx`)**: Badges com cores semânticas padronizadas:
  - **Verde (`success`)**: `ATIVO`, `ATIVA`, `CONVERTIDO`, `PAGO`, `REALIZADA`, `aprovado`
  - **Azul (`info`)**: `NOVO`, `EM_ATENDIMENTO`, `AGUARDANDO_RETORNO`
  - **Amarelo (`warning`)**: `PENDENTE`, `PENDENTE_LIBERACAO`, `SUSPENSA_30_DIAS`, `PREVISTO`, `AGENDADA`, `pendente`
  - **Vermelho (`destructive`)**: `ATRASADO`, `CANCELADA`, `CANCELADO`, `BLOQUEADA_INADIMPLENCIA`, `PERDIDO`, `rejeitado`
  - **Roxo (`primary`)**: `EXPERIMENTAL`
  - **Cinza (`muted`)**: `INATIVO`, `INATIVA`, `ISENTO`
- **`VisualFunnel` (`src/components/dashboard/VisualFunnel.tsx`)**: Renderização gráfica de funil de conversão em camadas com taxas de passagem percentuais.
- **`DivergentBarChart` (`src/components/dashboard/DivergentBarChart.tsx`)**: Gráfico de barras divergentes para balanço de entradas vs saídas e novos alunos vs cancelamentos.
- **`RadialGauge` (`src/components/dashboard/RadialGauge.tsx`)**: Mostrador circular analógico para metas de assiduidade e satisfação comunitária.
- **`AttendanceHeatmap` (`src/components/dashboard/AttendanceHeatmap.tsx`)**: Matriz visual de calor semanal cruzando dias da semana e turnos (Manhã, Tarde, Noite).
- **`BulletProgressBar` (`src/components/dashboard/BulletProgressBar.tsx`)**: Barra de progresso comparando valor realizado versus meta alvo.
- **`CpfInput` (`src/components/CpfInput.tsx`)**: Input controlado com máscara automática (`000.000.000-00`), cálculo dos 2 dígitos verificadores e feedback visual.
- **`PageHeader` (`src/components/PageHeader.tsx`)**: Cabeçalho de página com título, subtítulo, badge contador e slot para botões de ação.
- **`StatCard` (`src/components/StatCard.tsx`)**: Card de KPIs com ícone temático, suporte a barras de progresso, metas e indicadores de tendência.

---

## 8. Regras de Negócio e Gotchas Críticos

1. **Regra de Ouro do Repasse a Professores**:
   - O repasse do professor é calculado **estritamente sobre pagamentos com `tipo_lancamento = 'MENSALIDADE'` e status `PAGO`**.
   - Taxas de matrícula, material didático, reposições e multas pertencem 100% à administração da instituição e **nunca** entram na base de repasse docente.
2. **Arrecadação Total da Modalidade**:
   - Consolida todas as entradas recebidas (mensalidades + taxas + avulsos).
3. **Tratamento de Foreign Keys Vazias**:
   - Ao gravar matrículas, turmas, aulas ou pagamentos, campos FK opcionais não preenchidos devem ser sanitizados para `null` (nunca `""`).
4. **Cálculo de Vigência de Matrícula**:
   - `MENSAL`: soma 1 mês.
   - `TRIMESTRAL`: soma 3 meses.
   - `ANUAL`: soma 12 meses.
   - Status `SUSPENSA_30_DIAS` ou `TRANCADA_JUSTIFICADA`: prorroga a data final automaticamente em +30 dias.
5. **Ação Rápida "Dar Baixa"**:
   - Atualiza o status para `PAGO`, preenche a `data_pagamento` com a data atual e preenche o `valor_pago` caso esteja zerado.
6. **Formatação Padronizada de Datas**:
   - Todas as datas exibidas na interface devem ser formatadas no padrão brasileiro `DD/MM/YYYY` via `formatDateToBR` em `src/lib/utils.ts`.
7. **Proteção contra Auto-Modificação**:
   - Administradores logados são impedidos de excluir a sua própria conta ou revogar seus próprios privilégios em `/usuarios`.
8. **Resolução Relacional O(1)**:
   - Cálculos analíticos no frontend devem construir dicionários `Map` no `useMemo` para cruzar alunos, matrículas, turmas e modalidades em tempo linear.
