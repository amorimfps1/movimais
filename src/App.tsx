import { lazy, Suspense, ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Função utilitária com auto-recarga e resiliência a falhas de importação de chunks dinâmicos do Vite
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const isRefreshed = sessionStorage.getItem("vite_chunk_refreshed") === "true";
    try {
      const component = await factory();
      sessionStorage.removeItem("vite_chunk_refreshed");
      return component;
    } catch (error: any) {
      console.warn("Falha ao carregar módulo dinâmico. Tentando recarregar:", error);
      if (!isRefreshed) {
        sessionStorage.setItem("vite_chunk_refreshed", "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
const AlunosPage = lazyWithRetry(() => import("@/pages/AlunosPage"));
const LeadsPage = lazyWithRetry(() => import("@/pages/LeadsPage"));
const MatriculasPage = lazyWithRetry(() => import("@/pages/MatriculasPage"));
const TurmasPage = lazyWithRetry(() => import("@/pages/TurmasPage"));
const ModalidadesPage = lazyWithRetry(() => import("@/pages/ModalidadesPage"));
const InstrutoresPage = lazyWithRetry(() => import("@/pages/InstrutoresPage"));
const PagamentosPage = lazyWithRetry(() => import("@/pages/PagamentosPage"));
const FinanceiroPage = lazyWithRetry(() => import("@/pages/FinanceiroPage"));
const PresencasPage = lazyWithRetry(() => import("@/pages/PresencasPage"));
const AulasPage = lazyWithRetry(() => import("@/pages/AulasPage"));
const AuthPage = lazyWithRetry(() => import("@/pages/AuthPage"));
const UsuariosPage = lazyWithRetry(() => import("@/pages/UsuariosPage"));
const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Redirecionamento dinâmico da página inicial com base no perfil do usuário
function HomeRoute() {
  const { roles, isAdmin } = useAuth();

  // Usuários com role instrutor têm AulasPage como destino inicial
  if (!isAdmin && roles.includes("instrutor")) {
    return <Navigate to="/aulas" replace />;
  }

  // Demais roles (secretaria, coordenação) têm Dashboard como página inicial
  return <Dashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    {/* Rota inicial dinâmica por cargo */}
                    <Route path="/" element={<HomeRoute />} />

                    {/* Rotas acessíveis para instrutores e equipe administrativa */}
                    <Route path="/turmas" element={<TurmasPage />} />
                    <Route path="/modalidades" element={<ModalidadesPage />} />
                    <Route path="/presencas" element={<PresencasPage />} />
                    <Route path="/aulas" element={<AulasPage />} />

                    {/* Rotas restritas para Secretaria e Coordenação */}
                    <Route element={<ProtectedRoute requireRoles={["secretaria", "coordenacao"]} />}>
                      <Route path="/alunos" element={<AlunosPage />} />
                      <Route path="/leads" element={<LeadsPage />} />
                      <Route path="/matriculas" element={<MatriculasPage />} />
                      <Route path="/instrutores" element={<InstrutoresPage />} />
                      <Route path="/pagamentos" element={<PagamentosPage />} />
                      <Route path="/financeiro" element={<FinanceiroPage />} />
                    </Route>

                    {/* Gestão de Acessos e Usuários */}
                    <Route path="/usuarios" element={<ProtectedRoute requireAdmin><UsuariosPage /></ProtectedRoute>} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
