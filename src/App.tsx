import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/alunos" element={<AlunosPage />} />
                <Route path="/matriculas" element={<MatriculasPage />} />
                <Route path="/turmas" element={<TurmasPage />} />
                <Route path="/modalidades" element={<ModalidadesPage />} />
                <Route path="/instrutores" element={<InstrutoresPage />} />
                <Route path="/presencas" element={<PresencasPage />} />
                <Route path="/aulas" element={<AulasPage />} />
                <Route element={<ProtectedRoute requireRoles={["secretaria", "coordenacao"]} />}>
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/pagamentos" element={<PagamentosPage />} />
                </Route>
                <Route element={<ProtectedRoute requireAdmin />}>
                  <Route path="/usuarios" element={<UsuariosPage />} />
                </Route>
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
