# CONTEXT.md — MOVI+ Contexto Técnico e de Negócio

> Este arquivo serve como referência rápida para desenvolvedores e agentes de IA trabalhando neste repositório.
> Descreve a arquitetura, padrões de código, regras de negócio e convenções do projeto.

---

## 1. Visão Geral

**MOVI+** é uma aplicação web SPA (Single Page Application) para o **Movimento Comunitário do Jardim Botânico (MCJB)**, uma instituição comunitária em Brasília-DF que oferece atividades esportivas, artísticas e de bem-estar.

O sistema centraliza a gestão de:
- Cadastro de alunos e leads de captação
- Matrículas em modalidades e turmas
- Controle financeiro (pagamentos e mensalidades)
- Registro de presenças
- Gestão de instrutores
- Controle de acesso por perfis de usuário

---

## 2. Arquitetura

### Tipo de aplicação
**Frontend-only SPA** com backend gerenciado via **Supabase** (BaaS).
Não existe código de servidor local. Toda a lógica de banco de dados, autenticação e regras de acesso vive no Supabase.

### Fluxo de dados

```
Componente React
    └── useTable<T>(STORES.X)     ← hook genérico de leitura
            └── getAll<T>(table)  ← lib/store.ts → supabase.from(table).select()
                    └── Supabase PostgreSQL
```

Para escrita (create/update/delete):
```
Componente React
    └── create() / update() / remove()  ← lib/store.ts → supabase.from(table).insert/update/delete
```

### Gerenciamento de estado
- **Sem Redux / Zustand / Context para dados**: estado local com `useState` + re-fetch via `reload()`
- **TanStack Query**: importado mas não utilizado na maioria dos módulos ainda — padrão predominante é `useTable` + reload manual
- **AuthContext**: único Context global, via `useAuth()` — gerencia sessão Supabase + roles

---

## 3. Padrões de Código

### Padrão de página (CRUD)

Toda página de módulo segue o mesmo padrão:

```tsx
// 1. Buscar dados com useTable
const { data: itens, reload } = useTable<Tipo>(STORES.TABELA);

// 2. Estado do formulário
const [open, setOpen] = useState(false);
const [form, setForm] = useState<Tipo>(emptyTipo());

// 3. Salvar
const handleSave = async () => {
  await create(STORES.TABELA, form);
  await reload();
  setOpen(false);
};

// 4. Renderizar DataTable + Dialog de criação
```

### Geração de IDs
IDs são gerados no **frontend** via `generateId()` em `lib/store.ts`:
```ts
export function generateId() {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}
```
Resultado: strings de 8 caracteres hexadecimais em maiúsculas, ex: `A3F1B2C4`.

> ⚠️ IDs são gerados pelo cliente, não pelo banco. Não use `serial` ou `uuid_generate_v4()` nas inserções.

### Funções CRUD genéricas (lib/store.ts)

| Função | Descrição |
|---|---|
| `getAll<T>(table)` | Busca todos os registros ordenados por `created_at DESC` |
| `getById<T>(table, id)` | Busca um registro por ID |
| `create<T>(table, item)` | Insere um registro (lança erro em falha) |
| `update<T>(table, item)` | Atualiza registro por `item.id` |
| `remove(table, id)` | Remove registro por ID |

### Hook useTable

```ts
const { data, loading, reload, setData } = useTable<T>(STORES.X);
```

- Executa `getAll` automaticamente no mount
- `reload()` re-busca os dados (usar após create/update/delete)
- `setData()` atualiza localmente sem re-fetch (uso raro)

---

## 4. Autenticação e Autorização

### Supabase Auth
O login usa o sistema nativo do **Supabase Auth** (email + senha). O cliente está em `src/integrations/supabase/client.ts`.

### Perfis (RBAC)
Os perfis são armazenados na tabela `user_roles` (coluna `role: text`), ligados ao `auth.users` via `user_id`.

```ts
export type AppRole = "secretaria" | "coordenacao" | "instrutor";
```

