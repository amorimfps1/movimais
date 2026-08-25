import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MoviLogo from "./MoviLogo";
import {
  Users, UserPlus, GraduationCap, Calendar, Dumbbell,
  CreditCard, ClipboardCheck, BookOpen, LayoutDashboard,
  UserCog, Shield, LogOut, Menu, X, ChevronDown, Clock,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const allItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", roles: ["coordenacao", "secretaria"] },
  { label: "Alunos", icon: Users, path: "/alunos", roles: ["secretaria", "coordenacao"] },
  { label: "Leads", icon: UserPlus, path: "/leads", roles: ["secretaria", "coordenacao"] },
  { label: "Matrículas", icon: GraduationCap, path: "/matriculas", roles: ["secretaria", "coordenacao"] },
  { label: "Turmas", icon: Calendar, path: "/turmas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Modalidades", icon: Dumbbell, path: "/modalidades", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Instrutores", icon: UserCog, path: "/instrutores", roles: ["secretaria", "coordenacao"] },
  { label: "Pagamentos", icon: CreditCard, path: "/pagamentos", roles: ["secretaria", "coordenacao"] },
  { label: "Presenças", icon: ClipboardCheck, path: "/presencas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Aulas", icon: BookOpen, path: "/aulas", roles: ["secretaria", "coordenacao", "instrutor"] },
  { label: "Usuários e Aprovações", icon: Shield, path: "/usuarios", roles: ["secretaria", "coordenacao"] },
] as const;

export default function AppNavbar() {
  const location = useLocation();
  const { user, roles, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const navRef = useRef<HTMLElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const overflowing = scrollWidth > clientWidth + 4;
    setHasOverflow(overflowing);
    setCanScrollLeft(overflowing && scrollLeft > 4);
    setCanScrollRight(overflowing && scrollLeft < maxScroll - 4);
  };

  const scroll = (direction: "left" | "right") => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    if (maxScroll <= 0) return;

    const step = 240;
    let target: number;

    if (direction === "right") {
      target = scrollLeft + step;
      // Se estiver próximo do final (dentro de margem de 35px), crava exatamente no fim
      if (target >= maxScroll - 35) {
        target = maxScroll;
      }
    } else {
      target = scrollLeft - step;
      // Se estiver próximo do início, crava exatamente em 0
      if (target <= 35) {
        target = 0;
      }
    }

    navRef.current.scrollTo({
      left: Math.max(0, Math.min(target, maxScroll)),
      behavior: "smooth",
    });

    setTimeout(checkScroll, 320);
  };

  // Monitorar quantidade de cadastros pendentes para coordenadores e secretaria
  useEffect(() => {
    if (!isAdmin) return;

    const checkPending = async () => {
      try {
        const [{ data: profs }, { data: userRoles }] = await Promise.all([
          supabase.from("profiles").select("id, status"),
          supabase.from("user_roles").select("user_id"),
        ]);

        const assignedUserIds = new Set((userRoles ?? []).map((r: any) => r.user_id));
        const pendingCount = (profs ?? []).filter(
          (p: any) => p.status === "pendente" || (!p.status && !assignedUserIds.has(p.id))
        ).length;

        setPendingApprovalsCount(pendingCount);
      } catch {
        // Silêncio em caso de falha de conexão
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 30000); // checagem periódica a cada 30s
    return () => clearInterval(interval);
  }, [isAdmin]);

  const menuItems = allItems.filter((item) =>
    roles.length === 0 ? false : item.roles.some((r) => roles.includes(r as any))
  );

  useEffect(() => {
    checkScroll();
    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkScroll);
    };
  }, [menuItems]);

  // Centralizar a aba ativa automaticamente ao navegar
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
    setTimeout(checkScroll, 350);
  }, [location.pathname]);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-50 w-full bg-card/85 backdrop-blur-xl border-b border-white/10 shadow-sm shadow-black/40">
      {/* Barra Principal */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Marca */}
          <Link
            to="/"
            className="flex items-center gap-3.5 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg pr-2"
          >
            <MoviLogo size="md" className="group-hover:scale-[1.02] transition-transform duration-300" />
            <div className="hidden xl:flex flex-col border-l border-white/10 pl-3">
              <span className="text-xs font-semibold tracking-wider text-foreground/90 uppercase">MCJB</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Gestão Comunitária</span>
            </div>
          </Link>

          {/* Container com Abas e Setas de Navegação */}
          <div className="hidden lg:flex items-center flex-1 min-w-0 max-w-5xl justify-center gap-1.5 px-1">
            {/* Seta para a Esquerda (Exibida somente se houver overflow) */}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={cn(
                  "shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 shadow-sm select-none",
                  canScrollLeft
                    ? "bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/20 text-foreground cursor-pointer active:scale-95 hover:shadow-md"
                    : "bg-white/[0.02] border-white/5 text-muted-foreground/30 cursor-not-allowed opacity-40"
                )}
                title="Rolar abas para a esquerda"
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Abas de Navegação Superior */}
            <nav
              ref={navRef}
              onScroll={checkScroll}
              className={cn(
                "flex items-center gap-1.5 overflow-x-auto scroll-smooth py-2 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1",
                hasOverflow ? "flex-1 justify-start" : "justify-center"
              )}
            >
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const isUserApprovals = item.path === "/usuarios";
                const showBadge = isUserApprovals && pendingApprovalsCount > 0;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-active={isActive ? "true" : undefined}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all duration-200 whitespace-nowrap select-none shrink-0",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_16px_rgba(220,38,38,0.15)] font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.label}</span>

                    {showBadge && (
                      <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full animate-pulse shadow-sm shadow-amber-500/50">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {roles.length === 0 && (
                <span className="text-xs text-muted-foreground italic px-3 py-1.5 rounded-lg border border-dashed border-white/10 bg-background/40 shrink-0">
                  Aguardando perfil de acesso...
                </span>
              )}
            </nav>

            {/* Seta para a Direita (Exibida somente se houver overflow) */}
            {hasOverflow && (
              <button
                type="button"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={cn(
                  "shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 shadow-sm select-none",
                  canScrollRight
                    ? "bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/20 text-foreground cursor-pointer active:scale-95 hover:shadow-md"
                    : "bg-white/[0.02] border-white/5 text-muted-foreground/30 cursor-not-allowed opacity-40"
                )}
                title="Rolar abas para a direita"
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Perfil do Usuário & Ações */}
          <div className="flex items-center gap-3 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/80 to-primary/40 text-primary-foreground font-semibold text-xs flex items-center justify-center shadow-md shadow-primary/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
                    {userInitial}
                  </div>
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-medium text-foreground leading-none truncate max-w-[140px]">
                      {user?.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      {roles.length > 0 ? roles.join(" · ") : "Sem perfil"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-white/10 p-1.5 shadow-2xl">
                <DropdownMenuLabel className="font-normal px-2 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-medium leading-none text-foreground">{user?.email}</p>
                    <p className="text-[11px] leading-none text-muted-foreground capitalize">
                      {roles.length > 0 ? `Nível: ${roles.join(", ")}` : "Aguardando aprovação"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive text-xs py-2 gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botão Hambúrguer Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg h-9 w-9 relative"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {pendingApprovalsCount > 0 && !mobileMenuOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-card/95 backdrop-blur-2xl px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const isUserApprovals = item.path === "/usuarios";
              const showBadge = isUserApprovals && pendingApprovalsCount > 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all",
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{item.label}</span>
                  {showBadge && (
                    <span className="ml-auto px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
