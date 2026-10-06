import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import {
  UserRole,
  isPlatformAdmin,
  canAccessAdminPortal,
  canAccessTreasury,
  SUPER_DEV_EMAIL,
} from "@shared";

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

/**
 * Single place that fetches the profiles.role/full_name row used to decide
 * admin access — shared by useAdminAuth (route guard) and LoginPage (blocks
 * unauthorized sign-ins immediately) so the check only lives in one place.
 */
export async function fetchAdminProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Could not verify profile role:", error);
  }

  return data;
}

export { SUPER_DEV_EMAIL };

export const useAdminAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        if (active) setProfile(null);
        return;
      }
      const data = await fetchAdminProfile(currentSession.user.id);
      if (!active) return;
      setProfile({
        id: currentSession.user.id,
        email: currentSession.user.email || "",
        full_name: data?.full_name || currentSession.user.email || "Admin",
        role: data?.role || "user",
      });
    };

    const init = async () => {
      try {
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 4000)
        );
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ]);
        if (!active) return;
        setSession(data.session);
        if (data.session) {
          await loadProfile(data.session);
        }
      } catch (err) {
        console.error("[useAdminAuth] init error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setTimeout(async () => {
        if (!active) return;
        setSession(newSession);
        await loadProfile(newSession);
      }, 0);
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const isSuperDeveloper =
    profile?.email?.toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() ||
    profile?.role === UserRole.SUPER_ADMIN;
  const isAdmin = isPlatformAdmin(profile?.role, profile?.email);
  const isReviewer = profile?.role === UserRole.REVIEWER;
  const isCoordinator = profile?.role === UserRole.COORDINATOR;
  const isSupport = profile?.role === UserRole.SUPPORT;
  const canAccessAdmin = canAccessAdminPortal(profile?.role, profile?.email);
  const hasTreasuryAccess = canAccessTreasury(profile?.role, profile?.email);
  const isReadOnly = isSupport && !isSuperDeveloper && !isAdmin;

  return {
    session,
    profile,
    loading,
    isAdmin,
    isSuperDeveloper,
    isReviewer,
    isCoordinator,
    isSupport,
    canAccessAdmin,
    hasTreasuryAccess,
    isReadOnly,
  };
};

