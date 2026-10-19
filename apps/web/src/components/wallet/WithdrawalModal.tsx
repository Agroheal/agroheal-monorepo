import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  X,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coins,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/ToastComponent";
import { apiClient } from "@/lib/apiClient";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  directReferralBalance: number;
  matrixBalance: number;
  walletBalance?: number;
  availableBalance?: number;
  isDirectReferralWithdrawable?: boolean;
  isMatrixQualified: boolean;
  savedBankName?: string;
  savedAccountNumber?: string;
  savedAccountName?: string;
  savedBankCode?: string;
  isBankVerified?: boolean;
  userEmail?: string;
  isLegacy?: boolean;
  hasGreenCard?: boolean;
  hasFarmSlot?: boolean;
  hasPurchasedStarterPack?: boolean;
  directReferralsCount?: number;
  onSaveBankToProfile?: (bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => Promise<void>;
  onSuccess?: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  directReferralBalance,
  matrixBalance,
  walletBalance = 0,
  availableBalance = 0,
  isDirectReferralWithdrawable = true,
  isMatrixQualified,
  savedBankName,
  savedAccountNumber,
  savedAccountName,
  savedBankCode,
  isBankVerified,
  userEmail,
  isLegacy = false,
  hasGreenCard = true,
  hasFarmSlot = true,
  hasPurchasedStarterPack = false,
  directReferralsCount = 0,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setErrorMsg(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasLinkedBank = Boolean(
    savedBankName &&
    savedAccountNumber &&
    savedAccountNumber.trim().length >= 10
  );

  // Authoritative Available Cleared Balance (strictly enforcing ₦2k gate and qualification rules)
  const currentAvailableBalance = Math.max(0, availableBalance);

  const handleMaxAmount = () => {
    setAmount(Math.max(0, currentAvailableBalance).toString());
  };

  // Direct Disbursal Request Submission (No OTP requirement)
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Gate 1: Active Green Card Pass
    if (!hasGreenCard) {
      setErrorMsg("Green Card Required: You must be an active Green Card holder to request bank withdrawals.");
      return;
    }

    // Gate 2: Farm Slot Ownership
    if (!hasFarmSlot) {
      setErrorMsg("Farm Slot Required: You must own at least 1 active Farm Slot to request bank withdrawals.");
      return;
    }

    // Gate 3: Mushroom Power / Starter Pack Activation
    if (!hasPurchasedStarterPack) {
      setErrorMsg("Mushroom Power Required: You must activate your Starter Pack (Mushroom Power 100g) to request bank withdrawals.");
      return;
    }

    // Gate 4: 5 Direct Referrals
    if (directReferralsCount < 5) {
      setErrorMsg(`Direct Referrals Required: Bank withdrawals are locked until you refer at least 5 direct members (currently ${directReferralsCount}/5).`);
      return;
    }

    if (!hasLinkedBank) {
      setErrorMsg("Please link your verified bank account in your Profile Settings first.");
      return;
    }

    if (isBankVerified === false) {
      setErrorMsg("Your linked bank account requires NIBSS verification before requesting a withdrawal. Please go to your Profile to verify your bank details.");
      return;
    }

    // Gate 5: Minimum ₦2,000 Amount
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 2000) {
      setErrorMsg("Minimum withdrawal amount is ₦2,000. Negative or invalid amounts are not permitted.");
      return;
    }

    if (parsedAmount > currentAvailableBalance) {
      setErrorMsg(
        `Withdrawal amount exceeds your available cleared balance of ₦${currentAvailableBalance.toLocaleString()}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.withdrawals.request({
        walletType: "WALLET",
        amount: parsedAmount,
        bankName: savedBankName || "",
        bankCode: savedBankCode || "",
        accountNumber: savedAccountNumber || "",
        accountName: savedAccountName || "",
      });

      showToast({
        variant: "success",
        title: "Disbursal Request Queued",
        description: `₦${parsedAmount.toLocaleString()} withdrawal to ${savedBankName} (${savedAccountNumber?.slice(-4).padStart(10, "•")}) has been authorized.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[WithdrawalModal] Disbursal error:", err);
      setErrorMsg(err.message || "Failed to finalize withdrawal. Please contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 to-green-950 p-6 text-white relative shrink-0">
            <button
              onClick={onClose}
              disabled={submitting}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Verified Disbursal Settlement
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Request Bank Withdrawal
            </h2>
            <p className="text-xs text-emerald-200/90 font-medium mt-1">
              Cleared funds are paid to your registered bank account.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200/80 flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
              {/* Available Withdrawable Balance Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Available to Withdraw
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-950 mt-0.5">
                    ₦{currentAvailableBalance.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    100% Cleared for bank transfer (Min. ₦2,000)
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-300 flex items-center justify-center text-emerald-800">
                  <Coins className="w-5 h-5" />
                </div>
              </div>

              {/* Amount Input (Strictly Non-Negative) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount" className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Withdrawal Amount (₦)
                  </Label>
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Use Available Max</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₦
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="Min. 2,000"
                    value={amount}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, "");
                      setAmount(clean);
                    }}
                    className="pl-8 h-11 rounded-xl border-gray-200 font-mono text-sm font-bold text-gray-900 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Cleared available to withdraw:{" "}
                  <strong className="text-gray-900">
                    ₦{currentAvailableBalance.toLocaleString()}
                  </strong>
                </p>
              </div>

              {/* Bank Account Details (Configured from Profile) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Disbursal Bank Destination
                </Label>

                {hasLinkedBank ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-800" />
                        <span className="text-xs font-black text-gray-900">
                          {savedBankName}
                        </span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        ✓ Verified Profile Bank
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase font-medium">
                          Account Number
                        </span>
                        <span className="font-mono font-bold text-gray-800">
                          {savedAccountNumber}
                        </span>
                      </div>
                      {savedAccountName && (
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-medium">
                            Account Name
                          </span>
                          <span className="font-bold text-gray-800 truncate block">
                            {savedAccountName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Need to change bank details?</span>
                      <Link
                        to="/dashboard/profile"
                        className="font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                      >
                        <span>Edit in Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 sm:p-5 text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                          Bank Account Not Configured
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          To ensure total financial security, bank payout details can only be configured from your Profile Settings. Please add your verified NUBAN account in your profile before requesting a withdrawal.
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      <Link to="/dashboard/profile" className="flex items-center justify-center gap-1.5">
                        <span>Set Up Bank Account in Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl h-10 px-4 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !hasLinkedBank ||
                    currentAvailableBalance < 2000
                  }
                  className="rounded-xl h-10 px-5 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white gap-2 shadow-xs"
                >
                  {submitting ? (
                    "Processing Request..."
                  ) : (
                    <>
                      <span>Request Withdrawal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawalModal;
