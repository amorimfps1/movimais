import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AppLayout() {
  const { user, roles, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60">
        <header className="flex items-center justify-end gap-4 px-6 py-3 border-b bg-card">
          <div className="text-right">
            <div className="text-sm font-medium">{user?.email}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {roles.length > 0 ? roles.join(" · ") : "sem perfil atribuído"}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
