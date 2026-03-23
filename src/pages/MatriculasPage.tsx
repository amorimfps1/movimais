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
import { getAll, create, generateId, STORES, type Matricula, type Aluno, type Modalidade, type Turma } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState(() => getAll<Matricula>(STORES.MATRICULAS));
  const alunos = getAll<Aluno>(STORES.ALUNOS);
  const modalidades = getAll<Modalidade>(STORES.MODALIDADES);
  const turmas = getAll<Turma>(STORES.TURMAS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Matricula>({
    id: generateId(), id_aluno: "", id_modalidade: "", id_turma: "",
    tipo_matricula: "NORMAL", data_inicio: new Date().toISOString().split("T")[0],
    data_fim_prevista: "", status_matricula: "PENDENTE_LIBERACAO",
    valor_final: 0, forma_pagamento: "", liberado_para_aula: false,
    data_criacao: new Date().toISOString().split("T")[0], observacoes: "",
  });
  const { toast } = useToast();
  const set = (k: keyof Matricula, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.id_aluno) { toast({ title: "Selecione um aluno", variant: "destructive" }); return; }
    create(STORES.MATRICULAS, form);
    setMatriculas(getAll(STORES.MATRICULAS));
    setOpen(false);
    toast({ title: "Matrícula criada!" });
  };

  return (
    <div>
      <PageHeader title="Matrículas" description="Controle de matrículas" action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova Matrícula</Button>} />
      <DataTable data={matriculas} searchKeys={["id", "id_aluno"]} columns={[
        { key: "id", label: "ID" },
        { key: "id_aluno", label: "Aluno", render: m => alunos.find(a => a.id === m.id_aluno)?.nome_completo || m.id_aluno },
        { key: "id_modalidade", label: "Modalidade", render: m => modalidades.find(mod => mod.id === m.id_modalidade)?.nome_modalidade || "—" },
        { key: "tipo_matricula", label: "Tipo" },
        { key: "data_inicio", label: "Início" },
        { key: "valor_final", label: "Valor", render: m => `R$ ${m.valor_final.toFixed(2)}` },
        { key: "status_matricula", label: "Status", render: m => <StatusBadge status={m.status_matricula} /> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Nova Matrícula</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Aluno *</Label>
              <Select value={form.id_aluno} onValueChange={v => set("id_aluno", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Modalidade</Label>
              <Select value={form.id_modalidade} onValueChange={v => set("id_modalidade", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{modalidades.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_modalidade}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Turma</Label>
              <Select value={form.id_turma} onValueChange={v => set("id_turma", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome_turma}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo_matricula} onValueChange={v => set("tipo_matricula", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["NORMAL","BOLSA","DESCONTO_ESPECIAL","ASSOCIADO_MCJB","CORTESIA","EXPERIMENTAL_CONVERTIDA"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor Final</Label><Input type="number" value={form.valor_final} onChange={e => set("valor_final", Number(e.target.value))} className="bg-background border-border" /></div>
            <div><Label>Data Início</Label><Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Status</Label>
              <Select value={form.status_matricula} onValueChange={v => set("status_matricula", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PENDENTE_LIBERACAO","ATIVA","SUSPENSA_30_DIAS","TRANCADA_JUSTIFICADA","BLOQUEADA_INADIMPLENCIA","EXPERIMENTAL","CANCELADA","CONCLUIDA"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}
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
