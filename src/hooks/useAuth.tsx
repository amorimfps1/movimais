import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "secretaria" | "coordenacao" | "instrutor";
export type UserStatus = "pendente" | "aprovado" | "rejeitado";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  status: UserStatus | null;
  especialidades: string[];
  instrutorId: string | null;
  isPending: boolean;
  isApproved: boolean;
  loading: boolean;
  isAdmin: boolean;
  isInstrutor: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [instrutorId, setInstrutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (uid: string, userEmail?: string) => {
    try {
      const [{ data: rolesData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      ]);

      const userRoles = (rolesData?.map((r) => r.role) ?? []) as AppRole[];
      setRoles(userRoles);
      
      const userStatus = (profileData?.status as UserStatus) || (userRoles.length > 0 ? "aprovado" : "pendente");
      setStatus(userStatus);

      let specs: string[] = (profileData?.especialidades as string[]) || [];
      let instId: string | null = profileData?.id_instrutor || null;

      // Se for instrutor e não tiver instrutorId no perfil, tenta resolver pelo email ou user_id na tabela instrutores
      if (userRoles.includes("instrutor")) {
        try {
          const emailToSearch = userEmail || profileData?.email;
          const { data: instData } = await supabase
            .from("instrutores")
            .select("id, especialidades")
            .or(`user_id.eq.${uid}${emailToSearch ? `,email.eq.${emailToSearch}` : ""}`)
            .maybeSingle();

          if (instData) {
            instId = instData.id;
            if (specs.length === 0 && instData.especialidades && instData.especialidades.length > 0) {
              specs = instData.especialidades;
            }
          }
        } catch (e) {
          console.warn("Fallback de busca de instrutor:", e);
        }
      }

      setEspecialidades(specs);
      setInstrutorId(instId);
    } catch {
      // Fallback gracioso
      setRoles([]);
      setStatus("pendente");
      setEspecialidades([]);
      setInstrutorId(null);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id, s.user.email), 0);
      } else {
        setRoles([]);
        setStatus(null);
        setEspecialidades([]);
        setInstrutorId(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadUserData(s.user.id, s.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isInstrutor = roles.includes("instrutor");

  const value: AuthContextValue = {
    user,
    session,
    roles,
    status,
    especialidades,
    instrutorId,
    isPending: status === "pendente" && roles.length === 0,
    isApproved: status === "aprovado" || roles.length > 0,
    loading,
    isAdmin: roles.includes("secretaria") || roles.includes("coordenacao"),
    isInstrutor,
    hasRole: (r) => roles.includes(r),
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRoles([]);
      setStatus(null);
      setEspecialidades([]);
      setInstrutorId(null);
    },
    refreshRoles: async () => {
      if (user) await loadUserData(user.id, user.email);
    },
    refreshProfile: async () => {
      if (user) await loadUserData(user.id, user.email);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
