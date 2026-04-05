import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { Layers } from "lucide-react";

type LoginLocationState = {
  fromSignup?: boolean;
  registeredMessage?: string;
};

export default function Login() {
  const { user, sessionChecked, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const signupState = location.state as LoginLocationState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(
    signupState?.fromSignup && signupState?.registeredMessage
      ? signupState.registeredMessage
      : null
  );

  if (sessionChecked && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-card">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in only after you have registered and a super admin has approved your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successBanner && (
            <p className="text-sm text-green-800 dark:text-green-200 bg-green-500/15 rounded-md px-3 py-2">
              {successBanner}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New admin?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Register first
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
