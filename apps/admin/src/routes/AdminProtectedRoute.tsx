import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/lib/supabaseClient";

/**
 * Fixes the old App.tsx bug where a non-admin session was silently let in
 * ("Fallback for local development"). Missing session -> /login. Session
 * present but role !== 'admin' -> hard sign-out, then /login, matching what
 * the login form already enforced correctly.
 */
export default function AdminProtectedRoute() {
  const { session, loading, canAccessAdmin } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  if (!canAccessAdmin) {
    supabase.auth.signOut();
    return <Navigate to="/signin" replace />;
  }


  return <Outlet />;
}
