# Plano de implementação do Movi+

A sequência deste plano é: garantir que o sistema executa, protege os dados e apresenta informações verdadeiras; consolidar as regras da operação; abrir jornadas para o associado; e automatizar o trabalho da equipe. Cada etapa tem uma condição de conclusão para evitar que módulos novos sejam construídos sobre dados inconsistentes.

**Escopo:** todas as melhorias recomendadas na análise do Movi+. Eventos, pesquisas, documentos e benefícios entram no planejamento, mas sua implementação depende de demanda comprovada no MCJB.

## Andamento

**Primeira entrega de desenvolvimento concluída:**

- **Fase 1.1:** removidas as duplicações preexistentes em `src/lib/store.ts` e `src/pages/LeadsPage.tsx`; build de produção e checagem de tipos concluídos.
- **Fase 1.2:** números demonstrativos e exemplos apresentados como dados reais foram retirados dos painéis geral, financeiro, de coordenação, do instrutor e de comunicação. Indicadores sem fonte foram substituídos por estados explicativos. A visão financeira do painel inicial foi simplificada para mostrar somente valores dos lançamentos registrados.
- **Higiene da base:** removido o componente `src/components/ui/form.tsx`, que não era usado e importava uma dependência ausente; corrigidas inconsistências de tipos nas páginas de aulas, presenças e financeiro.

**Segunda entrega de desenvolvimento preparada:**

- **Fase 1.3:** `getAll` e `useTable` distinguem erro de lista vazia. As páginas exibem um aviso com as tabelas que falharam e ação para tentar novamente. A página de aulas usa o mesmo fluxo; a leitura de presenças na abertura da chamada também verifica o erro da consulta.
- **Fase 2.1:** a migração `20261006000000_instructor_scope_and_student_roster.sql` restringe turmas, instrutores, aulas e presenças por vínculo com o usuário. Instrutores deixam de consultar diretamente as tabelas completas de alunos e matrículas; duas views entregam apenas os campos necessários ao diário de presenças.
- **Migração aplicada pelo usuário:** `20261006000000_instructor_scope_and_student_roster.sql` foi executada no SQL Editor. A conferência dos acessos com contas reais de instrutor e administração continua pendente.

**Terceira entrega de desenvolvimento preparada:**

- **Fase 2.2:** `20261007000000_atomic_attendance.sql` cria `salvar_chamada`, que valida o usuário, a turma, a lista completa de matrículas elegíveis e todas as marcações antes de gravar presenças e concluir a aula numa transação. Índices únicos impedem duplicatas por matrícula/aula e por turma/data. Repetir a operação atualiza os registros existentes.
- **Interface:** o diário abre sem presumir presença; a pessoa marca todos os alunos antes de salvar. A página faz uma única chamada RPC e exibe o erro se o banco rejeitar a operação.
- **Migração aplicada pelo usuário:** após adaptar a consolidação ao campo `deleted_at`, `20261007000000_atomic_attendance.sql` foi executada com sucesso no SQL Editor. A conferência da chamada e do reenvio com contas de administração e instrutor continua pendente.
- **Correção da migração:** o banco possui um trigger de exclusão lógica em `presencas` que cancela o `DELETE`. A migração marca cópias iguais com `deleted_at`, mantém o arquivo de auditoria e aplica a unicidade somente aos registros ativos. As consultas da aplicação também ignoram presenças marcadas como excluídas.
- **Ajuste RLS aplicado pelo usuário:** o painel de segurança apontou `alunos_diario` e `matriculas_diario` como views com `SECURITY DEFINER`. `20261008000000_invoker_daily_views.sql` substituiu as duas por views `security_invoker`, com funções que validam o papel e a atribuição do instrutor e retornam somente as colunas necessárias. Conferir se os avisos desapareceram e se os perfis acessam apenas seus dados continua pendente.

**Quarta entrega de desenvolvimento preparada — Fase 2.3:**

