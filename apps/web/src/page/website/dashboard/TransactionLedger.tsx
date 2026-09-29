import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Award,
  HelpCircle,
  Download,
  Users,
  Sprout,
  CreditCard,
  Sparkles,
  Lock,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import { exportToExcel } from "@shared/excelExport";
import { isLegacyMember } from "@shared/businessRules";
import { AgrohealImages } from "@/constant/Image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import WithdrawalModal from "@/components/wallet/WithdrawalModal";

interface LedgerItem {
  id: string;
  date: string;
  type: "CREDIT" | "DEBIT";
  category: "REFERRAL_BONUS" | "SLOT_PURCHASE" | "SUBSCRIPTION" | "WITHDRAWAL" | "MATRIX_COMMISSION" | "CORE_DRIVER_BONUS" | "RETAIL_PURCHASE" | "FARM_CONTRIBUTION" | "COMBO_PACKAGE";
  amount: number;
  description: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  reference: string;
  is_legacy?: boolean;
}

const MATRIX_TIERS = [
  { level: 1, members: 5, percentage: 5.0, rewardPerSlot: 250, totalCeiling: 1250, requiredDirects: 0 },
  { level: 2, members: 25, percentage: 3.5, rewardPerSlot: 175, totalCeiling: 4375, requiredDirects: 0 },
  { level: 3, members: 125, percentage: 3.0, rewardPerSlot: 150, totalCeiling: 18750, requiredDirects: 0 },
  { level: 4, members: 625, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 78125, requiredDirects: 0 },
  { level: 5, members: 3125, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 390625, requiredDirects: 0 },
  { level: 6, members: 15625, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 1953125, requiredDirects: 0 },
  { level: 7, members: 78125, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 9765625, requiredDirects: 0 },
];

