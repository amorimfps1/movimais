import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  DollarSign, GraduationCap, Users,
  Download, CreditCard, Sparkles,
  PieChart as PieChartIcon, BarChart3, Wallet,
  Calendar, Filter, Loader2
} from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORES, type Pagamento, type Matricula, type Modalidade, type Turma, type Instrutor } from "@/lib/store";
import { useTable } from "@/hooks/useTable";
import { maskDate, parseBRDateToISO } from "@/lib/utils";
import {
  ModalidadeRevenueSchema,
  ProfessorRepasseSchema,
  ModalidadeMatriculasSchema,
  type ModalidadeRevenue,
  type ProfessorRepasse,
  type ModalidadeMatriculas
} from "@/types/financeiro";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const COLORS = {
  primary: "hsl(0, 65%, 48%)",
  emerald: "#10b981",
  amber: "#f59e0b",
  sky: "#0ea5e9",
  purple: "#8b5cf6",
  indigo: "#6366f1",
  teal: "#14b8a6",
  pink: "#ec4899",
  orange: "#f97316",
};

const PALETTE = [
  COLORS.emerald, COLORS.sky, COLORS.purple, COLORS.amber,
  COLORS.indigo, COLORS.pink, COLORS.teal, COLORS.orange, COLORS.primary
];