| Role | isAdmin | Acesso especial |
|---|---|---|
| `secretaria` | ✅ | Página de Usuários; todas as rotas |
| `coordenacao` | ✅ | Leads e Pagamentos; sem Usuários |
| `instrutor` | ❌ | Sem Leads, Pagamentos, ou Usuários |

`isAdmin` é `true` se o usuário tem `secretaria` OU `coordenacao`.

### ProtectedRoute

```tsx
// Qualquer usuário autenticado
<Route element={<ProtectedRoute />}>

// Apenas secretaria ou coordenacao
<Route element={<ProtectedRoute requireRoles={["secretaria", "coordenacao"]} />}>

// Apenas secretaria (admin exclusivo)
<Route element={<ProtectedRoute requireAdmin />}>
```

### Fluxo de novo usuário
1. Usuário se cadastra em `/auth` (cria conta no Supabase Auth)
2. Um registro em `profiles` é criado automaticamente (via trigger no Supabase)
3. Admin (`secretaria`) acessa `/usuarios` e atribui role via checkbox
4. Usuário faz login → menu é filtrado de acordo com as roles

---

## 5. Banco de Dados

### Convenções das tabelas

- Todas as tabelas têm `id text PRIMARY KEY` (gerado pelo frontend)
- Todas têm `created_at timestamptz NOT NULL DEFAULT now()`
- Chaves estrangeiras usam `ON DELETE CASCADE` (matrículas→alunos) ou `ON DELETE SET NULL` (turmas→modalidades)
- RLS (Row Level Security) está **ativado em todas as tabelas**
- Política atual: `open_all` — acesso total para `anon` e `authenticated` (para ser restringida no futuro)

### Relacionamentos principais

```
alunos (1) ──── (N) matriculas (N) ──── (1) modalidades
                      │                       │
                      └── (N) pagamentos      └── (N) turmas
                      └── (N) presencas
```

### Enums de status (implementados como `text` no PostgreSQL)

**alunos.status_cadastral**
- `ATIVO`, `INATIVO`

**leads.status_lead**
- `NOVO`, `EM_CONTATO`, `AGENDADO`, `CONVERTIDO`, `NAO_CONVERTIDO`, `PERDIDO`

**matriculas.status_matricula**
- `PENDENTE_LIBERACAO`, `ATIVA`, `SUSPENSA_30_DIAS`, `TRANCADA_JUSTIFICADA`, `BLOQUEADA_INADIMPLENCIA`, `EXPERIMENTAL`, `CANCELADA`, `CONCLUIDA`

**matriculas.tipo_matricula**
- `NORMAL`, `BOLSA`, `DESCONTO_ESPECIAL`, `ASSOCIADO_MCJB`, `CORTESIA`, `EXPERIMENTAL_CONVERTIDA`

**pagamentos.status_pagamento**
- `PREVISTO`, `PENDENTE`, `PAGO`, `ATRASADO`, `ISENTO`, `ESTORNADO`, `NEGOCIADO`

**pagamentos.tipo_lancamento**
- `MENSALIDADE`, `TAXA_MATRICULA`, `MATERIAL`, `REPOSICAO`, `MULTA`, `DESCONTO`, `AJUSTE`

**turmas.status_turma**
- `ATIVA`, `INATIVA`

**modalidades.status**
- `ATIVO`, `INATIVO`

**instrutores.ativo**
- `boolean` (não é text)

---

## 6. Componentes Reutilizáveis

### DataTable

```tsx
<DataTable
  data={items}
  searchKeys={["campo1", "campo2"]}  // campos para busca textual
  columns={[
    { key: "campo", label: "Label" },
    { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
  ]}
/>
```

### StatusBadge

Renderiza qualquer string de status com cor semântica automática.