export default function TransactionLedger() {
  const [loading, setLoading] = useState<boolean>(true);
  const [memberId, setMemberId] = useState<string>("NO GREENCARD YET");
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    email?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    bank_code?: string;
    is_legacy?: boolean;
    has_purchased_starter_pack?: boolean;
    created_at?: string;
  } | null>(null);
  const [legacyFilter, setLegacyFilter] = useState<"ALL" | "RECENT" | "LEGACY">("ALL");
  const [directReferralEarnings, setDirectReferralEarnings] = useState<number>(0);
  const [matrixEarnings, setMatrixEarnings] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [directReferralsCount, setDirectReferralsCount] = useState<number>(0);
  const [activePqv30d, setActivePqv30d] = useState<number>(0);
  const [pqvDaysRemaining, setPqvDaysRemaining] = useState<number>(30);
  const [selectedMatrixLevel, setSelectedMatrixLevel] = useState<number>(1);
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requeryRef, setRequeryRef] = useState<string>("");
  const [requeryLoading, setRequeryLoading] = useState<boolean>(false);
  const [activeRequeryRef, setActiveRequeryRef] = useState<string | null>(null);
  const [showRequeryModal, setShowRequeryModal] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isProjectSubscribed, setIsProjectSubscribed] = useState<boolean>(false);
  const [subscribingWithWallet, setSubscribingWithWallet] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Matrix Withdrawal Qualification: 5 direct referrals AND ₦10,000 PQV in 30 days
  const isMatrixQualified = directReferralsCount >= 5 && activePqv30d >= 10000;

  // Direct Referral Withdrawal Qualification: Active Project Subscribed AND >= ₦2,000
  const isDirectReferralWithdrawable = isProjectSubscribed && directReferralEarnings >= 2000;
  const canSubscribeWithWallet = !isProjectSubscribed && directReferralEarnings >= 10000;
  const hasGreenCard = Boolean(memberId && memberId !== "NO GREENCARD YET" && !memberId.includes("PENDING"));

  // Authoritative financial balances (incorporating direct referral earnings, matrix earnings, and platform wallet balance)
  const ledgerBalance = Math.max(
    walletBalance,
    directReferralEarnings + matrixEarnings
  );

  // Gatekeeper locked capital:
  // If user is not qualified for 5x7 matrix (5 directs + ₦10k 30d PQV), all matrix earnings are locked.
  const lockedMatrixAmount = !isMatrixQualified ? matrixEarnings : 0;
  // If direct referral earnings do not meet withdrawal conditions (active project + ₦2k threshold), lock them.
  const lockedDirectAmount = !isDirectReferralWithdrawable ? directReferralEarnings : 0;

  // Statutory Gate: A balance cannot appear in Available Balance if it is less than ₦2,000 (minimum statutory payout).
  const rawClearedBalance = Math.max(0, ledgerBalance - (lockedMatrixAmount + lockedDirectAmount));
  const availableBalance = rawClearedBalance >= 2000 ? rawClearedBalance : 0;
  const lockedBelowThresholdAmount = rawClearedBalance < 2000 ? rawClearedBalance : 0;
  const totalLockedAmount = lockedMatrixAmount + lockedDirectAmount + lockedBelowThresholdAmount;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await loadLedger();
      showToast({
        variant: "success",
        title: "All Sections Updated",
        description: "Refreshed wallet balances, matrix standing, and transaction history.",
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Refresh Failed",
        description: "Could not refresh ledger data. Please try again.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadLedger = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Attempt to fetch dual wallet summary & ledger from Express API v1 (/api/v1/wallet/...)
      let apiSummary: any = null;
      let apiLedgerEntries: any[] = [];
      try {
        const [summaryRes, ledgerRes] = await Promise.allSettled([
          apiClient.wallet.getSummary({ timeout: 3000 }),
          apiClient.wallet.getLedger({ timeout: 3000 }),
        ]);

        if (summaryRes.status === "fulfilled" && summaryRes.value) {
          apiSummary = summaryRes.value;
          if (apiSummary.directReferralWallet) {
            setDirectReferralEarnings(Number(apiSummary.directReferralWallet.balance) || 0);
          }
          if (apiSummary.matrixSpilloverWallet) {
            setMatrixEarnings(Number(apiSummary.matrixSpilloverWallet.balance) || 0);
            if (apiSummary.matrixSpilloverWallet.activePqv30d !== undefined) {
              setActivePqv30d(Number(apiSummary.matrixSpilloverWallet.activePqv30d) || 0);
            }
            if (apiSummary.matrixSpilloverWallet.directReferralsCount !== undefined) {
              setDirectReferralsCount(Number(apiSummary.matrixSpilloverWallet.directReferralsCount) || 0);
            }
          }
        }

        if (ledgerRes.status === "fulfilled" && Array.isArray(ledgerRes.value)) {
          apiLedgerEntries = ledgerRes.value;
        }
      } catch (apiErr: any) {
        console.info("[TransactionLedger] Express Wallet API unavailable, continuing with database records:", apiErr.message);
      }

      // 2. Resilient Database query for profile, transactions, subscriptions, and receipts
      let profile: any = null;
      try {
        const { data: pData, error: pErr } = await supabase
          .from("profiles")
          .select("member_id, full_name, email, referral_earnings, slot_bonus, wallet_balance, total_referrals, created_at, bank_name, bank_account_number, bank_account_name, bank_code, is_legacy, is_green_card_holder, has_greencard, greencard_status")
          .eq("id", user.id)
          .maybeSingle();

        if (pErr || !pData) {
          // Fallback to core columns if newly added columns are not yet in PostgREST schema cache
          const { data: fallbackData } = await supabase
            .from("profiles")
            .select("member_id, full_name, email, referral_earnings, slot_bonus, wallet_balance, total_referrals, created_at, bank_name, bank_account_number, bank_account_name, bank_code")
            .eq("id", user.id)
            .maybeSingle();
          profile = fallbackData;
        } else {
          profile = pData;
        }
      } catch (err: any) {
        console.warn("[TransactionLedger] Profile query error, attempting minimal fetch:", err.message);
      }

      let checkouts: any[] = [];
      try {
        const { data: txData } = await supabase
          .from("transactions")
          .select("id, amount, created_at, transaction_ref, payment_reference, status, is_legacy, project_category, user_id, email")
          .or(`user_id.eq.${user.id},email.ilike.${user.email || ""}`)
          .limit(100);
        checkouts = txData || [];
      } catch {
        checkouts = [];
      }

      let farmRecords: any[] = [];
      if (user.email) {
        try {
          const { data: frData } = await supabase
            .from("farm_records")
            .select("id, name, email, farm_slots, months_farm_setup, months_farm_support, absentee_fine, project_category, created_at, is_legacy")
            .ilike("email", user.email.trim());
          farmRecords = frData || [];
        } catch {
          farmRecords = [];
        }
      }

      const [
        { data: referrals },
        { data: subscriptions },
        { data: slotSubscriptions },
        { data: otherPayments },
        { data: dbWalletLedger },
        { data: dbOrders },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, created_at")
          .eq("referred_by", user.id),
        supabase
          .from("subscriptions")
          .select("id, started_at, plan, status, expires_at")
          .eq("user_id", user.id),
        user.email
          ? supabase
              .from("slot_subscriptions")
              .select("id, user_id, slots, amount, status, project_category, created_at, farm_group_id, is_legacy, last_payment_date, member_name, member_email, checkout_id")
              .or(`user_id.eq.${user.id},member_email.ilike.${user.email.trim()}`)
          : supabase
              .from("slot_subscriptions")
              .select("id, user_id, slots, amount, status, project_category, created_at, farm_group_id, is_legacy, last_payment_date, member_name, member_email, checkout_id")
              .eq("user_id", user.id),
        supabase
          .from("other_payments")
          .select("id, amount, payment_type, created_at, status, reference, is_legacy")
          .eq("user_id", user.id),
        supabase
          .from("wallet_ledger")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, product_code, quantity, total_price, pv_earned, status, notes, created_at, transaction_id")
          .eq("user_id", user.id),
      ]);

      const orders = dbOrders || [];

      if (profile) {
        setUserProfile({
          full_name: profile.full_name,
          email: profile.email,
          bank_name: profile.bank_name,
          bank_account_number: profile.bank_account_number,
          bank_account_name: profile.bank_account_name,
          bank_code: profile.bank_code,
          is_legacy: Boolean(profile.is_legacy),
          created_at: profile.created_at,
        });
      }

      let resolvedMemberId = profile?.member_id;
      const isCardHolder = Boolean(
        profile?.is_green_card_holder ||
        profile?.has_greencard ||
        profile?.greencard_status === "active" ||
        Boolean(resolvedMemberId) ||
        (subscriptions && subscriptions.some((s: any) => s.plan === "green_card" && s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date())))
      );

      if (!resolvedMemberId && isCardHolder) {
        try {
          const cardData = await apiClient.member.getDigitalCard();
          if (cardData?.memberId && cardData.memberId !== "PENDING") {
            resolvedMemberId = cardData.memberId;
          }
        } catch {
          // fallback
        }
      }

      if (resolvedMemberId) {
        setMemberId(formatAgcId(resolvedMemberId));
      } else if (isCardHolder) {
        setMemberId("AGC-ACTIVE");
      } else {
        setMemberId("NO GREENCARD YET");
      }

      const refEarnings = apiSummary?.directReferralWallet?.balance !== undefined
        ? Number(apiSummary.directReferralWallet.balance)
        : Number(profile?.referral_earnings || 0);
      setDirectReferralEarnings(refEarnings);

      const wBal = Number(profile?.wallet_balance) || 0;
      setWalletBalance(wBal);

      if (apiSummary?.matrixSpilloverWallet?.balance === undefined && profile?.slot_bonus) {
        setMatrixEarnings(Number(profile.slot_bonus || 0));
      }

      const hasActiveSub = Boolean(
        isCardHolder ||
        (subscriptions && subscriptions.some((s: any) => s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > new Date()))) ||
        (slotSubscriptions && slotSubscriptions.some((s: any) => (s.status || '').toLowerCase() === 'active')) ||
        (checkouts && checkouts.some((c: any) => ['paid', 'success', 'completed'].includes((c.status || '').toLowerCase())))
      );
      setIsProjectSubscribed(hasActiveSub);

      const refCount = apiSummary?.matrixSpilloverWallet?.directReferralsCount !== undefined
        ? Number(apiSummary.matrixSpilloverWallet.directReferralsCount)
        : (referrals ? referrals.length : (profile?.total_referrals || 0));
      setDirectReferralsCount(refCount);
      setSelectedMatrixLevel(refCount < 5 ? (refCount < 4 ? refCount + 1 : 5) : 1);

      // Compute 30-day PQV from slot subscriptions, retail orders, and monthly payments
      if (apiSummary?.matrixSpilloverWallet?.activePqv30d === undefined) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let calculatedPqv = 0;
        (slotSubscriptions || []).forEach((ss: any) => {
          if (new Date(ss.created_at || ss.last_payment_date) >= thirtyDaysAgo) {
            calculatedPqv += Number(ss.amount || 0);
          }
        });
        (otherPayments || []).forEach((p) => {
          if (new Date(p.created_at) >= thirtyDaysAgo) {
            calculatedPqv += Number(p.amount || 0);
          }
        });
        (orders || []).forEach((o: any) => {
          const isPaid = (o.status || "").toUpperCase() === "PAID";
          if (isPaid && new Date(o.created_at) >= thirtyDaysAgo) {
            calculatedPqv += Number(o.pv_earned || o.total_price || 0);
          }
        });
        setActivePqv30d(calculatedPqv);
      }

      // Build unified ledger list
      const items: LedgerItem[] = [];

      // If official wallet_ledger entries returned from API, map them first
      if (apiLedgerEntries.length > 0) {
        apiLedgerEntries.forEach((entry: any) => {
          items.push({
            id: entry.id || `ledger-${entry.reference_id || Math.random()}`,
            date: entry.created_at || new Date().toISOString(),
            type: entry.entry_type === "DEBIT" ? "DEBIT" : "CREDIT",
            category: entry.category || "REFERRAL_BONUS",
            amount: Number(entry.amount) || 0,
            description: entry.description || "Wallet Transaction",
            status: entry.status === "FAILED" ? "FAILED" : entry.status === "PENDING" ? "PENDING" : "COMPLETED",
            reference: entry.reference_id || entry.id || "N/A",
            is_legacy: Boolean(entry.is_legacy || isLegacyMember(entry.created_at)),
          });
        });
      }

      // 1. Direct referral earnings entries (synthetic aggregation or records)
      if (refEarnings > 0) {
        items.push({
          id: `ref-total-${user.id}`,
          date: profile?.created_at || new Date().toISOString(),
          type: "CREDIT",
          category: "REFERRAL_BONUS",
          amount: refEarnings,
          description: `Direct Referral Bonuses (${refCount} active referrals)`,
          status: "COMPLETED",
          reference: `DIR-REF-${refCount}`,
          is_legacy: Boolean(profile?.is_legacy || isLegacyMember(profile?.created_at)),
        });
      }

      // 2. Master Online Checkouts & Gateway Transactions (Authoritative Parent Cashflow Ledger)
      const accountedCheckoutIds = new Set<string>();
      const accountedCheckoutRefs = new Set<string>();
      let hasCompletedOnlineGreenCard = false;

      (checkouts || []).forEach((c: any) => {
        const isBelongingToUser =
          (c.user_id && c.user_id === user.id) ||
          (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase());
        if (!isBelongingToUser) return;

        const cStatus = (c.status || "").toLowerCase();
        const hasPaymentRef = Boolean(c.transaction_ref || c.payment_reference);

        // Omit uncompleted / abandoned checkout clicks (e.g. pending without any gateway payment reference)
        if (cStatus === "pending" && !hasPaymentRef) {
          return;
        }

        const isCCompleted = ["paid", "success", "completed", "confirmed", "active"].includes(cStatus);
        const isCFailed = ["failed", "cancelled", "abandoned", "declined"].includes(cStatus);
        const ref = c.transaction_ref || c.payment_reference || `CHK-${c.id.toString().slice(0, 8)}`;

        if (c.id) accountedCheckoutIds.add(String(c.id));
        if (c.transaction_ref) accountedCheckoutRefs.add(String(c.transaction_ref).toLowerCase());
        if (c.payment_reference) accountedCheckoutRefs.add(String(c.payment_reference).toLowerCase());

        const amount = Number(c.amount || 0);
        const catLower = (c.project_category || "").toLowerCase();

        const isComboTx =
          catLower.includes("combo") ||
          amount === 12000 ||
          (amount === 10000 && !catLower.includes("slot"));

        const isGreenCardTx =
          catLower.includes("green card") ||
          amount === 2000 ||
          (amount === 1000 && isLegacyMember(c.created_at));

        if (isCCompleted && (isComboTx || isGreenCardTx)) {
          hasCompletedOnlineGreenCard = true;
        }

        let category: LedgerItem["category"] = "SLOT_PURCHASE";
        let description = c.project_category ? `Online Payment — ${c.project_category}` : "Online Platform Payment";

        if (isComboTx) {
          category = "COMBO_PACKAGE";
          description = "Producer-Consumer Starter Bundle (Farm Slot + Mushroom Power 100g + Green Card)";
        } else if (isGreenCardTx) {
          category = "SUBSCRIPTION";
          description = "AgroHeal Green Card Activation (Lifetime Certified Digital Pass)";
        } else if (catLower.includes("starter pack") || (amount === 5000 && catLower.includes("product"))) {
          category = "RETAIL_PURCHASE";
          description = "Starter Pack Product: Mushroom Power 100g";
        } else if (catLower.includes("slot") || amount >= 5000) {
          const count = Math.max(1, Math.floor(amount / 5000));
          category = "SLOT_PURCHASE";
          description = `Secured ${count} Farm Slot(s) — ${c.project_category || "Mushroom Village"}`;
        }

        if (!items.some((i) => i.reference === ref || (c.transaction_ref && i.reference === c.transaction_ref))) {
          items.push({
            id: `chk-${c.id}`,
            date: c.created_at,
            type: "DEBIT",
            category: category,
            amount: amount,
            description: description,
            status: isCCompleted ? "COMPLETED" : isCFailed ? "FAILED" : "PENDING",
            reference: ref,
            is_legacy: Boolean(c.is_legacy || isLegacyMember(c.created_at)),
          });
        }
      });

      // 3. Slot Subscriptions (Physical & Digital Group Farm Slots)
      (slotSubscriptions || []).forEach((ss: any, idx: number) => {
        const isBelongingToUser =
          (ss.user_id && ss.user_id === user.id) ||
          (user.email && ss.member_email && ss.member_email.toLowerCase() === user.email.toLowerCase());
        if (!isBelongingToUser) return;

        // Parent-Child Invariant: If this slot subscription was provisioned via an online checkout in checkouts,
        // it is already accounted for by the master transaction debit. Do NOT double count.
        const isAccountedFor =
          ss.checkout_id &&
          (accountedCheckoutIds.has(String(ss.checkout_id)) ||
           accountedCheckoutRefs.has(String(ss.checkout_id).toLowerCase()));

        if (isAccountedFor) {
          return;
        }

        const slotsCount = Number(ss.slots || 1);
        const ssStatus = (ss.status || "active").toLowerCase();
        const isSsCompleted = ["active", "paid", "success", "confirmed", "completed"].includes(ssStatus);
        const isSsFailed = ["cancelled", "canceled", "failed", "expired"].includes(ssStatus);
        const ref = `SLOT-${(ss.id || idx).toString().slice(0, 8).toUpperCase()}`;

        items.push({
          id: `slot-${ss.id || idx}`,
          date: ss.created_at || ss.last_payment_date || new Date().toISOString(),
          type: "DEBIT",
          category: "SLOT_PURCHASE",
          amount: Number(ss.amount) || slotsCount * 5000,
          description: `Secured ${slotsCount} Slot(s) — ${ss.project_category || "Farm Project"}`,
          status: isSsCompleted ? "COMPLETED" : isSsFailed ? "FAILED" : "PENDING",
          reference: ref,
          is_legacy: Boolean(ss.is_legacy),
        });
      });

      // 4. Retail & Starter Pack Product Orders
      (orders || []).forEach((ord: any) => {
        // Parent-Child Invariant: If this order was provisioned as part of a Combo or Online Checkout,
        // it is already accounted for by the master transaction debit. Do NOT double count.
        const isAccountedFor =
          ord.transaction_id &&
          (accountedCheckoutIds.has(String(ord.transaction_id)) ||
           accountedCheckoutRefs.has(String(ord.transaction_id).toLowerCase()));

        if (isAccountedFor) {
          return;
        }

        const isPaid = (ord.status || "").toUpperCase() === "PAID";
        items.push({
          id: `ord-${ord.id}`,
          date: ord.created_at || new Date().toISOString(),
          type: "DEBIT",
          category: "RETAIL_PURCHASE",
          amount: Number(ord.total_price || 0),
          description: ord.notes || `Product Order (${ord.product_code || "Starter Pack"})`,
          status: isPaid ? "COMPLETED" : "PENDING",
          reference: `ORD-${(ord.id || "").toString().slice(0, 8).toUpperCase()}`,
          is_legacy: Boolean(isLegacyMember(ord.created_at)),
        });
      });

      // 5. Green Card Subscriptions
      (subscriptions || []).forEach((s: any, idx: number) => {
        // If Green Card was activated as part of an online checkout (Combo or Green Card pass),
        // it is already accounted for by the master transaction debit.
        if (hasCompletedOnlineGreenCard && s.plan === "green_card") {
          return;
        }

        const sStatus = (s.status || "").toLowerCase();
        const isSubCompleted = ["active", "paid", "success", "confirmed", "completed"].includes(sStatus);
        const isSubFailed = ["cancelled", "canceled", "failed", "expired"].includes(sStatus);
        items.push({
          id: `sub-${s.id || idx}`,
          date: s.started_at || new Date().toISOString(),
          type: "DEBIT",
          category: "SUBSCRIPTION",
          amount: 2000,
          description: `AgroHeal Green Card Activation (${s.plan || "Annual"})`,
          status: isSubCompleted ? "COMPLETED" : isSubFailed ? "FAILED" : "PENDING",
          reference: `GC-${(s.id || idx).toString().slice(0, 8).toUpperCase()}`,
          is_legacy: Boolean(isLegacyMember(s.started_at)),
        });
      });

      // 6. Other payments
      (otherPayments || []).forEach((p: any) => {
        const pStatus = (p.status || "").toLowerCase();
        const isPCompleted = ["confirmed", "active", "success", "paid", "completed"].includes(pStatus);
        const isPFailed = ["failed", "rejected"].includes(pStatus);
        items.push({
          id: `pay-${p.id}`,
          date: p.created_at,
          type: "DEBIT",
          category: "SUBSCRIPTION",
          amount: Number(p.amount || 0),
          description: `${(p.payment_type || "Payment").replace(/_/g, " ").toUpperCase()} Contribution`,
          status: isPCompleted ? "COMPLETED" : isPFailed ? "FAILED" : "PENDING",
          reference: p.reference || `PAY-${p.id.slice(0, 8)}`,
          is_legacy: Boolean(p.is_legacy || isLegacyMember(p.created_at)),
        });
      });

      // 7. Farm Setup & Support Contributions (from audited farm_records)
      (farmRecords || []).forEach((fr: any) => {
        if (fr.months_farm_setup && fr.months_farm_setup.toLowerCase() !== "0" && fr.months_farm_setup.toLowerCase() !== "unpaid") {
          const ref = `SETUP-${fr.id.slice(0, 8).toUpperCase()}`;
          if (!items.some((it) => it.reference === ref)) {
            items.push({
              id: `fr-setup-${fr.id}`,
              date: fr.created_at || "2024-01-01T00:00:00.000Z",
              type: "DEBIT",
              category: "FARM_CONTRIBUTION",
              amount: 0,
              description: `Farm Setup Contribution — ${fr.project_category || "Group Farm"} (${fr.months_farm_setup})`,
              status: "COMPLETED",
              reference: ref,
              is_legacy: true,
            });
          }
        }
        if (fr.months_farm_support && fr.months_farm_support.toLowerCase() !== "0" && fr.months_farm_support.toLowerCase() !== "unpaid") {
          const ref = `SUPP-${fr.id.slice(0, 8).toUpperCase()}`;
          if (!items.some((it) => it.reference === ref)) {
            items.push({
              id: `fr-supp-${fr.id}`,
              date: fr.created_at || "2024-01-01T00:00:00.000Z",
              type: "DEBIT",
              category: "FARM_CONTRIBUTION",
              amount: 0,
              description: `Farm Support Contribution — ${fr.project_category || "Group Farm"} (${fr.months_farm_support})`,
              status: "COMPLETED",
              reference: ref,
              is_legacy: true,
            });
          }
        }
        if (fr.absentee_fine && Number(fr.absentee_fine) > 0) {
          const ref = `FINE-${fr.id.slice(0, 8).toUpperCase()}`;
          if (!items.some((it) => it.reference === ref)) {
            items.push({
              id: `fr-fine-${fr.id}`,
              date: fr.created_at || "2024-01-01T00:00:00.000Z",
              type: "DEBIT",
              category: "FARM_CONTRIBUTION",
              amount: Number(fr.absentee_fine),
              description: `Absentee Fine / Penalty — ${fr.project_category || "Group Farm"}`,
              status: "COMPLETED",
              reference: ref,
              is_legacy: true,
            });
          }
        }
      });

      // 8. Official wallet_ledger entries (CORE_DRIVER_BONUS, wallet debits/credits)
      (dbWalletLedger || []).forEach((entry: any) => {
        const ref = entry.reference_id || entry.id?.slice(0, 8) || "N/A";
        if (!items.some((it) => it.id === entry.id || (entry.category === "CORE_DRIVER_BONUS" && it.reference === ref))) {
          const isDebit = entry.entry_type === "DEBIT";
          items.push({
            id: entry.id || `ledger-${ref}`,
            date: entry.created_at || new Date().toISOString(),
            type: isDebit ? "DEBIT" : "CREDIT",
            category: entry.category || "CORE_DRIVER_BONUS",
            amount: Math.abs(Number(entry.amount) || 0),
            description: entry.description || "Core Driver Growth Pool Share",
            status: entry.status === "FAILED" ? "FAILED" : entry.status === "PENDING" ? "PENDING" : "COMPLETED",
            reference: ref,
            is_legacy: Boolean(entry.is_legacy || isLegacyMember(entry.created_at)),
          });
        }
      });

      // Sort by date descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(items);
    } catch (err) {
      console.error("Ledger load error", err);
      showToast({
        variant: "error",
        title: "Error Loading Ledger",
        description: "Could not load financial records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleRequery = async (overrideRef?: string) => {
    const targetRef = (overrideRef || requeryRef).trim();
    if (!targetRef) {
      showToast({
        variant: "error",
        title: "Reference Required",
        description: "Please enter your payment or transfer reference.",
      });
      return;
    }

    setRequeryLoading(true);
    setActiveRequeryRef(targetRef);
    try {
      // 1. Check in transactions table by payment_reference, transaction_ref, or numeric ID
      let checkoutData: any = null;
      const numericId = targetRef.replace(/\D/g, "");

      const { data: byRef } = await supabase
        .from("transactions")
        .select("*")
        .or(`payment_reference.eq.${targetRef},transaction_ref.eq.${targetRef}`)
        .maybeSingle();

      checkoutData = byRef;

      if (!checkoutData && numericId && Number(numericId) > 0) {
        const { data: byId } = await supabase
          .from("transactions")
          .select("*")
          .eq("id", numericId)
          .maybeSingle();
        checkoutData = byId;
      }

      // 2. Check in other_payments if not in checkout
      let paymentRecord = checkoutData;
      if (!paymentRecord) {
        const { data: opData } = await supabase
          .from("other_payments")
          .select("*")
          .eq("reference", targetRef)
          .maybeSingle();
        paymentRecord = opData;
      }

      // 3. Check by id prefix if reference is formatted like PAY- or CHK- or SUB-
      if (!paymentRecord) {
        const rawId = targetRef.replace(/^(CHK-|PAY-|SUB-)/i, "");
        if (rawId.length >= 8) {
          const { data: opById } = await supabase
            .from("other_payments")
            .select("*")
            .ilike("id", `${rawId}%`)
            .maybeSingle();
          if (opById) paymentRecord = opById;
        }
      }

      if (!paymentRecord) {
        showToast({
          variant: "error",
          title: "Payment Not Found",
          description: `No record matching reference "${targetRef}" was found in our system. Please check and try again.`,
        });
      } else {
        let statusStr = (paymentRecord.status || "UNKNOWN").toUpperCase();

        // If pending, attempt server activation or verification
        if (statusStr === "PENDING") {
          try {
            const verifyRes = await apiClient.member.activateGreenCard({
              paymentReference: targetRef,
              amount: Number(paymentRecord.amount || 0),
            }).catch(() => null);

            if (verifyRes && verifyRes.memberId) {
              statusStr = "PAID";
            }
          } catch (vErr) {
            console.warn("[TransactionLedger] Gateway verify check:", vErr);
          }
        }

        showToast({
          variant:
            statusStr === "COMPLETED" || statusStr === "PAID" || statusStr === "SUCCESS" || statusStr === "CONFIRMED"
              ? "success"
              : "warning",
          title: "Transaction Requeried",
          description: `Current transaction status: ${statusStr}. Your ledger has been synchronized.`,
        });
        setShowRequeryModal(false);
        setRequeryRef("");
        await loadLedger();
      }
    } catch {
      showToast({
        variant: "error",
        title: "Requery Failed",
        description: "Unable to complete requery at this time.",
      });
    } finally {
      setRequeryLoading(false);
      setActiveRequeryRef(null);
    }
  };

  const handleSubscribeWithWallet = async () => {
    setSubscribingWithWallet(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("subscribe_with_wallet_balance", {
        p_user_id: user.id,
      });

      if (error || (data && !data.success)) {
        showToast({
          variant: "error",
          title: "Subscription Failed",
          description:
            error?.message ||
            data?.message ||
            "Failed to activate subscription from wallet balance.",
        });
      } else {
        showToast({
          variant: "success",
          title: "Project Subscription Activated! 🎉",
          description:
            "₦10,000 wallet credit applied. Your project subscription is now active and bank withdrawals are unlocked!",
        });
        await loadLedger();
      }
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Error",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setSubscribingWithWallet(false);
    }
  };

  const isLegacyUser = Boolean(userProfile?.is_legacy || isLegacyMember(userProfile?.created_at));

  const filteredTransactions = transactions.filter((t) => {
    if (isLegacyUser) {
      if (legacyFilter === "LEGACY" && !t.is_legacy) return false;
      if (legacyFilter === "RECENT" && t.is_legacy) return false;
    }
    if (filterType === "PENDING") {
      if (t.status !== "PENDING") return false;
    } else if (filterType !== "ALL" && t.category !== filterType && t.type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }
    return true;
  });

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const cleanId = (memberId || "AGC").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Agroheal_Transactions_${cleanId}_${dateStamp}.xlsx`;

    const mapTxToRow = (t: LedgerItem, idx: number) => ({
      "S/N": idx + 1,
      "Date & Time": new Date(t.date).toLocaleString(),
      "Type": t.type,
      "Category": t.category.replace(/_/g, " "),
      "Reference": t.reference,
      "Amount (₦)": t.amount,
      "Status": t.status,
      "Description": t.description,
    });

    const overviewRows = [
      { "Metric": "Member ID", "Value": memberId },
      { "Metric": "Available Withdrawable Balance (₦)", "Value": availableBalance },
      { "Metric": "Total Cumulative Ledger Balance (₦)", "Value": ledgerBalance },
      { "Metric": "Direct Referral Wallet (₦)", "Value": directReferralEarnings },
      { "Metric": "5x7 Matrix Spillover Wallet (₦)", "Value": matrixEarnings },
      { "Metric": "Direct Referrals Count", "Value": directReferralsCount },
      { "Metric": "Active 30-Day PQV (₦)", "Value": activePqv30d },
      { "Metric": "Matrix Qualification Status", "Value": isMatrixQualified ? "QUALIFIED" : "QUALIFICATION REQUIRED" },
      { "Metric": "Total Ledger Transactions", "Value": transactions.length },
      { "Metric": "Active Filter", "Value": filterType === "ALL" && !searchQuery.trim() ? "None (All Transactions)" : `Category/Type: ${filterType}${searchQuery ? ` | Search: "${searchQuery}"` : ""}` },
      { "Metric": "Total Exported in Filtered Sheet", "Value": filteredTransactions.length },
      { "Metric": "Export Timestamp", "Value": new Date().toLocaleString() },
    ];

    const sheets: { sheetName: string; data: any[] }[] = [];
    const isFiltered = filterType !== "ALL" || searchQuery.trim().length > 0;

    if (isFiltered) {
      sheets.push({
        sheetName: "Filtered Setup",
        data: filteredTransactions.map(mapTxToRow),
      });
      sheets.push({
        sheetName: "All Transactions",
        data: transactions.map(mapTxToRow),
      });
    } else {
      sheets.push({
        sheetName: "All Transactions",
        data: transactions.map(mapTxToRow),
      });
    }

    sheets.push({
      sheetName: "Wallet Overview",
      data: overviewRows,
    });

    exportToExcel({
      filename,
      sheets,
    });

    showToast({
      variant: "success",
      title: "Ledger Export Generated",
      description: isFiltered
        ? `Exported ${filteredTransactions.length} filtered items + complete ${transactions.length} transactions history.`
        : `Exported all ${transactions.length} transactions and wallet overview to ${filename}.`,
    });
  };

  const handleSaveBankToProfile = async (bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        bank_name: bankDetails.bankName,
        bank_account_number: bankDetails.accountNumber,
        bank_account_name: bankDetails.accountName,
      })
      .eq("id", user.id);

    setUserProfile((prev) =>
      prev
        ? {
            ...prev,
            bank_name: bankDetails.bankName,
            bank_account_number: bankDetails.accountNumber,
            bank_account_name: bankDetails.accountName,
          }
        : null
    );

    showToast({
      variant: "success",
      title: "Bank Details Saved",
      description: `Default payout destination saved to profile: ${bankDetails.bankName}.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── HEADER & MEMBER ID BADGE ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {memberId && memberId !== "NO GREENCARD YET" && !memberId.includes("PENDING") && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-mono font-bold text-xs rounded-full border border-emerald-200">
                  {memberId}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Transaction Ledger & Wallets
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Immutable financial record of slot purchases, subscriptions, referral rewards, and network spillovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={isRefreshing}
              onClick={handleRefreshAll}
              className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl gap-2 font-semibold text-xs h-10 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing All..." : "Refresh Ledger & Wallet"}
            </Button>
          </div>
        </div>

        {/* ── TOP DUAL CARDS (CREDIT CARD ASPECT RATIO) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* ── CARD 1 (LEFT): EXECUTIVE MEMBER WALLET (CREDIT CARD HERO) ── */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#051c11] via-[#092917] to-[#03130b] border border-emerald-500/50 rounded-3xl p-4.5 sm:p-5 text-white shadow-xl relative overflow-hidden space-y-2.5">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />

            {/* Top Row: Logo + Member Wallet Tag + Name & Green Card ID + Contactless Icon */}
            <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <img
                  src={AgrohealImages.HeaderLogo}
                  alt="AgroHeal"
                  className="h-5 sm:h-6 object-contain brightness-0 invert opacity-95 shrink-0"
                />
                <div className="h-3.5 w-px bg-white/20 hidden sm:block" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase font-mono truncate">
                  MEMBER WALLET
                </span>
              </div>

              {/* Name & Green Card ID Header Placement */}
              <div className="flex items-center gap-2 ml-auto text-right min-w-0">
                <div className="min-w-0">
                  {loading ? (
                    <div className="space-y-1 flex flex-col items-end">
                      <Skeleton className="h-4 w-28 bg-white/20" />
                      <Skeleton className="h-3 w-20 bg-white/15" />
                    </div>
                  ) : (
                    <>
                      {userProfile?.full_name ? (
                        <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-[200px]">
                          {userProfile.full_name}
                        </p>
                      ) : null}
                      {hasGreenCard && memberId && memberId !== "NO GREENCARD YET" && !memberId.includes("PENDING") ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-300 block">
                          {memberId}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
                <Wifi className="w-3.5 h-3.5 rotate-90 text-emerald-300/70 hidden sm:block shrink-0" />
              </div>
            </div>

            {/* Middle: EMV Chip & Digital Ledger Tag */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                {/* Realistic Gold EMV Smart Microchip (Credit Card Chip) */}
                <div className="relative w-11 h-7.5 sm:w-12 sm:h-8.5 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-300 shadow-md p-0.5 overflow-hidden shrink-0">
                  <div className="w-full h-full rounded-[3px] border border-amber-800/40 grid grid-cols-3 grid-rows-3 gap-[1px]">
                    <div className="border-r border-b border-amber-800/40" />
                    <div className="border-b border-amber-800/40" />
                    <div className="border-l border-b border-amber-800/40" />
                    <div className="border-r border-amber-800/40" />
                    <div className="rounded-full bg-amber-700/40 mx-auto my-auto w-1.5 h-1.5" />
                    <div className="border-l border-amber-800/40" />
                    <div className="border-r border-t border-amber-800/40" />
                    <div className="border-t border-amber-800/40" />
                    <div className="border-l border-t border-amber-800/40" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isDirectReferralWithdrawable ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs backdrop-blur-md bg-emerald-500/20 text-emerald-200 border-emerald-400/35">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Withdrawable
                    </span>
                  ) : canSubscribeWithWallet ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs backdrop-blur-md bg-purple-500/25 text-purple-200 border-purple-400/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      ₦10k Ready to Activate
                    </span>
                  ) : null}
                  <span className="text-[9px] font-mono text-emerald-200/60 uppercase tracking-wider">
                    DEBIT / DIGITAL LEDGER
                  </span>
                </div>
              </div>

              {/* Dual Financial Balances */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Available Balance
                  </span>
                  {loading ? (
                    <Skeleton className="h-7 w-28 bg-white/20 my-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                      ₦{availableBalance.toLocaleString()}
                    </p>
                  )}
                  <span className="text-[9px] text-emerald-200/70 block">
                    Immediately Withdrawable
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block">
                    Ledger Balance
                  </span>
                  {loading ? (
                    <Skeleton className="h-7 w-28 bg-white/20 my-1" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-black font-mono text-gray-200 tracking-tight">
                      ₦{ledgerBalance.toLocaleString()}
                    </p>
                  )}
                  <span className="text-[9px] text-gray-400 block">
                    Total Cumulative Posted
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Directly on Card */}
            <div className="relative z-10 pt-2 border-t border-white/10 space-y-1.5 mt-auto">
              {canSubscribeWithWallet && (
                <Button
                  disabled={subscribingWithWallet}
                  onClick={handleSubscribeWithWallet}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-8.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  {subscribingWithWallet ? "Activating..." : "Activate Project Subscription (₦10,000)"}
                </Button>
              )}

              <Button
                disabled={availableBalance < 2000}
                onClick={() => {
                  setIsWithdrawModalOpen(true);
                }}
                className={`w-full h-8.5 sm:h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  availableBalance >= 2000
                    ? "bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs cursor-pointer"
                    : "bg-white/10 text-gray-400 border border-white/10 cursor-not-allowed"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                {availableBalance >= 2000
                  ? `Withdraw Available Funds (₦${availableBalance.toLocaleString()})`
                  : !isProjectSubscribed && walletBalance < 2000
                  ? "Withdrawal Locked (Project Subscription Required)"
                  : `Accumulate ₦${(2000 - rawClearedBalance).toLocaleString()} More to Withdraw (Min. ₦2,000)`}
              </Button>
            </div>
          </div>

          {/* ── CARD 2 (RIGHT): CAPITAL GATEKEEPERS & LOCKED FUNDS BREAKDOWN (MATCHING COMPACT HEIGHT) ── */}
          {loading ? (
            <div className="bg-gradient-to-br from-[#fafcf9] via-white to-emerald-50/40 rounded-3xl p-4.5 sm:p-5 border border-emerald-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden space-y-2.5">
              <div className="space-y-2.5 relative z-10">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-xl bg-gray-200" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36 bg-gray-200" />
                      <Skeleton className="h-3 w-48 bg-gray-100" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full bg-emerald-950/15" />
                </div>

                <div className="grid grid-cols-2 gap-2 bg-emerald-950/20 p-2.5 rounded-2xl border border-emerald-900/30">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20 bg-emerald-900/30" />
                    <Skeleton className="h-6 w-24 bg-emerald-900/40" />
                    <Skeleton className="h-2.5 w-28 bg-emerald-900/20" />
                  </div>
                  <div className="space-y-1 border-l border-emerald-900/20 pl-2.5">
                    <Skeleton className="h-3 w-20 bg-emerald-900/30" />
                    <Skeleton className="h-6 w-24 bg-emerald-900/40" />
                    <Skeleton className="h-2.5 w-28 bg-emerald-900/20" />
                  </div>
                </div>

                <div className="space-y-1.5 p-2 bg-gray-50/80 rounded-xl border border-gray-100">
                  <Skeleton className="h-3 w-full bg-gray-200" />
                  <Skeleton className="h-3 w-3/4 bg-gray-100" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 mt-auto">
                <Skeleton className="h-8.5 sm:h-9 w-full rounded-xl bg-gray-200" />
              </div>
            </div>
          ) : !hasGreenCard ? (
            <div className="bg-gradient-to-br from-emerald-50/90 via-white to-green-50/60 text-gray-900 rounded-3xl p-4.5 sm:p-5 border border-emerald-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden space-y-2.5">
              <div className="space-y-2.5 relative z-10">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200 font-bold shrink-0">
                      <Lock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Locked Capital &amp; Green Card Gate</h3>
                      <p className="text-[10px] text-gray-500">Official Membership Credential Required</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                    Pass Inactive
                  </span>
                </div>

                <div className="bg-white/90 border border-amber-200/70 rounded-2xl p-3 space-y-2 shadow-2xs">
                  <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                    Activate your <strong>₦2,000 AgroHeal Green Card</strong> to unlock:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">₦1,000 Direct Referral Rewards</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">7-Tier 5×7 Matrix Placement</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Official Member ID &amp; QR</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Academy Video Curricula</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-100 space-y-1.5 relative z-10 mt-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Activation Pass Fee</span>
                  <span className="font-mono font-black text-base text-emerald-950">₦2,000</span>
                </div>
                <Button
                  asChild
                  className="w-full h-8.5 sm:h-9 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-bold text-xs shadow-xs transition-all"
                >
                  <Link to="/dashboard/checkout?product=green_card">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Activate Green Card — ₦2,000
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#fafcf9] via-white to-emerald-50/40 rounded-3xl p-4.5 sm:p-5 border border-emerald-200/80 shadow-sm flex flex-col justify-between space-y-2 text-gray-900">
              <div className="space-y-2">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        totalLockedAmount > 0
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {totalLockedAmount > 0 ? (
                        <Lock className="w-4 h-4 text-amber-700" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Locked Capital &amp; Gatekeepers</h3>
                      <p className="text-[10px] text-gray-500">Real-time audit of restricted funds vs release conditions</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 inline-flex items-center gap-1 ${
                      totalLockedAmount > 0
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {totalLockedAmount > 0 ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-700" />
                        <span>₦{totalLockedAmount.toLocaleString()} Locked</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>100% Cleared</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Hero Total Locked Balance & Summary */}
                <div className="grid grid-cols-2 gap-2 bg-emerald-950 text-white p-2.5 rounded-2xl shadow-inner border border-emerald-900">
                  <div>
                    <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">
                      Total Locked Capital
                    </span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-tight">
                      ₦{totalLockedAmount.toLocaleString()}
                    </p>
                    <span className="text-[9px] text-emerald-200/70 block">
                      Pending gatekeeper releases
                    </span>
                  </div>

                  <div className="border-l border-white/10 pl-2.5">
                    <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">
                      Cleared Available
                    </span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
                      ₦{availableBalance.toLocaleString()}
                    </p>
                    <span className="text-[9px] text-emerald-200/70 block">
                      Ready for bank withdrawal
                    </span>
                  </div>
                </div>

                {/* Breakdown List: Due to what? */}
                <div className="space-y-1.5">
                  {/* Gate 1: 5×7 Matrix Pool */}
                  <div
                    className={`p-2 rounded-xl border text-[11px] transition-all ${
                      isMatrixQualified
                        ? "bg-emerald-50/60 border-emerald-200/70 text-emerald-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-950"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span className="flex items-center gap-1.5">
                        {isMatrixQualified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>1. 5×7 Matrix Spillover</span>
                      </span>
                      <span className="font-mono">₦{matrixEarnings.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 flex items-center justify-between">
                      <span>Condition: 5 Directs ({directReferralsCount}/5) &amp; ₦5k 30d PQV (₦{(activePqv30d / 1000).toFixed(0)}k/₦5k)</span>
                      <span className={`font-semibold ${isMatrixQualified ? "text-emerald-700" : "text-amber-700"}`}>
                        {isMatrixQualified ? "Cleared ✓" : "Locked in Ledger"}
                      </span>
                    </div>
                  </div>

                  {/* Gate 2: Direct Referral Bonuses */}
                  <div
                    className={`p-2 rounded-xl border text-[11px] transition-all ${
                      isDirectReferralWithdrawable
                        ? "bg-emerald-50/60 border-emerald-200/70 text-emerald-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-950"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <span className="flex items-center gap-1.5">
                        {isDirectReferralWithdrawable ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>2. Direct Referral Rewards</span>
                      </span>
                      <span className="font-mono">₦{directReferralEarnings.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 flex items-center justify-between">
                      <span>
                        {!isProjectSubscribed
                          ? "Condition: Farm Slot Project Subscription Required"
                          : directReferralEarnings < 2000
                          ? `Condition: ₦2,000 Min. Payout (₦${directReferralEarnings.toLocaleString()}/₦2,000)`
                          : "Fully cleared for bank withdrawal"}
                      </span>
                      <span className={`font-semibold ${isDirectReferralWithdrawable ? "text-emerald-700" : "text-amber-700"}`}>
                        {isDirectReferralWithdrawable ? "Withdrawable ✓" : "Locked / Accumulating"}
                      </span>
                    </div>
                  </div>

                  {/* Gate 3: Statutory Minimum Withdrawal Gate */}
                  {lockedBelowThresholdAmount > 0 && (
                    <div className="p-2 rounded-xl border text-[11px] transition-all bg-amber-50/70 border-amber-200 text-amber-950">
                      <div className="flex items-center justify-between font-bold mb-0.5">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>3. Statutory Minimum Withdrawal Gate</span>
                        </span>
                        <span className="font-mono">₦{lockedBelowThresholdAmount.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-gray-600 flex items-center justify-between">
                        <span>
                          Condition: Statutory min. ₦2,000 required to release to Available Balance (₦{rawClearedBalance.toLocaleString()}/₦2,000)
                        </span>
                        <span className="font-semibold text-amber-700">
                          Accumulating to ₦2k
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Contextual Release Action */}
              <div className="pt-1.5 border-t border-gray-100 mt-auto">
                {!isProjectSubscribed && directReferralEarnings >= 10000 ? (
                  <Button
                    onClick={handleSubscribeWithWallet}
                    disabled={subscribingWithWallet}
                    className="w-full h-8.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    {subscribingWithWallet ? "Activating..." : "Unlock with Wallet Credit (₦10,000)"}
                  </Button>
                ) : !isMatrixQualified ? (
                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-200/80">
                    <span className="text-[11px] text-gray-600">
                      Sponsor {Math.max(0, 5 - directReferralsCount)} more partners to unlock matrix spillover.
                    </span>
                    <Link
                      to="/dashboard/my-network"
                      className="font-bold text-emerald-800 hover:text-emerald-900 underline underline-offset-2 shrink-0 text-[11px]"
                    >
                      Invite Partners →
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50/80 py-1.5 rounded-xl border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All Gatekeepers Satisfied · Funds 100% Cleared</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* ── TRANSACTION HISTORY TABLE ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header & Search Filter */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <CreditCard className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900">Unified Transaction History</h2>
              {transactions.some((t) => t.status === "PENDING") && (
                <button
                  type="button"
                  onClick={() => setFilterType("PENDING")}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Filter to view pending transactions"
                >
                  <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                  <span>{transactions.filter((t) => t.status === "PENDING").length} Pending</span>
                </button>
              )}

              {isLegacyUser && (
                <div className="inline-flex items-center gap-1 p-0.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs ml-0 sm:ml-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 px-1.5 hidden md:inline">
                    Founding Members' Records:
                  </span>
                  <button
                    type="button"
                    onClick={() => setLegacyFilter("ALL")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      legacyFilter === "ALL"
                        ? "bg-white text-emerald-950 shadow-2xs border border-amber-300"
                        : "text-amber-800 hover:text-amber-950"
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegacyFilter("RECENT")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      legacyFilter === "RECENT"
                        ? "bg-white text-emerald-950 shadow-2xs border border-amber-300"
                        : "text-amber-800 hover:text-amber-950"
                    }`}
                  >
                    New Platform
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegacyFilter("LEGACY")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      legacyFilter === "LEGACY"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "text-amber-800 hover:text-amber-950"
                    }`}
                  >
                    Founding Members ({transactions.filter((t) => t.is_legacy).length})
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reference or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Filter Pills */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="PENDING">
                  Pending Transactions {transactions.some((t) => t.status === "PENDING") ? `(${transactions.filter((t) => t.status === "PENDING").length})` : ""}
                </option>
                <option value="COMBO_PACKAGE">Starter Bundles (Combo)</option>
                <option value="REFERRAL_BONUS">Referral Bonuses</option>
                <option value="CORE_DRIVER_BONUS">Core Driver Growth Bonuses</option>
                <option value="SLOT_PURCHASE">Slot Purchases</option>
                <option value="FARM_CONTRIBUTION">Farm Contributions</option>
                <option value="RETAIL_PURCHASE">Retail / Starter Packs</option>
                <option value="SUBSCRIPTION">Subscriptions</option>
                <option value="CREDIT">Credits Only</option>
                <option value="DEBIT">Debits Only</option>
              </select>

              <Button
                onClick={handleExportExcel}
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-gray-600" /> Export Excel
              </Button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Reference</th>
                  <th className="py-3.5 px-5 text-right">Amount</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="py-4 px-5">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-4 px-5">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="py-4 px-5">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </td>
                      <td className="py-4 px-5 text-center">
                        <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap font-medium text-gray-900">
                        {new Date(t.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-800 max-w-xs truncate">
                        <span>{t.description}</span>
                        {t.is_legacy && (
                          <span className="ml-1.5 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Founding Member
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          t.category === "COMBO_PACKAGE"
                            ? "bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold"
                            : t.category === "CORE_DRIVER_BONUS"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : t.category === "RETAIL_PURCHASE"
                            ? "bg-purple-100 text-purple-900 border border-purple-200"
                            : t.category === "FARM_CONTRIBUTION"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {t.category === "COMBO_PACKAGE"
                            ? "Starter Bundle"
                            : t.category === "CORE_DRIVER_BONUS"
                            ? "Growth Driver Bonus"
                            : t.category === "RETAIL_PURCHASE"
                            ? "Retail / Starter Pack"
                            : t.category === "FARM_CONTRIBUTION"
                            ? "Farm Contribution"
                            : t.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-[11px] text-gray-500 max-w-[140px] sm:max-w-[180px]">
                        <div className="flex items-center gap-1.5 group">
                          <span className="truncate select-all" title={t.reference}>
                            {t.reference}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(t.reference);
                              setCopiedRef(t.reference);
                              setTimeout(() => setCopiedRef(null), 2000);
                              showToast({
                                variant: "success",
                                title: "Reference Copied",
                                description: `${t.reference} copied to clipboard.`,
                              });
                            }}
                            className="p-1 rounded hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                            title="Copy full reference"
                          >
                            {copiedRef === t.reference ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td
                        className={`py-4 px-5 whitespace-nowrap text-right font-mono font-bold ${
                          t.type === "CREDIT" ? "text-emerald-700" : "text-gray-900"
                        }`}
                      >
                        {t.type === "CREDIT" ? "+" : "-"}₦{t.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : t.status === "FAILED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {t.status === "COMPLETED" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : t.status === "FAILED" ? (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            {t.status.toUpperCase()}
                          </span>

                          {t.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleRequery(t.reference)}
                              disabled={requeryLoading && activeRequeryRef === t.reference}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                              title={`Requery payment for reference ${t.reference}`}
                            >
                              <RefreshCw
                                className={`w-2.5 h-2.5 ${
                                  requeryLoading && activeRequeryRef === t.reference
                                    ? "animate-spin text-emerald-600"
                                    : "text-emerald-700"
                                }`}
                              />
                              <span>
                                {requeryLoading && activeRequeryRef === t.reference
                                  ? "Checking..."
                                  : "Requery"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── REQUERY MODAL ── */}
        {showRequeryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-gray-900 text-base">Requery Dropped Payment</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRequeryModal(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                If your card or transfer payment succeeded at checkout but was not automatically reflected in your dashboard, enter the transaction reference to verify and sync your records.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Payment Reference</label>
                <input
                  type="text"
                  placeholder="e.g. AGRO-PAY-XXXXXXXX or Paystack reference"
                  value={requeryRef}
                  onChange={(e) => setRequeryRef(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-mono text-gray-800 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRequeryModal(false)}
                  className="h-10 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRequery()}
                  disabled={requeryLoading}
                  className="h-10 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-5"
                >
                  {requeryLoading ? "Verifying..." : "Verify & Restore"}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Disbursal & Bank Withdrawal Modal */}
        <WithdrawalModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          directReferralBalance={directReferralEarnings}
          matrixBalance={matrixEarnings}
          walletBalance={walletBalance}
          availableBalance={availableBalance}
          isDirectReferralWithdrawable={isDirectReferralWithdrawable}
          isMatrixQualified={isMatrixQualified}
          savedBankName={userProfile?.bank_name}
          savedAccountNumber={userProfile?.bank_account_number}
          savedAccountName={userProfile?.bank_account_name}
          userEmail={userProfile?.email}
          isLegacy={Boolean(userProfile?.is_legacy)}
          hasPurchasedStarterPack={Boolean(userProfile?.has_purchased_starter_pack)}
          onSaveBankToProfile={handleSaveBankToProfile}
          onSuccess={() => {
            loadLedger();
          }}
        />
      </div>
    </div>
  );
};
