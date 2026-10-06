# Regras operacionais a definir antes da Fase 3

## Decisão confirmada para matrícula e inadimplência

- A taxa de matrícula, mesmo paga, não ativa a matrícula.
- A matrícula fica ativa e o aluno é liberado para aula após a quitação integral de uma mensalidade vinculada à matrícula.
- Uma mensalidade vinculada que ultrapassou o vencimento sem quitação integral coloca a matrícula em inadimplência e bloqueia a chamada. O atraso começa no dia seguinte ao vencimento, sem carência.
- Quando todas as mensalidades vencidas estiverem quitadas, a matrícula volta a ficar ativa, desde que exista uma mensalidade integralmente paga. Estados administrativos como cancelamento e suspensão continuam impedindo a chamada.
- A cobrança depende de um lançamento de mensalidade registrado e vinculado à matrícula. A geração automática das próximas competências e o acompanhamento dos contatos de cobrança pertencem à Fase 3.3.

Este documento distingue o comportamento atual do sistema das decisões que a secretaria, coordenação e tesouraria precisam confirmar. As descrições abaixo não autorizam a implantação de novas regras financeiras ou de bloqueio.

| Tema | Comportamento atual observado | Decisão necessária |
|---|---|---|
| Início e fim da matrícula | A nova matrícula começa em `PENDENTE_LIBERACAO`; a tela calcula o fim a partir da data de início e do plano mensal, trimestral ou anual. Suspensão e trancamento somam 30 dias ao cálculo. | O plano representa vigência, pacote de cobrança ou ambos? A data de início é a contratação ou a primeira aula? Suspensão sempre prorroga a vigência? |
| Liberação para aula | O botão de liberação marca `liberado_para_aula = true` e muda o status para `ATIVA`. Ao revogar, desmarca a liberação, mas conserva `ATIVA`. A chamada inclui matrícula `ATIVA` liberada ou `EXPERIMENTAL` em turma que permite experimental. | Quais condições permitem ativar e liberar? Revogação deve mudar o status? Quem autoriza exceções e como o motivo fica registrado? |
| Estados da matrícula | A tela aceita `PENDENTE_LIBERACAO`, `ATIVA`, `SUSPENSA_30_DIAS`, `TRANCADA_JUSTIFICADA`, `BLOQUEADA_INADIMPLENCIA`, `EXPERIMENTAL`, `CANCELADA` e `CONCLUIDA`. Não há transições obrigatórias no banco. | Definir transições permitidas, situação de fim de vigência e efeito de inadimplência, cancelamento e trancamento sobre a frequência. |
| Valor da matrícula | `valor_final` é editável; a tela somava todos os planos ativos e chamava o resultado de receita mensal estimada. O rótulo foi corrigido para indicar apenas a soma dos valores finais. | O valor é mensal, total do plano ou negociado por competência? Como bolsas, descontos e cortesias alteram esse valor? |
| Pagamento | O lançamento é criado manualmente com mês e ano de referência, vencimento, valor previsto e valor pago. A baixa rápida marca `PAGO` e usa o valor previsto quando não há valor pago. O estado `ATRASADO` depende de marcação manual. | Quando gerar cobranças? Qual dia vence? Aceitam-se pagamentos parciais, isenção, estorno e negociação? Quando um débito passa a vencido e quando bloqueia a aula? |
| Repasse de instrutor | A tela financeira usa apenas mensalidades pagas como base, mas a regra de percentual, competência e aprovação ainda não está consolidada. | Qual percentual ou valor se aplica por instrutor? Reposição, bolsa e pagamento parcial entram no repasse? Quem aprova o fechamento? |
| Acesso de responsável e dados sensíveis | O acesso do instrutor foi limitado ao diário e aos campos mínimos. Ainda não há vínculo familiar e regra completa para consultas de responsável e aluno menor de idade. | Quem pode ver dados médicos, financeiros e avisos de cada aluno? Como o vínculo do responsável é confirmado? |

## Primeira decisão para destravar a implementação

Definir o significado de `ATIVA` e de `liberado_para_aula` com três exemplos reais: matrícula normal aguardando pagamento, matrícula paga dentro da vigência e matrícula com pagamento vencido. Com isso, a Fase 3 pode implementar transições válidas e uma resposta única sobre frequência, sem presumir a regra financeira do MCJB.
