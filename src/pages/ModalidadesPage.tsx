import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { getAll, create, generateId, STORES, type Modalidade } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState(() => getAll<Modalidade>(STORES.MODALIDADES));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Modalidade>({ id: generateId(), nome_modalidade: "", area: "", valor_padrao: 0, status: "ATIVO" });
  const { toast } = useToast();
  const set = (k: keyof Modalidade, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.nome_modalidade) { toast({ title: "Preencha o nome", variant: "destructive" }); return; }
    create(STORES.MODALIDADES, form);
    setModalidades(getAll(STORES.MODALIDADES));
    setOpen(false);
    toast({ title: "Modalidade criada!" });
  };

  return (
    <div>
      <PageHeader title="Modalidades" description="Atividades oferecidas" action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Modalidade</Button>} />
      <DataTable data={modalidades} searchKeys={["nome_modalidade"]} columns={[
        { key: "id", label: "ID" },
        { key: "nome_modalidade", label: "Modalidade" },
        { key: "area", label: "Área" },
        { key: "valor_padrao", label: "Valor Padrão", render: m => `R$ ${m.valor_padrao.toFixed(2)}` },
        { key: "status", label: "Status", render: m => <StatusBadge status={m.status} /> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>Nova Modalidade</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Nome *</Label><Input value={form.nome_modalidade} onChange={e => set("nome_modalidade", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Área</Label>
              <Select value={form.area} onValueChange={v => set("area", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Artes Marciais">Artes Marciais</SelectItem>
                  <SelectItem value="Dança">Dança</SelectItem>
                  <SelectItem value="Bem-Estar">Bem-Estar</SelectItem>
                  <SelectItem value="Artes">Artes</SelectItem>
                  <SelectItem value="Esporte">Esporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Padrão</Label><Input type="number" value={form.valor_padrao} onChange={e => set("valor_padrao", Number(e.target.value))} className="bg-background border-border" /></div>
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
