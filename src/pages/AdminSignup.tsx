import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { sendAdminSignupOtp, verifyAdminSignup } from "@/api/admins";
import { Layers, ArrowLeft } from "lucide-react";

type Step = "email" | "details";

export default function AdminSignup() {
  const { user, sessionChecked } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (sessionChecked && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await sendAdminSignupOtp({ email: email.trim().toLowerCase() });
      setInfo(res.message ?? "Check your email for the verification code.");
      setStep("details");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not send code. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!otp.trim()) {
      setError("Enter the code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyAdminSignup({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        otp: otp.trim(),
      });
      const message =
        res.message ??
        "Registration submitted. A super admin must approve your account before you can sign in.";
      navigate("/login", {
        replace: true,
        state: { fromSignup: true as const, registeredMessage: message },
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registration failed. Try again.";
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
          <h1 className="text-2xl font-bold tracking-tight">Admin registration</h1>
          <p className="text-sm text-muted-foreground">
            Create an account first. You will sign in after a super admin approves you.
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {info}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="signup-email">Work email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending code…" : "Send verification code"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Different email
            </button>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-green-700 dark:text-green-400 bg-green-500/10 rounded-md px-3 py-2">
                {info}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Code sent to <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-otp">Verification code</Label>
              <Input
                id="signup-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                placeholder="From email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Complete registration"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
