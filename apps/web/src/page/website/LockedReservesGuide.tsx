import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Wallet,
  Sprout,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  LogIn,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import { SITE_URL } from "@/config/Index";

export default function LockedReservesGuide() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [walletSummary, setWalletSummary] = useState<{
    walletBalance: number;
    directReferralEarnings: number;
    matrixEarnings: number;
    totalSlots: number;
    directReferralsCount: number;
    activePqv30d: number;
    isProjectSubscribed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingAccount, setCheckingAccount] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);

      // Fetch profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, email, member_id, referral_code, is_green_card_holder, wallet_balance, referral_earnings, has_purchased_starter_pack")
        .eq("id", user.id)
        .maybeSingle();

      setUserProfile(prof);

      // Fetch wallet summary & directs count
      let apiSummary: any = null;
      try {
        apiSummary = await apiClient.wallet.getSummary({ timeout: 3000 });
      } catch (e) {
        // fallback
      }

      // Count direct referrals
      const { count: directsCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("sponsor_id", user.id);

      // Check slot subscriptions
      const { data: slots } = await supabase
        .from("slot_subscriptions")
        .select("id, slots_count, status")
        .eq("user_id", user.id)
        .in("status", ["active", "paid", "confirmed", "completed"]);

      const totalSlots = (slots || []).reduce((acc: number, s: any) => acc + (Number(s.slots_count) || 1), 0);
      const isSubscribed = Boolean(prof?.has_purchased_starter_pack || totalSlots > 0);

      // Direct referral vs matrix earnings
      const directEarnings = apiSummary?.directReferralsEarnings ?? Number(prof?.referral_earnings || 0);
      const matrixEarnings = apiSummary?.matrixSpilloverEarnings ?? 0;
      const baseWallet = Number(prof?.wallet_balance || 0);

      setWalletSummary({
        walletBalance: Math.max(baseWallet, directEarnings + matrixEarnings),
        directReferralEarnings: directEarnings,
        matrixEarnings: matrixEarnings,
        totalSlots: totalSlots,
        directReferralsCount: directsCount ?? 0,
        activePqv30d: totalSlots * 5000,
        isProjectSubscribed: isSubscribed,
      });
    } catch (err) {
      console.error("Error checking account in LockedReservesGuide:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCheck = async () => {
    setCheckingAccount(true);
    await fetchUserStatus();
    setCheckingAccount(false);
  };

  const handleCopyLink = async () => {
    if (!userProfile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/signup?ref=${userProfile.referral_code}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      // ignore
    }
  };

  // Calculations if logged in
  const directs = walletSummary?.directReferralsCount ?? 0;
  const isMatrixQualified = directs >= 5;
  const isProjectSubscribed = Boolean(walletSummary?.isProjectSubscribed);
  const matrixEarnings = walletSummary?.matrixEarnings ?? 0;
  const directEarnings = walletSummary?.directReferralEarnings ?? 0;
  const totalBalance = walletSummary?.walletBalance ?? 0;

  const lockedMatrix = !isMatrixQualified ? matrixEarnings : 0;
  const lockedDirect = (!isProjectSubscribed || directs < 5) ? directEarnings : 0;
  const rawCleared = Math.max(0, totalBalance - (lockedMatrix + lockedDirect));
  const availableBalance = rawCleared >= 2000 ? rawCleared : 0;
  const lockedBelowFloor = rawCleared < 2000 ? rawCleared : 0;
  const totalLocked = lockedMatrix + lockedDirect + lockedBelowFloor;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-sans pb-20">
      {/* ── HEADER BANNER ── */}
      <div className="bg-[#0c2415] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/60 relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to How It Works
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Financial Safeguards &amp; Solvency Architecture
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Understanding Withdrawable vs. Locked Reserves
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-3xl">
            At AgroHeal, complete financial transparency is non-negotiable. Learn why certain
            earnings are held in temporary reserve, the statutory release rules, and how you can
            immediately qualify for full bank disbursements.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-8">
        {/* ── DYNAMIC PERSONAL STATUS CHECKER CARD ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block mb-1.5">
                Interactive Status Audit
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {currentUser ? "Your Real-Time Reserve Breakdown" : "Check Your Account's Locked Reserves"}
              </h2>
            </div>

            {currentUser ? (
              <Button
                variant="outline"
                size="sm"
                disabled={checkingAccount}
                onClick={handleRefreshCheck}
                className="h-9 px-3.5 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingAccount ? "animate-spin" : ""}`} />
                <span>{checkingAccount ? "Checking..." : "Re-check My Status"}</span>
              </Button>
            ) : (
              <Button
                asChild
                className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-4 self-start sm:self-auto"
              >
                <Link to="/signin?redirect=/how-it-works/locked-withdrawals">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In to Check My Status
                </Link>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
              <p>Auditing your personal ledger and referral qualifications...</p>
            </div>
          ) : currentUser && walletSummary ? (
            <div className="pt-6 space-y-6">
              {/* Balances Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Available to Withdraw
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-950 mt-1">
                    ₦{availableBalance.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    100% Cleared for bank transfer
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Currently in Reserve
                  </span>
                  <p className="text-2xl font-black font-mono text-amber-950 mt-1">
                    ₦{totalLocked.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-amber-700 mt-0.5 block">
                    Awaiting gatekeeper releases
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                    Total Cumulative Ledger
                  </span>
                  <p className="text-2xl font-black font-mono text-gray-900 mt-1">
                    ₦{totalBalance.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    All posted platform earnings
                  </span>
                </div>
              </div>

              {/* Status Checklist per Gate */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Gatekeeper Release Analysis
                </h3>

                {/* Gate 1: 5 Directs */}
                <div
                  className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isMatrixQualified
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-amber-50/70 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isMatrixQualified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-sm">
                        1. 5×7 Matrix Direct Referral Gate ({directs}/5 Directs)
                      </p>
                      <p className="text-gray-600 mt-0.5">
                        {isMatrixQualified
                          ? "Qualified! You have sponsored 5 or more active members. 100% of your 7-tier matrix spillover commissions are unlocked."
                          : `You have sponsored ${directs} of 5 required active partners. Sponsor ${
                              5 - directs
                            } more partner(s) to unlock ₦${matrixEarnings.toLocaleString()} held in matrix reserve.`}
                      </p>
                    </div>
                  </div>

                  {!isMatrixQualified && (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <Button
                        size="sm"
                        onClick={handleCopyLink}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl font-semibold gap-1 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Copied" : "Copy Invite Link"}</span>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs h-8 rounded-xl font-semibold"
                      >
                        <Link to="/dashboard/my-network">View Network</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Gate 2: Starter Package */}
                <div
                  className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isProjectSubscribed
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-amber-50/70 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isProjectSubscribed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-sm">
                        2. Producer-Consumer Starter Package (₦10,000)
                      </p>
                      <p className="text-gray-600 mt-0.5">
                        {isProjectSubscribed
                          ? "Active! You have enrolled in practical agricultural production with your starter package."
                          : directEarnings >= 10000
                          ? `You have ₦${directEarnings.toLocaleString()} in referral earnings! You can activate your ₦10,000 starter package directly using your wallet balance without paying out-of-pocket.`
                          : "Activate your ₦10,000 starter package (₦5,000 Mushroom Power 100g + ₦5,000 1st farm slot) to participate in quarterly harvest surplus distributions."}
                      </p>
                    </div>
                  </div>

                  {!isProjectSubscribed && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl font-semibold shrink-0 self-start sm:self-auto"
                    >
                      <Link to="/dashboard/checkout?product=green_card_combo">
                        Activate Package
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Gate 3: Minimum Payout Floor */}
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                    rawCleared >= 2000
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  {rawCleared >= 2000 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      3. Statutory Minimum Withdrawal Floor (₦2,000)
                    </p>
                    <p className="text-gray-600 mt-0.5">
                      {rawCleared >= 2000
                        ? `Cleared balance meets the statutory ₦2,000 minimum payout floor. You can request a withdrawal anytime from your dashboard.`
                        : `Your cleared balance is currently ₦${rawCleared.toLocaleString()}. Accumulate ₦${(
                            2000 - rawCleared
                          ).toLocaleString()} more to release directly to your bank account.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Link to Wallet */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs text-gray-600 font-medium">
                  Ready to manage your funds or request a payout?
                </span>
                <Button
                  asChild
                  className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer w-full sm:w-auto"
                >
                  <Link to="/dashboard/transactions">
                    <Wallet className="w-3.5 h-3.5 mr-1.5" />
                    Open Transaction Ledger &amp; Wallet
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Logged Out View */
            <div className="pt-6 space-y-4 text-center sm:text-left">
              <p className="text-sm text-gray-600 leading-relaxed">
                Log in to see your exact personal metrics: your active direct referrals count,
                current withdrawable balance, and any funds held in 5×7 matrix or subscription reserve.
              </p>
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <Button
                  asChild
                  className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 px-5"
                >
                  <Link to="/signin?redirect=/how-it-works/locked-withdrawals">
                    Sign In to View My Ledger
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold h-10 px-4"
                >
                  <Link to="/signup">Create New Account</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── EDUCATIONAL GUIDE: THE 3 CORE RULES EXPLAINED ── */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Why Does AgroHeal Have Locked Reserves?
            </h2>
            <p className="text-sm text-gray-600">
              Three clear safeguards protect community liquidity and ensure true productive agribusiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Reason 1 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  1. Sponsoring 5 Active Partners
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  AgroHeal is an organic producer cooperative, not a passive high-yield investment fund.
                  The 5×7 matrix generates passive spillover rewards from team placement, but you must
                  actively sponsor <strong>5 direct members</strong> to unlock 100% of those team commissions.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 text-[11px] font-semibold text-emerald-800">
                Rule: 5 Direct Referrals unlocks all 7 Matrix tiers.
              </div>
            </div>

            {/* Reason 2 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  2. Practical Farm Participation
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  To participate in quarterly harvest sales dividends, members must activate the
                  <strong> ₦10,000 Wealth Creation starter package</strong> (₦5k Mushroom Power welcome product + ₦5k 1st farm slot).
                  Referral earnings accumulate freely and can even fund this activation!
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 text-[11px] font-semibold text-amber-800">
                Rule: ₦10,000 Starter Package qualifies for harvest distributions.
              </div>
            </div>

            {/* Reason 3 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">
                  3. ₦2,000 Minimum Payout Floor
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Commercial bank transfers incur interbank clearing fees. Setting the statutory payout
                  floor at ₦2,000 prevents payment processors from draining member earnings on micro-transactions.
                  Balances under ₦2,000 simply accumulate until reached.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 text-[11px] font-semibold text-emerald-800">
                Rule: Minimum ₦2,000 dispatches electronically in 24–48h.
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ QUICK LINKS ── */}
        <div className="bg-[#0c2415] text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Need to Explore Full Compensation &amp; Commission Schedules?
              </h3>
              <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
                Read through our complete text presentation covering the 7-tier 5×7 matrix, product sales waterfall,
                and farm cluster production economics.
              </p>
            </div>
            <Button
              asChild
              className="bg-[#d1ef75] hover:bg-[#bce055] text-emerald-950 font-bold text-xs rounded-xl h-10 px-5 shrink-0"
            >
              <Link to="/how-it-works/presentation">
                <span>View Full Presentation</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
