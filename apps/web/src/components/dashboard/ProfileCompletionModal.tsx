import React, { useState, useEffect } from "react";
import {
  Phone,
  Users,
  Building2,
  ShieldCheck,
  CheckCircle2,
  LoaderCircle,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { cleanName, normalizePhoneNumber } from "@shared/dataSanitizers";
import { motion, AnimatePresence } from "framer-motion";

export interface ProfileCompletionModalProps {
  userId: string;
  initialPhone?: string;
  initialKin?: {
    kin_name?: string;
    kin_address?: string;
    kin_number?: string;
  } | null;
  initialBank?: {
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
  } | null;
  canDismiss?: boolean;
  onClose?: () => void;
  onComplete: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  userId,
  initialPhone = "",
  initialKin = null,
  initialBank = null,
  canDismiss = false,
  onClose,
  onComplete,
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [kinName, setKinName] = useState(initialKin?.kin_name || "");
  const [kinPhone, setKinPhone] = useState(initialKin?.kin_number || "");
  const [kinAddress, setKinAddress] = useState(initialKin?.kin_address || "");

  // Optional Bank Section
  const [showBankSection, setShowBankSection] = useState(false);
  const [bankName, setBankName] = useState(initialBank?.bank_name || "");
  const [accountNumber, setAccountNumber] = useState(
    initialBank?.bank_account_number || "",
  );
  const [accountName, setAccountName] = useState(
    initialBank?.bank_account_name || "",
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
    if (initialKin) {
      setKinName(initialKin.kin_name || "");
      setKinPhone(initialKin.kin_number || "");
      setKinAddress(initialKin.kin_address || "");
    }
    if (initialBank) {
      setBankName(initialBank.bank_name || "");
      setAccountNumber(initialBank.bank_account_number || "");
      setAccountName(initialBank.bank_account_name || "");
    }
  }, [initialPhone, initialKin, initialBank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Phone
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^[0-9]+$/.test(normalizedPhone) || normalizedPhone.length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    // 2. Validate Next of Kin
    const cleanedKinName = cleanName(kinName);
    const normalizedKinPhone = normalizePhoneNumber(kinPhone);
    const cleanedKinAddress = kinAddress.trim().replace(/\s+/g, " ");

    if (!cleanedKinName || cleanedKinName.length < 3) {
      toast.error("Please enter the full legal name of your Next of Kin");
      return;
    }

    if (
      !/^[0-9]+$/.test(normalizedKinPhone) ||
      normalizedKinPhone.length < 10
    ) {
      toast.error(
        "Please enter a valid phone number for your Next of Kin (at least 10 digits)",
      );
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();

      // Profile updates payload
      const profileUpdates: Record<string, any> = {
        phone: normalizedPhone,
      };

      if (bankName.trim() && accountNumber.trim()) {
        profileUpdates.bank_name = bankName.trim();
        profileUpdates.bank_account_number = accountNumber.trim();
        if (accountName.trim()) {
          profileUpdates.bank_account_name = cleanName(accountName);
        }
      }

      // Update profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileError) {
        throw new Error(profileError.message || "Failed to update profile");
      }

      // Check existing kin details
      const { data: existingKin, error: kinFetchError } = await supabase
        .from("kin_details")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (kinFetchError) {
        console.warn("Could not check existing kin_details:", kinFetchError);
      }

      if (existingKin?.id) {
        const { error: kinUpdateError } = await supabase
          .from("kin_details")
          .update({
            kin_name: cleanedKinName,
            kin_number: normalizedKinPhone,
            kin_address: cleanedKinAddress || null,
            date_updated: now,
          })
          .eq("user_id", userId);

        if (kinUpdateError) throw kinUpdateError;
      } else {
        const { error: kinInsertError } = await supabase
          .from("kin_details")
          .insert({
            user_id: userId,
            kin_name: cleanedKinName,
            kin_number: normalizedKinPhone,
            kin_address: cleanedKinAddress || null,
            date_created: now,
            date_updated: now,
          });

        if (kinInsertError) throw kinInsertError;
      }

      toast.success("Profile & Beneficiary details successfully recorded!");
      onComplete();
    } catch (err: any) {
      console.error("Profile completion error:", err);
      toast.error(
        err.message || "Failed to save details. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-200/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                Official Account Setup
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Complete Your Profile
              </h2>
            </div>
          </div>

          <p className="text-xs text-emerald-100/90 leading-relaxed mt-2">
            To ensure secure transaction communications and safeguard your
            quarterly farm dividends under our Legal Succession Covenant, please
            complete your primary contact and beneficiary details.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {/* Section 1: Member Phone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Your Contact Phone Number</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Required for Referrer &amp; Support
              </span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678 or +234..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
              required
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                <span>Next of Kin / Beneficiary</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-gray-500">
                Asset Succession
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-medium text-gray-600 block mb-1">
                  Beneficiary Full Legal Name <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={kinName}
                  onChange={(e) => setKinName(e.target.value)}
                  placeholder="e.g. Adebayo Johnson"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-gray-600 block mb-1">
                    Beneficiary Phone Number <span className="text-rose-500">*</span>
                  </span>
                  <input
                    type="tel"
                    value={kinPhone}
                    onChange={(e) => setKinPhone(e.target.value)}
                    placeholder="e.g. 08098765432"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <span className="text-[11px] font-medium text-gray-600 block mb-1">
                    Beneficiary Address (Optional)
                  </span>
                  <input
                    type="text"
                    value={kinAddress}
                    onChange={(e) => setKinAddress(e.target.value)}
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Optional Bank Payout Details (Collapsible) */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowBankSection(!showBankSection)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-bold text-gray-800">
                  Bank Settlement Details (Optional)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  For Dividends
                </span>
              </div>
              {showBankSection ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            <AnimatePresence>
              {showBankSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-3 overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-medium text-gray-600 block mb-1">
                        Bank Name
                      </span>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Zenith Bank, GTBank"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-gray-600 block mb-1">
                        10-Digit Account Number
                      </span>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) =>
                          setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="e.g. 0123456789"
                        maxLength={10}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-gray-600 block mb-1">
                      Account Name
                    </span>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-green-900 hover:from-emerald-900 hover:to-green-950 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Saving Profile Details...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete &amp; Proceed to Dashboard
                </>
              )}
            </button>

            {!canDismiss && (
              <p className="text-[11px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                These details are required once to activate full dashboard access.
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileCompletionModal;