| Status | Cor |
|---|---|
| ATIVO, ATIVA, CONVERTIDO, PAGO | Verde (success) |
| NOVO, EM_ATENDIMENTO | Azul (info) |
| PENDENTE, PENDENTE_LIBERACAO, SUSPENSA_30_DIAS | Amarelo (warning) |
| ATRASADO, CANCELADA, CANCELADO, BLOQUEADA_INADIMPLENCIA | Vermelho (destructive) |
| INATIVO | Cinza (muted) |
| EXPERIMENTAL | Roxo/primário |

Qualquer status não mapeado recebe a cor neutra padrão.

### PageHeader

```tsx
<PageHeader
  title="Título da Página"
  description="Subtítulo opcional"
  action={<Button>Ação</Button>}  // botão no canto direito
/>
```

---

## 7. Origem dos Dados

### Alunos — origem_primeiro_contato
Valores válidos: `INSTAGRAM`, `INDICACAO`, `PRESENCIAL`, `WHATSAPP`, `OUTRO`

### Localização padrão
Cidade padrão no formulário de aluno: **Brasília**, UF: **DF**

### Modalidades pré-seeded (19 modalidades)

Inseridas na migration `20260623184449_*.sql`. Os IDs são strings fixas mnemônicas:

| ID | Modalidade | Área |
|---|---|---|
| `PIL2X001` | Pilates 2X | Bem-Estar |
| `PIL3X001` | Pilates 3X | Bem-Estar |
| `GINRIT01` | Ginástica Rítmica | Esportes |
| `DESPIN01` | Desenho e Pintura | Artes |
| `KARATE01` | Karatê | Artes Marciais |
| `BALLET01` | Ballet | Dança |
| `KICKBOX1` | Kickboxing | Artes Marciais |
| `JIUJITS1` | Jiu-Jitsu | Artes Marciais |
| `TAEKWON1` | Taekwondo | Artes Marciais |
| `CAPOEIR1` | Capoeira | Artes Marciais |
| `YOGA0001` | Yoga | Bem-Estar |
| `FUNCPWR1` | Funcional Power | Fitness |
| `TEATRO01` | Teatro | Artes |
| `CANTO001` | Canto | Artes |
| `PWRJUMP1` | PowerJump | Fitness |
| `BODYPMP1` | BodyPump | Fitness |
| `TAICHI01` | TaiChiChuan | Bem-Estar |
| `CROCHE01` | Crochê | Artesanato |
| `TRICO001` | Tricô | Artesanato |

---

## 8. Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon/publishable key) do Supabase |

O cliente Supabase é instanciado em `src/integrations/supabase/client.ts` e reutilizado em todo o app.

---

## 9. Migrações

Localização: `supabase/migrations/`

| Arquivo | Conteúdo |
|---|---|
| `20260623184449_*.sql` | Schema completo inicial + seed de 19 modalidades + RLS |
| `20260623185538_*.sql` | Tabelas de auth: `profiles` e `user_roles` |
| `20260623185557_*.sql` | Ajustes complementares |

---

## 10. Convenções e Gotchas

- **IDs nulos em FK**: ao criar matrículas e pagamentos, campos FK opcionais devem ser enviados como `null` (não string vazia) para o Supabase. Veja o `payload` em `MatriculasPage.tsx` e `PagamentosPage.tsx`.
- **Validação e máscara de CPF**: implementada via `CpfInput` (`src/components/CpfInput.tsx`) com validação de dígitos verificadores e formatação automática `000.000.000-00`.
- **Paginação e Exportação CSV**: `DataTable` suporta paginação em memória (5, 10, 20, 50, 100 itens) e exportação em CSV com codificação UTF-8 com BOM (compatível com Excel).
- **CRUD Completo**: todos os 8 módulos possuem suporte a **Criação, Edição e Exclusão** (com confirmação visual).
- **Dashboard completo**: métricas com KPIs semânticos, receita total recebida, taxa de adimplência e 4 gráficos Recharts (Bar, Pie, Area).
- **RLS fechada**: políticas ativas restringindo visualizações e escrita com base no papel do usuário (`secretaria`, `coordenacao`, `instrutor`).

