import { create } from "zustand";
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
  avatar_url?: string | null;
  member_id?: string;
  referral_code?: string;
  has_greencard?: boolean;
  greencard_status?: string;
  is_legacy?: boolean;
  has_purchased_starter_pack?: boolean;
  placement_status?: string;
  holding_tank_expires_at?: string | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  [key: string]: unknown;
}

export interface KinDetails {
  kin_name?: string;
  kin_address?: string;
  kin_number?: string;
}

export interface UserState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  kinDetails: KinDetails | null;
  loading: boolean;
  isProfileIncomplete: boolean;
  hasGreenCard: boolean;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCoordinator: boolean;
  isSupport: boolean;

  // Actions
  initAuth: () => Promise<void>;
  fetchProfile: (userId?: string) => Promise<void>;
  updateProfileLocally: (updates: Partial<UserProfile>) => void;
  setKinDetailsLocally: (kin: KinDetails | null) => void;
  signOut: () => Promise<void>;
}

let isAuthInitialized = false;

export const useUserStore = create<UserState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  kinDetails: null,
  loading: true,
  isProfileIncomplete: false,
  hasGreenCard: false,
  role: UserRole.MEMBER,
  isAdmin: false,
  isSuperAdmin: false,
  isCoordinator: false,
  isSupport: false,

  fetchProfile: async (userId?: string) => {
    const targetUserId = userId || get().user?.id;
    if (!targetUserId) {
      set({
        profile: null,
        kinDetails: null,
        isProfileIncomplete: false,
        hasGreenCard: false,
        role: UserRole.MEMBER,
        isAdmin: false,
        isSuperAdmin: false,
        isCoordinator: false,
        isSupport: false,
      });
      return;
    }

    try {
      const [{ data: profileData }, { data: kinData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, role, phone, wallet_balance, avatar_url, member_id, referral_code, has_greencard, greencard_status, is_legacy, has_purchased_starter_pack, placement_status, holding_tank_expires_at, country, state, lga")
          .eq("id", targetUserId)
          .maybeSingle(),
        supabase
          .from("kin_details")
          .select("kin_name, kin_number, kin_address")
          .eq("user_id", targetUserId)
          .maybeSingle(),
      ]);

      const profile = profileData || null;
      const kin = kinData || null;

      const isPhoneMissing =
        !profile?.phone || String(profile.phone).trim().length < 10;
      const isKinMissing =
        !kin?.kin_name ||
        !kin?.kin_number ||
        String(kin.kin_number).trim().length < 10;
      const isLocationMissing =
        !profile?.state || !profile?.lga || String(profile.state).trim().length === 0 || String(profile.lga).trim().length === 0;
      const isProfileIncomplete = isPhoneMissing || isKinMissing || isLocationMissing;

      const hasGreenCard = Boolean(
        profile?.has_greencard === true ||
        profile?.greencard_status === "active" ||
        (profile?.member_id && String(profile.member_id).trim().length > 0)
      );

      const role: UserRole = parseUserRole(profile?.role);
      const email = get().session?.user?.email || profile?.email || "";
      const isSuperAdmin =
        email.toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() ||
        role === UserRole.SUPER_ADMIN;
      const isAdmin = isPlatformAdmin(role, email);
      const isCoordinator = role === UserRole.COORDINATOR;
      const isSupport = role === UserRole.SUPPORT;

      set({
        profile,
        kinDetails: kin,
        isProfileIncomplete,
        hasGreenCard,
        role,
        isAdmin,
        isSuperAdmin,
        isCoordinator,
        isSupport,
      });
    } catch (err) {
      console.error("[useUserStore] Error loading profile:", err);
    }
  },

  updateProfileLocally: (updates: Partial<UserProfile>) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...updates };

    const isPhoneMissing =
      !updated.phone || String(updated.phone).trim().length < 10;
    const kin = get().kinDetails;
    const isKinMissing =
      !kin?.kin_name ||
      !kin?.kin_number ||
      String(kin.kin_number).trim().length < 10;

    set({
      profile: updated,
      isProfileIncomplete: isPhoneMissing || isKinMissing,
    });
  },

  setKinDetailsLocally: (kin: KinDetails | null) => {
    const profile = get().profile;
    const isPhoneMissing =
      !profile?.phone || String(profile.phone).trim().length < 10;
    const isKinMissing =
      !kin?.kin_name ||
      !kin?.kin_number ||
      String(kin.kin_number).trim().length < 10;

    set({
      kinDetails: kin,
      isProfileIncomplete: isPhoneMissing || isKinMissing,
    });
  },

  initAuth: async () => {
    if (isAuthInitialized) return;
    isAuthInitialized = true;

    // Fail-safe timeout (4s) so user is never trapped in a permanent spinner
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => {
        console.warn("[useUserStore] Auth getSession timed out after 4s; releasing loading state.");
        resolve({ data: { session: null } });
      }, 4000)
    );

    try {
      const { data } = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise,
      ]);
      const initialSession = data.session;
      const initialUser = initialSession?.user || null;

      set({
        session: initialSession,
        user: initialUser,
        loading: false,
      });

      if (initialUser?.id) {
        await get().fetchProfile(initialUser.id);
      }

      // Listen to real-time auth changes (deferred to next tick to prevent mutex deadlock)
      supabase.auth.onAuthStateChange((_event, newSession) => {
        setTimeout(async () => {
          const newUser = newSession?.user || null;
          set({
            session: newSession,
            user: newUser,
            loading: false,
          });

          if (newUser?.id) {
            await get().fetchProfile(newUser.id);
          } else {
            set({
              profile: null,
              kinDetails: null,
              isProfileIncomplete: false,
              hasGreenCard: false,
              role: UserRole.MEMBER,
              isAdmin: false,
              isSuperAdmin: false,
              isCoordinator: false,
              isSupport: false,
            });
          }
        }, 0);
      });
    } catch (err) {
      console.error("[useUserStore] initAuth error:", err);
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[useUserStore] signOut error:", err);
    } finally {
      set({
        session: null,
        user: null,
        profile: null,
        kinDetails: null,
        isProfileIncomplete: false,
        hasGreenCard: false,
        role: UserRole.MEMBER,
        isAdmin: false,
        isSuperAdmin: false,
        isCoordinator: false,
        isSupport: false,
        loading: false,
      });
    }
  },
}));
