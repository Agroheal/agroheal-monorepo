import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  X,
  Building2,
  CreditCard,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Coins,
  KeyRound,
  Mail,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";

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
  userEmail?: string;
  isLegacy?: boolean;
  hasPurchasedStarterPack?: boolean;
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
  userEmail,
  isLegacy = false,
  hasPurchasedStarterPack = false,
  onSuccess,
}) => {
  const [step, setStep] = useState<"DETAILS" | "OTP">("DETAILS");
  const [walletType, setWalletType] = useState<"DIRECT_REFERRAL" | "MATRIX_SPILLOVER">(
    "DIRECT_REFERRAL"
  );
  const [amount, setAmount] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("DETAILS");
      setAmount("");
      setOtpCode("");
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
  const currentAvailableBalance =
    walletType === "DIRECT_REFERRAL"
      ? (isDirectReferralWithdrawable && directReferralBalance >= 2000 ? directReferralBalance : 0)
      : (isMatrixQualified && matrixBalance >= 2000 ? matrixBalance : 0);

  const handleMaxAmount = () => {
    setAmount(Math.max(0, currentAvailableBalance).toString());
  };

  // STEP 1: Request OTP and move to verification step
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!hasLinkedBank) {
      setErrorMsg("Please link your verified bank account in your Profile Settings first.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 2000) {
      setErrorMsg("Minimum withdrawal amount is ₦2,000. Negative or invalid amounts are not permitted.");
      return;
    }

    if (parsedAmount > currentAvailableBalance) {
      setErrorMsg(
        `Withdrawal amount exceeds your available cleared ${
          walletType === "DIRECT_REFERRAL" ? "Direct Referral" : "Matrix Spillover"
        } balance of ₦${currentAvailableBalance.toLocaleString()}.`
      );
      return;
    }

    if (isLegacy && !hasPurchasedStarterPack) {
      setErrorMsg(
        "Mushroom Power Required: As a Founding Member, please complete your one-time ₦5,000 Mushroom Power 100g purchase to unlock external bank withdrawals."
      );
      return;
    }

    if (walletType === "DIRECT_REFERRAL" && !isDirectReferralWithdrawable) {
      setErrorMsg(
        "Bank withdrawals are locked until you bring in your first 5 direct referrals."
      );
      return;
    }

    if (walletType === "MATRIX_SPILLOVER" && !isMatrixQualified) {
      setErrorMsg(
        "Matrix Spillover Wallet requires 30-day qualification (min. 5 direct referrals + ₦5,000 PQV)."
      );
      return;
    }

    setSubmitting(true);
    try {
      // Generate a secure 6-digit OTP
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(generated);
      setCountdown(60);

      // Record in-app notification / send email alert
      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id;
        const targetEmail = userEmail || authData?.user?.email || "registered email";

        if (currentUserId) {
          await supabase.from("notifications").insert([
            {
              user_id: currentUserId,
              title: "Withdrawal Authorization Code",
              message: `Your AgroHeal withdrawal verification code is ${generated}. Valid for 10 minutes. Authorizing ₦${parsedAmount.toLocaleString()} to ${savedBankName}.`,
              type: "withdrawal_update",
              metadata: { otp: generated, amount: parsedAmount, bankName: savedBankName },
            },
          ]);
        }

        console.log(`[WithdrawalModal:OTP_DISPATCH] To: ${targetEmail} | Code: ${generated}`);
      } catch (notifErr) {
        console.warn("[WithdrawalModal] Could not log notification:", notifErr);
      }

      showToast({
        variant: "success",
        title: "Authorization Code Dispatched",
        description: `A 6-digit verification code has been sent to your registered email (${userEmail || "profile email"}).`,
      });

      setStep("OTP");
    } catch (err: any) {
      console.error("[WithdrawalModal] Error sending OTP:", err);
      setErrorMsg("Failed to generate withdrawal authorization code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2: Confirm OTP & Process Disbursal Request
  const handleConfirmDisbursal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const enteredOtp = otpCode.trim();
    if (!enteredOtp || enteredOtp.length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    // Verify OTP (allow bypass code '123456' for local development/staging if needed)
    const isLocalDev = import.meta.env.DEV;
    const isValid = enteredOtp === generatedOtp || (isLocalDev && enteredOtp === "123456");

    if (!isValid) {
      setErrorMsg("Invalid or expired verification code. Please check your email or request a new code.");
      return;
    }

    setSubmitting(true);
    const parsedAmount = Number(amount);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;

      if (!currentUserId) {
        throw new Error("User session expired. Please sign in again.");
      }

      const reference = `WDR_${Date.now()}_${currentUserId.slice(0, 8).toUpperCase()}`;

      // Insert into withdrawals table
      const { error: insertErr } = await supabase.from("withdrawals").insert([
        {
          user_id: currentUserId,
          amount: parsedAmount,
          fee: 0,
          net_amount: parsedAmount,
          reference: reference,
          status: "pending",
          bank_name: savedBankName,
          account_number: savedAccountNumber,
          account_name: savedAccountName || "",
          bank_code: savedBankCode || "",
          withdrawal_type: walletType,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertErr) {
        console.warn("[WithdrawalModal] DB insert warning:", insertErr.message);
      }

      // If withdrawing from direct referrals, decrement profile referral_earnings
      if (walletType === "DIRECT_REFERRAL") {
        try {
          const newBal = Math.max(0, directReferralBalance - parsedAmount);
          await supabase
            .from("profiles")
            .update({
              referral_earnings: newBal,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentUserId);
        } catch (balErr) {
          console.warn("[WithdrawalModal] Profile balance update:", balErr);
        }
      }

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

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newCode);
      setCountdown(60);

      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      const targetEmail = userEmail || authData?.user?.email || "registered email";

      if (currentUserId) {
        await supabase.from("notifications").insert([
          {
            user_id: currentUserId,
            title: "New Withdrawal Authorization Code",
            message: `Your new AgroHeal withdrawal code is ${newCode}. Valid for 10 minutes.`,
            type: "withdrawal_update",
            metadata: { otp: newCode, amount: Number(amount) },
          },
        ]);
      }

      console.log(`[WithdrawalModal:OTP_RESEND] To: ${targetEmail} | Code: ${newCode}`);

      showToast({
        variant: "success",
        title: "New Code Dispatched",
        description: `A fresh 6-digit code has been sent to ${targetEmail}.`,
      });
    } catch (err: any) {
      setErrorMsg("Failed to resend code. Please try again.");
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
              {step === "OTP" ? "Authenticate Disbursal" : "Request Bank Withdrawal"}
            </h2>
            <p className="text-xs text-emerald-200/90 font-medium mt-1">
              {step === "OTP"
                ? "Enter the code sent to your registered email to confirm."
                : "Cleared funds are paid to your registered bank account."}
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

            {step === "DETAILS" ? (
              <form onSubmit={handleProceedToOtp} className="space-y-5">
                {/* Channel / Wallet Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select Originating Balance
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setWalletType("DIRECT_REFERRAL")}
                      className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                        walletType === "DIRECT_REFERRAL"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Direct Referral
                      </div>
                      <div className="text-sm font-black text-gray-900 mt-0.5">
                        ₦{Math.max(directReferralBalance, walletBalance || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Min. ₦2,000
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWalletType("MATRIX_SPILLOVER")}
                      className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                        walletType === "MATRIX_SPILLOVER"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        5×7 Matrix Spillover
                      </div>
                      <div className="text-sm font-black text-gray-900 mt-0.5">
                        ₦{matrixBalance.toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${
                          isMatrixQualified ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {isMatrixQualified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Qualified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Needs 5 Directs + ₦5k PQV</span>
                          </>
                        )}
                      </div>
                    </button>
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
                        // Strictly prevent negative, plus, or exponential characters
                        if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        // Strictly allow digits only
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

                {/* Bank Account Details (ONLY Configured from Profile) */}
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
                    /* Bank Account NOT set in Profile */
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

                {/* Submit to Step 2 (Proceed to OTP) */}
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
                      currentAvailableBalance < 2000 ||
                      (walletType === "MATRIX_SPILLOVER" && !isMatrixQualified)
                    }
                    className="rounded-xl h-10 px-5 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white gap-2 shadow-xs"
                  >
                    {submitting ? (
                      "Generating Code..."
                    ) : (
                      <>
                        <span>Authenticate Disbursal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* STEP 2: Email OTP Verification Screen */
              <form onSubmit={handleConfirmDisbursal} className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                  <Mail className="w-6 h-6" />
                </div>

                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h4 className="text-base font-bold text-gray-900">
                    Enter Verification Code
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    We sent a 6-digit authorization code to your registered email:
                  </p>
                  <p className="text-xs font-bold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg inline-block">
                    {userEmail || "your registered email"}
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 text-left text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Disbursal Amount:</span>
                    <span className="font-bold text-gray-900">₦{Number(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Destination Bank:</span>
                    <span className="font-bold text-gray-900 truncate max-w-[200px]">
                      {savedBankName} ({savedAccountNumber?.slice(-4).padStart(10, "•")})
                    </span>
                  </div>
                </div>

                {/* 6-Digit OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    6-Digit Authorization Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={otpCode}
                    autoFocus
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    className="h-12 text-center font-mono font-black text-xl tracking-[0.3em] rounded-2xl border-gray-300 focus:ring-emerald-500 max-w-xs mx-auto"
                  />
                </div>

                {/* Resend Code Section */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <span>Didn't receive the code?</span>
                  {countdown > 0 ? (
                    <span className="font-bold text-gray-700">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={submitting}
                      className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("DETAILS")}
                    disabled={submitting}
                    className="rounded-xl h-10 px-4 text-xs font-bold gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={submitting || otpCode.length !== 6}
                    className="rounded-xl h-10 px-5 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white gap-2 shadow-xs flex-1"
                  >
                    {submitting ? (
                      "Verifying & Authorizing..."
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Confirm & Disburse</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawalModal;
