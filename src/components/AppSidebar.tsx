import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  Users, UserPlus, GraduationCap, Calendar, Dumbbell,
  CreditCard, ClipboardCheck, BookOpen, LayoutDashboard,
  UserCog, ChevronLeft, ChevronRight, Shield
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const allItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Alunos", icon: Users, path: "/alunos", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Leads", icon: UserPlus, path: "/leads", roles: ["secretaria", "coordenacao"] },
  { label: "Matrículas", icon: GraduationCap, path: "/matriculas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Turmas", icon: Calendar, path: "/turmas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Modalidades", icon: Dumbbell, path: "/modalidades", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Instrutores", icon: UserCog, path: "/instrutores", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Pagamentos", icon: CreditCard, path: "/pagamentos", roles: ["secretaria", "coordenacao"] },
  { label: "Presenças", icon: ClipboardCheck, path: "/presencas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Aulas", icon: BookOpen, path: "/aulas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Usuários", icon: Shield, path: "/usuarios", roles: ["secretaria", "coordenacao"] },
] as const;

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { roles } = useAuth();

  const menuItems = allItems.filter((item) =>
    roles.length === 0 ? false : item.roles.some((r) => roles.includes(r as any))
  );

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r border-white/5 flex flex-col transition-all duration-500 ease-out z-50",
      collapsed ? "w-16" : "w-60 md:w-64"
    )}>
      <div className="h-20 flex items-center justify-center border-b border-white/5 shrink-0 px-4">
        <img src={logo} alt="MOVI+" className={cn("transition-all duration-500", collapsed ? "w-8 opacity-70" : "w-28 opacity-90")} />
      </div>

      <nav className="flex-1 py-6 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive && "text-primary")} />
              {!collapsed && <span className="tracking-wide">{item.label}</span>}
            </Link>
          );
        })}
        {roles.length === 0 && !collapsed && (
          <div className="px-4 py-4 mx-2 text-xs text-muted-foreground italic border border-white/5 rounded-lg bg-background/50">
            Aguardando atribuição de perfil pelo administrador.
          </div>
        )}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-14 border-t border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
