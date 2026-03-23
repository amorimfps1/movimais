import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { getAll, create, generateId, STORES, type Lead } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function LeadsPage() {
  const [leads, setLeads] = useState(() => getAll<Lead>(STORES.LEADS));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Lead>({
    id: generateId(), data_entrada: new Date().toISOString().split("T")[0],
    nome: "", cpf: "", telefone: "", email: "", canal_origem: "",
    modalidade_interesse: "", turma_interesse: "", responsavel_atendimento: "",
    status_lead: "NOVO", data_ultimo_contato: "", motivo_nao_conversao: "",
    observacoes: "", converteu_em_aluno: false,
  });
  const { toast } = useToast();
  const set = (k: keyof Lead, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.nome) { toast({ title: "Preencha o nome", variant: "destructive" }); return; }
    create(STORES.LEADS, form);
    setLeads(getAll(STORES.LEADS));
    setOpen(false);
    toast({ title: "Lead cadastrado!" });
  };

  return (
    <div>
      <PageHeader title="Leads" description="Gestão de contatos interessados" action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Lead</Button>} />
      <DataTable data={leads} searchKeys={["nome", "email", "telefone"]} columns={[
        { key: "id", label: "ID" },
        { key: "nome", label: "Nome" },
        { key: "telefone", label: "Telefone" },
        { key: "email", label: "Email" },
        { key: "canal_origem", label: "Canal" },
        { key: "status_lead", label: "Status", render: l => <StatusBadge status={l.status_lead} /> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => set("nome", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Canal</Label>
              <Select value={form.canal_origem} onValueChange={v => set("canal_origem", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="INDICACAO">Indicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status_lead} onValueChange={v => set("status_lead", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOVO">Novo</SelectItem>
                  <SelectItem value="EM_ATENDIMENTO">Em Atendimento</SelectItem>
                  <SelectItem value="AGUARDANDO_RETORNO">Aguardando Retorno</SelectItem>
                  <SelectItem value="NAO_CONVERTIDO">Não Convertido</SelectItem>
                  <SelectItem value="CONVERTIDO">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
