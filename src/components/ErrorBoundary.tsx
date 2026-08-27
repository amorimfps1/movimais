import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoviLogo from "@/components/MoviLogo";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error via ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
          <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-card/80 backdrop-blur-2xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-center">
              <MoviLogo size="md" />
            </div>

            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Ops! Ocorreu um erro
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Houve uma falha inesperada ao renderizar a visualização. Tente recarregar a página ou retornar à tela inicial.
              </p>
              {this.state.error?.message && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-rose-300/90 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1 h-11 rounded-xl border-white/10 text-xs gap-2 hover:bg-white/5"
              >
                <Home className="w-4 h-4" /> Início
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1 h-11 rounded-xl text-xs gap-2 shadow-md shadow-primary/20"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

