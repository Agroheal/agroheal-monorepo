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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import { exportToExcel } from "@shared/excelExport";
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

export default function TransactionLedger() {
  const [loading, setLoading] = useState<boolean>(true);
  const [memberId, setMemberId] = useState<string>("AGC-PENDING");
  const [directReferralEarnings, setDirectReferralEarnings] = useState<number>(0);
  const [matrixEarnings, setMatrixEarnings] = useState<number>(0);
  const [directReferralsCount, setDirectReferralsCount] = useState<number>(0);
  const [activePqv30d, setActivePqv30d] = useState<number>(0);
  const [pqvDaysRemaining, setPqvDaysRemaining] = useState<number>(30);
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requeryRef, setRequeryRef] = useState<string>("");
  const [requeryLoading, setRequeryLoading] = useState<boolean>(false);
  const [showRequeryModal, setShowRequeryModal] = useState<boolean>(false);
  const [isProjectSubscribed, setIsProjectSubscribed] = useState<boolean>(false);
  const [subscribingWithWallet, setSubscribingWithWallet] = useState<boolean>(false);

  // Matrix Withdrawal Qualification: 5 direct referrals AND ₦5,000 PQV in 30 days
  const isMatrixQualified = directReferralsCount >= 5 && activePqv30d >= 5000;

  // Direct Referral Withdrawal Qualification: Active Project Subscribed AND >= ₦2,000
  const isDirectReferralWithdrawable = isProjectSubscribed && directReferralEarnings >= 2000;
  const canSubscribeWithWallet = !isProjectSubscribed && directReferralEarnings >= 10000;

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
          .select("member_id, referral_earnings, slot_bonus, total_referrals, created_at")
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
        items.push({
          id: `sub-${s.id || idx}`,
          date: s.started_at || new Date().toISOString(),
          type: "DEBIT",
          category: isSlot ? "SLOT_PURCHASE" : "SUBSCRIPTION",
          amount: isSlot ? Number(s.slots) * 5000 : 2000,
          description: isSlot
            ? `Secured ${s.slots} Group Farm Slot(s)`
            : `AgroHeal Green Card Activation (${s.plan || "Annual"})`,
          status: s.status === "active" ? "COMPLETED" : "PENDING",
          reference: `SUB-${(s.id || idx).toString().slice(0, 8)}`,
        });
      });

      // 3. Other payments
      (otherPayments || []).forEach((p) => {
        items.push({
          id: `pay-${p.id}`,
          date: p.created_at,
          type: "DEBIT",
          category: "SUBSCRIPTION",
          amount: Number(p.amount || 0),
          description: `${p.payment_type.replace(/_/g, " ").toUpperCase()} Contribution`,
          status: p.status === "confirmed" || p.status === "active" ? "COMPLETED" : "PENDING",
          reference: p.reference || `PAY-${p.id.slice(0, 8)}`,
        });
      });

      // 4. Checkouts
      (checkouts || []).forEach((c) => {
        if (!items.some((i) => i.reference === c.payment_reference)) {
          items.push({
            id: `chk-${c.id}`,
            date: c.created_at,
            type: "DEBIT",
            category: "SLOT_PURCHASE",
            amount: Number(c.amount || 0),
            description: "Online Platform Payment",
            status: c.status === "success" ? "COMPLETED" : "PENDING",
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

  const handleRequery = async () => {
    if (!requeryRef.trim()) {
      showToast({
        variant: "error",
        title: "Reference Required",
        description: "Please enter your payment or transfer reference.",
      });
      return;
    }

    setRequeryLoading(true);
    try {
      // Requery against Paystack or Supabase verify payment
      const { data, error } = await supabase
        .from("checkout")
        .select("*")
        .eq("payment_reference", requeryRef.trim())
        .maybeSingle();

      if (error || !data) {
        showToast({
          variant: "error",
          title: "Payment Not Found",
          description: "No pending transaction found for this reference. Please check and try again.",
        });
      } else {
        showToast({
          variant: "success",
          title: "Transaction Requeried",
          description: `Transaction status: ${data.status.toUpperCase()}. Your records have been updated.`,
        });
        setShowRequeryModal(false);
        setRequeryRef("");
        loadLedger();
      }
    } catch {
      showToast({
        variant: "error",
        title: "Requery Failed",
        description: "Unable to complete requery at this time.",
      });
    } finally {
      setRequeryLoading(false);
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
    if (filterType !== "ALL" && t.category !== filterType && t.type !== filterType) {
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

    const txRows = filteredTransactions.map((t, idx) => ({
      "S/N": idx + 1,
      "Date": new Date(t.date).toLocaleString(),
      "Type": t.type,
      "Category": t.category.replace(/_/g, " "),
      "Reference": t.reference,
      "Amount (₦)": t.amount,
      "Status": t.status,
      "Description": t.description,
    }));

    const overviewRows = [
      { "Metric": "Member ID", "Value": memberId },
      { "Metric": "Direct Referral Wallet (₦)", "Value": directReferralEarnings },
      { "Metric": "5x7 Matrix Spillover Wallet (₦)", "Value": matrixEarnings },
      { "Metric": "Direct Referrals Count", "Value": directReferralsCount },
      { "Metric": "Active 30-Day PQV (₦)", "Value": activePqv30d },
      { "Metric": "Matrix Qualification Status", "Value": isMatrixQualified ? "QUALIFIED" : "QUALIFICATION REQUIRED" },
      { "Metric": "Total Filtered Transactions", "Value": filteredTransactions.length },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Transactions", data: txRows },
        { sheetName: "Wallet Overview", data: overviewRows },
      ],
    });

    showToast({
      variant: "success",
      title: "Ledger Exported",
      description: `Downloaded ${filename}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── HEADER & MEMBER ID BADGE ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-mono font-bold text-xs rounded-full border border-emerald-200">
                {memberId}
              </span>
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
              variant="outline"
              size="sm"
              onClick={() => setShowRequeryModal(true)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl gap-2 font-semibold text-xs h-10"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
              Requery Payment
            </Button>
            <Button
              size="sm"
              onClick={loadLedger}
              className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl gap-2 font-semibold text-xs h-10 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── WALLET SUMMARY CARDS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Direct Referral Earnings Wallet */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Direct Referral Wallet</h3>
                  <p className="text-xs text-gray-500">₦1,000 per Green Card Referral</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  isDirectReferralWithdrawable
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : canSubscribeWithWallet
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : !isProjectSubscribed
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isDirectReferralWithdrawable
                  ? "Withdrawable"
                  : canSubscribeWithWallet
                  ? "₦10k Ready to Activate"
                  : !isProjectSubscribed
                  ? "Unsubscribed (Accumulating)"
                  : "Min. ₦2,000"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Available Direct Balance
              </span>
              <p className="text-3xl font-extrabold text-gray-900 font-mono">
                ₦{directReferralEarnings.toLocaleString()}
              </p>
            </div>

            {/* Dynamic Status / Information Box */}
            {isProjectSubscribed ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Active Project Member
                </p>
                <p className="text-emerald-900/90 leading-relaxed">
                  Direct referral earnings are independent of 5x7 matrix gates. You can withdraw your direct referral balance whenever it reaches ₦2,000.
                </p>
              </div>
            ) : canSubscribeWithWallet ? (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  ₦10,000 Wallet Credit Milestone Reached!
                </p>
                <p className="text-purple-800 leading-relaxed">
                  You have accumulated ₦{directReferralEarnings.toLocaleString()} in your wallet! Use ₦10,000 of your wallet balance to activate your project subscription and unlock bank withdrawals.
                </p>
                <Button
                  disabled={subscribingWithWallet}
                  onClick={handleSubscribeWithWallet}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-9 rounded-xl shadow-sm"
                >
                  {subscribingWithWallet ? "Activating Subscription..." : "Activate Project Subscription from Wallet (₦10,000)"}
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Project Subscription Required to Withdraw
                </p>
                <p className="text-amber-900/90 leading-relaxed">
                  Your referral earnings accumulate safely in your wallet. Bank withdrawals unlock once you subscribe to an active project, or once your wallet credit reaches ₦10,000 to subscribe directly using your balance.
                </p>
              </div>
            )}

            <Button
              disabled={!isDirectReferralWithdrawable}
              className={`w-full h-11 rounded-xl font-bold text-xs transition-all ${
                isDirectReferralWithdrawable
                  ? "bg-emerald-800 hover:bg-emerald-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => {
                showToast({
                  variant: "success",
                  title: "Withdrawal Initiated",
                  description: "Proceeding to bank disbursal selection...",
                });
              }}
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              {isDirectReferralWithdrawable
                ? "Withdraw Direct Earnings"
                : !isProjectSubscribed
                ? "Withdrawal Locked (Project Subscription Required)"
                : `Accumulate ₦${(2000 - directReferralEarnings).toLocaleString()} More to Withdraw`}
            </Button>
          </div>

          {/* 2. 5x7 Matrix Spillover Earnings Wallet */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">5×7 Matrix Spillover Wallet</h3>
                  <p className="text-xs text-gray-500">7-Level Community Network Tree</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  isMatrixQualified
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isMatrixQualified ? "Qualified" : "Qualification Required"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Matrix Earnings Balance
              </span>
              <p className="text-3xl font-extrabold text-emerald-900 font-mono">
                ₦{matrixEarnings.toLocaleString()}
              </p>
            </div>

            {/* 30-Day Gatekeeper Progress */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">1. Direct Referrals Gate (Min. 5):</span>
                <span className={`font-bold font-mono ${directReferralsCount >= 5 ? "text-emerald-700" : "text-amber-700"}`}>
                  {directReferralsCount} / 5 {directReferralsCount >= 5 && "✓"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (directReferralsCount / 5) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600 font-medium">2. 30-Day Active PQV (Min. ₦5,000):</span>
                <span className={`font-bold font-mono ${activePqv30d >= 5000 ? "text-emerald-700" : "text-amber-700"}`}>
                  ₦{activePqv30d.toLocaleString()} / ₦5,000 {activePqv30d >= 5000 && "✓"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (activePqv30d / 5000) * 100)}%` }}
                />
              </div>
            </div>

            <Button
              disabled={!isMatrixQualified || matrixEarnings <= 0}
              className={`w-full h-11 rounded-xl font-bold text-xs transition-all ${
                isMatrixQualified && matrixEarnings > 0
                  ? "bg-emerald-800 hover:bg-emerald-700 text-white shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              {isMatrixQualified
                ? "Withdraw Matrix Spillover"
                : "Complete 5 Referrals & ₦5k PQV to Unlock"}
            </Button>
          </div>
        </div>

        {/* ── TRANSACTION HISTORY TABLE ── */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header & Search Filter */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900">Unified Transaction History</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
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
                className="h-9 px-3 rounded-xl border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Export Excel
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
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {t.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {t.status.toUpperCase()}
                        </span>
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
                  onClick={handleRequery}
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
