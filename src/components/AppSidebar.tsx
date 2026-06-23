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
  { label: "Usuários", icon: Shield, path: "/usuarios", roles: ["secretaria"] },
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
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="p-4 flex items-center justify-center border-b border-sidebar-border">
        <img src={logo} alt="MOVI+" className={cn("transition-all", collapsed ? "w-8" : "w-32")} />
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/15 text-primary border-l-2 border-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        {roles.length === 0 && !collapsed && (
          <div className="px-4 py-3 mx-2 text-xs text-muted-foreground">
            Aguardando atribuição de perfil pelo administrador.
          </div>
        )}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5 mx-auto" />}
      </button>
    </aside>
  );
}
