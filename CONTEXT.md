# CONTEXT.md — MOVI+ Contexto Técnico e de Negócio

> Este arquivo serve como referência rápida para desenvolvedores e agentes de IA trabalhando neste repositório.
> Descreve a arquitetura, padrões de código, regras de negócio, convenções e evolução do projeto.

---

## 1. Visão Geral

**MOVI+** é uma aplicação web SPA (Single Page Application) moderna desenvolvida para o **Movimento Comunitário do Jardim Botânico (MCJB)**, uma instituição comunitária em Brasília-DF que oferece atividades esportivas, artísticas, culturais e de bem-estar.

O sistema centraliza a gestão operacional, pedagógica e financeira de:
- **Alunos**: Cadastro completo de alunos, dados de contato, responsáveis para menores e observações médicas.
- **Leads & Captação**: Funil de atendimento comercial e conversão direta de contatos em alunos em 1 clique.
- **Matrículas & Planos**: Vínculo aluno ↔ modalidade ↔ turma, planos (Mensal, Trimestral, Anual), cálculo automático de vigência e liberação para aula.
- **Turmas & Grade Horária**: Agrupamento por modalidade, faixa etária, dias da semana, horários, salas e atribuição de instrutores.
- **Modalidades**: Catálogo de atividades esportivas, artísticas, fitness e bem-estar (19 modalidades pré-cadastradas).
- **Instrutores**: Gestão do corpo docente, especialidades múltiplas (1:N), vinculação com conta de acesso e contato direto via WhatsApp.
- **Pagamentos Operacionais**: Lançamentos financeiros por matrícula e aluno, controle de mensalidades e ação rápida "Dar Baixa".
- **Painel Financeiro & Repasses (`/financeiro`)**: Dashboard analítico avançado de arrecadação por modalidade, cálculo de repasses a professores (baseado estritamente em mensalidades), retenção de taxas e evolução histórica.
- **Presenças & Diário de Classe**: Chamada em lote por turma, data e aula, com filtros inteligentes por instrutor e modalidade.
- **Aulas & Calendário**: Gestão de aulas agendadas e realizadas por turma e instrutor.
- **Gestão de Usuários & Aprovações**: Sistema de solicitação de cadastro, fluxo de aprovação/rejeição pela coordenação/secretaria e atribuição de perfis (RBAC).

---

## 2. Arquitetura

### Tipo de aplicação
**Frontend-only SPA** com backend gerenciado via **Supabase** (BaaS).
Não existe servidor backend local tradicional. Toda a lógica de banco de dados, autenticação, storage e regras de acesso (RLS e RPCs) vive no Supabase (PostgreSQL).

### Navegação e Layout
- **AppNavbar Superior**: Barra de navegação horizontal com abas inteligentes, rolagem suave com setas direcionais em overflow, badge animado de cadastros pendentes e dropdown de perfil com logout.
- **Dynamic Home Routing (`HomeRoute`)**:
  - Usuários com perfil exclusivo de `instrutor` são redirecionados automaticamente para `/aulas`.
  - Usuários com perfil administrativo (`secretaria` ou `coordenacao`) acessam o `/` (Dashboard analítico).
- **Code Splitting**: Todas as páginas são carregadas sob demanda via `React.lazy` e encapsuladas por `Suspense` com fallback visual `PageLoader`.

### Fluxo de dados

```
Componente React
    ├── useTable<T>(STORES.X)     ← hook genérico de leitura reativa
    │       └── getAll<T>(table)  ← lib/store.ts → supabase.from(table).select().order("created_at", { ascending: false })
    │               └── Supabase PostgreSQL
    └── Chamadas Específicas / RPCs (supabase.rpc("approve_user", ...))
```

Para operações de escrita (CRUD):
```
Componente React
    └── create() / update() / remove()  ← lib/store.ts → supabase.from(table).insert/update/delete
            └── reload()                ← re-fetch dos dados atualizados
```

