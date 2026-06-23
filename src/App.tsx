import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<AlunosPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/matriculas" element={<MatriculasPage />} />
            <Route path="/turmas" element={<TurmasPage />} />
            <Route path="/modalidades" element={<ModalidadesPage />} />
            <Route path="/instrutores" element={<InstrutoresPage />} />
            <Route path="/pagamentos" element={<PagamentosPage />} />
            <Route path="/presencas" element={<PresencasPage />} />
            <Route path="/aulas" element={<AulasPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
