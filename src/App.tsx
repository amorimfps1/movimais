import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import AlunosPage from "@/pages/AlunosPage";
import LeadsPage from "@/pages/LeadsPage";
import MatriculasPage from "@/pages/MatriculasPage";
import TurmasPage from "@/pages/TurmasPage";
import ModalidadesPage from "@/pages/ModalidadesPage";
import InstrutoresPage from "@/pages/InstrutoresPage";
import PagamentosPage from "@/pages/PagamentosPage";
import PresencasPage from "@/pages/PresencasPage";
import AulasPage from "@/pages/AulasPage";
import AuthPage from "@/pages/AuthPage";
import UsuariosPage from "@/pages/UsuariosPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

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
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
                </Route>

                {/* Gestão de Acessos e Usuários */}
                <Route path="/usuarios" element={<ProtectedRoute requireAdmin><UsuariosPage /></ProtectedRoute>} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
