import { useEffect } from "react";
import { useUserStore, type UserProfile, type KinDetails } from "@/store/useUserStore";

export type { UserProfile, KinDetails };

export const useAuth = () => {
  const session = useUserStore((s) => s.session);
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const kinDetails = useUserStore((s) => s.kinDetails);
  const loading = useUserStore((s) => s.loading);
  const isProfileIncomplete = useUserStore((s) => s.isProfileIncomplete);
  const hasGreenCard = useUserStore((s) => s.hasGreenCard);
  const role = useUserStore((s) => s.role);
  const isAdmin = useUserStore((s) => s.isAdmin);
  const isSuperAdmin = useUserStore((s) => s.isSuperAdmin);
  const isCoordinator = useUserStore((s) => s.isCoordinator);
  const isSupport = useUserStore((s) => s.isSupport);
  const initAuth = useUserStore((s) => s.initAuth);
  const fetchProfile = useUserStore((s) => s.fetchProfile);
  const updateProfileLocally = useUserStore((s) => s.updateProfileLocally);
  const setKinDetailsLocally = useUserStore((s) => s.setKinDetailsLocally);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return {
    session,
    user,
    profile,
    kinDetails,
    isProfileIncomplete,
    hasGreenCard,
    role,
    isAdmin,
    isSuperAdmin,
    isCoordinator,
    isSupport,
    loading,
    refreshProfile: fetchProfile,
    updateProfileLocally,
    setKinDetailsLocally,
  };
};
