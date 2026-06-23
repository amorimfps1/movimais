import { Navigate, Outlet } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  requireRoles?: AppRole[];
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ requireRoles, requireAdmin }: Props) {
  const { user, loading, roles, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireRoles && !requireRoles.some((r) => roles.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
