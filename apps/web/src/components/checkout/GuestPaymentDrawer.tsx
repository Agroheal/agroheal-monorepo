import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  CreditCard,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { trackMetaPixel } from "@/lib/metaPixel";

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

export type GuestPlanType = "combo" | "installment" | "green_card";

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
  defaultPlan = "combo",
  sponsorCode = "356FV1",
  onClaimSuccess,
}) => {
  const navigate = useNavigate();

  // Navigation & stages: "form" | "processing" | "claim" | "success"
  const [stage, setStage] = useState<"form" | "processing" | "claim" | "success">("form");

  // Step 1 Guest Form State
  const [plan, setPlan] = useState<GuestPlanType>(defaultPlan);
  const [selectedGateway, setSelectedGateway] = useState<"flutterwave" | "nomba">("nomba");
  const { launchPayment } = usePaymentGateway();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Fallback Manual Claim State (Only used if auto-creation encounters conflict)
  const [claimEmail, setClaimEmail] = useState("");
  const [claimFullName, setClaimFullName] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimPassword, setClaimPassword] = useState("");

  // Final Success State
  const [claimedMemberId, setClaimedMemberId] = useState("");
  const [slotsAllocated, setSlotsAllocated] = useState(0);

  // Loading & Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync default plan prop changes
  useEffect(() => {
    if (defaultPlan) {
      setPlan(defaultPlan);
      setAmountPaid(defaultPlan === "combo" ? 15000 : 2000);
    }
  }, [defaultPlan]);

  const [isResolvingSponsor, setIsResolvingSponsor] = useState(false);

  // Lock body scroll when drawer is open to guarantee absolute mobile isolation
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Dynamically resolve sponsor details on mount and prop change
  useEffect(() => {
    let isMounted = true;
    const cleanCode = (sponsorCode || "356FV1").trim();

    const resolveSponsor = async () => {
      setIsResolvingSponsor(true);
      try {
        // 1. Authoritative Express backend endpoint
        const serverRes = await apiClient.checkout.resolveSponsor(cleanCode).catch(() => null);
        if (serverRes && serverRes.found && serverRes.fullName) {
          if (isMounted) {
            setSponsorDisplay({
              name: serverRes.fullName,
              code: serverRes.referralCode || cleanCode,
            });
          }
          return;
        }

        // 2. Direct Supabase RPC
        const { data, error } = await supabase.rpc("resolve_referral_sponsor", {
          sponsor_input: cleanCode,
        });

        if (!error && data && (data as any).found && (data as any).sponsor) {
          if (isMounted) {
            setSponsorDisplay({
              name: (data as any).sponsor.full_name || "Adetola Esther",
              code: (data as any).sponsor.referral_code || cleanCode,
            });
          }
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, referral_code")
          .or(`referral_code.eq.${cleanCode.toUpperCase()},member_id.eq.${cleanCode}`)
          .maybeSingle();

        if (prof && isMounted) {
          setSponsorDisplay({
            name: prof.full_name || "Adetola Esther",
            code: prof.referral_code || cleanCode,
          });
          return;
        }

        if (isMounted) {
          setSponsorDisplay({
            name: "Adetola Esther",
            code: cleanCode,
          });
        }
      } catch (err) {
        console.warn("[GuestPaymentDrawer] Could not resolve sponsor:", err);
      } finally {
        if (isMounted) setIsResolvingSponsor(false);
      }
    };

    resolveSponsor();
    return () => {
      isMounted = false;
    };
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
    if (isSubmitting) return;
    setErrorMessage(null);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────
  // AUTO-PROVISION ACCOUNT & REDIRECT DIRECTLY TO DASHBOARD
  // ─────────────────────────────────────────────────────────────
  const executeAutoProvisionAndRedirect = async (
    targetTxRef: string,
    userEmail: string,
    userName: string,
    userPhone: string,
    userPassword?: string
  ) => {
    setIsSubmitting(true);
    setStage("processing");

    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanName = userName.trim();
    const cleanPhone = userPhone.trim();
    const effectivePassword =
      userPassword && userPassword.trim().length >= 6
        ? userPassword.trim()
        : cleanPhone.length >= 6
        ? cleanPhone
        : "Agroheal@2026";

    try {
      // 1. Auto-claim account (Supabase Auth admin createUser with email_confirm: true)
      let claimRes: any = null;
      try {
        claimRes = await apiClient.checkout.claimAccount({
          txRef: targetTxRef,
          email: cleanEmail,
          password: effectivePassword,
          fullName: cleanName,
          phone: cleanPhone,
        });
      } catch (claimAttemptErr: any) {
        console.warn("[GuestPaymentDrawer] Settlement notice:", claimAttemptErr?.message);
        throw claimAttemptErr;
      }

      const memberId =
        claimRes?.memberId ||
        claimRes?.settlement?.memberId ||
        "GC-2026-MEMBER";
      setClaimedMemberId(memberId);
      setSlotsAllocated(
        claimRes?.settlement?.slotsAllocated || (plan === "combo" ? 1 : 0)
      );

      // 2. Direct client sign-in (email is pre-confirmed, zero verification link required)
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: effectivePassword,
        });
      } catch (authErr) {
        console.warn("[GuestCheckout] Auto sign-in notice:", authErr);
      }

      const isExisting = claimRes?.isExistingMember || claimRes?.settlement?.remainingDebt !== undefined;
      const toastTitle = isExisting ? "Payment Confirmed! 🎉" : "Account Created! 🎉";
      const toastDesc =
        claimRes?.message ||
        (claimRes?.settlement?.remainingDebt !== undefined
          ? `Payment applied to your balance! Redirecting to your dashboard...`
          : isExisting
          ? `Payment credited to your account! Redirecting to your dashboard...`
          : `Welcome to AgroHeal! Your Green Card ID is ${memberId}. Redirecting to your dashboard...`);

      showToast({
        variant: "success",
        title: toastTitle,
        description: toastDesc,
      });

      setStage("success");
      if (onClaimSuccess) onClaimSuccess(claimRes);

      // 3. Seamless auto-redirect to dashboard
      setTimeout(() => {
        onClose();
        navigate("/dashboard");
      }, 1500);
    } catch (claimErr: any) {
      console.error("[GuestPaymentDrawer] Auto-provisioning error:", claimErr);
      // Fallback: If an edge case occurs (e.g. existing email conflict), allow user to view fallback form
      setClaimEmail(cleanEmail);
      setClaimFullName(cleanName);
      setClaimPhone(cleanPhone);
      setClaimPassword(effectivePassword);
      setErrorMessage(
        claimErr.message ||
          "Payment was received! Please confirm your details below to finish setup."
      );
      setStage("claim");
    } finally {
      setIsSubmitting(false);
    }
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
      // Call backend to pre-register pending guest transaction and freeze email
      const initRes = await apiClient.checkout.guestInitiate({
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        amount: price,
        plan,
        sponsorCode: sponsorCode || "356FV1",
        gateway: selectedGateway,
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

      const title =
        plan === "combo"
          ? "AgroHeal Combo (Green Card + Starter Pack + 1 Farm Slot)"
          : "AgroHeal Loan / Instalment Initial Deposit";

      await launchPayment({
        gateway: selectedGateway,
        amount: initRes.amount,
        txRef,
        customerEmail: cleanEmail,
        customerName: cleanName,
        customerPhone: cleanPhone,
        title,
        publicKey: initRes.flwPublicKey,
        checkoutUrl: initRes.checkoutUrl,
        onSuccess: async (payRes) => {
          trackMetaPixel("Purchase", {
            value: initRes.amount,
            currency: "NGN",
            content_name: title,
            transaction_id: payRes.reference || txRef,
          });
          await executeAutoProvisionAndRedirect(
            payRes.reference,
            cleanEmail,
            cleanName,
            cleanPhone,
            password
          );
        },
        onClose: () => {
          setIsSubmitting(false);
        },
        onError: (err) => {
          setIsSubmitting(false);
          setErrorMessage(err.message || "Payment initialization failed.");
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
        if (statusRes.isClaimed) {
          showToast({
            variant: "success",
            title: "Account Already Active! 🎉",
            description: "Redirecting to your dashboard...",
          });
          onClose();
          navigate("/dashboard");
        } else {
          // Auto-provision immediately!
          await executeAutoProvisionAndRedirect(
            currentTxRef,
            statusRes.email || email,
            statusRes.fullName || fullName,
            statusRes.phone || phone,
            password
          );
        }
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
  // 3. FALLBACK MANUAL CLAIM SUBMISSION
  // ─────────────────────────────────────────────────────────────
  const handleFallbackClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    await executeAutoProvisionAndRedirect(
      currentTxRef,
      claimEmail,
      claimFullName,
      claimPhone,
      claimPassword
    );
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex justify-end overflow-hidden transition-opacity duration-200"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.72)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="w-full h-full max-h-[100dvh] sm:max-w-lg shadow-2xl flex flex-col justify-between sm:rounded-l-3xl relative overflow-hidden"
        style={{ backgroundColor: "#ffffff", color: "#111827" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className="flex-shrink-0 p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-200 flex-shrink-0">
              🌿
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-snug truncate">
                {stage === "form" && "Instant Green Card Checkout"}
                {stage === "processing" && "Activating Your Account..."}
                {stage === "claim" && "Complete Account Setup"}
                {stage === "success" && "Welcome to AgroHeal!"}
              </h2>
              <p className="text-xs text-gray-500 font-medium truncate">
                {stage === "form" && "Auto account creation. Zero email verification needed."}
                {stage === "processing" && "Verifying payment & minting Green Card..."}
                {stage === "claim" && "Confirm your details to enter dashboard."}
                {stage === "success" && "Your Green Card is activated. Redirecting..."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div
          className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
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
                      {isResolvingSponsor ? "Verifying Referrer..." : sponsorDisplay.name}
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
                          <span>Full Payment (Starter Combo)</span>
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Includes <strong>1 Organic Farm Slot</strong> (₦10,000) +{" "}
                          <strong>Starter Product Pack</strong> (₦3,000) + Green Card (₦2,000).
                        </p>
                        <span className="inline-block mt-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                          ⚡ Installment payment available below (from ₦2,000 today)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-700">₦15,000</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                        Full Settlement
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
                          Loan / Instalment Option
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Start with an initial ₦2,000 deposit towards your ₦15,000 package. Balance spread across weekly instalments.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-700">₦2,000</span>
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                        Initial Deposit
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
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
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
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
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
                    Your Green Card receipt and account will be linked to this email.
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
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      Choose Password (Optional)
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Defaults to your phone number
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to use phone number"
                      className="w-full px-4 py-3 sm:py-2.5 pr-11 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Rail Selector (Flutterwave / Nomba) */}
              <PaymentMethodSelector
                selectedMethod={selectedGateway}
                onSelectMethod={(m) => setSelectedGateway(m as "flutterwave" | "nomba")}
                amount={plan === "combo" ? 15000 : 2000}
                disabled={isSubmitting}
              />

              {/* Instant Automated Registration Promise */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-xs text-emerald-900 flex items-start space-x-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Instant Dashboard Access:</strong> Upon successful payment, your account is automatically created and logged in. No email verification link required.
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
                    <span>Pay ₦{amountPaid.toLocaleString()} Now</span>
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
                    <span>Paid via Bank Transfer? Click to Auto-Activate</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE: PROCESSING (AUTOMATIC PROVISIONING)
             ───────────────────────────────────────────────────────────── */}
          {stage === "processing" && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <RefreshCw className="w-10 h-10 animate-spin" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  PAYMENT RECEIVED
                </span>
                <h3 className="text-2xl font-black text-gray-900">
                  Setting Up Your Account...
                </h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  We are automatically creating your account, minting your Digital Green Card, and logging you into your member dashboard.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 max-w-sm mx-auto text-xs text-gray-500 font-mono">
                Ref: {currentTxRef}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE: FALLBACK CLAIM (Only if automated race condition occurs)
             ───────────────────────────────────────────────────────────── */}
          {stage === "claim" && (
            <form onSubmit={handleFallbackClaimSubmit} className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg space-y-2">
                <div className="flex items-center space-x-2 font-black text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                  <span>Payment of ₦{amountPaid.toLocaleString()} Confirmed!</span>
                </div>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Please confirm your login details below to complete your dashboard activation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
                  />
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
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={claimPassword}
                    onChange={(e) => setClaimPassword(e.target.value)}
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-base sm:text-sm transition-all h-12 sm:h-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg"
              >
                {isSubmitting ? "Activating..." : "Confirm & Enter Dashboard →"}
              </button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE: SUCCESS CELEBRATION
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
                  Welcome, {fullName || "Member"}!
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your account has been created and your Digital Green Card is ready.
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
                    <span className="font-bold">{fullName || "Member"}</span>
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
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Enter Member Dashboard Now</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div
          className="flex-shrink-0 p-3.5 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500"
          style={{ backgroundColor: "#f9fafb" }}
        >
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
    </div>,
    document.body
  );
};

export default GuestPaymentDrawer;