- `20261009000000_atomic_user_management.sql` cria uma RPC transacional para aprovar, rejeitar, excluir, acrescentar ou retirar cargos e atualizar o vínculo de instrutor. A função valida o administrador, impede alterar o próprio acesso, verifica conflitos de vínculo e registra cada ação em `user_access_audit`.
- A página de usuários passa a usar apenas a RPC para essas ações. Foram removidos os fallbacks de alteração direta e o vínculo de instrutor por correspondência automática de e-mail. O cadastro passa a depender do trigger existente que cria `profiles`.
- A migração bloqueia alterações diretas nos campos administrativos de `profiles`, retira permissões de escrita direta em `user_roles` e revoga a execução das RPCs antigas pelos usuários autenticados.
- **Migração aplicada pelo usuário:** `20261009000000_atomic_user_management.sql` foi executada com sucesso no SQL Editor. Ainda falta conferir aprovação, rejeição, mudança de cargo, vínculo de instrutor e exclusão com contas reais; o retorno de sucesso da execução SQL não confirma esses fluxos.

**Próximas prioridades:** concluir as conferências das fases 1 e 2; documentar as regras operacionais da Fase 0; então iniciar a situação única da matrícula na Fase 3.

**Preparação da Fase 3:** o comportamento atual de matrícula, liberação, pagamento, repasse e acesso foi registrado em `regras_operacionais_pendentes.md`, junto das decisões que precisam de confirmação operacional. Na tela de matrículas, a soma de `valor_final` deixou de ser apresentada como receita mensal estimada, pois os planos têm períodos diferentes.

**Fase 3.1 em desenvolvimento:** a regra confirmada exige mensalidade integralmente paga para ativar e liberar a matrícula. Mensalidade vencida e não quitada gera inadimplência e bloqueia a chamada. A migração `20261010000000_monthly_payment_enrollment.sql` e as telas de matrículas e pagamentos foram preparadas; a migração ainda precisa ser aplicada ao banco. A geração de mensalidades futuras e o histórico de cobrança permanecem na Fase 3.3.

### Matriz de acesso desta entrega

| Recurso | Administração | Instrutor |
|---|---|---|
| Alunos e matrículas completos | Acesso conforme políticas administrativas existentes | Sem leitura direta |
| `alunos_diario` | Usa a tabela completa | ID e nome de alunos matriculados em turma atribuída |
| `matriculas_diario` | Usa a tabela completa | ID, aluno, turma, situação e liberação para aula |
| Turmas | Acesso conforme política administrativa | Turma própria ou com aula atribuída |
| Instrutores | Acesso conforme política administrativa | Somente o próprio cadastro |
| Aulas | Acesso conforme política administrativa | Lê e altera aulas de turma própria ou atribuídas a si; cria somente na turma própria e em nome próprio |
| Presenças | Acesso conforme política administrativa | Gerencia registros vinculados a matrícula da turma própria ou de aula atribuída na data |

## Prioridades e sequência

| Prioridade | Entrega | Resultado esperado |
|---|---|---|
| **P0.1** | Recuperar a versão atual e corrigir indicadores fictícios | Sistema utilizável e painéis confiáveis |
| **P0.2** | Proteger dados e tornar gravações críticas consistentes | Acesso adequado e menos erros silenciosos |
| **P0.3** | Definir e implementar regras de matrícula, aula e cobrança | Uma situação correta para cada aluno |
| **P0.4** | Criar a fila operacional da equipe | Pendências com responsável e próximo passo |
| **P0.5** | Gerar cobranças por competência | Menos lançamentos e conferências manuais |
| **P0.6** | Abrir “Minha situação” para associado e responsável | Consulta recorrente sem depender da secretaria |
| **P1** | Melhorar captação, atendimento, avisos, faltas e reposições | Jornadas completas e histórico das ações |
| **P2/P3** | Eventos, pesquisas, documentos, benefícios e demais áreas comunitárias | Expansão conforme uso e necessidade reais |

## Fase 0 — Decisões operacionais que destravam o trabalho

Antes das mudanças de regra, realizar sessões curtas com secretaria, coordenação, instrutores e tesouraria para fechar quatro definições. O resultado deve ser uma tabela de regras que a equipe consiga consultar.

