import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  X,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Users,
  ShoppingBag,
  Coins,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReleaseConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerBalance: number;
  availableBalance: number;
  totalLockedAmount: number;
  directReferralEarnings?: number;
  matrixEarnings?: number;
  directReferralsCount: number;
  activePqv30d: number;
  isProjectSubscribed: boolean;
  hasPurchasedStarterPack: boolean;
  isLegacy?: boolean;
  isLegacyHold?: boolean;
  advanceDebt?: {
    isIndebted: boolean;
    balance: number;
    total: number;
    repaid: number;
  } | null;
  onOpenWithdrawal?: () => void;
}

export const ReleaseConditionsModal: React.FC<ReleaseConditionsModalProps> = ({
  isOpen,
  onClose,
  ledgerBalance,
  availableBalance,
  totalLockedAmount,
  directReferralEarnings = 0,
  matrixEarnings = 0,
  directReferralsCount,
  activePqv30d,
  isProjectSubscribed,
  hasPurchasedStarterPack,
  isLegacy,
  isLegacyHold,
  advanceDebt,
  onOpenWithdrawal,
}) => {
  if (!isOpen) return null;

  // Gate 1: Starter Package Requirement
  const isGate1Passed = Boolean(isProjectSubscribed || hasPurchasedStarterPack);

  // Gate 2: 5 Direct Referrals (Rules apply uniformly to all earnings; PQV waived by Management)
  const isDirectsMet = directReferralsCount >= 5;
  const isPqvMet = activePqv30d >= 10000;
  const isGate2Passed = isDirectsMet;

  // Gate 3: Minimum ₦2,000 floor
  const isGate3Passed = availableBalance >= 2000;

  const directsProgress = Math.min(100, Math.round((directReferralsCount / 5) * 100));
  const pqvProgress = Math.min(100, Math.round((activePqv30d / 10000) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-900 p-6 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              Statutory Solvency & Reserve Governance
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Reserve Release Conditions
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-md">
              Live status of your statutory qualification gates governing reserve release and bank disbursements.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Balances Card */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Total Ledger
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5">
                  ₦{ledgerBalance.toLocaleString()}
                </span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center justify-center gap-1">
                  <Unlock className="w-3 h-3" /> Available
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700 block mt-0.5">
                  ₦{availableBalance.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> {isLegacyHold ? "On Hold" : "In Reserve"}
                </span>
                <span className="text-base sm:text-lg font-black text-amber-700 block mt-0.5">
                  ₦{totalLockedAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Legacy Pre-Migration Hold Notice */}
            {isLegacyHold && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950">
                    Legacy Pre-Migration Hold Active
                  </div>
                  <p className="text-amber-800/90 mt-1 leading-relaxed">
                    You are viewing historical pre-migration balances. Withdrawals from legacy balances are currently on hold pending final administrative reconciliation. To withdraw active, cleared commission earnings, switch to your Live Wallet.
                  </p>
                </div>
              </div>
            )}

            {/* Corporate Advance Alert if Active */}
            {advanceDebt && advanceDebt.isIndebted && advanceDebt.balance > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 flex items-center justify-between">
                    <span>Corporate Advance Recovery Active</span>
                    <span className="font-mono">₦{advanceDebt.balance.toLocaleString()} remaining</span>
                  </div>
                  <p className="text-amber-800 mt-1">
                    100% of future earnings automatically apply to settle this principal advance (Repaid ₦{advanceDebt.repaid.toLocaleString()} of ₦{advanceDebt.total.toLocaleString()}).
                  </p>
                </div>
              </div>
            )}

            {/* The 3 Statutory Gates */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Statutory Qualification Gates
              </h3>

              {/* Gate 1: Farm Project / Starter Package */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isGate1Passed
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-amber-50/70 border-amber-200"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isGate1Passed ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {isGate1Passed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Gate 1: Farm Project / Starter Package
                        </span>
                        <Badge
                          className={`text-[10px] font-bold py-0.5 px-2 ${
                            isGate1Passed
                              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                              : "bg-amber-600 hover:bg-amber-600 text-white"
                          }`}
                        >
                          {isGate1Passed ? "UNLOCKED" : "ACTION REQUIRED"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Active farm slot subscription or Starter Package (Mushroom Power 100g) required for external withdrawals.
                      </p>
                    </div>
                  </div>
                </div>

                {!isGate1Passed && (
                  <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center justify-between">
                    <span className="text-xs text-amber-900 font-medium">
                      One-time Starter Package activation unlocks eligibility.
                    </span>
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                    >
                      <Link to="/dashboard/checkout?bundle=starter" onClick={onClose}>
                        Activate Package <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Gate 2: 5x7 Matrix Spillover Qualification */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isGate2Passed
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isGate2Passed ? "bg-emerald-600 text-white" : "bg-slate-400 text-white"
                    }`}>
                      {isGate2Passed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Gate 2: 5 Direct Personally Sponsored Referrals
                        </span>
                        <Badge
                          className={`text-[10px] font-bold py-0.5 px-2 ${
                            isGate2Passed
                              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                              : "bg-slate-600 hover:bg-slate-600 text-white"
                          }`}
                        >
                          {isGate2Passed ? "QUALIFIED" : "IN PROGRESS"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Requires 5 direct personally sponsored referrals. (Rolling 30-day PQV is currently waived by Management).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Referrals Progress */}
                <div className="mt-3.5 space-y-2.5 pt-3 border-t border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        Direct Personal Referrals
                      </span>
                      <span className={isDirectsMet ? "text-emerald-700 font-bold" : "text-slate-600"}>
                        {directReferralsCount} / 5 {isDirectsMet && "✓"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDirectsMet ? "bg-emerald-600" : "bg-blue-600"
                        }`}
                        style={{ width: `${directsProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* 30-Day PQV Progress (Waived by Management) */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        Rolling 30-Day Product PQV
                        <span className="text-[10px] text-emerald-600 font-normal bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Waived
                        </span>
                      </span>
                      <span className="text-slate-600">
                        ₦{activePqv30d.toLocaleString()} / ₦10,000 (Grace Period)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPqvMet ? "bg-emerald-600" : "bg-purple-600"
                        }`}
                        style={{ width: `${pqvProgress}%` }}
                      />
                    </div>
                  </div>

                  {!isGate2Passed && (
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Matrix reserve: <strong className="text-slate-800">₦{matrixEarnings.toLocaleString()}</strong>
                      </span>
                      <Button
                        asChild
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-emerald-700 font-bold hover:underline"
                      >
                        <Link to="/dashboard/my-network" onClick={onClose}>
                          View Downline Matrix →
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gate 3: Statutory Minimum ₦2,000 Floor */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isGate3Passed
                  ? "bg-emerald-50/70 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isGate3Passed ? "bg-emerald-600 text-white" : "bg-slate-400 text-white"
                  }`}>
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        Gate 3: Minimum ₦2,000 Disbursement Floor
                      </span>
                      <Badge
                        className={`text-[10px] font-bold py-0.5 px-2 ${
                          isGate3Passed
                            ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                            : "bg-slate-500 hover:bg-slate-500 text-white"
                        }`}
                      >
                        {isGate3Passed ? "MET" : `₦${(2000 - availableBalance).toLocaleString()} NEEDED`}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Bank transfers require at least ₦2,000 in unlocked cleared funds to clear the interbank payment gateway.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-2xl text-xs font-bold text-slate-700 border-slate-300"
            >
              Close
            </Button>

            {availableBalance >= 2000 ? (
              <Button
                onClick={() => {
                  onClose();
                  if (onOpenWithdrawal) onOpenWithdrawal();
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-900/10"
              >
                Withdraw ₦{availableBalance.toLocaleString()} Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                asChild
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold"
              >
                <Link to="/dashboard/my-network" onClick={onClose}>
                  Grow Network to Unlock <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
