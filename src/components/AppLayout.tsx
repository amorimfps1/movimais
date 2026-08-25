import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-primary/30 selection:text-primary-foreground">
      {/* Luz ambiente de fundo (Glow editorial suave) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-primary/0 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Barra de Navegação Superior (Top Navbar com Abas) */}
      <AppNavbar />

      {/* Conteúdo Principal com Container Amplo e Respirável */}
      <main className="flex-1 w-full relative z-10 p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
        <Outlet />
      </main>

      {/* Footer Discreto */}
      <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-muted-foreground/60 relative z-10">
        MOVI+ &bull; Movimento Comunitário do Jardim Botânico &bull; Sistema de Gestão
      </footer>
    </div>
  );
}
