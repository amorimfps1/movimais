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
import { create, generateId, STORES, type Aluno } from "@/lib/store";
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
  const [form, setForm] = useState<Aluno>(emptyAluno());
  const { toast } = useToast();

  const handleSave = async () => {
    if (!form.nome_completo || !form.cpf) {
      toast({ title: "Preencha nome e CPF", variant: "destructive" });
      return;
    }
    try {
      await create(STORES.ALUNOS, form);
      await reload();
      setOpen(false);
      setForm(emptyAluno());
      toast({ title: "Aluno cadastrado com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const set = (key: keyof Aluno, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Alunos"
        description="Cadastro de alunos do MCJB"
        action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Aluno</Button>}
      />

      <DataTable
        data={alunos}
        searchKeys={["nome_completo", "cpf", "email"]}
        columns={[
          { key: "id", label: "ID" },
          { key: "nome_completo", label: "Nome" },
          { key: "cpf", label: "CPF" },
          { key: "telefone", label: "Telefone" },
          { key: "email", label: "Email" },
          { key: "status_cadastral", label: "Status", render: (a) => <StatusBadge status={a.status_cadastral} /> },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Aluno</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome Completo *</Label>
              <Input value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} className="bg-background border-border" />
            </div>
            <div><Label>CPF *</Label><Input value={form.cpf} onChange={e => set("cpf", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Data de Nascimento</Label><Input type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => set("telefone", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="bg-background border-border" /></div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => set("endereco", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => set("bairro", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>CEP</Label><Input value={form.cep} onChange={e => set("cep", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => set("cidade", e.target.value)} className="bg-background border-border" /></div>
            <div>
              <Label>UF</Label>
              <Select value={form.uf} onValueChange={v => set("uf", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["DF","SP","RJ","MG","GO","BA","RS","PR","SC","PE","CE","PA","MA","AM","ES","PB","RN","PI","AL","SE","MT","MS","RO","TO","AC","AP","RR"].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 border-t border-border pt-4 mt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-3">Responsável (menores de idade)</p>
            </div>
            <div><Label>Nome Responsável</Label><Input value={form.nome_responsavel} onChange={e => set("nome_responsavel", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>CPF Responsável</Label><Input value={form.cpf_responsavel} onChange={e => set("cpf_responsavel", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Telefone Responsável</Label><Input value={form.telefone_responsavel} onChange={e => set("telefone_responsavel", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Email Responsável</Label><Input value={form.email_responsavel} onChange={e => set("email_responsavel", e.target.value)} className="bg-background border-border" /></div>
            <div className="col-span-2"><Label>Observações Médicas</Label><Input value={form.observacoes_medicas} onChange={e => set("observacoes_medicas", e.target.value)} className="bg-background border-border" /></div>
            <div>
              <Label>Origem do Contato</Label>
              <Select value={form.origem_primeiro_contato} onValueChange={v => set("origem_primeiro_contato", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="INDICACAO">Indicação</SelectItem>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
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
