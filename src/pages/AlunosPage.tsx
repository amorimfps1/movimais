import { useState, useMemo, useCallback } from "react";
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
import { Plus, Users, UserCheck, Phone, MessageSquare, HeartHandshake, Eye } from "lucide-react";
import { create, update, remove, generateId, STORES, type Aluno } from "@/lib/store";
import { maskCPF, validateCPF, stripCPF, formatDateToBR } from "@/lib/utils";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";

const emptyAluno = (): Aluno => ({
  id: generateId(),
  nome_completo: "", cpf: "", data_nascimento: "", telefone: "", email: "",
  endereco: "", bairro: "", cep: "", cidade: "Brasília", uf: "DF",
  nome_responsavel: "", cpf_responsavel: "", telefone_responsavel: "", email_responsavel: "",
  autorizacao_imagem: false, aceita_comunicacao: false, observacoes_medicas: "",
  data_cadastro: new Date().toISOString().split("T")[0],
  origem_primeiro_contato: "", status_cadastral: "ATIVO",
});

export default function AlunosPage() {
  const { data: alunos, reload } = useTable<Aluno>(STORES.ALUNOS);
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Aluno | null>(null);
  const [editingItem, setEditingItem] = useState<Aluno | null>(null);
  const [form, setForm] = useState<Aluno>(emptyAluno());
  const [cpfMasked, setCpfMasked] = useState("");
  const [cpfRespMasked, setCpfRespMasked] = useState("");
  const { toast } = useToast();

  // Métricas
  const { totalAlunos, alunosAtivos, menoresIdade } = useMemo(() => {
    const total = alunos.length;
    const ativos = alunos.filter(a => a.status_cadastral === "ATIVO").length;
    const menores = alunos.filter(a => !!a.nome_responsavel || !!a.cpf_responsavel).length;
    return { totalAlunos: total, alunosAtivos: ativos, menoresIdade: menores };
  }, [alunos]);

  const handleNew = useCallback(() => {
    setEditingItem(null);
    setForm(emptyAluno());
    setCpfMasked("");
    setCpfRespMasked("");
    setOpen(true);
  }, []);

  const handleEdit = useCallback((item: Aluno) => {
    setEditingItem(item);
    setForm({ ...item });
    setCpfMasked(maskCPF(item.cpf || ""));
    setCpfRespMasked(maskCPF(item.cpf_responsavel || ""));
    setOpen(true);
  }, []);

  const handleDelete = useCallback(async (item: Aluno) => {
    try {
      await remove(STORES.ALUNOS, item.id);
      await reload();
      toast({ title: "Aluno removido com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  }, [reload, toast]);

  const handleSave = useCallback(async () => {
    if (!form.nome_completo.trim()) {
      toast({ title: "Preencha o nome completo", variant: "destructive" });
      return;
    }
    if (!form.cpf.trim()) {
      toast({ title: "Preencha o CPF", variant: "destructive" });
      return;
    }
    const cleanCpf = stripCPF(form.cpf);
    if (cleanCpf.length !== 11 || !validateCPF(cleanCpf)) {
      toast({ title: "CPF inválido", description: "O CPF deve conter 11 dígitos válidos.", variant: "destructive" });
      return;
    }
    const duplicateCpf = alunos.find(a => stripCPF(a.cpf) === cleanCpf && (!editingItem || a.id !== editingItem.id));
    if (duplicateCpf) {
      toast({ title: "CPF já cadastrado", description: `Este CPF já pertence ao aluno ${duplicateCpf.nome_completo}.`, variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await update(STORES.ALUNOS, form);
        toast({ title: "Aluno atualizado com sucesso!" });
      } else {
        await create(STORES.ALUNOS, form);
        toast({ title: "Aluno cadastrado com sucesso!" });
      }
      await reload();
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  }, [editingItem, form, reload, toast]);

  const set = useCallback((key: keyof Aluno, value: any) => setForm(prev => ({ ...prev, [key]: value })), []);

  // Filtros avançados para a tabela
  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "status_cadastral",
      label: "Status",
      options: [
        { label: "Ativo", value: "ATIVO" },
        { label: "Inativo", value: "INATIVO" },
      ],
    },
    {
      key: "origem_primeiro_contato",
      label: "Origem",
      options: [
        { label: "Instagram", value: "INSTAGRAM" },
        { label: "WhatsApp", value: "WHATSAPP" },
        { label: "Presencial", value: "PRESENCIAL" },
        { label: "Indicação", value: "INDICACAO" },
        { label: "Outro", value: "OUTRO" },
      ],
    },
  ], []);

  const openWhatsApp = useCallback((phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) return;
    const num = clean.startsWith("55") ? clean : `55${clean}`;
    const msg = encodeURIComponent(`Olá ${name}, tudo bem? Aqui é do MOVI+ MCJB!`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <PageHeader
        title="Alunos"
        description="Gestão da base de alunos matriculados e cadastrados no MCJB"
        badge={`${alunos.length} Cadastros`}
        action={
          <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </Button>
        }
      />

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total de Alunos"
          value={totalAlunos}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Alunos Ativos"
          value={alunosAtivos}
          icon={UserCheck}
          variant="success"
          trend={`${totalAlunos > 0 ? Math.round((alunosAtivos / totalAlunos) * 100) : 0}% da base`}
          trendType="positive"
        />
        <StatCard
          title="Menores de Idade"
          value={menoresIdade}
          icon={HeartHandshake}
          variant="info"
          trend="Com responsável cadastrado"
        />
      </div>

      {/* Tabela de Alunos */}
      <DataTable
        data={alunos}
        searchKeys={["nome_completo", "cpf", "email", "telefone", "cidade"]}
        searchPlaceholder="Buscar por nome, CPF, e-mail ou telefone..."
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={item => setViewItem(item)}
        exportFilename="alunos_movimais"
        customActions={aluno => (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg"
              onClick={() => setViewItem(aluno)}
              title="Visualizar detalhes do aluno"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {aluno.telefone && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
                onClick={() => openWhatsApp(aluno.telefone, aluno.nome_completo)}
                title="Conversar via WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
        columns={[
          {
            key: "nome_completo",
            label: "Aluno",
            render: a => {
              const initial = a.nome_completo ? a.nome_completo.charAt(0).toUpperCase() : "A";
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{a.nome_completo}</p>
                    <p className="text-[11px] text-muted-foreground">{a.email || "Sem e-mail"}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "cpf",
            label: "CPF",
            render: a => <span className="font-mono text-xs text-muted-foreground">{maskCPF(a.cpf || "")}</span>,
          },
          {
            key: "telefone",
            label: "Telefone / Contato",
            render: a => (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3 opacity-60" />
                {a.telefone || "—"}
              </span>
            ),
          },
          {
            key: "cidade",
            label: "Local",
            render: a => <span className="text-xs text-muted-foreground">{a.bairro ? `${a.bairro}, ${a.cidade || "DF"}` : a.cidade || "DF"}</span>,
          },
          {
            key: "data_nascimento",
            label: "Nascimento",
            render: a => <span className="text-xs text-muted-foreground">{formatDateToBR(a.data_nascimento)}</span>,
          },
          {
            key: "data_cadastro",
            label: "Data Cadastro",
            render: a => <span className="text-xs text-muted-foreground">{formatDateToBR(a.data_cadastro)}</span>,
          },
          {
            key: "origem_primeiro_contato",
            label: "Origem",
            render: a => <span className="text-xs text-muted-foreground capitalize">{a.origem_primeiro_contato ? a.origem_primeiro_contato.toLowerCase() : "—"}</span>,
          },
          {
            key: "status_cadastral",
            label: "Status",
            render: a => <StatusBadge status={a.status_cadastral} />,
          },
        ]}
      />

      {/* Modal de Detalhes do Aluno */}
      <Dialog open={!!viewItem} onOpenChange={open => { if (!open) setViewItem(null); }}>
        <DialogContent className="max-w-xl bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center">
                {viewItem?.nome_completo ? viewItem.nome_completo.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <p className="text-foreground">{viewItem?.nome_completo}</p>
                <p className="text-xs text-muted-foreground font-normal">Cadastrado em {formatDateToBR(viewItem?.data_cadastro)}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <span className="text-muted-foreground block">CPF:</span>
                  <span className="font-mono text-foreground font-medium">{maskCPF(viewItem.cpf || "")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Nascimento:</span>
                  <span className="text-foreground font-medium">{formatDateToBR(viewItem.data_nascimento)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Telefone:</span>
                  <span className="text-foreground font-medium">{viewItem.telefone || "Não informado"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">E-mail:</span>
                  <span className="text-foreground font-medium">{viewItem.email || "Não informado"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block">Endereço:</span>
                  <span className="text-foreground font-medium">
                    {viewItem.endereco ? `${viewItem.endereco}, ${viewItem.bairro || ""} - ${viewItem.cidade || "DF"}` : "Não informado"}
                  </span>
                </div>
              </div>

              {viewItem.nome_responsavel && (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <span className="text-primary font-semibold block text-[11px] uppercase tracking-wider">Responsável Legal</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block">Nome:</span>
                      <span className="text-foreground font-medium">{viewItem.nome_responsavel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">CPF:</span>
                      <span className="font-mono text-foreground font-medium">{maskCPF(viewItem.cpf_responsavel || "")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Telefone:</span>
                      <span className="text-foreground font-medium">{viewItem.telefone_responsavel || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">E-mail:</span>
                      <span className="text-foreground font-medium">{viewItem.email_responsavel || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewItem.observacoes_medicas && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <span className="font-semibold block text-[11px] uppercase tracking-wider mb-1">Observações Médicas</span>
                  <p>{viewItem.observacoes_medicas}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewItem(null)} className="rounded-xl border-white/10">
                  Fechar
                </Button>
                <Button size="sm" onClick={() => { const item = viewItem; setViewItem(null); handleEdit(item); }} className="rounded-xl">
                  Editar Aluno
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Criação / Edição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Cadastro de Aluno" : "Cadastrar Novo Aluno"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            
            {/* Seção 1: Dados Pessoais */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">1. Dados Pessoais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Nome Completo *</Label>
                  <Input value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Ex: Maria Clara Souza" className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">CPF *</Label>
                  <CpfInput
                    value={cpfMasked}
                    onChange={(raw, masked) => { setCpfMasked(masked); set("cpf", raw); }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Data de Nascimento</Label>
                  <Input type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Telefone / WhatsApp</Label>
                  <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(61) 99999-9999" className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="aluno@email.com" className="bg-background/60 border-white/10 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Seção 2: Endereço */}
            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">2. Endereço & Localização</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Endereço (Rua, Quadra, Lote)</Label>
                  <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Bairro / Condomínio</Label>
                  <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Ex: Jardim Botânico" className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">CEP</Label>
                  <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="71680-000" className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">UF</Label>
                  <Select value={form.uf} onValueChange={v => set("uf", v)}>
                    <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card/95 border-white/10">
                      {["DF","GO","SP","RJ","MG","BA","RS","PR","SC","PE","CE","PA","MA","AM","ES","PB","RN","PI","AL","SE","MT","MS","RO","TO","AC","AP","RR"].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seção 3: Responsável Legal */}
            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">3. Responsável Legal (Menores de Idade)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label className="text-xs">Nome do Responsável</Label>
                  <Input value={form.nome_responsavel} onChange={e => set("nome_responsavel", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">CPF do Responsável</Label>
                  <CpfInput
                    value={cpfRespMasked}
                    onChange={(raw, masked) => { setCpfRespMasked(masked); set("cpf_responsavel", raw); }}
                    showValidation={!!cpfRespMasked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone do Responsável</Label>
                  <Input value={form.telefone_responsavel} onChange={e => set("telefone_responsavel", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">E-mail do Responsável</Label>
                  <Input value={form.email_responsavel} onChange={e => set("email_responsavel", e.target.value)} className="bg-background/60 border-white/10 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Seção 4: Detalhes Adicionais */}
            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">4. Informações Adicionais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Observações Médicas ou Restrições</Label>
                  <Input value={form.observacoes_medicas} onChange={e => set("observacoes_medicas", e.target.value)} placeholder="Alergias, lesões prévias, restrições cardíacas..." className="bg-background/60 border-white/10 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs">Origem do Primeiro Contato</Label>
                  <Select value={form.origem_primeiro_contato} onValueChange={v => set("origem_primeiro_contato", v)}>
                    <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card/95 border-white/10">
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                      <SelectItem value="INDICACAO">Indicação</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status Cadastral</Label>
                  <Select value={form.status_cadastral} onValueChange={v => set("status_cadastral", v)}>
                    <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card/95 border-white/10">
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Cadastrar Aluno"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
