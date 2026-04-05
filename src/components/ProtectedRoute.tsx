import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { user, sessionChecked } = useAuth();

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return <Outlet />;
}
