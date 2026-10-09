import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  ShoppingBag,
  Lock,
  FileSpreadsheet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Wifi,
  Copy,
  Check,
  Zap,
  Landmark,
  Sparkles,
  Info,
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
import { DataPagination } from "@/components/ui/pagination";

interface LedgerItem {
  id: string;
  date: string;
  type: "CREDIT" | "DEBIT";
  category: "REFERRAL_BONUS" | "SLOT_PURCHASE" | "SUBSCRIPTION" | "WITHDRAWAL" | "MATRIX_COMMISSION" | "CORE_DRIVER_BONUS" | "RETAIL_PURCHASE" | "FARM_CONTRIBUTION" | "COMBO_PACKAGE" | "SLOT_BONUS" | "ADVANCE_RECOVERY";
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

export default function TransactionLedger({ defaultMode }: { defaultMode?: "live" | "legacy" } = {}) {
  const location = useLocation();
  const isLegacyPath = location.pathname.startsWith("/legacy");
  const [walletMode, setWalletMode] = useState<"live" | "legacy">(
    defaultMode || (isLegacyPath ? "legacy" : "live")
  );

  useEffect(() => {
    if (defaultMode) {
      setWalletMode(defaultMode);
    } else if (location.pathname.startsWith("/legacy")) {
      setWalletMode("legacy");
    } else {
      setWalletMode("live");
    }
  }, [location.pathname, defaultMode]);

  const [loading, setLoading] = useState<boolean>(true);
  const [memberId, setMemberId] = useState<string>("NO GREENCARD YET");
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    email?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    bank_code?: string;
    bank_verified?: boolean;
    bank_updated_at?: string;
    is_legacy?: boolean;
    has_purchased_starter_pack?: boolean;
    created_at?: string;
    referral_earnings?: number;
    slot_bonus?: number;
  } | null>(null);
  const [directReferralEarnings, setDirectReferralEarnings] = useState<number>(0);
  const [matrixEarnings, setMatrixEarnings] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [advanceDebt, setAdvanceDebt] = useState<{
    balance: number;
    total: number;
    repaid: number;
    isIndebted: boolean;
  } | null>(null);
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
  const [copiedDesc, setCopiedDesc] = useState<string | null>(null);
  const [activeLedgerTab, setActiveLedgerTab] = useState<"wallet_ledger" | "purchase_history">("wallet_ledger");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isItemLegacy = (t: LedgerItem) => {
    // Core Driver Growth Pool bonuses are strictly live wallet entries regardless of historical creation date
    if (t.category === "CORE_DRIVER_BONUS") return false;
    return Boolean(t.is_legacy) || isLegacyMember(t.date);
  };

  const legacyTransactions = React.useMemo(() => transactions.filter(isItemLegacy), [transactions]);
  const liveTransactions = React.useMemo(() => transactions.filter((t) => !isItemLegacy(t)), [transactions]);