// Tooltip estilizado para gráficos monetários e de contagem
const CustomFinancialTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const rawTitle = payload[0]?.payload?.labelCompleto || payload[0]?.payload?.nome || payload[0]?.payload?.nome_modalidade || payload[0]?.payload?.nome_instrutor || label;

  return (
    <div className="bg-zinc-950/95 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[180px] z-50">
      <p className="font-bold text-white border-b border-white/15 pb-1 mb-1.5 text-xs tracking-wide">
        {rawTitle}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const isCurrency = typeof entry.value === "number" && entry.dataKey !== "matriculas" && entry.dataKey !== "matriculas_ativas" && entry.dataKey !== "total_alunos_ativos" && entry.dataKey !== "count";
          const formattedVal = isCurrency
            ? `R$ ${Number(entry.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : `${entry.value} ${entry.dataKey === "percentual" ? "%" : "matrículas"}`;

          const name = entry.name || entry.dataKey;
          const color = entry.color || entry.fill || COLORS.emerald;

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3 text-white">
              <span className="flex items-center gap-1.5 font-medium text-zinc-200">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span>{name}:</span>
              </span>
              <span className="font-bold text-white tracking-tight">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function FinanceiroPage() {
  const { data: pagamentos, loading: loadingPag } = useTable<Pagamento>(STORES.PAGAMENTOS);
  const { data: matriculas, loading: loadingMat } = useTable<Matricula>(STORES.MATRICULAS);
  const { data: modalidades, loading: loadingMod } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: turmas, loading: loadingTur } = useTable<Turma>(STORES.TURMAS);
  const { data: instrutores, loading: loadingInst } = useTable<Instrutor>(STORES.INSTRUTORES);


  // Estados de filtro
  const [periodoFiltro, setPeriodoFiltro] = useState<"mes_atual" | "3m" | "6m" | "12m" | "personalizado" >("mes_atual");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"modalidades" | "professores">("modalidades");

  const currentDate = useMemo(() => new Date(), []);
  const anoAtual = currentDate.getFullYear();
  const mesAtual = currentDate.getMonth() + 1; // 1-12

  // Dicionários para busca em tempo O(1)
  const modalidadesMap = useMemo(() => new Map(modalidades.map(m => [m.id, m])), [modalidades]);
  const turmasMap = useMemo(() => new Map(turmas.map(t => [t.id, t])), [turmas]);
  const instrutoresMap = useMemo(() => new Map(instrutores.map(i => [i.id, i])), [instrutores]);
  const matriculasMap = useMemo(() => new Map(matriculas.map(m => [m.id, m])), [matriculas]);

  // Parser padronizado e tolerante a falhas de pagamentos
  const parsePayment = useCallback((p: Pagamento) => {
    let mes = p.mes_referencia != null ? Number(p.mes_referencia) : NaN;
    let ano = p.ano_referencia != null ? Number(p.ano_referencia) : NaN;
    let dateISO = "";

    // Tenta extrair data válida a partir dos campos disponíveis
    const rawDateStr = p.data_pagamento || p.data_vencimento || (p as any).created_at;
    if (rawDateStr) {
      dateISO = String(rawDateStr).split("T")[0];
      const parts = dateISO.split("-");
      if (parts.length >= 2) {
        if (isNaN(ano)) ano = parseInt(parts[0], 10);
        if (isNaN(mes)) mes = parseInt(parts[1], 10);
      }
    }

    // Se ainda não tiver dateISO mas tiver ano e mês válidos
    if (!dateISO && !isNaN(ano) && !isNaN(mes) && mes >= 1 && mes <= 12) {
      dateISO = `${ano}-${String(mes).padStart(2, "0")}-01`;
    }

    const rawStatus = String(p.status_pagamento || "").trim().toUpperCase();
    const rawTipo = String(p.tipo_lancamento || "MENSALIDADE").trim().toUpperCase();
    const valorPagoNum = Number(p.valor_pago) || 0;
    const valorPrevistoNum = Number(p.valor_previsto) || 0;

    // Status flexível: cobre PAGO, LIQUIDADO, CONCLUIDO, RECEBIDO ou qualquer registro com valor pago positivo
    const isPago = rawStatus === "PAGO" || rawStatus === "LIQUIDADO" || rawStatus === "CONCLUIDO" || rawStatus === "RECEBIDO" || (valorPagoNum > 0 && rawStatus !== "ESTORNADO" && rawStatus !== "CANCELADO");
    const valor = valorPagoNum > 0 ? valorPagoNum : (isPago ? (valorPrevistoNum || 0) : 0);
    
    // Identificação de categoria do lançamento
    const isTaxaMatricula = rawTipo.includes("MATRICULA") || rawTipo === "TAXA_MATRICULA";
    const isMensalidade = !isTaxaMatricula && (rawTipo.includes("MENSAL") || rawTipo === "MENSALIDADE" || !p.tipo_lancamento);

    return {
      mes,
      ano,
      dateISO,
      status: rawStatus,
      tipo: rawTipo,
      isPago,
      valor,
      valorPrevisto: valorPrevistoNum || valorPagoNum || 0,
      isMensalidade,
      isTaxaMatricula,
    };
  }, []);

  // Resolução relacional da matrícula correspondente a um pagamento
  const resolveMatricula = useCallback((p: Pagamento) => {
    if (p.id_matricula && matriculasMap.has(p.id_matricula)) {
      return matriculasMap.get(p.id_matricula);
    }
    if (p.id_aluno) {
      const ativas = matriculas.filter(m => m.id_aluno === p.id_aluno && m.status_matricula === "ATIVA");
      if (ativas.length > 0) return ativas[0];
      return matriculas.find(m => m.id_aluno === p.id_aluno);
    }
    return undefined;
  }, [matriculasMap, matriculas]);

  // Resolução relacional de modalidade
  const resolveModalidadeId = useCallback((p: Pagamento, mat?: Matricula) => {
    if (mat?.id_modalidade) return mat.id_modalidade;
    if (mat?.id_turma) {
      const t = turmasMap.get(mat.id_turma);
      if (t?.id_modalidade) return t.id_modalidade;
    }
    if (p.id_aluno) {
      const alunoMats = matriculas.filter(m => m.id_aluno === p.id_aluno);
      for (const m of alunoMats) {
        if (m.id_modalidade) return m.id_modalidade;
        if (m.id_turma) {
          const t = turmasMap.get(m.id_turma);
          if (t?.id_modalidade) return t.id_modalidade;
        }
      }
    }
    return null;
  }, [turmasMap, matriculas]);

  // Resolução relacional de instrutor responsável (prioridade: Turma -> Modalidade -> Especialidade)
  const resolveInstrutorId = useCallback((p: Pagamento, mat?: Matricula) => {
    // 1. Diretamente pela turma vinculada à matrícula
    if (mat?.id_turma) {
      const t = turmasMap.get(mat.id_turma);
      if (t?.id_instrutor && instrutoresMap.has(t.id_instrutor)) {
        return t.id_instrutor;
      }
    }

    // 2. Pela modalidade da matrícula através das turmas ativas
    const modId = resolveModalidadeId(p, mat);
    if (modId) {
      const turmaComInst = turmas.find(t => t.id_modalidade === modId && t.id_instrutor);
      if (turmaComInst?.id_instrutor && instrutoresMap.has(turmaComInst.id_instrutor)) {
        return turmaComInst.id_instrutor;
      }

      // 3. Pela lista de modalidades do instrutor
      const instMod = instrutores.find(i => i.id_modalidades?.includes(modId));
      if (instMod) return instMod.id;

      // 4. Por especialidade nominal do instrutor
      const modObj = modalidadesMap.get(modId);
      if (modObj?.nome_modalidade) {
        const modNomeNorm = modObj.nome_modalidade.toLowerCase().trim();
        const instEsp = instrutores.find(i =>
          i.especialidades?.some(e => {
            const eNorm = e.toLowerCase().trim();
            return eNorm.includes(modNomeNorm) || modNomeNorm.includes(eNorm);
          })
        );
        if (instEsp) return instEsp.id;
      }
    }

    return null;
  }, [resolveModalidadeId, turmasMap, instrutoresMap, turmas, instrutores, modalidadesMap]);

  // Filtragem de pagamentos por período
  const pagamentosFiltrados = useMemo(() => {
    return pagamentos.filter(p => {
      const info = parsePayment(p);
      if (!info.isPago) return false;

      // Filtro Mês Atual (competência ou pagamento no mês corrente)
      if (periodoFiltro === "mes_atual") {
        return info.ano === anoAtual && info.mes === mesAtual;
      }

      // Filtro Últimos 3 Meses (janela móvel de 3 meses até o mês atual)
      if (periodoFiltro === "3m") {
        if (isNaN(info.ano) || isNaN(info.mes)) return false;
        const diffMeses = (anoAtual - info.ano) * 12 + (mesAtual - info.mes);
        return diffMeses >= 0 && diffMeses < 3;
      }

      // Filtro Últimos 6 Meses (janela móvel de 6 meses até o mês atual)
      if (periodoFiltro === "6m") {
        if (isNaN(info.ano) || isNaN(info.mes)) return false;
        const diffMeses = (anoAtual - info.ano) * 12 + (mesAtual - info.mes);
        return diffMeses >= 0 && diffMeses < 6;
      }

      // Filtro Último Ano (12 meses móveis até o mês atual)
      if (periodoFiltro === "12m") {
        if (isNaN(info.ano) || isNaN(info.mes)) return false;
        const diffMeses = (anoAtual - info.ano) * 12 + (mesAtual - info.mes);
        return diffMeses >= 0 && diffMeses < 12;
      }

      // Filtro Personalizado (intervalo de datas customizado DD/MM/YYYY)
      if (periodoFiltro === "personalizado") {
        if (!info.dateISO) return false;
        const isoInicio = parseBRDateToISO(dataInicio);
        const isoFim = parseBRDateToISO(dataFim);
        if (isoInicio && info.dateISO < isoInicio) return false;
        if (isoFim && info.dateISO > isoFim) return false;
        return true;
      }

      // Todo o histórico
      return true; // geral
    });
  }, [pagamentos, periodoFiltro, anoAtual, mesAtual, dataInicio, dataFim, parsePayment]);

  // Rótulo textual do período selecionado
  const periodoLabel = useMemo(() => {
    switch (periodoFiltro) {
      case "mes_atual":
        return `Mês Atual (${MESES[mesAtual - 1]}/${anoAtual})`;
      case "3m":
        return "Últimos 3 Meses";
      case "6m":
        return "Últimos 6 Meses";
      case "12m":
        return "Último Ano (12M)";
      case "personalizado":
        return dataInicio || dataFim
          ? `Personalizado (${dataInicio || "Início"} a ${dataFim || "Hoje"})`
          : "Personalizado (Intervalo Livre)";
      case "geral":
      default:
        return "Todo o Histórico";
    }
  }, [periodoFiltro, mesAtual, anoAtual, dataInicio, dataFim]);

  // ==========================================
  // REGRA 1: ARRECADAÇÃO POR MODALIDADE (Total)
  // Inclui mensalidades, taxas de matrícula e quaisquer outros valores pagos
  // ==========================================
  const arrecadacaoPorModalidade = useMemo((): ModalidadeRevenue[] => {
    const map = new Map<string, {
      total_receita: number;
      total_mensalidades: number;
      total_taxas_matricula: number;
      total_outros: number;
      total_transacoes: number;
      matriculas_ativas: number;
    }>();

    // Inicializa todas as modalidades cadastradas
    modalidades.forEach(m => {
      map.set(m.id, {
        total_receita: 0,
        total_mensalidades: 0,
        total_taxas_matricula: 0,
        total_outros: 0,
        total_transacoes: 0,
        matriculas_ativas: 0,
      });
    });

    // Contabiliza matrículas ativas por modalidade
    matriculas.forEach(mat => {
      if (mat.status_matricula === "ATIVA") {
        let modId = mat.id_modalidade;
        if (!modId && mat.id_turma) {
          modId = turmasMap.get(mat.id_turma)?.id_modalidade || "";
        }
        if (modId && map.has(modId)) {
          map.get(modId)!.matriculas_ativas += 1;
        }
      }
    });

    // Soma os pagamentos liquidados (todas as categorias)
    pagamentosFiltrados.forEach(p => {
      const info = parsePayment(p);
      const mat = resolveMatricula(p);
      const modId = resolveModalidadeId(p, mat);

      if (modId && map.has(modId)) {
        const item = map.get(modId)!;
        item.total_receita += info.valor;
        item.total_transacoes += 1;
        if (info.isMensalidade) {
          item.total_mensalidades += info.valor;
        } else if (info.isTaxaMatricula) {
          item.total_taxas_matricula += info.valor;
        } else {
          item.total_outros += info.valor;
        }
      }
    });

    // Constrói e valida via Zod
    const list: ModalidadeRevenue[] = [];
    map.forEach((vals, modId) => {
      const mod = modalidadesMap.get(modId);
      const rawObj = {
        id_modalidade: modId,
        nome_modalidade: mod?.nome_modalidade || "Modalidade Avulsa",
        area: mod?.area || "Geral",
        total_receita: Number(vals.total_receita.toFixed(2)),
        total_mensalidades: Number(vals.total_mensalidades.toFixed(2)),
        total_taxas_matricula: Number(vals.total_taxas_matricula.toFixed(2)),
        total_outros: Number(vals.total_outros.toFixed(2)),
        total_transacoes: vals.total_transacoes,
        matriculas_ativas: vals.matriculas_ativas,
      };

      const parsed = ModalidadeRevenueSchema.safeParse(rawObj);
      if (parsed.success) {
        list.push(parsed.data);
      } else {
        list.push(rawObj);
      }
    });

    return list.sort((a, b) => b.total_receita - a.total_receita);
  }, [modalidades, matriculas, pagamentosFiltrados, turmasMap, resolveMatricula, resolveModalidadeId, modalidadesMap, parsePayment]);

  // ==========================================
  // REGRA 2: REPASSE POR PROFESSOR (INSTRUTOR)
  // REGRA DE OURO: Inclui APENAS pagamentos com tipo_lancamento = 'MENSALIDADE'.
  // Taxas de matrícula, material, etc., são EXCLUÍDAS da conta do professor!
  // ==========================================
  const repassePorProfessor = useMemo((): ProfessorRepasse[] => {
    const map = new Map<string, {
      total_mensalidades: number;
      total_taxas_excluidas: number;
      turmas_ids: Set<string>;
      alunos_ativos_ids: Set<string>;
      mensalidades_count: number;
    }>();

    // Inicializa todos os instrutores
    instrutores.forEach(inst => {
      map.set(inst.id, {
        total_mensalidades: 0,
        total_taxas_excluidas: 0,
        turmas_ids: new Set(),
        alunos_ativos_ids: new Set(),
        mensalidades_count: 0,
      });
    });

    // Mapeia turmas de cada instrutor
    turmas.forEach(t => {
      if (t.id_instrutor && map.has(t.id_instrutor)) {
        map.get(t.id_instrutor)!.turmas_ids.add(t.id);
      }
    });

    // Mapeia alunos ativos atribuídos ao instrutor (por turma ou por modalidade)
    matriculas.forEach(mat => {
      if (mat.status_matricula === "ATIVA") {
        const dummyPayment: Pagamento = { id: "", id_aluno: mat.id_aluno, id_matricula: mat.id } as any;
        const idInstrutor = resolveInstrutorId(dummyPayment, mat);
        if (idInstrutor && map.has(idInstrutor) && mat.id_aluno) {
          map.get(idInstrutor)!.alunos_ativos_ids.add(mat.id_aluno);
        }
      }
    });

    // Processa pagamentos atribuídos a cada instrutor
    pagamentosFiltrados.forEach(p => {
      const info = parsePayment(p);
      const mat = resolveMatricula(p);
      const idInstrutor = resolveInstrutorId(p, mat);

      if (idInstrutor && map.has(idInstrutor)) {
        const instData = map.get(idInstrutor)!;
        if (info.isMensalidade) {
          // REGRA DE OURO: Apenas MENSALIDADE entra no repasse
          instData.total_mensalidades += info.valor;
          instData.mensalidades_count += 1;
        } else {
          // Taxa de matrícula, material, etc., são retidas pela escola e registradas como não-repassadas
          instData.total_taxas_excluidas += info.valor;
        }
      }
    });

    // Formata e valida com Zod
    const list: ProfessorRepasse[] = [];
    map.forEach((vals, instId) => {
      const inst = instrutoresMap.get(instId);
      const rawObj = {
        id_instrutor: instId,
        nome_instrutor: inst?.nome_completo || "Instrutor Não Informado",
        email: inst?.email || null,
        funcao: inst?.funcao || "Instrutor(a)",
        total_mensalidades_arrecadadas: Number(vals.total_mensalidades.toFixed(2)),
        total_taxas_nao_repassadas: Number(vals.total_taxas_excluidas.toFixed(2)),
        total_turmas: vals.turmas_ids.size,
        total_alunos_ativos: vals.alunos_ativos_ids.size,
        total_mensalidades_pagas_count: vals.mensalidades_count,
      };

      const parsed = ProfessorRepasseSchema.safeParse(rawObj);
      if (parsed.success) {
        list.push(parsed.data);
      } else {
        list.push(rawObj);
      }
    });

    return list.sort((a, b) => b.total_mensalidades_arrecadadas - a.total_mensalidades_arrecadadas);
  }, [instrutores, turmas, matriculas, pagamentosFiltrados, resolveInstrutorId, resolveMatricula, instrutoresMap, parsePayment]);

  // ==========================================
  // DISTRIBUIÇÃO DE MATRÍCULAS ATIVAS POR MODALIDADE (Para Gráfico de Pizza)
  // ==========================================
  const matriculasPorModalidade = useMemo((): ModalidadeMatriculas[] => {
    const totalAtivasGeral = matriculas.filter(m => m.status_matricula === "ATIVA").length;
    const counts: Record<string, { ativas: number; total: number }> = {};

    modalidades.forEach(m => {
      counts[m.id] = { ativas: 0, total: 0 };
    });

    matriculas.forEach(m => {
      let modId = m.id_modalidade;
      if (!modId && m.id_turma) {
        modId = turmasMap.get(m.id_turma)?.id_modalidade || "";
      }
      if (modId) {
        if (!counts[modId]) counts[modId] = { ativas: 0, total: 0 };
        counts[modId].total += 1;
        if (m.status_matricula === "ATIVA") {
          counts[modId].ativas += 1;
        }
      }
    });

    const list: ModalidadeMatriculas[] = [];
    Object.entries(counts).forEach(([modId, data]) => {
      const mod = modalidadesMap.get(modId);
      const percentual = totalAtivasGeral > 0 ? Number(((data.ativas / totalAtivasGeral) * 100).toFixed(1)) : 0;
      const rawObj = {
        id_modalidade: modId,
        nome_modalidade: mod?.nome_modalidade || "Outra",
        area: mod?.area || "Geral",
        matriculas_ativas: data.ativas,
        matriculas_total: data.total,
        percentual,
      };

      const parsed = ModalidadeMatriculasSchema.safeParse(rawObj);
      if (parsed.success) {
        list.push(parsed.data);
      } else {
        list.push(rawObj);
      }
    });

    return list
      .filter(item => item.matriculas_ativas > 0 || item.matriculas_total > 0)
      .sort((a, b) => b.matriculas_ativas - a.matriculas_ativas);
  }, [modalidades, matriculas, turmasMap, modalidadesMap]);

  // ==========================================
  // RESUMO DE KPIS NO TOPO (Consolidado do Período e Mês)
  // ==========================================
  const kpis = useMemo(() => {
    // Pagamentos filtrados no período selecionado (estritamente pagos e liquidados)
    const receitaPeriodo = pagamentosFiltrados.reduce((sum, p) => sum + parsePayment(p).valor, 0);

    const repasseProfessoresPeriodo = pagamentosFiltrados
      .filter(p => parsePayment(p).isMensalidade)
      .reduce((sum, p) => sum + parsePayment(p).valor, 0);

    const taxasMatriculaPeriodo = pagamentosFiltrados
      .filter(p => parsePayment(p).isTaxaMatricula)
      .reduce((sum, p) => sum + parsePayment(p).valor, 0);

    const outrosValoresPeriodo = pagamentosFiltrados
      .filter(p => {
        const info = parsePayment(p);
        return !info.isMensalidade && !info.isTaxaMatricula;
      })
      .reduce((sum, p) => sum + parsePayment(p).valor, 0);


    // Mensalidade base contratada de todas as matrículas ativas (1 mês)
    const receitaPrevistaMensalBase = matriculas
      .filter(m => m.status_matricula === "ATIVA")
      .reduce((sum, m) => sum + (Number(m.valor_final) || 0), 0);

    // Cálculo proporcional da previsão conforme o período selecionado
    let fatorMesesPrevisao = 1;
    let labelPrevisaoPeriodo = "Previsão (Mês Atual)";
    let trendPrevisaoPeriodo = "Base: 1 mês de contratos ativos";

    if (periodoFiltro === "3m") {
      fatorMesesPrevisao = 3;
      labelPrevisaoPeriodo = "Previsão (3 Meses)";
      trendPrevisaoPeriodo = "Projeção de 3 meses contratados";
    } else if (periodoFiltro === "6m") {
      fatorMesesPrevisao = 6;
      labelPrevisaoPeriodo = "Previsão (6 Meses)";
      trendPrevisaoPeriodo = "Projeção de 6 meses contratados";
    } else if (periodoFiltro === "12m") {
      fatorMesesPrevisao = 12;
      labelPrevisaoPeriodo = "Previsão (12 Meses)";
      trendPrevisaoPeriodo = "Projeção anual de contratos ativos";
    } else if (periodoFiltro === "personalizado") {
      const isoInicio = parseBRDateToISO(dataInicio);
      const isoFim = parseBRDateToISO(dataFim);
      if (isoInicio && isoFim) {
        const d1 = new Date(isoInicio);
        const d2 = new Date(isoFim);
        const diffDays = Math.max(1, Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        fatorMesesPrevisao = diffDays / 30.4375;
        labelPrevisaoPeriodo = `Previsão (${diffDays} dias)`;
        trendPrevisaoPeriodo = `Projeção proporcional (~${fatorMesesPrevisao.toFixed(1)} meses)`;
      } else {
        fatorMesesPrevisao = 1;
        labelPrevisaoPeriodo = "Previsão (Personalizado)";
        trendPrevisaoPeriodo = "Base mensal de contratos ativos";
      }
    } 

    const receitaPrevistaPeriodo = Number((receitaPrevistaMensalBase * fatorMesesPrevisao).toFixed(2));

    const pagamentosLiquidadosCount = pagamentosFiltrados.length;
    const mensalidadesPagasCount = pagamentosFiltrados.filter(p => parsePayment(p).isMensalidade).length;

    const matriculasAtivasTotal = matriculas.filter(m => m.status_matricula === "ATIVA").length;

    return {
      receitaPeriodo,
      repasseProfessoresPeriodo,
      taxasMatriculaPeriodo,
      outrosValoresPeriodo,
      pagamentosLiquidadosCount,
      mensalidadesPagasCount,
      matriculasAtivasTotal,
      receitaPrevistaPeriodo,
      labelPrevisaoPeriodo,
      trendPrevisaoPeriodo,
    };
  }, [pagamentosFiltrados, matriculas, periodoFiltro, dataInicio, dataFim, parsePayment]);

  // Gráfico de Receita por Modalidade (Top 8 para visualização limpa)
  const chartModalidadesReceita = useMemo(() => {
    return arrecadacaoPorModalidade.slice(0, 8).map(m => ({
      id: m.id_modalidade,
      nome: m.nome_modalidade,
      receita_total: m.total_receita,
      mensalidades: m.total_mensalidades,
      taxas_extras: m.total_taxas_matricula + m.total_outros,
      matriculas: m.matriculas_ativas,
    }));
  }, [arrecadacaoPorModalidade]);

  // Gráfico de Repasse de Professores (Top 8)
  const chartProfessoresRepasse = useMemo(() => {
    return repassePorProfessor.slice(0, 8).map(p => ({
      id: p.id_instrutor,
      nome: p.nome_instrutor,
      mensalidades_repasse: p.total_mensalidades_arrecadadas,
      taxas_escola: p.total_taxas_nao_repassadas,
      turmas: p.total_turmas,
      alunos: p.total_alunos_ativos,
    }));
  }, [repassePorProfessor]);

  // Exportação de Relatório CSV
  const handleExportCSV = useCallback(() => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `RELATORIO FINANCEIRO CONSOLIDADO - MOVI+ (${periodoLabel.toUpperCase()})\n\n`;

    csvContent += "=== ARRECADACAO POR MODALIDADE ===\n";
    csvContent += "Modalidade,Area,Matriculas Ativas,Total Mensalidades (R$),Taxas Matricula (R$),Outros (R$),Receita Total (R$)\n";
    arrecadacaoPorModalidade.forEach(m => {
      csvContent += `"${m.nome_modalidade}","${m.area || ""}","${m.matriculas_ativas}","${m.total_mensalidades.toFixed(2)}","${m.total_taxas_matricula.toFixed(2)}","${m.total_outros.toFixed(2)}","${m.total_receita.toFixed(2)}"\n`;
    });

    csvContent += "\n=== REPASSE POR PROFESSOR (APENAS MENSALIDADES) ===\n";
    csvContent += "Professor,Turmas,Alunos Ativos,Mensalidades Pagas (Qtd),Base de Repasse Mensalidades (R$),Taxas Retidas(R$)\n";
    repassePorProfessor.forEach(p => {
      csvContent += `"${p.nome_instrutor}","${p.total_turmas}","${p.total_alunos_ativos}","${p.total_mensalidades_pagas_count}","${p.total_mensalidades_arrecadadas.toFixed(2)}","${p.total_taxas_nao_repassadas.toFixed(2)}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard_financeiro_movi_${periodoFiltro}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [arrecadacaoPorModalidade, repassePorProfessor, periodoLabel, periodoFiltro]);

  const isLoading = loadingPag || loadingMat || loadingMod || loadingTur || loadingInst;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Carregando métricas financeiras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Top Header */}
      <PageHeader
        title="Dashboard Financeiro"
        description="Gestão de arrecadação por modalidade, repasses de professores, matrículas e auditoria"
        badge="Coordenação & Secretaria"
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 rounded-xl border-white/10 hover:bg-white/5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </Button>
            <Link to="/pagamentos">
              <Button size="sm" className="text-xs gap-1.5 rounded-xl shadow-md shadow-primary/20">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Lançamentos</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Barra de Filtros de Período */}
      <div className="space-y-3 p-4 rounded-2xl bg-card/60 border border-white/10 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Filtro de Período para Análise:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: "mes_atual", label: `Mês Atual (${MESES[mesAtual - 1]}/${anoAtual})` },
              { key: "3m", label: "Últimos 3 Meses" },
              { key: "6m", label: "Últimos 6 Meses" },
              { key: "12m", label: "Último Ano (12M)" },
              { key: "geral", label: "Todo o Histórico" },
              { key: "personalizado", label: "Personalizado" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setPeriodoFiltro(f.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  periodoFiltro === f.key
                    ? "bg-primary text-white shadow-md shadow-primary/25 border border-primary/40 font-semibold"
                    : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Painel de Datas Personalizadas (quando o filtro selecionado for 'personalizado') */}
        {periodoFiltro === "personalizado" && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Intervalo personalizado (DD/MM/AAAA):</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <label htmlFor="dataInicio" className="text-muted-foreground text-[11px]">De:</label>
                <Input
                  id="dataInicio"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={dataInicio}
                  onChange={e => setDataInicio(maskDate(e.target.value))}
                  maxLength={10}
                  className="h-8 w-32 text-xs bg-black/40 border-white/10 rounded-lg placeholder:text-zinc-600 font-mono text-center"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="dataFim" className="text-muted-foreground text-[11px]">Até:</label>
                <Input
                  id="dataFim"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={dataFim}
                  onChange={e => setDataFim(maskDate(e.target.value))}
                  maxLength={10}
                  className="h-8 w-32 text-xs bg-black/40 border-white/10 rounded-lg placeholder:text-zinc-600 font-mono text-center"
                />
              </div>

              {(dataInicio || dataFim) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDataInicio(""); setDataFim(""); }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                >
                  Limpar datas
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid de KPIs Principais (Resumo no Topo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`Receita Liquidada (${periodoFiltro === "mes_atual" ? "Mês Atual" : periodoFiltro === "3m" ? "3 Meses" : periodoFiltro === "6m" ? "6 Meses" : periodoFiltro === "12m" ? "12 Meses" : periodoFiltro === "personalizado" ? "Personalizado" : "Histórico"})`}
          value={`R$ ${kpis.receitaPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="success"
          trend={`${kpis.pagamentosLiquidadosCount} pagamento(s) confirmado(s)`}
          trendType={kpis.receitaPeriodo > 0 ? "positive" : "neutral"}
        />

        <StatCard
          title={kpis.labelPrevisaoPeriodo}
          value={`R$ ${kpis.receitaPrevistaPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={GraduationCap}
          variant="info"
          trend={`${kpis.trendPrevisaoPeriodo} • ${kpis.matriculasAtivasTotal} matrícula(s)`}
          trendType="positive"
        />

        <StatCard
          title="Base de Repasse a Professores"
          value={`R$ ${kpis.repasseProfessoresPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Users}
          variant="primary"
          trend={`${kpis.mensalidadesPagasCount} mensalidade(s) no período`}
          trendType="neutral"
        />

        <StatCard
          title="Taxas & Outras Receitas"
          value={`R$ ${(kpis.taxasMatriculaPeriodo + kpis.outrosValoresPeriodo).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Sparkles}
          variant="purple"
          trend="100% retido pela administração"
          trendType="neutral"
        />
      </div>

      {/* Seção de Gráficos — Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Gráfico 1: Arrecadação por Modalidade */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-3 space-y-4 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Arrecadação Total por Modalidade
              </h3>
              <p className="text-xs text-muted-foreground">
                Receita consolidada (mensalidades + taxas + outros pagamentos)
              </p>
            </div>
            <span className="text-[11px] font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 text-muted-foreground">
              Top 8 modalidades
            </span>
          </div>

          {chartModalidadesReceita.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-xs">
              Nenhum pagamento registrado no período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartModalidadesReceita} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={{ fill: "#d4d4d8", fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#d4d4d8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => {
                    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
                    return `R$ ${v}`;
                  }}
                />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<CustomFinancialTooltip />} />
                <Bar dataKey="mensalidades" name="Mensalidades" stackId="a" fill={COLORS.emerald} radius={[0, 0, 0, 0]} />
                <Bar dataKey="taxas_extras" name="Taxas & Outros" stackId="a" fill={COLORS.purple} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 flex-wrap gap-2">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                Mensalidades
              </span>
              <span className="flex items-center gap-1.5 text-white font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-sm" />
                Taxas & Matrículas
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Total listado: R$ {chartModalidadesReceita.reduce((s, i) => s + i.receita_total, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Gráfico 2: Matrículas Ativas por Modalidade (Donut/Pizza) */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl lg:col-span-2 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-sky-400" />
              Matrículas Ativas por Modalidade
            </h3>
            <p className="text-xs text-muted-foreground">
              Distribuição percentual de alunos ativos no sistema
            </p>
          </div>

          {matriculasPorModalidade.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-xs">
              Nenhuma matrícula ativa registrada.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={matriculasPorModalidade}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="matriculas_ativas"
                  nameKey="nome_modalidade"
                >
                  {matriculasPorModalidade.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip content={<CustomFinancialTooltip />} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 10, color: "#ffffff", paddingTop: "8px", maxHeight: "80px", overflowY: "auto" }}
                  formatter={(value) => <span className="text-white font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="text-[11px] text-muted-foreground pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Modalidades ativas: <strong className="text-foreground">{matriculasPorModalidade.length}</strong></span>
            <span>Total de alunos ativos: <strong className="text-foreground">{matriculas.filter(m => m.status_matricula === "ATIVA").length}</strong></span>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos — Linha 2: Repasse por Professor */}
      <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              Arrecadação de Mensalidades por Professor (Repasse)
            </h3>
            <p className="text-xs text-muted-foreground">
              Base de repasse calculada estritamente com base nos pagamentos de mensalidade liquidados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl font-medium">
              Taxas de matrícula excluídas
            </span>
          </div>
        </div>

        {chartProfessoresRepasse.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
            Nenhum repasse ou pagamento de mensalidade identificado no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartProfessoresRepasse} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#d4d4d8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `R$ ${v}`}
              />
              <YAxis
                type="category"
                dataKey="nome"
                tick={{ fill: "#d4d4d8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={<CustomFinancialTooltip />} />
              <Bar dataKey="mensalidades_repasse" name="Base Mensalidades (Repasse)" fill={COLORS.amber} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabs com Detalhamento em Tabelas */}
      <div className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl space-y-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("modalidades")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "modalidades"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Detalhamento por Modalidade
            </button>
            <button
              onClick={() => setActiveTab("professores")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "professores"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Detalhamento de Repasses (Professores)
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            Total de registros: <strong className="text-foreground">{activeTab === "modalidades" ? arrecadacaoPorModalidade.length : repassePorProfessor.length}</strong>
          </span>
        </div>

        {/* Tabela de Modalidades */}
        {activeTab === "modalidades" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Modalidade</th>
                  <th className="py-3 px-3">Área</th>
                  <th className="py-3 px-3 text-center">Matrículas Ativas</th>
                  <th className="py-3 px-3 text-right">Mensalidades</th>
                  <th className="py-3 px-3 text-right">Taxas Matrícula</th>
                  <th className="py-3 px-3 text-right">Outros Valores</th>
                  <th className="py-3 px-3 text-right font-bold text-foreground">Receita Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {arrecadacaoPorModalidade.map(m => (
                  <tr key={m.id_modalidade} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">
                      {m.nome_modalidade}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {m.area || "Geral"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-medium">
                        {m.matriculas_ativas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300">
                      R$ {m.total_mensalidades.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-purple-300">
                      R$ {m.total_taxas_matricula.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground">
                      R$ {m.total_outros.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      R$ {m.total_receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Repasses por Professor */}
        {activeTab === "professores" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Professor / Instrutor</th>
                  <th className="py-3 px-3 text-center">Turmas</th>
                  <th className="py-3 px-3 text-center">Alunos Ativos</th>
                  <th className="py-3 px-3 text-center">Mensalidades Pagas</th>
                  <th className="py-3 px-3 text-right">Taxas Retidas</th>
                  <th className="py-3 px-3 text-right font-bold text-amber-400">Base Repasse (Mensalidades)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {repassePorProfessor.map(p => (
                  <tr key={p.id_instrutor} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">
                      <div>
                        <p>{p.nome_instrutor}</p>
                        <p className="text-[10px] text-muted-foreground font-normal">{p.email || p.funcao}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-foreground">
                        {p.total_turmas}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-300">
                      {p.total_alunos_ativos}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-300">
                      {p.total_mensalidades_pagas_count}
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground line-through decoration-zinc-600">
                      R$ {p.total_taxas_nao_repassadas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-400">
                      R$ {p.total_mensalidades_arrecadadas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

