import { Outlet } from "react-router-dom";
import { AlertCircle, RotateCcw } from "lucide-react";
import AppNavbar from "./AppNavbar";
import { TableLoadProvider, useTableLoadStatus } from "@/hooks/useTableLoadStatus";

function AppContent() {
  const tableStatus = useTableLoadStatus();
  const failedTables = [...new Set(tableStatus?.failures.map(item => item.table) ?? [])];

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
        {failedTables.length > 0 && (
          <div role="alert" className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Não foi possível carregar os dados</p>
                <p className="text-xs text-muted-foreground">Falha em {failedTables.join(", ")}. Os números desta tela estão temporariamente ocultos.</p>
              </div>
            </div>
            <button type="button" onClick={tableStatus?.retryAll} className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold hover:bg-rose-500/10">
              <RotateCcw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}
        <div className={failedTables.length > 0 ? "invisible pointer-events-none" : undefined} aria-busy={failedTables.length > 0}>
          <Outlet />
        </div>
      </main>

      {/* Footer Discreto */}
      <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-muted-foreground/60 relative z-10">
        MOVI+ &bull; Movimento Comunitário do Jardim Botânico &bull; Sistema de Gestão
      </footer>
    </div>
  );
}

export default function AppLayout() {
  return <TableLoadProvider><AppContent /></TableLoadProvider>;
}