  const legacyEarnings = React.useMemo(() => {
    const historicalTxSum = legacyTransactions
      .filter((t) => t.type === "CREDIT" && t.status === "COMPLETED")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const profileLegacySum = Number(userProfile?.referral_earnings || 0) + Number(userProfile?.slot_bonus || 0);
    return Math.max(historicalTxSum, profileLegacySum);
  }, [legacyTransactions, userProfile]);
  const legacySlotsCount = React.useMemo(() => {
    return legacyTransactions.filter((t) => t.category === "SLOT_PURCHASE" || t.category === "FARM_CONTRIBUTION").length;
  }, [legacyTransactions]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "COMBO_PACKAGE":
        return "Starter Bundle";
      case "CORE_DRIVER_BONUS":
        return "Growth Driver Pool";
      case "RETAIL_PURCHASE":
        return "Starter Pack Product";
      case "FARM_CONTRIBUTION":
        return "Farm Contribution";
      case "SLOT_PURCHASE":
        return "Farm Slot";
      case "SUBSCRIPTION":
        return "Green Card Pass";
      case "DIRECT_REFERRAL":
        return "Direct Sponsor Bonus";
      case "MATRIX_SPILLOVER":
        return "Matrix Commission";
      case "SLOT_BONUS":
        return "Slot Bonus";
      case "HARVEST_DIVIDEND":
        return "Harvest Dividend";
      case "WITHDRAWAL":
        return "Bank Withdrawal";
      case "ADVANCE_RECOVERY":
        return "Advance Auto-Recovery";
      case "CORP_PROMO_GRANT":
        return "Corporate Promo Grant";
      default:
        return category.replace(/_/g, " ");
    }
  };

  // Matrix Withdrawal Qualification: 5 direct referrals AND ₦10,000 PQV in 30 days
  const isMatrixQualified = directReferralsCount >= 5 && activePqv30d >= 10000;

  // Direct Referral Withdrawal Qualification: Active Project Subscribed AND >= 5 direct referrals AND >= ₦2,000
  const isDirectReferralWithdrawable = isProjectSubscribed && directReferralsCount >= 5 && directReferralEarnings >= 2000;
  // Pay from wallet temporarily disabled/commented out as requested
  const canSubscribeWithWallet = false;
  const hasGreenCard = Boolean(memberId && memberId !== "NO GREENCARD YET" && !memberId.includes("PENDING"));

  // Authoritative financial balances: In live mode, balance is strictly the live liquid walletBalance
  // In legacy mode, it is the legacy pre-migration total
  const ledgerBalance = walletMode === "live"
    ? walletBalance
    : legacyEarnings;

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
          if (apiSummary.advanceDebt) {
            setAdvanceDebt(apiSummary.advanceDebt);
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
          .select("member_id, full_name, email, referral_earnings, slot_bonus, wallet_balance, total_referrals, created_at, bank_name, bank_account_number, bank_account_name, bank_code, bank_verified, bank_updated_at, is_legacy, is_green_card_holder, has_greencard, greencard_status, has_purchased_starter_pack, advance_debt_balance, advance_debt_total")
          .eq("id", user.id)
          .maybeSingle();

        if (pData?.advance_debt_balance && Number(pData.advance_debt_balance) > 0) {
          setAdvanceDebt((prev) => prev || {
            balance: Number(pData.advance_debt_balance) || 0,
            total: Number(pData.advance_debt_total) || Number(pData.advance_debt_balance) || 0,
            repaid: Math.max(0, (Number(pData.advance_debt_total) || 0) - (Number(pData.advance_debt_balance) || 0)),
            isIndebted: true,
          });
        }

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

      const isLegacy = Boolean(profile?.is_legacy || isLegacyMember(profile?.created_at));

      if (profile) {
        setUserProfile({
          full_name: profile.full_name,
          email: profile.email,
          bank_name: profile.bank_name,
          bank_account_number: profile.bank_account_number,
          bank_account_name: profile.bank_account_name,
          bank_code: profile.bank_code,
          bank_verified: Boolean(profile.bank_verified),
          bank_updated_at: profile.bank_updated_at,
          is_legacy: isLegacy,
          has_purchased_starter_pack: Boolean(profile?.has_purchased_starter_pack),
          created_at: profile.created_at,
          referral_earnings: Number(profile.referral_earnings || 0),
          slot_bonus: Number(profile.slot_bonus || 0),
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

      // STRICT BARRICADE: Live wallet MUST NOT pull legacy balances (profiles.referral_earnings, profiles.slot_bonus)
      // Live wallet balances strictly derive from the live double-entry wallet_ledger and live profile.wallet_balance
      const liveLedgerList = dbWalletLedger || [];
      let refEarnings = 0;
      if (apiSummary?.directReferralWallet?.balance !== undefined) {
        refEarnings = Number(apiSummary.directReferralWallet.balance) || 0;
      } else {
        refEarnings = liveLedgerList
          .filter(
            (e: any) =>
              e.category === "REFERRAL_BONUS" &&
              e.entry_type === "CREDIT" &&
              !e.is_legacy &&
              (e.status || "").toUpperCase() !== "PENDING"
          )
          .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
      }
      setDirectReferralEarnings(refEarnings);

      const wBal = Number(profile?.wallet_balance) || 0;
      setWalletBalance(wBal);

      let matEarnings = 0;
      if (apiSummary?.matrixSpilloverWallet?.balance !== undefined) {
        matEarnings = Number(apiSummary.matrixSpilloverWallet.balance) || 0;
      } else {
        matEarnings = liveLedgerList
          .filter(
            (e: any) =>
              (e.category === "MATRIX_COMMISSION" ||
                e.category === "SLOT_BONUS" ||
                e.category === "CORE_DRIVER_BONUS") &&
              e.entry_type === "CREDIT" &&
              !e.is_legacy &&
              (e.status || "").toUpperCase() !== "PENDING"
          )
          .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
      }
      setMatrixEarnings(matEarnings);

      const hasBoughtStarter = Boolean(
        profile?.has_purchased_starter_pack ||
        (orders && orders.some((o: any) => o.product_code === "SP-MUSH-100G" && (o.status || "").toUpperCase() === "PAID"))
      );

      // Management Rule: Legacy members MUST purchase the ₦5,000 Mushroom Power 100g to unlock withdrawals & matrix.
      // Non-legacy members must hold active farm slots / starter package.
      const hasActiveSub = isLegacy
        ? hasBoughtStarter
        : Boolean(
            hasBoughtStarter ||
            (slotSubscriptions && slotSubscriptions.some((s: any) => (s.status || '').toLowerCase() === 'active')) ||
            (checkouts && checkouts.some((c: any) => (Number(c.amount) >= 10000 || Number(c.amount) === 12000) && ['paid', 'success', 'completed'].includes((c.status || '').toLowerCase())))
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

      // Official wallet_ledger entries from API or direct DB query
      const ledgerSource = apiLedgerEntries.length > 0 ? apiLedgerEntries : (dbWalletLedger || []);
      if (ledgerSource.length > 0) {
        ledgerSource.forEach((entry: any) => {
          if ((entry.status || "").toUpperCase() === "PENDING") return; // Pending loan commissions should not show in UI at all
          items.push({
            id: entry.id || `ledger-${entry.reference_id || Math.random()}`,
            date: entry.created_at || new Date().toISOString(),
            type: entry.entry_type === "DEBIT" ? "DEBIT" : "CREDIT",
            category: entry.category || "REFERRAL_BONUS",
            amount: Number(entry.amount) || 0,
            description: entry.description || "Wallet Transaction",
            status: entry.status === "FAILED" ? "FAILED" : "COMPLETED",
            reference: entry.reference_id || entry.id || "N/A",
            is_legacy: entry.category === "CORE_DRIVER_BONUS" ? false : Boolean(entry.is_legacy || isLegacyMember(entry.created_at)),
          });
        });
      }

      // 1. Direct referral earnings entries (for non-legacy or fallback if no ledger entries)
      if (!isLegacy && refEarnings > 0 && !items.some((i) => i.category === "REFERRAL_BONUS" && !i.is_legacy)) {
        items.push({
          id: `ref-total-${user.id}`,
          date: profile?.created_at || new Date().toISOString(),
          type: "CREDIT",
          category: "REFERRAL_BONUS",
          amount: refEarnings,
          description: `Direct Referral Bonuses (${refCount} active referrals)`,
          status: "COMPLETED",
          reference: `DIR-REF-${refCount}`,
          is_legacy: false,
        });
      }

      // For legacy users, inject their pre-migration earnings strictly into Founding Records
      if (isLegacy) {
        if (Number(profile?.referral_earnings || 0) > 0 && !items.some((i) => i.reference === "FOUNDING-REF-ARCHIVE")) {
          items.push({
            id: `legacy-ref-${user.id}`,
            date: profile?.created_at || "2024-01-01T00:00:00Z",
            type: "CREDIT",
            category: "REFERRAL_BONUS",
            amount: Number(profile.referral_earnings),
            description: "Preserved Founding Referral Earnings (Pre-Migration)",
            status: "COMPLETED",
            reference: "FOUNDING-REF-ARCHIVE",
            is_legacy: true,
          });
        }
        if (Number(profile?.slot_bonus || 0) > 0 && !items.some((i) => i.reference === "FOUNDING-SLOT-ARCHIVE")) {
          items.push({
            id: `legacy-slot-${user.id}`,
            date: profile?.created_at || "2024-01-01T00:00:00Z",
            type: "CREDIT",
            category: "SLOT_BONUS",
            amount: Number(profile.slot_bonus),
            description: "Preserved Founding Slot Bonus (Pre-Migration)",
            status: "COMPLETED",
            reference: "FOUNDING-SLOT-ARCHIVE",
            is_legacy: true,
          });
        }
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
        const rawCategory = c.project_category || "";
        const cleanCat = rawCategory
          .replace(/Mushroom Farm,\s*Mushroom Farm/gi, "Mushroom Farm")
          .replace(/Mushroom Village,\s*Mushroom Village/gi, "Mushroom Village")
          .replace(/,\s*,/g, ",")
          .trim();
        const catLower = cleanCat.toLowerCase();

        const isComboTx =
          catLower.includes("combo") ||
          amount === 12000 ||
          amount === 11000 ||
          (amount === 10000 && !catLower.includes("slot"));

        const isGreenCardTx =
          catLower.includes("green card") ||
          amount === 2000 ||
          (amount === 1000 && isLegacyMember(c.created_at));

        // For members whose green card was not paid for, it should not reflect in their transaction history
        if (isGreenCardTx && !isCCompleted) {
          return;
        }

        if (isCCompleted && (isComboTx || isGreenCardTx)) {
          hasCompletedOnlineGreenCard = true;
        }

        let category: LedgerItem["category"] = "SLOT_PURCHASE";
        let description = cleanCat ? `Online Payment — ${cleanCat}` : "Online Platform Payment";

        const linkedOrders = (orders || []).filter((o: any) => String(o.transaction_id) === String(c.id));
        const linkedSlots = (slotSubscriptions || []).filter((s: any) => String(s.checkout_id) === String(c.id));

        if (c.notes && (c.notes.toLowerCase().includes("corporate advance") || c.notes.toLowerCase().includes("corporate loan") || c.notes.toLowerCase().includes("advance debt recovery"))) {
          category = "ADVANCE_RECOVERY";
          description = c.notes;
        } else if (linkedOrders.length > 0 && linkedSlots.length > 0) {
          category = "COMBO_PACKAGE";
          const slotCount = linkedSlots.reduce((sum: number, s: any) => sum + (Number(s.slots) || 0), 0);
          const prodNames = linkedOrders.map((o: any) => `${o.quantity > 1 ? `${o.quantity}x ` : ""}${o.product_code === "SP-MUSH-100G" ? "Mushroom Power 100g" : (o.product_code || "Product")}`).join(", ");
          description = `Secured ${slotCount} Farm Slot(s) + ${prodNames} — ${cleanCat || "Mushroom Village"}`;
        } else if (linkedOrders.length > 0 && linkedSlots.length === 0) {
          category = "RETAIL_PURCHASE";
          const prodNames = linkedOrders.map((o: any) => `${o.quantity > 1 ? `${o.quantity}x ` : ""}${o.product_code === "SP-MUSH-100G" ? "Mushroom Power 100g" : (o.product_code || "Product")}`).join(", ");
          description = `Product Purchase: ${prodNames}`;
        } else if (linkedSlots.length > 0) {
          category = "SLOT_PURCHASE";
          const slotCount = linkedSlots.reduce((sum: number, s: any) => sum + (Number(s.slots) || 0), 0);
          description = `Secured ${slotCount} Farm Slot(s) — ${cleanCat || "Mushroom Village"}`;
        } else if (amount === 12000 || (isComboTx && amount === 12000)) {
          category = "COMBO_PACKAGE";
          description = "Starter Combo Bundle (1 Farm Slot ₦5,000 + Mushroom Power 100g ₦5,000 + Green Card Pass ₦2,000)";
        } else if (amount === 11000 || (isComboTx && amount === 11000)) {
          category = "COMBO_PACKAGE";
          description = "Starter Combo Bundle (1 Farm Slot ₦5,000 + Mushroom Power 100g ₦5,000 + Legacy Green Card ₦1,000)";
        } else if (amount === 10000 && (isComboTx || !catLower.includes("slot"))) {
          category = "COMBO_PACKAGE";
          description = "Starter Combo Bundle (1 Farm Slot ₦5,000 + Mushroom Power 100g ₦5,000 [Free Legacy Green Card])";
        } else if (isComboTx) {
          category = "COMBO_PACKAGE";
          description = "Starter Combo Bundle (1 Farm Slot ₦5,000 + Mushroom Power 100g ₦5,000 + Green Card)";
        } else if (isGreenCardTx) {
          category = "SUBSCRIPTION";
          description = "AgroHeal Green Card Activation (Lifetime Certified Digital Pass)";
        } else if (catLower.includes("starter pack") || (amount === 5000 && catLower.includes("product"))) {
          category = "RETAIL_PURCHASE";
          description = "Starter Pack Product: Mushroom Power 100g";
        } else if (catLower.includes("slot") || amount >= 5000) {
          const count = Math.max(1, Math.floor(amount / 5000));
          category = "SLOT_PURCHASE";
          description = `Secured ${count} Farm Slot(s) — ${cleanCat || "Mushroom Village"}`;
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

        const cleanSlotCat = (ss.project_category || "Farm Project")
          .replace(/Mushroom Farm,\s*Mushroom Farm/gi, "Mushroom Farm")
          .replace(/Mushroom Village,\s*Mushroom Village/gi, "Mushroom Village")
          .replace(/,\s*,/g, ",")
          .trim();

        items.push({
          id: `slot-${ss.id || idx}`,
          date: ss.created_at || ss.last_payment_date || new Date().toISOString(),
          type: "DEBIT",
          category: "SLOT_PURCHASE",
          amount: Number(ss.amount) || slotsCount * 5000,
          description: `Secured ${slotsCount} Slot(s) — ${cleanSlotCat}`,
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

      // 5. Other verified payments (direct transfers/receipts)
      (otherPayments || []).forEach((p: any) => {
        const pStatus = (p.status || "").toLowerCase();
        const isPCompleted = ["confirmed", "active", "success", "paid", "completed"].includes(pStatus);
        const isPFailed = ["failed", "rejected"].includes(pStatus);
        const pType = (p.payment_type || "").toLowerCase();
        // Unpaid Green Cards must not reflect in transaction ledger
        if (pType.includes("green") && !isPCompleted) {
          return;
        }
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
        const cleanFrCat = (fr.project_category || "Group Farm")
          .replace(/Mushroom Farm,\s*Mushroom Farm/gi, "Mushroom Farm")
          .replace(/Mushroom Village,\s*Mushroom Village/gi, "Mushroom Village")
          .replace(/,\s*,/g, ",")
          .trim();

        if (fr.months_farm_setup && fr.months_farm_setup.toLowerCase() !== "0" && fr.months_farm_setup.toLowerCase() !== "unpaid") {
          const ref = `SETUP-${fr.id.slice(0, 8).toUpperCase()}`;
          if (!items.some((it) => it.reference === ref)) {
            items.push({
              id: `fr-setup-${fr.id}`,
              date: fr.created_at || "2024-01-01T00:00:00.000Z",
              type: "DEBIT",
              category: "FARM_CONTRIBUTION",
              amount: 0,
              description: `Farm Setup Contribution — ${cleanFrCat} (${fr.months_farm_setup})`,
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
              description: `Farm Support Contribution — ${cleanFrCat} (${fr.months_farm_support})`,
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
              description: `Absentee Fine / Penalty — ${cleanFrCat}`,
              status: "COMPLETED",
              reference: ref,
              is_legacy: true,
            });
          }
        }
      });

      // 8. Official wallet_ledger entries (CORE_DRIVER_BONUS, wallet debits/credits)
      (dbWalletLedger || []).forEach((entry: any) => {
        if ((entry.status || "").toUpperCase() === "PENDING") return; // Pending loan commissions should not show in UI at all
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
            status: entry.status === "FAILED" ? "FAILED" : "COMPLETED",
            reference: ref,
            is_legacy: entry.category === "CORE_DRIVER_BONUS" ? false : Boolean(entry.is_legacy || isLegacyMember(entry.created_at)),
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

  const isPurchaseCategory = (cat: string) => {
    return ["COMBO_PACKAGE", "SUBSCRIPTION", "SLOT_PURCHASE", "RETAIL_PURCHASE", "FARM_CONTRIBUTION"].includes(cat);
  };

  const activeBaseTransactions = walletMode === "live" ? liveTransactions : legacyTransactions;
  const walletLedgerCount = React.useMemo(
    () => activeBaseTransactions.filter((t) => !isPurchaseCategory(t.category)).length,
    [activeBaseTransactions]
  );
  const purchaseHistoryCount = React.useMemo(
    () => activeBaseTransactions.filter((t) => isPurchaseCategory(t.category)).length,
    [activeBaseTransactions]
  );

  const filteredTransactions = transactions.filter((t) => {
    const isLegacy = isItemLegacy(t);
    if (walletMode === "live" && isLegacy) return false;
    if (walletMode === "legacy" && !isLegacy) return false;

    // Filter by Active Ledger Tab (Applies exclusively to Live Wallet):
    // "wallet_ledger" -> Pure internal earnings & disbursements (referrals, matrix commissions, driver bonuses, slot bonuses, withdrawals)
    // "purchase_history" -> Clear list of external orders and card receipts (combo bundles, starter packs, farm slots, subscriptions)
    if (walletMode === "live") {
      if (activeLedgerTab === "wallet_ledger" && isPurchaseCategory(t.category)) return false;
      if (activeLedgerTab === "purchase_history" && !isPurchaseCategory(t.category)) return false;
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, walletMode, activeLedgerTab]);

  const PAGE_SIZE = 10;
  const paginatedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

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

        {/* ── CENTRALIZED EXECUTIVE MEMBER WALLET (CANONICAL CREDIT CARD ASPECT RATIO) ── */}
        <div className="w-full max-w-[470px] mx-auto">

          <div className={`flex flex-col justify-between ${
            walletMode === "legacy"
              ? "bg-[#1f1707] border-amber-600/60"
              : "bg-[#0c2415] border-emerald-700/50"
          } border rounded-3xl p-5 sm:p-5.5 text-white shadow-xl relative overflow-hidden space-y-3 transition-colors duration-300`}>
            {/* Background Ambient Glows */}
            <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full ${
              walletMode === "legacy" ? "bg-amber-400/15" : "bg-emerald-400/10"
            } blur-3xl pointer-events-none`} />
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
                <span className={`text-[10px] font-bold tracking-widest ${
                  walletMode === "legacy" ? "text-amber-300" : "text-emerald-300"
                } uppercase font-mono truncate`}>
                  {walletMode === "legacy" ? "LEGACY ARCHIVE" : "MEMBER WALLET"}
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
                        <span className={`text-[10px] font-mono font-bold ${
                          walletMode === "legacy" ? "text-amber-300" : "text-emerald-300"
                        } block`}>
                          {memberId}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
                <Wifi className={`w-3.5 h-3.5 rotate-90 ${
                  walletMode === "legacy" ? "text-amber-300/70" : "text-emerald-300/70"
                } hidden sm:block shrink-0`} />
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
                  {walletMode === "legacy" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border shadow-xs backdrop-blur-md bg-amber-500/25 text-amber-200 border-amber-400/40">
                      <Landmark className="w-3 h-3 text-amber-300" />
                      Preserved Record
                    </span>
                  ) : isDirectReferralWithdrawable ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs backdrop-blur-md bg-emerald-500/20 text-emerald-200 border-emerald-400/35">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Withdrawable
                    </span>
                  ) : canSubscribeWithWallet ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs backdrop-blur-md bg-emerald-500/25 text-emerald-200 border-emerald-400/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ₦10k Ready to Activate
                    </span>
                  ) : null}
                  <span className={`text-[9px] font-mono ${
                    walletMode === "legacy" ? "text-amber-200/70" : "text-emerald-200/60"
                  } uppercase tracking-wider`}>
                    {walletMode === "legacy" ? "PRE-MIGRATION RECORD" : "DEBIT / DIGITAL LEDGER"}
                  </span>
                </div>
              </div>

              {/* Balances Display: Conditional based on walletMode */}
              {walletMode === "legacy" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-amber-500/30 space-y-0.5">
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                      Legacy Cumulative
                    </span>
                    {loading ? (
                      <Skeleton className="h-7 w-28 bg-white/20 my-1" />
                    ) : (
                      <p className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                        ₦{legacyEarnings.toLocaleString()}
                      </p>
                    )}
                    <span className="text-[9px] text-amber-200/70 block">
                      Preserved Offline Roster
                    </span>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block">
                      Breakdown
                    </span>
                    {loading ? (
                      <Skeleton className="h-7 w-28 bg-white/20 my-1" />
                    ) : (
                      <div className="text-xs font-mono text-gray-200 space-y-0.5 pt-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Referrals:</span>
                          <span className="font-bold">₦{(Number(userProfile?.referral_earnings) || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-[10px]">Slots:</span>
                          <span className="font-bold">₦{(Number(userProfile?.slot_bonus) || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    <span className="text-[9px] text-gray-400 block pt-0.5">
                      {legacySlotsCount} Founding Slot{legacySlotsCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-0.5">
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

                  <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-0.5">
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
              )}
            </div>

            {/* Bottom Actions Directly on Card */}
            <div className="relative z-10 pt-2 border-t border-white/10 space-y-2 mt-auto">
              {walletMode === "legacy" ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Preserved founding records prior to 2026 platform migration.</span>
                  </span>
                  <Link
                    to="/dashboard/transactions"
                    className="text-xs font-bold text-amber-300 hover:text-white underline underline-offset-2 shrink-0 ml-2"
                  >
                    Modern Wallet →
                  </Link>
                </div>
              ) : (
                <>
                  {canSubscribeWithWallet && (
                    <Button
                      disabled={subscribingWithWallet}
                      onClick={handleSubscribeWithWallet}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sprout className="w-3.5 h-3.5 text-emerald-200" />
                      {subscribingWithWallet ? "Activating..." : "Activate Project Subscription (₦10,000)"}
                    </Button>
                  )}

                  <Button
                    disabled={availableBalance < 2000}
                    onClick={() => {
                      setIsWithdrawModalOpen(true);
                    }}
                    className={`w-full h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      availableBalance >= 2000
                        ? "bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs cursor-pointer"
                        : "bg-white/10 text-gray-400 border border-white/10 cursor-not-allowed"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    {availableBalance >= 2000
                      ? `Withdraw Available Funds (₦${availableBalance.toLocaleString()})`
                      : userProfile?.is_legacy && !userProfile?.has_purchased_starter_pack
                      ? "Withdrawal Locked (₦5,000 Mushroom Power Required)"
                      : !isProjectSubscribed
                      ? "Withdrawal Locked (Starter Package Required)"
                      : `Accumulate ₦${(2000 - rawClearedBalance).toLocaleString()} More to Withdraw (Min. ₦2,000)`}
                  </Button>

                  {totalLockedAmount > 0 && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-amber-200/80">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>₦{totalLockedAmount.toLocaleString()} held in reserve</span>
                      </span>
                      <Link
                        to="/how-it-works/locked-withdrawals"
                        className="underline underline-offset-2 hover:text-white transition-colors"
                      >
                        Release conditions →
                      </Link>
                    </div>
                  )}

                  {advanceDebt && advanceDebt.isIndebted && advanceDebt.balance > 0 && (
                    <div className="pt-2">
                      <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200">
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className="flex items-center gap-1.5 text-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            Corporate Advance Active
                          </span>
                          <span className="text-white font-mono">
                            ₦{advanceDebt.balance.toLocaleString()} remaining
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200/70">
                          100% of future earnings will automatically settle this advance (Repaid: ₦{advanceDebt.repaid.toLocaleString()} of ₦{advanceDebt.total.toLocaleString()}).
                        </p>
                      </div>
                    </div>
                  )}

                  {userProfile?.is_legacy && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-200/80">
                      <span className="flex items-center gap-1.5">
                        <Landmark className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Have preserved founding earnings?</span>
                      </span>
                      <Link
                        to="/legacy/dashboard/transactions"
                        className="underline underline-offset-2 hover:text-white text-amber-300 transition-colors font-medium"
                      >
                        View Legacy Archive →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── TRANSACTION HISTORY TABLE ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header & Search Filter */}
          <div className="p-5 border-b border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  {walletMode === "legacy" ? (
                    <Landmark className="w-4 h-4 text-amber-700" />
                  ) : activeLedgerTab === "wallet_ledger" ? (
                    <Wallet className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {walletMode === "legacy"
                      ? "Preserved Founding Records (Pre-Migration)"
                      : activeLedgerTab === "wallet_ledger"
                      ? "Member Wallet Ledger"
                      : "Orders & Purchase History"}
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    {walletMode === "legacy"
                      ? "Archival record of legacy commissions, founding slots, and historical referral credits"
                      : activeLedgerTab === "wallet_ledger"
                      ? "Pure double-entry statement of referral rewards, matrix commissions, driver pool & withdrawals"
                      : "Official receipts of farm slots, starter packages, products & card checkout payments"}
                  </p>
                </div>
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
              </div>

              {/* Sub-Tabs: Wallet Ledger vs Purchase History (Exclusively for Live Wallet) */}
              {walletMode === "live" && (
                <div className="inline-flex p-1 bg-gray-100/90 border border-gray-200/70 rounded-2xl shadow-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLedgerTab("wallet_ledger");
                      setFilterType("ALL");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeLedgerTab === "wallet_ledger"
                        ? "bg-white text-emerald-950 shadow-xs border border-gray-200/60"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Wallet Ledger</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      {walletLedgerCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLedgerTab("purchase_history");
                      setFilterType("ALL");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeLedgerTab === "purchase_history"
                        ? "bg-white text-emerald-950 shadow-xs border border-gray-200/60"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                    <span>Orders & Receipts</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-900 font-bold border border-amber-200">
                      {purchaseHistoryCount}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter Bar: Row 2 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reference or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50/70 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Contextual Filter Pills */}
                {walletMode === "legacy" ? (
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50/70 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">All Preserved Records</option>
                    <option value="SLOT_BONUS">Slot Bonuses</option>
                    <option value="REFERRAL_BONUS">Referral Earnings</option>
                    <option value="SLOT_PURCHASE">Farm Slot Purchases</option>
                    <option value="FARM_CONTRIBUTION">Farm Contributions</option>
                  </select>
                ) : activeLedgerTab === "wallet_ledger" ? (
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50/70 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">All Ledger Entries</option>
                    <option value="PENDING">Pending Only</option>
                    <option value="REFERRAL_BONUS">Direct Referral Bonuses</option>
                    <option value="CORE_DRIVER_BONUS">Growth Driver Pool</option>
                    <option value="SLOT_BONUS">Slot Bonuses</option>
                    <option value="MATRIX_COMMISSION">Matrix Commissions</option>
                    <option value="WITHDRAWAL">Bank Withdrawals</option>
                    <option value="CREDIT">Credits Only</option>
                    <option value="DEBIT">Debits Only</option>
                  </select>
                ) : (
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50/70 text-xs text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ALL">All Purchases & Orders</option>
                    <option value="PENDING">Pending Payments</option>
                    <option value="COMBO_PACKAGE">Starter Bundles (Combo)</option>
                    <option value="RETAIL_PURCHASE">Starter Pack Products (Mushroom Power)</option>
                    <option value="SLOT_PURCHASE">Farm Slot Purchases</option>
                    <option value="SUBSCRIPTION">Green Card Passes</option>
                    <option value="FARM_CONTRIBUTION">Farm Contributions</option>
                  </select>
                )}

                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-xs shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Export Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full min-w-[640px] table-fixed text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-2.5 sm:px-3 w-[100px] sm:w-[105px] whitespace-nowrap">Date</th>
                  <th className="py-3 px-2.5 sm:px-3 min-w-[190px]">Description</th>
                  <th className="py-3 px-2 w-[115px] sm:w-[130px] whitespace-nowrap">Reference</th>
                  <th className="py-3 px-2.5 sm:px-3 w-[100px] sm:w-[110px] text-right whitespace-nowrap">Amount</th>
                  <th className="py-3 px-2 w-[100px] sm:w-[110px] text-center whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-2.5 sm:px-3">
                        <Skeleton className="h-4 w-16 sm:w-20" />
                      </td>
                      <td className="py-3.5 px-2.5 sm:px-3">
                        <Skeleton className="h-4 w-36 sm:w-52 mb-1.5" />
                        <Skeleton className="h-3 w-24 sm:w-28" />
                      </td>
                      <td className="py-3.5 px-2">
                        <Skeleton className="h-4 w-16 sm:w-20" />
                      </td>
                      <td className="py-3.5 px-2.5 sm:px-3 text-right">
                        <Skeleton className="h-4 w-14 sm:w-16 ml-auto" />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-2.5 sm:px-3 whitespace-nowrap font-medium text-gray-900 text-[11px] sm:text-xs">
                        <div className="font-semibold text-gray-900">
                          {new Intl.DateTimeFormat("en-GB", {
                            timeZone: "Africa/Lagos",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(t.date))}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>
                            {new Intl.DateTimeFormat("en-US", {
                              timeZone: "Africa/Lagos",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }).format(new Date(t.date))}
                          </span>
                          <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            WAT
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2.5 sm:px-3 min-w-0">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-start gap-1.5 group min-w-0">
                            <span
                              className="font-semibold text-gray-900 leading-snug line-clamp-2 break-words"
                              title={t.description}
                            >
                              {t.description}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(t.description);
                                setCopiedDesc(t.id);
                                setTimeout(() => setCopiedDesc(null), 2000);
                                showToast({
                                  variant: "success",
                                  title: "Description Copied",
                                  description: "Full transaction description copied to clipboard.",
                                });
                              }}
                              className="p-1 rounded hover:bg-gray-200/80 text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-0.5"
                              title="Copy full description"
                            >
                              {copiedDesc === t.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1">
                            {/* Credit / Debit Pill */}
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                t.type === "CREDIT"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {t.type === "CREDIT" ? "Credit" : "Debit"}
                            </span>

                            {/* Category Pill */}
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold truncate max-w-[130px] sm:max-w-[160px] ${
                                t.category === "COMBO_PACKAGE"
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : t.category === "CORE_DRIVER_BONUS"
                                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                                  : t.category === "RETAIL_PURCHASE"
                                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                                  : t.category === "REFERRAL_BONUS"
                                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                                  : t.category === "SLOT_PURCHASE"
                                  ? "bg-blue-50 text-blue-900 border border-blue-200"
                                  : t.category === "SUBSCRIPTION"
                                  ? "bg-emerald-50 text-emerald-950 border border-emerald-300"
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {getCategoryLabel(t.category)}
                            </span>

                            {t.is_legacy && (
                              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Founding
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-1 group w-full min-w-0">
                          <span
                            className="truncate flex-1 min-w-0 select-all block font-mono"
                            title={t.reference}
                          >
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
                            title={`Copy reference: ${t.reference}`}
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
                        className={`py-3.5 px-2.5 sm:px-3 whitespace-nowrap text-right font-mono font-bold text-xs sm:text-sm ${
                          t.type === "CREDIT" ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {t.type === "CREDIT" ? "+" : "-"}₦{t.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-semibold ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : t.status === "FAILED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {t.status === "COMPLETED" ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : t.status === "FAILED" ? (
                              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            )}
                            <span className="uppercase font-bold text-[9px] sm:text-[9.5px]">{t.status}</span>
                          </span>

                          {t.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleRequery(t.reference)}
                              disabled={requeryLoading && activeRequeryRef === t.reference}
                              className="inline-flex items-center p-1 rounded-md text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
                              title={`Requery payment for reference ${t.reference}`}
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${
                                  requeryLoading && activeRequeryRef === t.reference
                                    ? "animate-spin text-emerald-600"
                                    : "text-emerald-700"
                                }`}
                              />
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

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <DataPagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredTransactions.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
                totalItems={filteredTransactions.length}
                pageSize={PAGE_SIZE}
                itemLabel="transactions"
              />
            </div>
          )}
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
          savedBankCode={userProfile?.bank_code}
          isBankVerified={Boolean(userProfile?.bank_verified)}
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
