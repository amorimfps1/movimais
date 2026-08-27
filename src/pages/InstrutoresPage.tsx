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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog, UserCheck, MessageSquare, Phone, Mail, Dumbbell, Calendar, Check } from "lucide-react";
import { create, update, remove, generateId, STORES, type Instrutor, type Modalidade, type Turma } from "@/lib/store";
import { maskCPF } from "@/lib/utils";
import { useTable } from "@/hooks/useTable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const emptyInstrutor = (): Instrutor => ({
  id: generateId(),
  nome_completo: "",
  cpf: "",
  telefone: "",
  email: "",
  funcao: "INSTRUTOR_PRINCIPAL",
  especialidades: [],
  id_modalidades: [],
  ativo: true,
});

export default function InstrutoresPage() {
  const { isAdmin } = useAuth();
  const { data: instrutores, reload } = useTable<Instrutor>(STORES.INSTRUTORES);
  const { data: modalidades } = useTable<Modalidade>(STORES.MODALIDADES);
  const { data: turmas } = useTable<Turma>(STORES.TURMAS);

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Instrutor | null>(null);
  const [form, setForm] = useState<Instrutor>(emptyInstrutor());
  const [cpfMasked, setCpfMasked] = useState("");
  const { toast } = useToast();

  const total = instrutores.length;
  const ativos = instrutores.filter(i => i.ativo).length;
  const principais = instrutores.filter(i => i.funcao === "INSTRUTOR_PRINCIPAL").length;

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyInstrutor());
    setCpfMasked("");
    setOpen(true);
  };

  const handleEdit = (item: Instrutor) => {
    setEditingItem(item);
    setForm({
      ...item,
      especialidades: item.especialidades || [],
      id_modalidades: item.id_modalidades || [],
    });
    setCpfMasked(maskCPF(item.cpf || ""));
    setOpen(true);
  };

  const handleDelete = async (item: Instrutor) => {
    try {
      await remove(STORES.INSTRUTORES, item.id);
      await reload();
      toast({ title: "Instrutor removido com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!form.nome_completo.trim()) {
      toast({ title: "Preencha o nome do instrutor", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        ...form,
        especialidades: form.especialidades || [],
        id_modalidades: form.id_modalidades || [],
      };
      if (editingItem) {
        await update(STORES.INSTRUTORES, payload);
        toast({ title: "Instrutor atualizado com sucesso!" });
      } else {
        await create(STORES.INSTRUTORES, payload);
        toast({ title: "Instrutor cadastrado com sucesso!" });
      }
      await reload();
      setOpen(false);
      setForm(emptyInstrutor());
      setCpfMasked("");
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const toggleModalidade = (mod: Modalidade) => {
    const currentIds = form.id_modalidades || [];
    const currentSpecs = form.especialidades || [];
    const exists = currentIds.includes(mod.id);

    if (exists) {
      setForm(prev => ({
        ...prev,
        id_modalidades: currentIds.filter(id => id !== mod.id),
        especialidades: currentSpecs.filter(name => name !== mod.nome_modalidade),
      }));
    } else {
      setForm(prev => ({
        ...prev,
        id_modalidades: [...currentIds, mod.id],
        especialidades: [...currentSpecs, mod.nome_modalidade],
      }));
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) return;
    const num = clean.startsWith("55") ? clean : `55${clean}`;
    const msg = encodeURIComponent(`Olá Prof. ${name}, tudo bem? Aqui é da coordenação do MOVI+ MCJB!`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  const set = (k: keyof Instrutor, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const filters: FilterConfig[] = useMemo(() => [
    {
      key: "funcao",
      label: "Função",
      options: [
        { label: "Principal", value: "INSTRUTOR_PRINCIPAL" },
        { label: "Substituto", value: "INSTRUTOR_SUBSTITUTO" },
        { label: "Monitor", value: "MONITOR" },
        { label: "Apoio", value: "APOIO" },
      ],
    },
    {
      key: "ativo",
      label: "Status",
      options: [
        { label: "Ativo", value: "true" },
        { label: "Inativo", value: "false" },
      ],
    },
  ], []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top Header */}
      <PageHeader
        title="Instrutores e Professores"
        description="Corpo docente, especialidades e profissionais responsáveis pelas modalidades do MCJB"
        badge={`${total} Profissionais`}
        action={
          isAdmin ? (
            <Button onClick={handleNew} className="rounded-xl shadow-md shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              <span>Novo Instrutor</span>
            </Button>
          ) : undefined
        }
      />

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total de Instrutores"
          value={total}
          icon={UserCog}
          variant="primary"
        />
        <StatCard
          title="Instrutores Ativos"
          value={ativos}
          icon={UserCheck}
          variant="success"
          trend="Ministrando aulas no momento"
        />
        <StatCard
          title="Instrutores Principais"
          value={principais}
          icon={UserCog}
          variant="info"
          trend="Responsáveis titulares"
        />
      </div>

      {/* Tabela de Instrutores */}
      <DataTable
        data={instrutores}
        searchKeys={["nome_completo", "cpf", "email", "telefone", "especialidades"]}
        searchPlaceholder="Buscar por nome, CPF, contato ou modalidade..."
        filters={filters}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        exportFilename="instrutores_movimais"
        customActions={inst => (
          inst.telefone ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
              onClick={() => openWhatsApp(inst.telefone, inst.nome_completo)}
              title="Conversar via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          ) : null
        )}
        columns={[
          {
            key: "nome_completo",
            label: "Instrutor",
            render: i => {
              const initial = i.nome_completo ? i.nome_completo.charAt(0).toUpperCase() : "I";
              return (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{i.nome_completo}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 opacity-60" /> {i.email || "Sem e-mail"}
                    </p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "especialidades",
            label: "Modalidades / Especialidades",
            render: i => {
              const specs = i.especialidades || [];
              if (specs.length === 0) {
                return <span className="text-xs text-muted-foreground italic">Geral / Não atribuída</span>;
              }
              return (
                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                  {specs.map((spec, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20 text-[11px] font-medium"
                    >
                      <Dumbbell className="w-3 h-3" />
                      {spec}
                    </span>
                  ))}
                </div>
              );
            },
          },
          {
            key: "turmas",
            label: "Turmas Atribuídas",
            render: i => {
              const turmasDoInst = turmas.filter(t => t.id_instrutor === i.id);
              if (turmasDoInst.length === 0) {
                return <span className="text-xs text-muted-foreground">0 turmas</span>;
              }
              return (
                <span className="text-xs text-foreground font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  {turmasDoInst.length} {turmasDoInst.length === 1 ? "turma" : "turmas"}
                </span>
              );
            },
          },
          {
            key: "telefone",
            label: "Telefone",
            render: i => (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3 opacity-60" />
                {i.telefone || "—"}
              </span>
            ),
          },
          {
            key: "ativo",
            label: "Status",
            render: i => <StatusBadge status={i.ativo ? "ATIVO" : "INATIVO"} />,
          },
        ]}
      />

      {/* Modal de Criação / Edição de Instrutor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Editar Instrutor" : "Cadastrar Novo Instrutor"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3.5 pt-2">
            <div>
              <Label className="text-xs">Nome Completo *</Label>
              <Input value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Ex: Carlos Eduardo Silveira" className="bg-background/60 border-white/10 rounded-xl" />
            </div>

            <div>
              <Label className="text-xs">CPF</Label>
              <CpfInput
                value={cpfMasked}
                onChange={(raw, masked) => { setCpfMasked(masked); set("cpf", raw); }}
                showValidation={!!cpfMasked}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(61) 99999-9999" className="bg-background/60 border-white/10 rounded-xl" />
              </div>

              <div>
                <Label className="text-xs">E-mail</Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="professor@email.com" className="bg-background/60 border-white/10 rounded-xl" />
              </div>
            </div>

            {/* SELEÇÃO 1:N DE ESPECIALIDADES / MODALIDADES */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Modalidades / Especialidades Lecionadas (1 : N)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {(form.especialidades || []).length} selecionada(s)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selecione todas as modalidades que este instrutor tem habilitação para ministrar no MCJB:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-background/50 border border-white/10 custom-scrollbar">
                {modalidades.map((mod) => {
                  const selected = (form.id_modalidades || []).includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModalidade(mod)}
                      className={`
                        p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-1.5
                        ${selected
                          ? "bg-primary/20 border-primary text-primary font-semibold shadow-sm"
                          : "bg-white/[0.02] border-white/5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }
                      `}
                    >
                      <span className="truncate">{mod.nome_modalidade}</span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs">Função no Sistema</Label>
              <Select value={form.funcao} onValueChange={v => set("funcao", v)}>
                <SelectTrigger className="bg-background/60 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card/95 border-white/10">
                  {["INSTRUTOR_PRINCIPAL", "INSTRUTOR_SUBSTITUTO", "MONITOR", "APOIO"].map(f => (
                    <SelectItem key={f} value={f}>{f.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 mt-1">
              <div>
                <span className="text-xs font-medium text-foreground block">Instrutor Ativo</span>
                <span className="text-[11px] text-muted-foreground">Disponível para vincular a turmas e aulas</span>
              </div>
              <Switch checked={form.ativo} onCheckedChange={v => set("ativo", v)} />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/20">
              {editingItem ? "Salvar Alterações" : "Cadastrar Instrutor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
