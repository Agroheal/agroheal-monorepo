import { createContext, useContext, useState, type ReactNode } from "react";

export type AdminTier = "live" | "legacy" | "all";

interface AdminTierContextValue {
  tier: AdminTier;
  setTier: (tier: AdminTier) => void;
  isModern: boolean;
  isLegacy: boolean;
  isBoth: boolean;
  tierLabel: string;
}

const AdminTierContext = createContext<AdminTierContextValue | undefined>(undefined);

const STORAGE_KEY = "agroheal_admin_tier_filter";

export function AdminTierProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<AdminTier>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "live" || stored === "legacy" || stored === "all") {
        return stored;
      }
    }
    return "live"; // Modern is default
  });

  const setTier = (newTier: AdminTier) => {
    setTierState(newTier);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newTier);
    }
  };

  const isModern = tier === "live";
  const isLegacy = tier === "legacy";
  const isBoth = tier === "all";

  const tierLabel = isModern ? "Modern" : isLegacy ? "Legacy" : "Both";

  return (
    <AdminTierContext.Provider
      value={{
        tier,
        setTier,
        isModern,
        isLegacy,
        isBoth,
        tierLabel,
      }}
    >
      {children}
    </AdminTierContext.Provider>
  );
}

export function useAdminTierFilter(): AdminTierContextValue {
  const context = useContext(AdminTierContext);
  if (!context) {
    throw new Error("useAdminTierFilter must be used within an AdminTierProvider");
  }
  return context;
}
