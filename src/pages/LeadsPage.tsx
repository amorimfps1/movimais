import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { FilterConfig } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import CpfInput from "@/components/CpfInput";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus, MessageSquare, UserCheck, Sparkles, TrendingUp } from "lucide-react";
import { create, update, remove, generateId, STORES, type Lead, type Aluno } from "@/lib/store";
import { maskCPF } from "@/lib/utils";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

const emptyLead = (): Lead => ({
  id: generateId(), data_entrada: new Date().toISOString().split("T")[0],
  nome: "", cpf: "", telefone: "", email: "", canal_origem: "WHATSAPP",
  modalidade_interesse: "", turma_interesse: "", responsavel_atendimento: "",
  status_lead: "NOVO", data_ultimo_contato: "", motivo_nao_conversao: "",
  observacoes: "", converteu_em_aluno: false,
});

export default function LeadsPage() {
  const { data: leads, reload } = useTable<Lead>(STORES.LEADS);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Lead | null>(null);
  const [form, setForm] = useState<Lead>(emptyLead());
  const [cpfMasked, setCpfMasked] = useState("");
  const { toast } = useToast();

  // Métricas
  const totalLeads = leads.length;
  const leadsNovos = leads.filter(l => l.status_lead === "NOVO").length;
  const leadsEmAtendimento = leads.filter(l => l.status_lead === "EM_ATENDIMENTO" || l.status_lead === "AGUARDANDO_RETORNO").length;
  const convertidos = leads.filter(l => l.status_lead === "CONVERTIDO" || l.converteu_em_aluno).length;
  const taxaConversao = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0;

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyLead());
    setCpfMasked("");
    setOpen(true);
  };

  const handleEdit = (item: Lead) => {
    setEditingItem(item);
    setForm({ ...item });
    setCpfMasked(maskCPF(item.cpf || ""));
    setOpen(true);
  };

  const handleDelete = async (item: Lead) => {
    try {
      await remove(STORES.LEADS, item.id);
      await reload();
      toast({ title: "Lead removido com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Preencha o nome do interessado", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await update(STORES.LEADS, form);
        toast({ title: "Lead atualizado!" });
      } else {
        await create(STORES.LEADS, form);
        toast({ title: "Lead registrado com sucesso!" });
      }
      await reload();
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  // Conversão de Lead em Aluno em 1 clique
  const handleConverterEmAluno = async (lead: Lead) => {
    try {
      const novoAluno: Aluno = {
        id: generateId(),
        nome_completo: lead.nome,
        cpf: lead.cpf || "",
        telefone: lead.telefone || "",
        email: lead.email || "",
        endereco: "",
        bairro: "",
        cep: "",
        cidade: "Brasília",
        uf: "DF",
        data_nascimento: "",
        nome_responsavel: "",
        cpf_responsavel: "",
        telefone_responsavel: "",
        email_responsavel: "",
        autorizacao_imagem: false,
        aceita_comunicacao: true,
        observacoes_medicas: "",
        data_cadastro: new Date().toISOString().split("T")[0],
        origem_primeiro_contato: lead.canal_origem || "LEAD_CONVERTIDO",
        status_cadastral: "ATIVO",
      };

      await create(STORES.ALUNOS, novoAluno);
      await update(STORES.LEADS, {
        ...lead,
        status_lead: "CONVERTIDO",
        converteu_em_aluno: true,
      });
      await reload();
      toast({
        title: "🎉 Lead convertido em Aluno com sucesso!",
        description: `${lead.nome} agora está cadastrado na base de alunos do MOVI+.`,
      });
    } catch (e: any) {
      toast({ title: "Erro na conversão", description: e.message, variant: "destructive" });
    }
  };

  const openWhatsApp = (lead: Lead) => {
    const clean = (lead.telefone || "").replace(/\D/g, "");
    if (!clean) return;
    const num = clean.startsWith("55") ? clean : `55${clean}`;
    const modalidadeTxt = lead.modalidade_interesse ? ` na modalidade de *${lead.modalidade_interesse}*` : "";
    const msg = encodeURIComponent(`Olá ${lead.nome}, tudo bem? Sou do MOVI+ do Jardim Botânico! Vi seu interesse${modalidadeTxt}. Como posso te ajudar a agendar uma aula experimental?`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  const set = (k: keyof Lead, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_lead",
      label: "Status",
      options: [
        { label: "Novo", value: "NOVO" },
        { label: "Em Atendimento", value: "EM_ATENDIMENTO" },
        { label: "Aguardando Retorno", value: "AGUARDANDO_RETORNO" },
        { label: "Convertido", value: "CONVERTIDO" },
        { label: "Não Convertido", value: "NAO_CONVERTIDO" },
      ],
    },
    {
      key: "canal_origem",
      label: "Canal",
      options: [
        { label: "WhatsApp", value: "WHATSAPP" },
        { label: "Instagram", value: "INSTAGRAM" },
        { label: "Presencial", value: "PRESENCIAL" },
        { label: "Indicação", value: "INDICACAO" },
      ],
    },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top Header */}
      <PageHeader
        title="Leads e Atendimento"
        description="Acompanhamento e funil de conversão de novos contatos interessados no MCJB"
        badge={`${totalLeads} Contatos`}
        action={
          <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" />
            <span>Novo Lead</span>
          </Button>
        }
      />

      {/* Mini KPIs do Funil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Leads"
          value={totalLeads}
          icon={UserPlus}
          variant="primary"
        />
        <StatCard
          title="Novos Contatos"
          value={leadsNovos}
          icon={Sparkles}
          variant="info"
          trend="Aguardando primeiro contato"
        />
        <StatCard
          title="Em Negociação"
          value={leadsEmAtendimento}
          icon={MessageSquare}
          variant="warning"
          trend="Em atendimento ativo"
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${taxaConversao}%`}
          icon={TrendingUp}
          variant="success"
          trend={`${convertidos} convertidos em aluno`}
          trendType="positive"
        />
      </div>

      {/* Tabela de Leads */}
      <DataTable
        data={leads}
        searchKeys={["nome", "telefone", "email", "modalidade_interesse", "responsavel_atendimento"]}
        searchPlaceholder="Buscar por nome, telefone, modalidade de interesse..."
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        exportFilename="leads_movimais"
        customActions={lead => (
          <div className="flex items-center gap-1">
            {lead.telefone && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
                onClick={() => openWhatsApp(lead)}
                title="Chamar no WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
            )}
            {lead.status_lead !== "CONVERTIDO" && !lead.converteu_em_aluno && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg"
                onClick={() => handleConverterEmAluno(lead)}
                title="Converter diretamente em Aluno"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
        columns={[
          {
            key: "nome",
            label: "Interessado",
            render: l => {
              const initial = l.nome ? l.nome.charAt(0).toUpperCase() : "L";
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{l.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{l.email || "Sem e-mail"}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "telefone",
            label: "Contato",
            render: l => <span className="text-xs text-muted-foreground">{l.telefone || "—"}</span>,
          },
          {
            key: "modalidade_interesse",
            label: "Interesse",
            render: l => (
              <span className="text-xs font-medium text-foreground/90">
                {l.modalidade_interesse || "Geral / Não especificado"}
              </span>
            ),
          },
          {
            key: "canal_origem",
            label: "Canal",
            render: l => <span className="text-xs text-muted-foreground capitalize">{l.canal_origem?.toLowerCase() || "—"}</span>,
          },
          {
            key: "data_entrada",
            label: "Data",
            render: l => <span className="text-xs text-muted-foreground">{l.data_entrada || "—"}</span>,
          },
          {
            key: "status_lead",
            label: "Status do Funil",
            render: l => <StatusBadge status={l.status_lead} />,
          },
        ]}
      />

      {/* Modal de Criação / Edição de Lead */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Lead" : "Registrar Novo Lead"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Nome do Interessado *</Label>
              <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Roberto Silva" className="bg-background/60 border-white/10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(61) 99999-9999" className="bg-background/60 border-white/10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contato@email.com" className="bg-background/60 border-white/10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">CPF (Opcional)</Label>
              <CpfInput
                value={cpfMasked}
                onChange={(raw, masked) => { setCpfMasked(masked); set("cpf", raw); }}
                showValidation={!!cpfMasked}
              />
            </div>
            <div>
              <Label className="text-xs">Canal de Origem</Label>
              <Select value={form.canal_origem} onValueChange={v => set("canal_origem", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="INDICACAO">Indicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Modalidade de Interesse</Label>
              <Input value={form.modalidade_interesse} onChange={e => set("modalidade_interesse", e.target.value)} placeholder="Ex: Jiu-Jitsu, Ballet, Funcional..." className="bg-background/60 border-white/10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Status do Lead</Label>
              <Select value={form.status_lead} onValueChange={v => set("status_lead", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  <SelectItem value="NOVO">Novo</SelectItem>
                  <SelectItem value="EM_ATENDIMENTO">Em Atendimento</SelectItem>
                  <SelectItem value="AGUARDANDO_RETORNO">Aguardando Retorno</SelectItem>
                  <SelectItem value="NAO_CONVERTIDO">Não Convertido</SelectItem>
                  <SelectItem value="CONVERTIDO">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Responsável pelo Atendimento</Label>
              <Input value={form.responsavel_atendimento} onChange={e => set("responsavel_atendimento", e.target.value)} placeholder="Nome do atendente / recepção" className="bg-background/60 border-white/10 rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Observações do Atendimento</Label>
              <Input value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Preferência de horários, dúvidas, etc." className="bg-background/60 border-white/10 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Registrar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
