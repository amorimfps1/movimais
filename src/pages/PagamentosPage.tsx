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
import { getAll, create, generateId, STORES, type Pagamento, type Aluno, type Matricula } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState(() => getAll<Pagamento>(STORES.PAGAMENTOS));
  const alunos = getAll<Aluno>(STORES.ALUNOS);
  const matriculas = getAll<Matricula>(STORES.MATRICULAS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Pagamento>({
    id: generateId(), id_matricula: "", id_aluno: "", tipo_lancamento: "MENSALIDADE",
    mes_referencia: new Date().getMonth() + 1, ano_referencia: new Date().getFullYear(),
    data_vencimento: "", valor_previsto: 0, valor_pago: 0, data_pagamento: "",
    status_pagamento: "PREVISTO", forma_pagamento: "",
  });
  const { toast } = useToast();
  const set = (k: keyof Pagamento, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    create(STORES.PAGAMENTOS, form);
    setPagamentos(getAll(STORES.PAGAMENTOS));
    setOpen(false);
    toast({ title: "Pagamento registrado!" });
  };

  return (
    <div>
      <PageHeader title="Pagamentos" description="Controle financeiro" action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Pagamento</Button>} />
      <DataTable data={pagamentos} searchKeys={["id_aluno"]} columns={[
        { key: "id", label: "ID" },
        { key: "id_aluno", label: "Aluno", render: p => alunos.find(a => a.id === p.id_aluno)?.nome_completo || p.id_aluno },
        { key: "tipo_lancamento", label: "Tipo" },
        { key: "data_vencimento", label: "Vencimento" },
        { key: "valor_previsto", label: "Previsto", render: p => `R$ ${p.valor_previsto.toFixed(2)}` },
        { key: "valor_pago", label: "Pago", render: p => `R$ ${p.valor_pago.toFixed(2)}` },
        { key: "status_pagamento", label: "Status", render: p => <StatusBadge status={p.status_pagamento} /> },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Novo Pagamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Aluno</Label>
              <Select value={form.id_aluno} onValueChange={v => set("id_aluno", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo</Label>
              <Select value={form.tipo_lancamento} onValueChange={v => set("tipo_lancamento", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["MENSALIDADE","TAXA_MATRICULA","MATERIAL","REPOSICAO","MULTA","DESCONTO","AJUSTE"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={e => set("data_vencimento", e.target.value)} className="bg-background border-border" /></div>
            <div><Label>Valor Previsto</Label><Input type="number" value={form.valor_previsto} onChange={e => set("valor_previsto", Number(e.target.value))} className="bg-background border-border" /></div>
            <div><Label>Valor Pago</Label><Input type="number" value={form.valor_pago} onChange={e => set("valor_pago", Number(e.target.value))} className="bg-background border-border" /></div>
            <div><Label>Status</Label>
              <Select value={form.status_pagamento} onValueChange={v => set("status_pagamento", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PREVISTO","PAGO","PENDENTE","ATRASADO","ISENTO","ESTORNADO","NEGOCIADO"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
