import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import {
  UserRole,
  parseUserRole,
  isPlatformAdmin,
  SUPER_DEV_EMAIL,
} from "@shared";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  wallet_balance?: number;
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        if (active) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, phone, wallet_balance")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (active) {
        setProfile(data || null);
      }
    };

    // Get initial session
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (active) setLoading(false);
    };

    getInitialSession();

    // Listen to auth state changes in real-time
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        loadProfile(newSession);
      },
    );

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const role: UserRole = parseUserRole(profile?.role);
  const email = session?.user?.email || profile?.email || "";
  const isSuperAdmin =
    email.toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() ||
    role === UserRole.SUPER_ADMIN;
  const isAdmin = isPlatformAdmin(role, email);
  const isCoordinator = role === UserRole.COORDINATOR;
  const isSupport = role === UserRole.SUPPORT;

  return {
    session,
    user: (session?.user || null) as User | null,
    profile,
    role,
    isAdmin,
    isSuperAdmin,
    isCoordinator,
    isSupport,
    loading,
  };
};
