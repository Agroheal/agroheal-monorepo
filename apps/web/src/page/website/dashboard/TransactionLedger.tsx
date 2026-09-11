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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import { exportToExcel } from "@shared/excelExport";
import { AgrohealImages } from "@/constant/Image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface LedgerItem {
  id: string;
  date: string;
  type: "CREDIT" | "DEBIT";
  category: "REFERRAL_BONUS" | "SLOT_PURCHASE" | "SUBSCRIPTION" | "WITHDRAWAL" | "MATRIX_COMMISSION";
  amount: number;
  description: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  reference: string;
}

const MATRIX_TIERS = [
  { level: 1, members: 5, percentage: 5.0, rewardPerSlot: 250, totalCeiling: 1250, requiredDirects: 1 },
  { level: 2, members: 25, percentage: 3.5, rewardPerSlot: 175, totalCeiling: 4375, requiredDirects: 2 },
  { level: 3, members: 125, percentage: 3.0, rewardPerSlot: 150, totalCeiling: 18750, requiredDirects: 3 },
  { level: 4, members: 625, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 78125, requiredDirects: 4 },
  { level: 5, members: 3125, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 390625, requiredDirects: 5 },
  { level: 6, members: 15625, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 1953125, requiredDirects: 5 },
  { level: 7, members: 78125, percentage: 2.5, rewardPerSlot: 125, totalCeiling: 9765625, requiredDirects: 5 },
];

