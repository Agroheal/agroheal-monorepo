import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  CreditCard,
  User,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/ToastComponent";
// import apiClient from "@/lib/apiClient"; // Ready for live endpoint invocation

const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint MFB",
  "OPay (PayCom)",
  "PalmPay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Taj Bank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank / ALAT",
  "Zenith Bank",
];

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  directReferralBalance: number;
  matrixBalance: number;
  isMatrixQualified: boolean;
  savedBankName?: string;
  savedAccountNumber?: string;
  savedAccountName?: string;
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
  isMatrixQualified,
  savedBankName,
  savedAccountNumber,
  savedAccountName,
  onSaveBankToProfile,
  onSuccess,
}) => {
  const [walletType, setWalletType] = useState<"DIRECT_REFERRAL" | "MATRIX_SPILLOVER">(
    "DIRECT_REFERRAL"
  );
  const [amount, setAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>(savedBankName || "");
  const [accountNumber, setAccountNumber] = useState<string>(savedAccountNumber || "");
  const [accountName, setAccountName] = useState<string>(savedAccountName || "");
  const [useSavedBank, setUseSavedBank] = useState<boolean>(
    Boolean(savedBankName && savedAccountNumber)
  );
  const [saveToProfile, setSaveToProfile] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (savedBankName && savedAccountNumber) {
      setBankName(savedBankName);
      setAccountNumber(savedAccountNumber);
      setAccountName(savedAccountName || "");
      setUseSavedBank(true);
    }
  }, [savedBankName, savedAccountNumber, savedAccountName]);

  if (!isOpen) return null;

  const currentAvailableBalance =
    walletType === "DIRECT_REFERRAL" ? directReferralBalance : matrixBalance;

  const handleMaxAmount = () => {
    setAmount(currentAvailableBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 2000) {
      setErrorMsg("Minimum withdrawal amount is ₦2,000.");
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

    if (walletType === "MATRIX_SPILLOVER" && !isMatrixQualified) {
      setErrorMsg(
        "Matrix Spillover Wallet requires 30-day qualification (min. 5 direct referrals + ₦5,000 PQV)."
      );
      return;
    }

    const targetBank = useSavedBank && savedBankName ? savedBankName : bankName;
    const targetAccount = useSavedBank && savedAccountNumber ? savedAccountNumber : accountNumber;
    const targetAccountName = useSavedBank && savedAccountName ? savedAccountName : accountName;

    if (!targetBank) {
      setErrorMsg("Please select your bank.");
      return;
    }

    const cleanAccount = targetAccount.replace(/\D/g, "");
    if (cleanAccount.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit NUBAN account number.");
      return;
    }

    if (!targetAccountName.trim()) {
      setErrorMsg("Please enter the registered bank account name.");
      return;
    }

    setSubmitting(true);

    try {
      // Save bank details to profile if requested and not currently using saved bank
      if (!useSavedBank && saveToProfile && onSaveBankToProfile) {
        try {
          await onSaveBankToProfile({
            bankName: targetBank,
            accountNumber: cleanAccount,
            accountName: targetAccountName.trim(),
          });
        } catch (saveErr) {
          console.warn("[WithdrawalModal] Could not save bank details to profile:", saveErr);
        }
      }

      /*
      // =========================================================================
      // LIVE ENDPOINT WIRING: POST /api/v1/withdrawals/request
      // UNCOMMENT the block below when ready to test live bank withdrawal processing:
      // =========================================================================
      const response = await apiClient.withdrawals.request({
        walletType,
        amount: parsedAmount,
        bankName: targetBank,
        accountNumber: cleanAccount,
        accountName: targetAccountName.trim(),
      });
      console.log("[WithdrawalModal] Live withdrawal request submitted:", response);
      */

      // Staged testing simulation (Active while backend route is commented out)
      await new Promise((res) => setTimeout(res, 900));

      showToast({
        variant: "success",
        title: "Disbursal Request Staged",
        description: `₦${parsedAmount.toLocaleString()} cleared withdrawal to ${targetBank} (${cleanAccount}) queued for admin settlement.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[WithdrawalModal] Error requesting withdrawal:", err);
      setErrorMsg(err.message || "Failed to process withdrawal request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasSavedBank = Boolean(savedBankName && savedAccountNumber);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 to-green-950 p-6 text-white relative">
            <button
              onClick={onClose}
              disabled={submitting}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Audited Cooperative Disbursal
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Request Bank Withdrawal
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1">
              Transfer cleared cooperative earnings directly to your verified commercial bank account.
            </p>
          </div>

          {/* Body Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Wallet Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Withdraw From Cleared Balance</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalletType("DIRECT_REFERRAL")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    walletType === "DIRECT_REFERRAL"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Direct Referrals</div>
                  <div className="text-base font-black font-mono text-emerald-900 mt-0.5">
                    ₦{directReferralBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-semibold">Cleared & Available</div>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletType("MATRIX_SPILLOVER")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    walletType === "MATRIX_SPILLOVER"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-[11px] font-bold text-gray-500 uppercase">5×7 Matrix Dividends</div>
                  <div className="text-base font-black font-mono text-emerald-900 mt-0.5">
                    ₦{matrixBalance.toLocaleString()}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 font-semibold ${
                      isMatrixQualified ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isMatrixQualified ? "Cleared & Qualified" : "Gatekeeper Locked"}
                  </div>
                </button>
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-xs font-bold text-gray-700">
                  Withdrawal Amount (₦)
                </Label>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-[11px] text-emerald-700 font-bold hover:underline"
                >
                  Max (₦{currentAvailableBalance.toLocaleString()})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold text-sm">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Min. 2,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-10 rounded-xl border-gray-200 font-mono text-sm font-semibold focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Destination Bank Account */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">Destination Bank Account</Label>

              {hasSavedBank && useSavedBank ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="truncate">{savedBankName}</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">
                          Saved in Profile
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-600 mt-0.5 truncate">
                        {savedAccountNumber} {savedAccountName ? `· ${savedAccountName}` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseSavedBank(false)}
                    className="text-xs font-bold text-emerald-800 hover:underline shrink-0 ml-3 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200">
                  {hasSavedBank && (
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                      <span className="text-[11px] font-semibold text-gray-600">Enter different bank account</span>
                      <button
                        type="button"
                        onClick={() => setUseSavedBank(true)}
                        className="text-xs font-bold text-emerald-800 hover:underline"
                      >
                        Use Saved Bank
                      </button>
                    </div>
                  )}

                  {/* Bank Name Dropdown */}
                  <div className="space-y-1">
                    <Label htmlFor="bank" className="text-[11px] font-semibold text-gray-600">
                      Bank Name
                    </Label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        id="bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full pl-10 pr-4 h-9 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select bank...</option>
                        {NIGERIAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1">
                    <Label htmlFor="accountNumber" className="text-[11px] font-semibold text-gray-600">
                      10-Digit NUBAN Account Number
                    </Label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="accountNumber"
                        type="text"
                        maxLength={10}
                        placeholder="0123456789"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        className="pl-10 h-9 rounded-xl border-gray-200 font-mono text-xs focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1">
                    <Label htmlFor="accountName" className="text-[11px] font-semibold text-gray-600">
                      Account Name
                    </Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="accountName"
                        type="text"
                        placeholder="e.g. John O. Doe"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="pl-10 h-9 rounded-xl border-gray-200 text-xs font-medium focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Save to Profile Checkbox */}
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-gray-600 font-medium">
                      Save this bank account to my profile for future instant withdrawals
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Statutory Notice */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-[11px] text-gray-500 leading-relaxed">
              Disbursal requests are audited against cooperative transaction ledgers to guarantee solvency and anti-money laundering compliance before bank batch dispatch.
            </div>

            {/* Submit Action */}
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
                disabled={submitting || currentAvailableBalance < 2000}
                className="rounded-xl h-10 px-5 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white gap-2 shadow-xs"
              >
                {submitting ? (
                  "Processing..."
                ) : (
                  <>
                    <span>Confirm Withdrawal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WithdrawalModal;
