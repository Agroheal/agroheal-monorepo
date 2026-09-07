import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Lock, Mail, AlertCircle, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchAdminProfile, useAdminAuth } from "@/hooks/useAdminAuth";
import { canAccessAdminPortal } from "@shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, canAccessAdmin, loading: authLoading } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!authLoading && session && canAccessAdmin) {
      navigate("/", { replace: true });
    }
  }, [authLoading, session, canAccessAdmin, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both your email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Authentication succeeded but no user returned.");

      const profile = await fetchAdminProfile(data.user.id);
      const isAllowed = canAccessAdminPortal(profile?.role, data.user.email);

      if (!isAllowed) {
        await supabase.auth.signOut();
        throw new Error("Access Denied: Your account does not have administrative or support privileges.");
      }

      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 bg-card shadow-2xl shadow-black/40">
        <CardContent className="pt-8 pb-6">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Sprout className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Agroheal Admin</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to manage members, slots, and platform operations.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              {errorMessage.includes("Access Denied") ? (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@agroheal.solutions"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected Administrator Portal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