export default function TransactionLedger() {
  const [loading, setLoading] = useState<boolean>(true);
  const [memberId, setMemberId] = useState<string>("NO GREENCARD YET");
  const [userProfile, setUserProfile] = useState<{ full_name?: string; email?: string } | null>(null);
  const [directReferralEarnings, setDirectReferralEarnings] = useState<number>(0);
  const [matrixEarnings, setMatrixEarnings] = useState<number>(0);
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
  const [isProjectSubscribed, setIsProjectSubscribed] = useState<boolean>(false);
  const [subscribingWithWallet, setSubscribingWithWallet] = useState<boolean>(false);

  // Matrix Withdrawal Qualification: 5 direct referrals AND ₦5,000 PQV in 30 days
  const isMatrixQualified = directReferralsCount >= 5 && activePqv30d >= 5000;

  // Direct Referral Withdrawal Qualification: Active Project Subscribed AND >= ₦2,000
  const isDirectReferralWithdrawable = isProjectSubscribed && directReferralEarnings >= 2000;
  const canSubscribeWithWallet = !isProjectSubscribed && directReferralEarnings >= 10000;
  const hasGreenCard = Boolean(memberId && memberId !== "NO GREENCARD YET" && !memberId.includes("PENDING"));

  // Clear financial balances
  const availableBalance = (isDirectReferralWithdrawable ? directReferralEarnings : 0) + (isMatrixQualified ? matrixEarnings : 0);
  const ledgerBalance = directReferralEarnings + matrixEarnings;

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
        variant: "destructive",
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
          apiClient.wallet.getSummary(),
          apiClient.wallet.getLedger(),
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

      // 2. Database query for profile, subscriptions, and receipts
      const [
        { data: profile },
        { data: referrals },
        { data: subscriptions },
        { data: otherPayments },
        { data: checkouts },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("member_id, full_name, email, referral_earnings, slot_bonus, total_referrals, created_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, created_at")
          .eq("referred_by", user.id),
        supabase
          .from("subscriptions")
          .select("id, slots, started_at, plan, status, expires_at")
          .eq("user_id", user.id),
        supabase
          .from("otherPayments")
          .select("id, amount, payment_type, created_at, status, reference")
          .eq("user_id", user.id),
        supabase
          .from("checkout")
          .select("id, amount, created_at, payment_reference, status")
          .eq("user_id", user.id)
          .limit(20),
      ]);

      if (profile) {
        setUserProfile({
          full_name: profile.full_name,
          email: profile.email,
        });
      }
      setMemberId(formatAgcId(profile?.member_id));
      const refEarnings = apiSummary?.directReferralWallet?.balance !== undefined
        ? Number(apiSummary.directReferralWallet.balance)
        : Number(profile?.referral_earnings || 0);
      setDirectReferralEarnings(refEarnings);

      if (apiSummary?.matrixSpilloverWallet?.balance === undefined && profile?.slot_bonus) {
        setMatrixEarnings(Number(profile.slot_bonus || 0));
      }

      const hasActiveSub = Boolean(
        (subscriptions && subscriptions.some((s: any) => s.status === 'active' && (!s.expires_at || new Date(s.expires_at) > new Date()))) ||
        (checkouts && checkouts.some((c: any) => c.status === 'paid'))
      );
      setIsProjectSubscribed(hasActiveSub);

      const refCount = apiSummary?.matrixSpilloverWallet?.directReferralsCount !== undefined
        ? Number(apiSummary.matrixSpilloverWallet.directReferralsCount)
        : (referrals ? referrals.length : (profile?.total_referrals || 0));
      setDirectReferralsCount(refCount);
      setSelectedMatrixLevel(refCount < 5 ? (refCount < 4 ? refCount + 1 : 5) : 1);

      // Compute 30-day PQV from slot subscriptions and monthly payments
      if (apiSummary?.matrixSpilloverWallet?.activePqv30d === undefined) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let calculatedPqv = 0;
        (otherPayments || []).forEach((p) => {
          if (new Date(p.created_at) >= thirtyDaysAgo) {
            calculatedPqv += Number(p.amount || 0);
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
        });
      }

      // 2. Subscriptions / Green Card
      (subscriptions || []).forEach((s, idx) => {
        const isSlot = Number(s.slots || 0) > 0;
        const sStatus = (s.status || "").toLowerCase();
        const isSubCompleted = ["active", "paid", "success", "confirmed", "completed"].includes(sStatus);
        const isSubFailed = ["cancelled", "canceled", "failed", "expired"].includes(sStatus);
        items.push({
          id: `sub-${s.id || idx}`,
          date: s.started_at || new Date().toISOString(),
          type: "DEBIT",
          category: isSlot ? "SLOT_PURCHASE" : "SUBSCRIPTION",
          amount: isSlot ? Number(s.slots) * 5000 : 2000,
          description: isSlot
            ? `Secured ${s.slots} Group Farm Slot(s)`
            : `AgroHeal Green Card Activation (${s.plan || "Annual"})`,
          status: isSubCompleted ? "COMPLETED" : isSubFailed ? "FAILED" : "PENDING",
          reference: `SUB-${(s.id || idx).toString().slice(0, 8)}`,
        });
      });

      // 3. Other payments
      (otherPayments || []).forEach((p) => {
        const pStatus = (p.status || "").toLowerCase();
        const isPCompleted = ["confirmed", "active", "success", "paid", "completed"].includes(pStatus);
        const isPFailed = ["failed", "rejected"].includes(pStatus);
        items.push({
          id: `pay-${p.id}`,
          date: p.created_at,
          type: "DEBIT",
          category: "SUBSCRIPTION",
          amount: Number(p.amount || 0),
          description: `${p.payment_type.replace(/_/g, " ").toUpperCase()} Contribution`,
          status: isPCompleted ? "COMPLETED" : isPFailed ? "FAILED" : "PENDING",
          reference: p.reference || `PAY-${p.id.slice(0, 8)}`,
        });
      });

      // 4. Checkouts
      (checkouts || []).forEach((c) => {
        if (!items.some((i) => i.reference === c.payment_reference)) {
          const cStatus = (c.status || "").toLowerCase();
          const isCCompleted = ["paid", "success", "completed", "confirmed", "active"].includes(cStatus);
          const isCFailed = ["failed", "cancelled", "abandoned", "declined"].includes(cStatus);
          items.push({
            id: `chk-${c.id}`,
            date: c.created_at,
            type: "DEBIT",
            category: "SLOT_PURCHASE",
            amount: Number(c.amount || 0),
            description: "Online Platform Payment",
            status: isCCompleted ? "COMPLETED" : isCFailed ? "FAILED" : "PENDING",
            reference: c.payment_reference || `CHK-${c.id.slice(0, 8)}`,
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
      // 1. Check in checkout table
      const { data: checkoutData } = await supabase
        .from("checkout")
        .select("*")
        .eq("payment_reference", targetRef)
        .maybeSingle();

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
        const statusStr = (paymentRecord.status || "UNKNOWN").toUpperCase();
        showToast({
          variant:
            statusStr === "COMPLETED" || statusStr === "PAID" || statusStr === "SUCCESS" || statusStr === "CONFIRMED"
              ? "success"
              : "info",
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

  const filteredTransactions = transactions.filter((t) => {
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

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── HEADER & MEMBER ID BADGE ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {memberId && memberId !== "NO GREENCARD YET" && !memberId.includes("PENDING") ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-mono font-bold text-xs rounded-full border border-emerald-200">
                  {memberId}
                </span>
              ) : (
                <Link
                  to="/subscribe"
                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200 inline-flex items-center gap-1.5 transition-colors underline underline-offset-2 uppercase"
                  title="Click to activate your AgroHeal Green Card"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>NO GREENCARD YET</span>
                  <ArrowRight className="w-3 h-3 text-amber-600" />
                </Link>
              )}
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Audited Member Ledger
              </span>
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

        {/* ── TOP DUAL CARDS (CREDIT CARD ASPECT RATIO ~1.6:1) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* ── CARD 1 (LEFT): CONDITIONAL GREEN CARD ACTIVATION OR 5x7 MATRIX PIPELINE (LIGHT COOPERATIVE THEME) ── */}
          {!hasGreenCard ? (
            <div className="bg-gradient-to-br from-emerald-50/90 via-white to-green-50/60 text-gray-900 rounded-3xl p-5 sm:p-5.5 border border-emerald-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden space-y-3.5">
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 font-bold">
                      <Award className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">AgroHeal Green Card (AGC)</h3>
                      <p className="text-[11px] text-gray-500">Cooperative Identity & Profit Key</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                    Not Activated
                  </span>
                </div>

                <div className="bg-white/90 border border-emerald-100 rounded-xl p-3 space-y-1.5 text-xs text-gray-700 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Permanent Verified Member ID (AGC) & QR Credential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Full lifetime access to AgroHeal Academy curricula</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>₦1,000 Direct Referral Rewards on every Green Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Permanent placement in 7-level 5×7 community matrix</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-emerald-100 space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">One-Time Activation Fee</span>
                  <span className="font-mono font-black text-lg text-emerald-950">₦2,000</span>
                </div>
                <Button
                  asChild
                  className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-gray-950 font-bold text-xs shadow-xs transition-all"
                >
                  <Link to="/subscribe">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Activate Green Card — ₦2,000
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-50/50 via-white to-green-50/30 rounded-3xl p-5 sm:p-5.5 border border-emerald-200/80 shadow-sm flex flex-col justify-between space-y-3 text-gray-900">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">5×7 Community Matrix Pipeline</h3>
                      <p className="text-[11px] text-gray-500">7-Level Spillover Network (Not a Wallet)</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isMatrixQualified
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {isMatrixQualified ? "Qualified" : "Qualification Required"}
                  </span>
                </div>

                {/* Accrued Matrix Earnings */}
                <div className="flex items-baseline justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Accrued Matrix Dividends
                    </span>
                    <p className="text-2xl font-extrabold text-emerald-950 font-mono">
                      ₦{matrixEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-gray-500 text-[11px]">Active Depth:</span>{" "}
                    <span className="font-bold text-emerald-800 text-xs">
                      {directReferralsCount >= 5
                        ? "All 7 Levels"
                        : directReferralsCount > 0
                        ? `Levels 1-${directReferralsCount}`
                        : "Level 0"}
                    </span>
                  </div>
                </div>

                {/* 30-Day Gatekeeper Progress */}
                <div className="space-y-1.5 pt-1 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 font-medium">1. Direct Referrals (Min. 5):</span>
                    <span className={`font-bold font-mono ${directReferralsCount >= 5 ? "text-emerald-700" : "text-amber-700"}`}>
                      {directReferralsCount} / 5 {directReferralsCount >= 5 && "✓"}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (directReferralsCount / 5) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-gray-600 font-medium">2. Active PQV (Min. ₦5k):</span>
                    <span className={`font-bold font-mono ${activePqv30d >= 5000 ? "text-emerald-700" : "text-amber-700"}`}>
                      ₦{activePqv30d.toLocaleString()} / ₦5,000 {activePqv30d >= 5000 && "✓"}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (activePqv30d / 5000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Matrix Level Quick Carousel */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                    Tiers
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedMatrixLevel((prev) => Math.max(1, prev - 1))}
                      disabled={selectedMatrixLevel <= 1}
                      className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors"
                      title="Previous"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-gray-700 px-1">
                      L{selectedMatrixLevel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMatrixLevel((prev) => Math.min(7, prev + 1))}
                      disabled={selectedMatrixLevel >= 7}
                      className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors"
                      title="Next"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 7 Level Tabs */}
                <div className="grid grid-cols-7 gap-1">
                  {MATRIX_TIERS.map((tier) => {
                    const isUnlocked = directReferralsCount >= tier.requiredDirects;
                    const isSelected = selectedMatrixLevel === tier.level;
                    return (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => setSelectedMatrixLevel(tier.level)}
                        className={`py-0.5 text-[10px] font-bold rounded border transition-all text-center ${
                          isSelected
                            ? "bg-emerald-800 text-white border-emerald-900 shadow-2xs"
                            : isUnlocked
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                        }`}
                      >
                        L{tier.level}
                      </button>
                    );
                  })}
                </div>

                {/* Active Tier mini line */}
                {(() => {
                  const tier = MATRIX_TIERS.find((t) => t.level === selectedMatrixLevel) || MATRIX_TIERS[0];
                  const isUnlocked = directReferralsCount >= tier.requiredDirects;
                  const directsToUnlock = Math.max(0, tier.requiredDirects - directReferralsCount);

                  return (
                    <div className="p-2 rounded-xl bg-white border border-gray-200/70 text-[11px] flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-gray-900">
                          Level {tier.level}: {tier.percentage}% (₦{tier.rewardPerSlot}/slot)
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          Ceiling: ₦{tier.totalCeiling.toLocaleString()} · {tier.members.toLocaleString()} members
                        </span>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUnlocked
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isUnlocked ? "✓ Unlocked" : `Need ${directsToUnlock} more`}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── CARD 2 (RIGHT): THE ONLY CARD CALLED "WALLET" (EXECUTIVE CREDIT CARD HERO) ── */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#051c11] via-[#092917] to-[#03130b] border border-emerald-500/50 rounded-3xl p-5 sm:p-5.5 text-white shadow-2xl relative overflow-hidden space-y-3">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />

            {/* Top Row: Company Logo + Official Wallet Badge + Status Badge + Contactless Icon */}
            <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-white/10 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={AgrohealImages.HeaderLogo}
                  alt="AgroHeal"
                  className="h-6 sm:h-7 object-contain brightness-0 invert opacity-95 shrink-0"
                />
                <div className="h-4 w-px bg-white/20 hidden sm:block" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase font-mono truncate">
                  MEMBER WALLET
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wide border shadow-xs backdrop-blur-md ${
                    isDirectReferralWithdrawable
                      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/35"
                      : canSubscribeWithWallet
                      ? "bg-purple-500/25 text-purple-200 border-purple-400/40"
                      : !isProjectSubscribed
                      ? "bg-amber-500/20 text-amber-200 border-amber-400/35"
                      : "bg-white/10 text-gray-300 border-white/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDirectReferralWithdrawable
                        ? "bg-emerald-400"
                        : canSubscribeWithWallet
                        ? "bg-purple-400"
                        : "bg-amber-400"
                    } animate-pulse`}
                  />
                  {isDirectReferralWithdrawable
                    ? "Withdrawable"
                    : canSubscribeWithWallet
                    ? "₦10k Ready to Activate"
                    : !isProjectSubscribed
                    ? "Unsubscribed (Accumulating)"
                    : "Min. ₦2,000"}
                </span>

                <Wifi className="w-3.5 h-3.5 rotate-90 text-emerald-300/70 hidden sm:block" />
              </div>
            </div>

            {/* Middle: EMV Chip & Financial Balances */}
            <div className="relative z-10 py-1 space-y-2.5">
              <div className="flex items-center justify-between">
                {/* Gold Smart Chip */}
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-200/90 shadow-xs flex items-center justify-center p-0.5 relative overflow-hidden">
                  <div className="w-full h-full border border-amber-600/40 rounded-xs grid grid-cols-2 grid-rows-2 opacity-60" />
                </div>

                <span className="text-[9px] font-mono text-emerald-200/60 uppercase tracking-wider">
                  DEBIT / DIGITAL LEDGER
                </span>
              </div>

              {/* Dual Financial Balances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                    ₦{availableBalance.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-200/70 block">
                    Immediately Withdrawable
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block">
                    Ledger Balance
                  </span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-gray-200 tracking-tight">
                    ₦{ledgerBalance.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-gray-400 block">
                    Total Cumulative Posted
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card Row: Cardholder Details + Security/Audited Stamp */}
            <div className="relative z-10 border-t border-white/10 pt-2.5 mt-auto space-y-2.5">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[9px] text-emerald-200/60 uppercase tracking-widest font-semibold block">
                    Cardholder & Member ID
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
                    {userProfile?.full_name || "AgroHeal Member"}
                  </p>
                  <p className="text-[10px] font-mono font-medium text-emerald-300/90">
                    {memberId}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-emerald-200/50 uppercase tracking-widest font-mono block">
                    PLATFORM TRANSACTION LEDGER
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300/80 uppercase">
                    IMMUTABLE • AUDITED
                  </span>
                </div>
              </div>

              {/* Action Buttons below on wallet card */}
              {canSubscribeWithWallet && (
                <Button
                  disabled={subscribingWithWallet}
                  onClick={handleSubscribeWithWallet}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-9 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  {subscribingWithWallet ? "Activating..." : "Activate Project Subscription (₦10,000)"}
                </Button>
              )}

              <Button
                disabled={!isDirectReferralWithdrawable}
                onClick={() => {
                  showToast({
                    variant: "success",
                    title: "Withdrawal Initiated",
                    description: "Proceeding to bank disbursal selection...",
                  });
                }}
                className={`w-full h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  isDirectReferralWithdrawable
                    ? "bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs cursor-pointer"
                    : "bg-white/10 text-gray-400 border border-white/10 cursor-not-allowed"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                {isDirectReferralWithdrawable
                  ? `Withdraw Available Funds (₦${availableBalance.toLocaleString()})`
                  : !isProjectSubscribed
                  ? "Withdrawal Locked (Project Subscription Required)"
                  : `Accumulate ₦${(2000 - directReferralEarnings).toLocaleString()} More to Withdraw`}
              </Button>
            </div>
          </div>
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
                <option value="REFERRAL_BONUS">Referral Bonuses</option>
                <option value="SLOT_PURCHASE">Slot Purchases</option>
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
                  <tr>
                    <td colSpan={6} className="py-12">
                      <LoadingSpinner message="Loading financial ledger..." />
                    </td>
                  </tr>
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
                        {t.description}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-700">
                          {t.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap font-mono text-[11px] text-gray-500">
                        {t.reference}
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
      </div>
    </div>
  );
};
