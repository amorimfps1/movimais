import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { getAll, create, generateId, STORES, type Turma, type Modalidade } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function TurmasPage() {
  const [turmas, setTurmas] = useState(() => getAll<Turma>(STORES.TURMAS));
  const modalidades = getAll<Modalidade>(STORES.MODALIDADES);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Turma>({
    id: generateId(), id_modalidade: "", nome_turma: "", faixa_etaria: "",
    capacidade_maxima: 20, status_turma: "ATIVO", permite_experimental: true,
  });
  const { toast } = useToast();
  const set = (k: keyof Turma, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.nome_turma) { toast({ title: "Preencha o nome da turma", variant: "destructive" }); return; }
    create(STORES.TURMAS, form);
    setTurmas(getAll(STORES.TURMAS));
    setOpen(false);
    toast({ title: "Turma criada!" });
  };

  return (
    <div>
      <PageHeader title="Turmas" description="Cadastro de turmas" action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Turma</Button>} />
      <DataTable data={turmas} searchKeys={["nome_turma"]} columns={[
        { key: "id", label: "ID" },
        { key: "nome_turma", label: "Turma" },
        { key: "id_modalidade", label: "Modalidade", render: t => modalidades.find(m => m.id === t.id_modalidade)?.nome_modalidade || "—" },
        { key: "faixa_etaria", label: "Faixa Etária" },
        { key: "capacidade_maxima", label: "Capacidade" },
        { key: "status_turma", label: "Status", render: t => <StatusBadge status={t.status_turma} /> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Nova Turma</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Nome da Turma *</Label><Input value={form.nome_turma} onChange={e => set("nome_turma", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Modalidade</Label>
              <Select value={form.id_modalidade} onValueChange={v => set("id_modalidade", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{modalidades.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_modalidade}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Faixa Etária</Label><Input value={form.faixa_etaria} onChange={e => set("faixa_etaria", e.target.value)} placeholder="Ex: 6-10 anos" className="bg-background border-border" /></div>
            <div><Label>Capacidade</Label><Input type="number" value={form.capacidade_maxima} onChange={e => set("capacidade_maxima", Number(e.target.value))} className="bg-background border-border" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.permite_experimental} onCheckedChange={v => set("permite_experimental", v)} />
              <Label>Permite Experimental</Label>
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
