import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  nome: string | null;
}

const ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "secretaria", label: "Secretaria", description: "Acesso completo + gerência de usuários" },
  { value: "coordenacao", label: "Coordenação", description: "Acesso completo aos módulos operacionais" },
  { value: "instrutor", label: "Instrutor", description: "Leitura de turmas/alunos + gestão de presenças" },
];

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, AppRole[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id, email, nome").order("nome"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles(profs ?? []);
    const map: Record<string, AppRole[]> = {};
    (rs ?? []).forEach((r: any) => {
      map[r.user_id] = [...(map[r.user_id] ?? []), r.role];
    });
    setRolesMap(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = async (userId: string, role: AppRole, checked: boolean) => {
    if (checked) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
      toast.success("Perfil atribuído");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success("Perfil removido");
    }
    setRolesMap((prev) => {
      const current = prev[userId] ?? [];
      return {
        ...prev,
        [userId]: checked ? [...current, role] : current.filter((r) => r !== role),
      };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários do Sistema"
        description="Gerencie quem tem acesso ao MOVI+ e qual perfil cada pessoa possui"
      />

      <Card className="p-4 bg-muted/40">
        <p className="text-sm text-muted-foreground">
          Novos usuários devem se cadastrar pela tela de login. Aqui você atribui o perfil correto após o cadastro.
        </p>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Usuário</th>
                {ROLES.map((r) => (
                  <th key={r.value} className="p-3 text-center min-w-[140px]">
                    <div>{r.label}</div>
                    <div className="text-xs font-normal text-muted-foreground">{r.description}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const userRoles = rolesMap[p.id] ?? [];
                const isSelf = p.id === currentUser?.id;
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{p.nome ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                      {isSelf && <div className="text-xs text-primary">(você)</div>}
                    </td>
                    {ROLES.map((r) => (
                      <td key={r.value} className="p-3 text-center">
                        <Checkbox
                          checked={userRoles.includes(r.value)}
                          onCheckedChange={(c) => toggleRole(p.id, r.value, !!c)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