1. **Matrícula:** quando começa, quando termina, o que significa `ATIVA`, quando pode ser suspensa, bloqueada ou cancelada e quem pode autorizar uma exceção.
2. **Cobrança:** o que o valor do plano representa, quais competências devem ser geradas, quando um débito fica vencido, como registrar desconto, bolsa, pagamento parcial, estorno e negociação.
3. **Repasse:** base de cálculo, percentual ou regra por instrutor, competência, tratamento de reposições e quem aprova o fechamento.
4. **Acesso:** quais dados cada função precisa ver; como responsável e aluno menor de idade se vinculam; quem pode consultar observações médicas.

**Entrega:** regras documentadas com exemplos reais e responsáveis pela aprovação. **Dependência:** participação da operação. Esta fase pode ocorrer em paralelo às correções de compilação e dos painéis.

## Fase 1 — Corrigir o que compromete o uso atual

### 1.1 Recuperar a versão executável — P0

- Corrigir as declarações duplicadas em `src/lib/store.ts` e os campos duplicados em `src/pages/LeadsPage.tsx`, preservando as alterações locais intencionais.
- Conferir as jornadas essenciais: entrar, cadastrar aluno, criar matrícula, registrar chamada e dar baixa em pagamento.
- Estabelecer a compilação como condição para integrar novas alterações.

**Concluído quando:** a aplicação compila e as cinco jornadas essenciais podem ser percorridas. O estado atual desses arquivos deve ser tratado como trabalho em andamento; as duplicações já existiam antes da elaboração deste plano.

### 1.2 Remover indicadores demonstrativos — P0

- Localizar todos os números fixos, aleatórios e dados de exemplo apresentados como métricas nos cinco painéis.
- Substituir cada um por cálculo rastreável ou por um estado explícito: “Ainda não há dados para este indicador”.
- Mostrar período e definição nos indicadores que permanecerem.
- Retirar NPS, satisfação e desempenho de canais até existir coleta real.

**Concluído quando:** nenhum painel operacional mostra um número que não possa ser explicado a partir de registros reais.

### 1.3 Corrigir erros silenciosos de leitura — P0

- Alterar `getAll` e `useTable` para distinguir **lista vazia**, **carregamento** e **falha de consulta**.
- Oferecer mensagem e ação de tentar novamente nas páginas.
- Identificar consultas que carregam tabelas inteiras; começar a paginação e os filtros no banco pelas listas que crescerem mais.

**Concluído quando:** uma falha do Supabase não aparece como “nenhum registro encontrado”.

## Fase 2 — Segurança e consistência das operações

### 2.1 Restringir dados por função — P0

- Criar uma matriz de acesso por tabela e campo.
- Aplicar as restrições no banco: instrutor acessa suas turmas e somente os dados dos alunos necessários à aula.
- Separar observações médicas e outros dados sensíveis das consultas genéricas.
- Revisar leitura, inserção, alteração e exclusão de presenças e aulas para que a atribuição à turma seja verificada no banco.
- Adaptar as telas aos dados que cada função pode consultar.

**Concluído quando:** consultar diretamente o Supabase com uma conta de instrutor não revela alunos ou turmas fora de sua atribuição.

### 2.2 Tornar chamada e aula uma operação consistente — P0

- Criar uma operação única no banco para salvar a chamada e atualizar a aula.
- Impedir presença duplicada para a mesma matrícula e aula.
- Mostrar falha por inteiro se a gravação não puder ser concluída.
- Revisar o padrão “todos presentes” ao abrir uma chamada, para evitar registros acidentais.

**Concluído quando:** uma chamada salva ou falha integralmente, e reabrir ou salvar novamente não duplica presenças.

### 2.3 Unificar a gestão de usuários — P0

- Fazer aprovação, rejeição, mudança de papel e exclusão passarem por operações de servidor com verificação de autorização.
- Remover os caminhos alternativos de alteração direta pelo navegador quando uma RPC falha.
- Garantir que exclusão da conta, perfil e papéis produzam um único resultado confirmado.
- Registrar quem executou mudanças de acesso.

**Concluído quando:** nenhuma ação informa sucesso após uma alteração parcial de permissões.

## Fase 3 — Consolidar matrícula e financeiro

### 3.1 Criar uma situação única da matrícula — P0

- Formalizar as transições: pendente, ativa, suspensa, bloqueada, cancelada e encerrada.
- Definir como vigência, pagamento e liberação para aula se relacionam.
- Registrar motivo, responsável e data para bloqueios e liberações excepcionais.
- Impedir combinações inválidas e revisar registros antigos antes de aplicar a regra.
- Ajustar a tela para mostrar **situação atual**, **motivo** e **próxima ação**.

