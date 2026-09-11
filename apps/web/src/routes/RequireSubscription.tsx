import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/**
 * Gates access on an active Green Card subscription, separately from
 * ProtectedRoute's session check. Wrap this around the /dashboard route's
 * children so every page under it (courses, checkout, farm tools, etc.)
 * requires a paid, unexpired plan — not just a logged-in session.
 */
const RequireSubscription = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setHasActiveSubscription(!!sub && new Date(sub.expires_at) > new Date());
      setLoading(false);
    };

    checkSubscription();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Verifying member subscription..." />;
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
};

export default RequireSubscription;
