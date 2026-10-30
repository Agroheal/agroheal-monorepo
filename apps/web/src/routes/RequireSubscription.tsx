import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { isGreenCardHolder } from "@shared/businessRules";

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

      const [
        { data: sub },
        { data: profile }
      ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("expires_at, plan, status")
          .eq("user_id", user.id)
          .eq("plan", "green_card")
          .eq("status", "active")
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, member_id, role, is_legacy, is_green_card_holder, has_greencard, greencard_status")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      const isSubActive = Boolean(
        sub && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now())
      );
      const isPrivileged = profile?.role === "coordinator" || profile?.role === "admin" || profile?.role === "super_admin";
      const isCardHolder = Boolean(isPrivileged || isSubActive || isGreenCardHolder(profile));
      setHasActiveSubscription(isCardHolder);
      setLoading(false);
    };

    checkSubscription();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/dashboard/checkout?bundle=starter" replace />;
  }

  return <>{children}</>;
};

export default RequireSubscription;