### Gerenciamento de estado e Validação
- **Estado Local Reativo**: `useState` + `useMemo` / `useCallback` para cálculos de KPIs e filtros em memória sem re-renderizações desnecessárias.
- **AuthContext (`useAuth`)**: Contexto global de autenticação, monitorando sessão Supabase, status cadastral (`pendente`, `aprovado`, `rejeitado`), papéis RBAC (`secretaria`, `coordenacao`, `instrutor`), especialidades do professor e `id_instrutor`.
- **Validação de Tipos com Zod**: Schemas tipados em `src/types/financeiro.ts` para garantir integridade matemática e formatação dos relatórios financeiros.
- **TanStack Query**: Provedor configurado em `src/App.tsx` com `staleTime: 5min` para queries assíncronas.

---

## 3. Padrões de Código e Estrutura

### Padrão de Página de Módulo (CRUD)

Toda página de módulo segue a estrutura padronizada:

```tsx
// 1. Leitura reativa de tabelas
const { data: itens, reload } = useTable<Tipo>(STORES.TABELA);
const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);

// 2. Estado de formulário, modal e edição
const [open, setOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Tipo | null>(null);
const [form, setForm] = useState<Tipo>(emptyTipo());

// 3. Persistência
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

### Geração de IDs
Os identificadores das entidades de negócio são gerados no **frontend** via `generateId()` em `lib/store.ts`:
```ts
export function generateId() {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}
```
Exemplo de ID gerado: `A3F1B2C4`.
> ⚠️ **Importante**: As tabelas de negócio usam `id text PRIMARY KEY`. IDs são strings de 8 dígitos hexadecimais geradas pelo cliente antes da inserção. Perfis de auth (`profiles`, `auth.users`, `notifications`) utilizam `UUID`.

### Funções CRUD Genéricas (`src/lib/store.ts`)

| Função | Descrição |
|---|---|
| `getAll<T>(table)` | Busca todos os registros ordenados por `created_at DESC` |
| `getById<T>(table, id)` | Busca um registro por ID |
| `create<T>(table, item)` | Insere um registro (lança erro em falha) |
| `update<T>(table, item)` | Atualiza registro localizando por `item.id` |
| `remove(table, id)` | Remove registro por ID |

### Utilitários de Matrícula (`src/lib/matriculaUtils.ts`)

| Função | Descrição |
|---|---|
| `calcularDataFimPrevista(inicio, plano, status, diasProrrogacao)` | Calcula a data de término somando 1 mês (Mensal), 3 meses (Trimestral) ou 12 meses (Anual), adicionando +30 dias para status de trancamento/suspensão |
| `calcularDataFimPrevistaBR(...)` | Retorna a data final formatada diretamente no padrão `DD/MM/YYYY` |
| `isMatriculaTrancada(status)` | Identifica `SUSPENSA_30_DIAS` ou `TRANCADA_JUSTIFICADA` |
| `isMatriculaInadimplente(status)` | Identifica `BLOQUEADA_INADIMPLENCIA` |
| `isMatriculaVencida(dataFim)` | Verifica se a data de término expirou em relação à data atual |

### Schemas e Tipos Financeiros (`src/types/financeiro.ts`)

| Schema / Tipo | Descrição |
|---|---|
| `ModalidadeRevenueSchema` | Validação de receita total arrecadada, mensalidades, taxas de matrícula e contagem de alunos por modalidade |
| `ProfessorRepasseSchema` | Validação do valor de repasse a instrutores calculado **exclusivamente sobre mensalidades**, rastreando taxas retidas pela escola |
| `ModalidadeMatriculasSchema`| Distribuição de matrículas ativas e percentual de participação de cada atividade |
| `KpiFinancialSummarySchema` | Indicadores de receita acumulada, total a repassar, taxas de matrícula, ticket médio e taxa de adimplência |
| `EvolucaoFinanceiraMensalSchema` | Histórico mensal comparando receitas de mensalidades, taxas extras e repasse a professores |

---

## 4. Autenticação, Autorização e Workflow de Aprovação

### Perfis de Acesso (RBAC)
Os papéis de acesso são armazenados na tabela `user_roles` (`role: app_role`), associados ao `auth.users.id`:

```ts
export type AppRole = "secretaria" | "coordenacao" | "instrutor";
export type UserStatus = "pendente" | "aprovado" | "rejeitado";
```

| Perfil | Nível Admin (`isAdmin`) | Destino Inicial | Módulos com Acesso |
|---|---|---|---|
| **`secretaria`** | ✅ Sim | `/` (Dashboard) | Acesso total a todas as rotas e gestão administrativa/financeira/usuários |
| **`coordenacao`** | ✅ Sim | `/` (Dashboard) | Acesso a todos os módulos operacionais, pagamentos, financeiro analítico e aprovação de usuários |
| **`instrutor`** | ❌ Não | `/aulas` | Acesso restrito a Turmas, Modalidades, Presenças e Aulas |

### Fluxo de Aprovação de Novos Usuários (Approval Workflow)
1. **Cadastro**: O usuário se registra em `/auth`. A conta é criada no `auth.users` e inserida em `profiles` com `status = 'pendente'`.
2. **Notificação**: Uma notificação é gerada na tabela `notifications` direcionada à coordenação/secretaria.
3. **Bloqueio no Login**: Tentativas de login por usuários pendentes ou rejeitados são interceptadas no `AuthPage`, exibindo feedback claro e desconectando a sessão temporária.
4. **Avaliação em `/usuarios`**:
   - **Aprovação**: Administradores abrem o modal de aprovação, selecionam o cargo obrigatório (`secretaria`, `coordenacao` ou `instrutor`) e, para instrutores, vinculam modalidades/especialidades lecionadas. Executa a RPC `approve_user`.
   - **Rejeição**: Administradores informam o motivo da recusa. Executa a RPC `reject_user`.
   - **Exclusão**: Administradores podem excluir contas pendentes ou desativadas com segurança atômica via RPC `delete_user_account` (bloqueada para a própria conta).

---

## 5. Banco de Dados e Esquema Relacional

### Tabelas Principais

| Tabela | Chave Primária | Relacionamentos e Observações |
|---|---|---|
| `alunos` | `id text` | Dados pessoais, endereço (DF), responsável por menor, aceite médico e de imagem |
| `leads` | `id text` | Funil comercial de captação; conversão em aluno em 1 clique |
| `matriculas` | `id text` | FKs para `alunos`, `modalidades`, `turmas`. Suporta `tipo_plano` e `liberado_para_aula` |
| `turmas` | `id text` | FK para `modalidades`, FK para `instrutores`. Campos `dias_semana: text[]`, `horario_inicio`, `horario_fim`, `sala` |
| `modalidades` | `id text` | Catálogo com 19 modalidades pré-cadastradas, área temática e valor padrão |
| `instrutores` | `id text` | FK opcional para `auth.users(id)`. Campos `especialidades: text[]`, `id_modalidades: text[]` |
| `pagamentos` | `id text` | FKs para `matriculas` e `alunos`. Lançamentos mensais com controle de baixa rápida |
| `presencas` | `id text` | FKs para `turmas`, `matriculas`, `alunos`. Diário de chamada por aula e data |
| `aulas` | `id text` | FKs para `turmas` e `instrutores`. Calendário de aulas com status e observações |
| `profiles` | `id uuid` | Espelho de `auth.users` com `status`, `approved_by`, `especialidades`, `id_instrutor` |
| `user_roles` | `id uuid` | Vínculo N:M entre `user_id` e `app_role` (`secretaria`, `coordenacao`, `instrutor`) |
| `notifications`| `id uuid` | Notificações internas para a equipe administrativa |

### Enums e Status do Sistema

- **`alunos.status_cadastral`**: `ATIVO`, `INATIVO`
- **`leads.status_lead`**: `NOVO`, `EM_ATENDIMENTO`, `AGUARDANDO_RETORNO`, `AGENDADO`, `CONVERTIDO`, `NAO_CONVERTIDO`, `PERDIDO`
- **`matriculas.status_matricula`**: `PENDENTE_LIBERACAO`, `ATIVA`, `SUSPENSA_30_DIAS`, `TRANCADA_JUSTIFICADA`, `BLOQUEADA_INADIMPLENCIA`, `EXPERIMENTAL`, `CANCELADA`, `CONCLUIDA`
- **`matriculas.tipo_plano`**: `MENSAL`, `TRIMESTRAL`, `ANUAL`
- **`matriculas.tipo_matricula`**: `NORMAL`, `BOLSA`, `DESCONTO_ESPECIAL`, `ASSOCIADO_MCJB`, `CORTESIA`, `EXPERIMENTAL_CONVERTIDA`
- **`pagamentos.status_pagamento`**: `PREVISTO`, `PENDENTE`, `PAGO`, `ATRASADO`, `ISENTO`, `ESTORNADO`, `NEGOCIADO`
- **`pagamentos.tipo_lancamento`**: `MENSALIDADE`, `TAXA_MATRICULA`, `MATERIAL`, `REPOSICAO`, `MULTA`, `DESCONTO`, `AJUSTE`
- **`turmas.status_turma`**: `ATIVA`, `INATIVA`
- **`modalidades.status`**: `ATIVO`, `INATIVO`
- **`aulas.status_aula`**: `AGENDADA`, `REALIZADA`, `CANCELADA`
- **`profiles.status`**: `pendente`, `aprovado`, `rejeitado`

---

## 6. Componentes Reutilizáveis Principais

### `DataTable` (`src/components/DataTable.tsx`)
Componente universal de tabela de dados com recursos avançados:
- **Busca Textual com Debounce (250ms)** por múltiplas chaves de busca.
- **Filtros Multi-Critério** com seletores e tags de remoção rápida.
- **Ordenação Dinâmica** ascendente / descendente por qualquer coluna.
- **Paginação em Memória** configurável (5, 10, 20, 50, 100 itens por página).
- **Exportação CSV** com suporte a caracteres acentuados (UTF-8 com BOM para Microsoft Excel).
- **Confirmação de Exclusão** via `AlertDialog` visual antes de deletar registros.
- **Formatação Automática de Datas** brasileiras (`DD/MM/YYYY`).

### `StatusBadge` (`src/components/StatusBadge.tsx`)
Renderiza badges com cores semânticas padronizadas:
- **Verde (`success`)**: `ATIVO`, `ATIVA`, `CONVERTIDO`, `PAGO`, `REALIZADA`, `aprovado`
- **Azul (`info`)**: `NOVO`, `EM_ATENDIMENTO`, `AGUARDANDO_RETORNO`
- **Amarelo (`warning`)**: `PENDENTE`, `PENDENTE_LIBERACAO`, `SUSPENSA_30_DIAS`, `PREVISTO`, `AGENDADA`, `pendente`
- **Vermelho (`destructive`)**: `ATRASADO`, `CANCELADA`, `CANCELADO`, `BLOQUEADA_INADIMPLENCIA`, `PERDIDO`, `rejeitado`
- **Roxo (`primary`)**: `EXPERIMENTAL`
- **Cinza (`muted`)**: `INATIVO`, `INATIVA`, `ISENTO`

### `CpfInput` (`src/components/CpfInput.tsx`)
Input controlado com máscara automática (`000.000.000-00`), cálculo de validação dos 2 dígitos verificadores do CPF e feedback visual de status válido/inválido.

### `PageHeader` (`src/components/PageHeader.tsx`)
Cabeçalho padrão contendo título da página, descrição contextual, badge contador e slot para ações principais (botões de criação e filtros).

### `StatCard` (`src/components/StatCard.tsx`)
Cards analíticos de indicadores com ícone temático, suporte a variantes visuais (`default`, `primary`, `success`, `warning`, `destructive`) e indicador de tendência.

---

## 7. Origem dos Dados e Seed Inicial

### Alunos — Origem do Primeiro Contato
Canais cadastrados: `INSTAGRAM`, `INDICACAO`, `PRESENCIAL`, `WHATSAPP`, `OUTRO`.

### Modalidades Pré-cadastradas (19 modalidades)
Inseridas no seed inicial com IDs mnemônicos fixos:
`PIL2X001` (Pilates 2X), `PIL3X001` (Pilates 3X), `GINRIT01` (Ginástica Rítmica), `DESPIN01` (Desenho e Pintura), `KARATE01` (Karatê), `BALLET01` (Ballet), `KICKBOX1` (Kickboxing), `JIUJITS1` (Jiu-Jitsu), `TAEKWON1` (Taekwondo), `CAPOEIR1` (Capoeira), `YOGA0001` (Yoga), `FUNCPWR1` (Funcional Power), `TEATRO01` (Teatro), `CANTO001` (Canto), `PWRJUMP1` (PowerJump), `BODYPMP1` (BodyPump), `TAICHI01` (TaiChiChuan), `CROCHE01` (Crochê), `TRICO001` (Tricô).

---

## 8. Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon/publishable key) do Supabase |

---

## 9. Histórico Completo de Migrações SQL

Localização: `supabase/migrations/`

| Arquivo de Migração | Finalidade e Conteúdo |
|---|---|
| `20260623184449_*.sql` | Schema inicial completo (8 tabelas) + seed de 19 modalidades + ativação de RLS inicial |
| `20260623185538_*.sql` | Tabelas de segurança e auth: `profiles` e `user_roles` |
| `20260623185557_*.sql` | Políticas complementares de RLS |
| `20260824222327_create_aulas_table.sql` | Criação da tabela `aulas` com FKs, índices e políticas de acesso por cargo |
| `20260825000000_approval_workflow.sql` | Enum `user_status`, tabela `notifications`, trigger `handle_new_user`, RPCs `approve_user` e `reject_user` |
| `20260826000000_user_management_and_deletion.sql` | RPC `delete_user_account` para exclusão segura de usuários e permissões administrativas |
| `20260827000000_turmas_schedule_and_instructor_modalities.sql` | Grade de horários em turmas (`dias_semana`, `horario_inicio`, `horario_fim`, `sala`), especialidades múltiplas em instrutores (`especialidades: text[]`, `id_modalidades: text[]`, `user_id`) e índices |
| `20260828000000_add_tipo_plano_to_matriculas.sql` | Coluna `tipo_plano` na tabela `matriculas` (padrão `TRIMESTRAL`) |

---

## 10. Convenções, Regras de Negócio e Gotchas

1. **Regras de Repasse Financeiro aos Professores (Regra de Ouro)**:
   - O repasse do professor é calculado **exclusivamente sobre lançamentos com `tipo_lancamento = 'MENSALIDADE'`**.
   - Taxas de matrícula, material didático, multas e reposições pertencem integralmente à escola/MCJB e são separadas na coluna `total_taxas_nao_repassadas`.
2. **Arrecadação Total por Modalidade**:
   - A arrecadação total de cada modalidade consolida todas as entradas recebidas (mensalidades, taxas de matrícula, reposições e avulsos).
3. **Valores Nulos em FKs Opcionais**:
   - Ao gravar matrículas, turmas e pagamentos, campos de chave estrangeira vazios no formulário devem ser transmitidos como `null` (e nunca como string vazia `""`), evitando erros de violação de FK no PostgreSQL.
4. **Cálculo de Vigência de Matrícula**:
   - `MENSAL`: soma 1 mês.
   - `TRIMESTRAL`: soma 3 meses.
   - `ANUAL`: soma 12 meses.
   - Status `SUSPENSA_30_DIAS` ou `TRANCADA_JUSTIFICADA`: prorroga a data final automaticamente em +30 dias.
5. **Baixa Rápida de Pagamento**:
   - O botão "Dar Baixa" em `PagamentosPage` atualiza o status para `PAGO`, registra a `data_pagamento` atual e preenche o `valor_pago` caso esteja zerado.
6. **Visibilidade e Acesso de Instrutores**:
   - O perfil `instrutor` tem acesso simplificado e focado nas turmas e presenças que correspondem às suas modalidades/especialidades ou à sua atribuição direta na turma.
7. **Formatação de Datas em Todo o Sistema**:
   - Todas as exibições visuais utilizam o formato brasileiro `DD/MM/YYYY` via `formatDateToBR` em `src/lib/utils.ts`.
8. **Proteção de Auto-Alteração em Usuários**:
   - Nenhum administrador pode excluir a sua própria conta ou desmarcar os seus próprios papéis de acesso em `/usuarios`.
