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
  isPending: boolean;
  isApproved: boolean;
  loading: boolean;
  isAdmin: boolean;
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
  const [loading, setLoading] = useState(true);

  const loadUserData = async (uid: string) => {
    try {
      const [{ data: rolesData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("status").eq("id", uid).maybeSingle(),
      ]);

      const userRoles = (rolesData?.map((r) => r.role) ?? []) as AppRole[];
      setRoles(userRoles);
      
      const userStatus = (profileData?.status as UserStatus) || (userRoles.length > 0 ? "aprovado" : "pendente");
      setStatus(userStatus);
    } catch {
      // Fallback gracioso
      setRoles([]);
      setStatus("pendente");
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setRoles([]);
        setStatus(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadUserData(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    roles,
    status,
    isPending: status === "pendente" && roles.length === 0,
    isApproved: status === "aprovado" || roles.length > 0,
    loading,
    isAdmin: roles.includes("secretaria") || roles.includes("coordenacao"),
    hasRole: (r) => roles.includes(r),
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRoles([]);
      setStatus(null);
    },
    refreshRoles: async () => {
      if (user) await loadUserData(user.id);
    },
    refreshProfile: async () => {
      if (user) await loadUserData(user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