**Concluído quando:** secretaria e instrutor recebem a mesma resposta sobre se o aluno pode frequentar uma aula.

### 3.2 Unificar os cálculos financeiros — P0

- Definir uma fonte comum para receita recebida, receita prevista, inadimplência e repasse.
- Alinhar a página financeira, os painéis e as views/RPCs já existentes.
- Separar competência do pagamento, data do recebimento e data de vencimento.
- Identificar lançamentos que não possam ser associados com segurança a uma matrícula ou modalidade; colocá-los em uma fila de correção, sem atribuição presumida.
- Exibir o período e permitir navegar até os lançamentos que formam cada total.

**Concluído quando:** o mesmo período e a mesma definição apresentam o mesmo valor em todas as telas.

### 3.3 Gerar cobranças por competência — P0

- Gerar os lançamentos previstos de acordo com o plano e a matrícula.
- Garantir que executar o processo novamente não crie duplicatas.
- Calcular vencimento pelo calendário e identificar atrasos sem exigir mudança manual de status.
- Preservar ajustes, descontos, isenções e pagamentos parciais conforme as regras aprovadas.
- Criar uma lista de cobrança com valor, atraso, responsável pelo contato e último retorno.

**Concluído quando:** a equipe não precisa criar manualmente cada mensalidade comum e consegue identificar todos os vencidos a partir da data registrada. Esta entrega não pressupõe integração com banco ou emissão automática de cobrança.

## Fase 4 — Transformar dados em trabalho organizado

### 4.1 Fila operacional — P0

Começar com quatro tipos de pendência:

- matrícula aguardando decisão;
- cobrança vencida;
- aula prevista sem chamada;
- interessado aguardando retorno.

Cada item terá **responsável, prazo, estado, link para o registro e histórico da resolução**. Regras de geração e encerramento devem evitar tarefas duplicadas.

**Concluído quando:** a equipe consegue iniciar o dia por uma lista priorizada e registrar o que fez. O painel inicial passa a destacar essa fila, com poucos indicadores de apoio.

### 4.2 Matrícula guiada — P1

- Reunir identificação do aluno, escolha de turma, plano, revisão financeira e liberação em um fluxo.
- Mostrar vagas e restrições antes da confirmação.
- Reaproveitar dados existentes e mostrar pendências após salvar.
- Coletar dados adicionais somente quando necessários ao processo.

**Concluído quando:** uma matrícula comum pode ser finalizada sem alternar entre várias páginas para descobrir a próxima etapa.

## Fase 5 — Acesso do associado

### 5.1 Identidade e vínculo familiar — P0

- Criar o acesso do associado ou responsável com aprovação ou verificação compatível com o cadastro existente.
- Relacionar responsável a um ou mais alunos, especialmente menores de idade.
- Definir quem pode ver e atualizar cada dado.
- Impedir que um usuário consulte matrículas, pagamentos ou dados pessoais de outra família.

**Concluído quando:** um responsável vê somente os alunos aos quais está vinculado.

### 5.2 “Minha situação” — P0

Primeira versão:

- próximas aulas e horários;
- situação da matrícula e eventual pendência;
- pagamentos previstos, vencidos e recebidos;
- avisos de suas turmas;
- canal para pedir correção de uma informação.

A versão deve funcionar bem no telefone e explicar os estados em linguagem comum.

**Concluído quando:** um associado consegue responder sozinho “quando é a aula?”, “minha matrícula está ativa?” e “há algo a pagar?”. Esse é o primeiro teste concreto de utilidade recorrente.

## Fase 6 — Jornadas completas de relacionamento

### 6.1 Interessado até matrícula — P1

- Vincular o interessado ao aluno criado e, depois, à matrícula.
- Separar etapas como novo contato, retorno marcado, aula experimental, matrícula e perda.
- Registrar responsável, próxima data de contato e motivo de perda.
- Fazer a conversão como operação consistente, evitando aluno duplicado.
- Medir conversão por **matrícula concluída**, com período e origem definidos.

**Concluído quando:** a equipe sabe quem precisa de retorno e consegue explicar quantos contatos realmente viraram matrículas.

