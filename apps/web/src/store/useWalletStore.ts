import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

export interface LedgerItem {
  id: string;
  date: string;
  type: "CREDIT" | "DEBIT";
  category: "REFERRAL_BONUS" | "SLOT_PURCHASE" | "SUBSCRIPTION" | "WITHDRAWAL" | "MATRIX_COMMISSION";
  amount: number;
  description: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  reference: string;
}

export interface WalletState {
  walletBalance: number;
  directReferralEarnings: number;
  matrixEarnings: number;
  totalEarnings: number;
  transactions: LedgerItem[];
  loading: boolean;
  lastFetched: number | null;

  // Actions
  fetchWalletData: (userId: string, force?: boolean) => Promise<void>;
  recordOptimisticDebit: (amount: number) => void;
  invalidateAndRefetch: (userId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  walletBalance: 0,
  directReferralEarnings: 0,
  matrixEarnings: 0,
  totalEarnings: 0,
  transactions: [],
  loading: false,
  lastFetched: null,

  fetchWalletData: async (userId: string, force = false) => {
    if (!userId) return;

    // Cache hit: If fetched within the last 60 seconds and not forced, return cached data
    const last = get().lastFetched;
    if (!force && last && Date.now() - last < 60000 && get().transactions.length > 0) {
      return;
    }

    set({ loading: true });

    try {
      const [
        { data: profileData },
        { data: referralData },
        { data: slotSubs },
        { data: otherPayments },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("wallet_balance, referral_earnings, slot_bonus")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, full_name, created_at")
          .eq("referred_by", userId),
        supabase
          .from("slot_subscriptions")
          .select("id, amount, status, created_at, reference, project_category")
          .eq("user_id", userId),
        supabase
          .from("other_payments")
          .select("id, amount, status, category, reference, created_at, metadata")
          .eq("user_id", userId),
      ]);

      const walletBalance = Number(profileData?.wallet_balance) || 0;
      const directEarnings = Number(profileData?.referral_earnings) || (referralData?.length ? referralData.length * 1000 : 0);
      const matrixEarnings = Number(profileData?.slot_bonus) || 0;

      // Build unified transaction ledger
      const items: LedgerItem[] = [];

      // 1. Referral credits
      (referralData || []).forEach((ref: any) => {
        items.push({
          id: `ref-${ref.id}`,
          date: ref.created_at || new Date().toISOString(),
          type: "CREDIT",
          category: "REFERRAL_BONUS",
          amount: 1000,
          description: `Direct Referral Reward (${ref.full_name || "New Member"})`,
          status: "COMPLETED",
          reference: `REF-${ref.id.slice(0, 8)}`,
        });
      });

      // 2. Slot subscriptions
      (slotSubs || []).forEach((sub: any) => {
        items.push({
          id: `sub-${sub.id}`,
          date: sub.created_at || new Date().toISOString(),
          type: "DEBIT",
          category: "SLOT_PURCHASE",
          amount: Number(sub.amount) || 0,
          description: `Farm Slot Subscription (${sub.project_category || "Mushroom"})`,
          status: sub.status === "active" ? "COMPLETED" : "PENDING",
          reference: sub.reference || `SUB-${sub.id.slice(0, 8)}`,
        });
      });

      // 3. Other payments (Green Card, miscellaneous)
      (otherPayments || []).forEach((pay: any) => {
        const isWithdrawal = pay.category === "withdrawal";
        items.push({
          id: `pay-${pay.id}`,
          date: pay.created_at || new Date().toISOString(),
          type: isWithdrawal ? "DEBIT" : "CREDIT",
          category: isWithdrawal ? "WITHDRAWAL" : "SUBSCRIPTION",
          amount: Number(pay.amount) || 0,
          description: pay.metadata?.description || (isWithdrawal ? "Wallet Withdrawal" : "Community Payment"),
          status: pay.status === "completed" ? "COMPLETED" : pay.status === "failed" ? "FAILED" : "PENDING",
          reference: pay.reference || `PAY-${pay.id.slice(0, 8)}`,
        });
      });

      // Sort chronological descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      set({
        walletBalance,
        directReferralEarnings: directEarnings,
        matrixEarnings,
        totalEarnings: directEarnings + matrixEarnings,
        transactions: items,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error("[useWalletStore] Error fetching wallet data:", err);
      set({ loading: false });
    }
  },

  recordOptimisticDebit: (amount: number) => {
    const current = get().walletBalance;
    set({ walletBalance: Math.max(0, current - amount) });
  },

  invalidateAndRefetch: async (userId: string) => {
    return get().fetchWalletData(userId, true);
  },
}));
