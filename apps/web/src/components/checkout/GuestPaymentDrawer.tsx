import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Gift,
  CreditCard,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";

const COMMON_TYPOS: Record<string, string> = {
  "gmil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gamail.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "otlook.com": "outlook.com",
  "outloo.com": "outlook.com",
  "iclud.com": "icloud.com",
};

function suggestEmailCorrection(email: string): string | null {
  if (!email || !email.includes("@")) return null;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return null;
  const [user, domain] = parts;
  if (COMMON_TYPOS[domain]) {
    return `${user}@${COMMON_TYPOS[domain]}`;
  }
  return null;
}

function ensureFlutterwaveScript(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("flutterwave-script");
    if (existing) {
      if ((window as any).FlutterwaveCheckout) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load payment gateway"))
      );
    }
    const script = document.createElement("script");
    script.id = "flutterwave-script-guest";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment gateway"));
    document.body.appendChild(script);
  });
}

export type GuestPlanType = "green_card" | "combo";

export interface GuestPaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: GuestPlanType;
  sponsorCode?: string;
  onClaimSuccess?: (data: any) => void;
}

export const GuestPaymentDrawer: React.FC<GuestPaymentDrawerProps> = ({
  isOpen,
  onClose,
  defaultPlan = "green_card",
  sponsorCode = "356FV1",
  onClaimSuccess,
}) => {
  const navigate = useNavigate();

  // Navigation & stages: "form" | "claim" | "success"
  const [stage, setStage] = useState<"form" | "claim" | "success">("form");

  // Step 1 Guest Form State
  const [plan, setPlan] = useState<GuestPlanType>(defaultPlan);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // Sponsor resolution info
  const [sponsorDisplay, setSponsorDisplay] = useState<{
    name: string;
    code: string;
  }>({
    name: "Adetola Esther",
    code: sponsorCode || "356FV1",
  });

  // Transaction details for post-payment claim
  const [currentTxRef, setCurrentTxRef] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(
    defaultPlan === "combo" ? 15000 : 2000
  );

  // Step 2 Account Claim State
  const [claimEmail, setClaimEmail] = useState("");
  const [claimFullName, setClaimFullName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Final Success State
  const [claimedMemberId, setClaimedMemberId] = useState("");
  const [slotsAllocated, setSlotsAllocated] = useState(0);

  // Loading & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync default plan prop changes
  useEffect(() => {
    if (defaultPlan) {
      setPlan(defaultPlan);
      setAmountPaid(defaultPlan === "combo" ? 15000 : 2000);
    }
  }, [defaultPlan]);

  // Keep sponsor display updated with prop
  useEffect(() => {
    if (sponsorCode) {
      setSponsorDisplay((prev) => ({
        ...prev,
        code: sponsorCode,
      }));
    }
  }, [sponsorCode]);

  // Check email typo suggestion on the fly
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const suggestion = suggestEmailCorrection(val);
    setEmailSuggestion(suggestion);
  };

  const applyEmailSuggestion = () => {
    if (emailSuggestion) {
      setEmail(emailSuggestion);
      setEmailSuggestion(null);
    }
  };

  // Close & reset
  const handleClose = () => {
    if (isSubmitting || isClaiming) return;
    setErrorMessage(null);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────
  // 1. INITIATE PAYMENT & LAUNCH FLUTTERWAVE GATEWAY
  // ─────────────────────────────────────────────────────────────
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    const price = plan === "combo" ? 15000 : 2000;
    setIsSubmitting(true);

    try {
      await ensureFlutterwaveScript();

      // Call backend to pre-register pending guest transaction and freeze email
      const initRes = await apiClient.checkout.guestInitiate({
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        amount: price,
        plan,
        sponsorCode: sponsorCode || "356FV1",
      });

      const txRef = initRes.txRef;
      setCurrentTxRef(txRef);
      setAmountPaid(initRes.amount);

      if (initRes.sponsor) {
        setSponsorDisplay({
          name: initRes.sponsor.name || "Adetola Esther",
          code: initRes.sponsor.code || sponsorCode || "356FV1",
        });
      }

      // Initialize prefilled claim details
      setClaimEmail(cleanEmail);
      setClaimFullName(cleanName);
      setClaimPhone(cleanPhone);

      const flwKey =
        initRes.flwPublicKey ||
        (typeof window !== "undefined" && (window as any).FLUTTERWAVE_PUBLIC_KEY) ||
        "FLWPUBK-20fafa986173a9b4507c82992f53055b-X";

      const title =
        plan === "combo"
          ? "AgroHeal Combo (Green Card + Starter Pack + 1 Farm Slot)"
          : "AgroHeal Digital Green Card Activation";

      (window as any).FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: txRef,
        amount: initRes.amount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: cleanEmail,
          phone_number: cleanPhone,
          name: cleanName,
        },
        customizations: {
          title,
          description: "Organic Health & Wealth Food Revolution",
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png",
        },
        callback: (response: any) => {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            showToast({
              variant: "success",
              title: "Payment Received! 🎉",
              description:
                "Confirm your details and set your password to claim your Green Card.",
            });
            setStage("claim");
          }
          setIsSubmitting(false);
        },
        onclose: () => {
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      console.error("[GuestPaymentDrawer] Initiate error:", err);
      setErrorMessage(
        err.message || "Failed to initialize payment gateway. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. CHECK STATUS (For Bank Transfer / Delayed Callback Fallback)
  // ─────────────────────────────────────────────────────────────
  const handleCheckPaymentStatus = async () => {
    if (!currentTxRef) return;
    setIsCheckingStatus(true);
    setErrorMessage(null);

    try {
      const statusRes = await apiClient.checkout.claimStatus(currentTxRef);
      if (statusRes.isPaid) {
        showToast({
          variant: "success",
          title: "Payment Confirmed! 🎉",
          description: "Your payment was verified. Set your password to claim your account.",
        });
        setClaimEmail(statusRes.email || email);
        setClaimFullName(statusRes.fullName || fullName);
        setClaimPhone(statusRes.phone || phone);
        setStage("claim");
      } else {
        showToast({
          variant: "warning",
          title: "Payment Not Confirmed Yet",
          description:
            "If you paid via bank transfer, please wait 1 to 2 minutes for Flutterwave to settle and try again.",
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not check payment status.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. CLAIM ACCOUNT (Create User, Unified Settlement, Auto-login)
  // ─────────────────────────────────────────────────────────────
  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = claimEmail.trim().toLowerCase();
    const cleanName = claimFullName.trim();
    const cleanPhone = claimPhone.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (cleanName.length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsClaiming(true);

    try {
      const claimRes = await apiClient.checkout.claimAccount({
        txRef: currentTxRef,
        email: cleanEmail,
        password,
        fullName: cleanName,
        phone: cleanPhone,
      });

      const memberId =
        claimRes.memberId ||
        claimRes.settlement?.memberId ||
        "GC-2026-MEMBER";
      setClaimedMemberId(memberId);
      setSlotsAllocated(claimRes.settlement?.slotsAllocated || (plan === "combo" ? 1 : 0));

      // Attempt immediate login into client session
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
      } catch (loginErr) {
        console.warn("[GuestCheckout] Auto-login notice:", loginErr);
      }

      showToast({
        variant: "success",
        title: "Account Activated! 🌿",
        description: `Your Green Card ID is ${memberId}. Welcome aboard!`,
      });

      setStage("success");
      if (onClaimSuccess) onClaimSuccess(claimRes);
    } catch (err: any) {
      console.error("[GuestPaymentDrawer] Claim error:", err);
      setErrorMessage(
        err.message || "Failed to claim account. Please check your details."
      );
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-200">
              🌿
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {stage === "form" && "Instant Green Card Checkout"}
                {stage === "claim" && "Payment Verified! Set Password"}
                {stage === "success" && "Welcome to AgroHeal!"}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {stage === "form" && "Fast 60-second activation. No upfront password required."}
                {stage === "claim" && "Confirm your account details to claim your Green Card."}
                {stage === "success" && "Your Green Card is activated and ready to use."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 1: GUEST PAYMENT FORM
             ───────────────────────────────────────────────────────────── */}
          {stage === "form" && (
            <form onSubmit={handleInitiatePayment} className="space-y-6">
              {/* Sponsor Verification Badge */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-emerald-800 font-medium block">
                      Direct Sponsor Attribution
                    </span>
                    <span className="text-sm font-bold text-emerald-950">
                      {sponsorDisplay.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  {sponsorDisplay.code}
                </span>
              </div>

              {/* Package Selection Cards */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                  Select Your Activation Package
                </label>

                {/* Option 1: Combo ₦15,000 (Recommended) */}
                <div
                  onClick={() => {
                    setPlan("combo");
                    setAmountPaid(15000);
                  }}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    plan === "combo"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>POPULAR & BEST VALUE</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          plan === "combo"
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-gray-300"
                        }`}
                      >
                        {plan === "combo" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-950 text-base flex items-center space-x-2">
                          <span>Green Card + Starter Combo</span>
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Includes <strong>1 Organic Farm Slot</strong> (₦10,000) +{" "}
                          <strong>Starter Product Pack</strong> (₦3,000) + Green Card (₦2,000).
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-700">₦15,000</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                        Full Activation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Green Card Only ₦2,000 */}
                <div
                  onClick={() => {
                    setPlan("green_card");
                    setAmountPaid(2000);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    plan === "green_card"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          plan === "green_card"
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-gray-300"
                        }`}
                      >
                        {plan === "green_card" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-950 text-base">
                          Green Card Registration Only
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Lifetime membership, 10–30% food discount, 5x7 matrix placement, referral bonuses.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-700">₦2,000</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                        One-Time
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samuel Adekunle"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="e.g. samuel@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                  {emailSuggestion && (
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                      <span>
                        Did you mean <strong>{emailSuggestion}</strong>?
                      </span>
                      <button
                        type="button"
                        onClick={applyEmailSuggestion}
                        className="font-bold text-emerald-700 hover:underline ml-2"
                      >
                        Fix typo
                      </button>
                    </div>
                  )}
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Your payment receipt & Green Card verification will be sent here.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Connecting Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>
                      Pay ₦{amountPaid.toLocaleString()} Now
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-2 text-[12px] text-gray-500 font-medium">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>256-Bit Encrypted • Card, Bank Transfer, USSD via Flutterwave</span>
              </div>

              {/* Re-check status button if user previously started payment */}
              {currentTxRef && (
                <div className="pt-2 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={handleCheckPaymentStatus}
                    disabled={isCheckingStatus}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center mx-auto space-x-1"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin" : ""}`}
                    />
                    <span>Already completed payment via transfer? Check Status</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 2: POST-PAYMENT ACCOUNT CLAIM & PASSWORD CREATION
             ───────────────────────────────────────────────────────────── */}
          {stage === "claim" && (
            <form onSubmit={handleClaimAccount} className="space-y-6">
              {/* Payment Success Confirmation Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg space-y-2">
                <div className="flex items-center space-x-2 font-black text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                  <span>Payment of ₦{amountPaid.toLocaleString()} Received!</span>
                </div>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Your transaction is verified on the blockchain and ledger. Set a secure password below to activate your Green Card and gain instant dashboard access.
                </p>
                <div className="pt-2 border-t border-emerald-500/40 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-200">Ref:</span>
                  <span className="font-bold text-white tracking-wider">{currentTxRef}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  💡 <strong>Typo Protection:</strong> You can confirm or correct your email and name below before your account is permanently registered.
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                  {claimEmail !== email && (
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                      ✓ Email corrected from original payment entry ({email}).
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={claimFullName}
                    onChange={(e) => setClaimFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Create Secure Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isClaiming}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isClaiming ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Activating Green Card & Setting Up Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Activate Account & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 3: CLAIM SUCCESS
             ───────────────────────────────────────────────────────────── */}
          {stage === "success" && (
            <div className="py-6 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  OFFICIALLY ACTIVATED
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-3">
                  Congratulations, {claimFullName}!
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your Digital Green Card has been officially minted and your statutory bonuses have been distributed.
                </p>
              </div>

              {/* Digital Card Preview Pill */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-800 to-green-950 text-white shadow-xl text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono tracking-widest text-emerald-300 uppercase">
                    AGROHEAL GREEN CARD
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    ACTIVE
                  </span>
                </div>
                <div>
                  <span className="text-xs text-emerald-300 block">Member ID</span>
                  <span className="text-xl font-mono font-black tracking-wider text-white">
                    {claimedMemberId || "GC-2026-MEMBER"}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-700/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 block">MEMBER</span>
                    <span className="font-bold">{claimFullName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block">FARM SLOTS</span>
                    <span className="font-bold text-amber-300">{slotsAllocated} Slot(s)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate("/dashboard");
                }}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
              >
                <span>Enter Member Dashboard</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          Need assistance with checkout? Call or WhatsApp{" "}
          <a
            href="https://wa.me/2349168055000"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-700 hover:underline"
          >
            +234 916 805 5000
          </a>
        </div>
      </div>
    </div>
  );
};

export default GuestPaymentDrawer;