### 6.2 Atendimento com protocolo — P1

- Permitir abertura de solicitações por associado e por funcionário em nome de alguém.
- Registrar categoria, descrição, responsável, prazo, andamento, resposta e conclusão.
- Exibir histórico para o associado e fila de atraso para gestores.
- Começar com poucas categorias baseadas nos atendimentos mais frequentes.

**Concluído quando:** uma demanda pode ser acompanhada sem procurar mensagens em vários canais.

### 6.3 Avisos por turma — P1

- Publicar alteração ou aviso para os inscritos em determinada turma.
- Registrar autor, horário, público e conteúdo da publicação.
- Exibir o aviso em “Minha situação”.
- Acrescentar entrega por mensagem ou notificação somente após definir consentimento, canal e rotina de envio.

**Concluído quando:** uma alteração de aula tem uma publicação única que a secretaria e o associado conseguem consultar.

## Fase 7 — Automatizar retenção e calendário

### 7.1 Faltas e acompanhamento — P1

- Definir com a coordenação o período e o número de **faltas consecutivas** que exigem contato.
- Calcular por turma e matrícula, distinguindo aula cancelada e ausência não registrada.
- Gerar tarefa, registrar contato, resultado e eventual novo prazo.
- Medir quantos casos receberam retorno e o que aconteceu depois.

**Concluído quando:** cada alerta representa um caso real, tem responsável e pode ser encerrado com histórico.

### 7.2 Cancelamento e reposição de aula — P1

- Relacionar a aula cancelada à reposição.
- Acompanhar quem precisa escolher nova data e quais alunos devem ser avisados.
- Registrar realização e presença da reposição.
- Mostrar pendências no painel da coordenação.

**Concluído quando:** a equipe consegue saber quais aulas ainda exigem reposição sem usar uma lista paralela.

## Fase 8 — Expandir conforme demanda comprovada

| Área | Condição para iniciar | MVP |
|---|---|---|
| **Eventos e inscrições — P2** | Eventos frequentes com inscrição, limite de vagas e listas mantidas fora do sistema | Evento, vagas, inscrição e presença |
| **Documentos — P2** | Alto volume de pedidos ou entrega recorrente de documentos | Solicitar, anexar ou disponibilizar documento com controle de acesso |
| **Pesquisas — P2** | Decisão concreta que dependa de ouvir associados | Pesquisa curta, período definido e resultado agregado |
| **Transparência e relatórios comunitários — P2** | Dados administrativos confiáveis e definição do que deve ser publicado | Página com poucos indicadores e documentos aprovados pela diretoria |
| **Benefícios e parceiros — P3** | Programa existente, regras claras e responsável por mantê-lo | Catálogo simples com validade e condições |
| **Automação de mensagens e integrações — P3** | Fluxos internos estáveis e necessidade demonstrada de escala | Um tipo de aviso, com consentimento e acompanhamento de falhas |

**IA, chatbot, gamificação e mapas ficam fora da implementação planejada.** Reavaliar cada um apenas diante de um problema medido que as jornadas acima não resolvam adequadamente.

## Como organizar a execução

Dividir o trabalho em entregas pequenas, seguindo a ordem de prioridade. Cada entrega só avança quando cumprir quatro critérios:

1. **Regra aprovada pela área responsável.**
2. **Dados e permissões corretos no banco e na interface.**
3. **Estados de carregamento, ausência de dados e erro compreensíveis.**
4. **Resultado observável:** uma tarefa a menos, uma consulta resolvida pelo associado ou uma decisão administrativa baseada em registros reais.

Após as fases P0, medir **tempo para matricular**, **lançamentos manuais por mês**, **cobranças vencidas sem ação**, **chamadas pendentes**, **consultas resolvidas pelo próprio associado** e **solicitações concluídas dentro do prazo**. Esses números mostram se o Movi+ está reduzindo trabalho e se tornou útil para a comunidade; a quantidade de gráficos ou acessos isolados não mostra isso.

**Primeira entrega concreta:** recuperar a compilação, remover os indicadores demonstrativos e definir a matriz de acesso. Isso abre caminho para trabalhar nas regras de matrícula e cobrança com uma base confiável.
