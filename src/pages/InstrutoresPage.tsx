import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { getAll, create, generateId, STORES, type Instrutor } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function InstrutoresPage() {
  const [instrutores, setInstrutores] = useState(() => getAll<Instrutor>(STORES.INSTRUTORES));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Instrutor>({
    id: generateId(), nome_completo: "", cpf: "", telefone: "", email: "",
    funcao: "INSTRUTOR_PRINCIPAL", ativo: true,
  });
  const { toast } = useToast();
  const set = (k: keyof Instrutor, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.nome_completo) { toast({ title: "Preencha o nome", variant: "destructive" }); return; }
    create(STORES.INSTRUTORES, form);
    setInstrutores(getAll(STORES.INSTRUTORES));
    setOpen(false);
    toast({ title: "Instrutor cadastrado!" });
  };

  return (
    <div>
      <PageHeader title="Instrutores" description="Profissionais do MCJB" action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Instrutor</Button>} />
      <DataTable data={instrutores} searchKeys={["nome_completo"]} columns={[
        { key: "id", label: "ID" },
        { key: "nome_completo", label: "Nome" },
        { key: "cpf", label: "CPF" },
        { key: "telefone", label: "Telefone" },
        { key: "funcao", label: "Função", render: i => i.funcao.replace(/_/g, " ") },
        { key: "ativo", label: "Ativo", render: i => <span className={i.ativo ? "text-success" : "text-destructive"}>{i.ativo ? "Sim" : "Não"}</span> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>Novo Instrutor</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Nome *</Label><Input value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>CPF</Label><Input value={form.cpf} onChange={e => set("cpf", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Função</Label>
              <Select value={form.funcao} onValueChange={v => set("funcao", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["INSTRUTOR_PRINCIPAL","INSTRUTOR_SUBSTITUTO","MONITOR","APOIO"].map(f => <SelectItem key={f} value={f}>{f.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={v => set("ativo", v)} />
              <Label>Ativo</Label>
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
