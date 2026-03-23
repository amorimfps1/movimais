import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  Users, UserPlus, GraduationCap, Calendar, Dumbbell,
  CreditCard, ClipboardCheck, BookOpen, LayoutDashboard,
  UserCog, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Alunos", icon: Users, path: "/alunos" },
  { label: "Leads", icon: UserPlus, path: "/leads" },
  { label: "Matrículas", icon: GraduationCap, path: "/matriculas" },
  { label: "Turmas", icon: Calendar, path: "/turmas" },
  { label: "Modalidades", icon: Dumbbell, path: "/modalidades" },
  { label: "Instrutores", icon: UserCog, path: "/instrutores" },
  { label: "Pagamentos", icon: CreditCard, path: "/pagamentos" },
  { label: "Presenças", icon: ClipboardCheck, path: "/presencas" },
  { label: "Aulas", icon: BookOpen, path: "/aulas" },
];

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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
