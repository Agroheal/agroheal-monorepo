import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  Crown,
  Shield,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Mail,
  User as UserIcon,
  Phone,
  Lock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { benefits, included } from "@/helpers/dashboard.helpers";
import { supabase } from "@/lib/supabaseClient";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import * as Sentry from "@sentry/react";
import type { User } from "@supabase/supabase-js";
import {
  GREEN_CARD_FEE,
  isLegacyMember,
  getGreenCardFee,
  formatNaira,
} from "@shared/businessRules";
import { showToast } from "@/components/ui/ToastComponent";

const LIFETIME_YEARS = 100;

// Common Nigerian & global domain typo corrections
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmaik.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "iclud.com": "icloud.com",
  "icoud.com": "icloud.com",
};

function detectEmailTypo(email: string): string | null {
  if (!email || !email.includes("@")) return null;
  const parts = email.trim().split("@");
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  const suggestion = COMMON_DOMAIN_TYPOS[domain];
  return suggestion ? `${parts[0]}@${suggestion}` : null;
}

export const Subscribe: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Guest form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [emailTypoSuggestion, setEmailTypoSuggestion] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [addComboUpsell, setAddComboUpsell] = useState(false);

  // Post-payment guest password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [paidPaymentRef, setPaidPaymentRef] = useState<string | null>(null);

  // Post-payment success screen
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          const { data: prof } = await supabase
            .from("profiles")
            .select("created_at, full_name, phone")
            .eq("id", currentUser.id)
            .maybeSingle();

          setUserCreatedAt(prof?.created_at || currentUser.created_at || null);
          if (prof?.full_name) {
            const parts = prof.full_name.trim().split(" ");
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
          }
          if (prof?.phone) setGuestPhone(prof.phone);
          if (currentUser.email) setGuestEmail(currentUser.email);
        }
      } catch (err) {
        console.warn("[Subscribe] Session check fallback:", err);
      } finally {
        setIsSessionLoading(false);
      }
    };

    checkSession();

    // Load Flutterwave inline script
    if (!document.getElementById("flutterwave-script")) {
      const script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Handle email changes with real-time typo detection
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGuestEmail(val);
    const suggestion = detectEmailTypo(val);
    setEmailTypoSuggestion(suggestion);
  };

  const applyEmailTypoFix = () => {
    if (emailTypoSuggestion) {
      setGuestEmail(emailTypoSuggestion);
      setEmailTypoSuggestion(null);
    }
  };

  const isLegacy = isLegacyMember(userCreatedAt);
  const activeGreenCardFee = getGreenCardFee(userCreatedAt);
  // Management Rule: Only registered, authenticated members can opt into farm slots/combos.
  // Guests are restricted to the minimal-risk ₦2,000 Green Card registration.
  const isComboApplicable = Boolean(user && addComboUpsell);
  const finalAmount = activeGreenCardFee + (isComboApplicable ? 10000 : 0);

  const handleFlutterwavePayment = async () => {
    setFormError(null);

    // Validate inputs
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = guestEmail.trim().toLowerCase();
    const cleanPhone = guestPhone.replace(/\D/g, "");

    if (!user) {
      if (!cleanFirstName || !cleanLastName) {
        setFormError("Please enter your first and last name.");
        return;
      }
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setFormError("Please provide a valid email address.");
        return;
      }
      if (cleanPhone.length < 10) {
        setFormError("Please provide a valid phone number (at least 10 digits).");
        return;
      }
    }

    const flwKey = FLUTTERWAVE_KEYS;
    if (!flwKey) {
      alert("Flutterwave configuration key is missing. Please try again shortly.");
      return;
    }
    if (!window.FlutterwaveCheckout) {
      alert("Payment gateway is initializing. Please wait a few seconds and try again.");
      return;
    }

    Sentry.metrics.count("payment_initiated", 1);
    setLoading(true);

    const targetUserId = user?.id || `guest_${Date.now()}`;
    const reference = isComboApplicable
      ? `GC_COMBO_${Date.now()}_${targetUserId.slice(0, 8)}`
      : `GC_SUB_${Date.now()}_${targetUserId.slice(0, 8)}`;

    try {
      window.FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: reference,
        amount: finalAmount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: cleanEmail || user?.email || "",
          phone_number: cleanPhone,
          name: `${cleanFirstName} ${cleanLastName}`.trim() || user?.user_metadata?.full_name || cleanEmail,
        },
        meta: {
          user_id: targetUserId,
          plan: isComboApplicable ? "green_card_combo" : "green_card",
          has_combo: isComboApplicable,
          referral_code: referralCode.trim() || undefined,
        },
        customizations: {
          title: isComboApplicable
            ? "AgroHeal Green Card + Starter Combo"
            : "AgroHeal Green Card Pass",
          description: isComboApplicable
            ? "Lifetime Green Card + 1 Mushroom Village Slot + Mushroom Power 100g (Milestone 3 Unlock)"
            : "Lifetime Certified Membership & Platform Access",
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => setLoading(false),
        callback: async (response) => {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            Sentry.metrics.count("payment_success", 1);
            const txId = String(response.transaction_id || response.id || reference);
            setPaidPaymentRef(txId);

            // Record transaction in transactions table
            try {
              await supabase.from("transactions").insert([
                {
                  user_id: user ? user.id : null,
                  first_name: cleanFirstName,
                  last_name: cleanLastName,
                  email: cleanEmail,
                  phone: cleanPhone,
                  amount: finalAmount,
                  payment_method: "flutterwave",
                  transaction_ref: txId,
                  status: "paid",
                  project_category: addComboUpsell ? "Green Card + Starter Combo" : "Green Card",
                },
              ]);
            } catch (txErr) {
              console.warn("[Subscribe] Transaction log notice:", txErr);
            }

            // Case A: User is already logged in
            if (user) {
              try {
                const now = new Date();
                const expiresAt = new Date();
                expiresAt.setFullYear(expiresAt.getFullYear() + LIFETIME_YEARS);

                // 1. Activate Green Card Subscription
                await supabase.from("subscriptions").upsert(
                  [
                    {
                      user_id: user.id,
                      plan: "green_card",
                      status: "active",
                      started_at: now.toISOString(),
                      expires_at: expiresAt.toISOString(),
                    },
                  ],
                  { onConflict: "user_id" },
                );

                // 2. Profile update
                const profileUpdates: Record<string, any> = {
                  is_green_card_holder: true,
                  has_greencard: true,
                  greencard_status: "active",
                };
                if (addComboUpsell) {
                  profileUpdates.has_purchased_starter_pack = true;
                  profileUpdates.is_wealth_creation_active = true;
                }

                await supabase
                  .from("profiles")
                  .update(profileUpdates)
                  .eq("id", user.id);

                // 3. If Combo included, allocate 1 slot in Mushroom Village and record Starter Pack
                if (addComboUpsell) {
                  const nextPay = new Date();
                  nextPay.setDate(nextPay.getDate() + 365);

                  await supabase.from("slot_subscriptions").insert([
                    {
                      user_id: user.id,
                      project_category: "Mushroom Village",
                      slots: 1,
                      amount: 5000,
                      slotprice: 5000,
                      status: "active",
                      is_starter_pack: false,
                      last_payment_date: now.toISOString(),
                      next_payment_date: nextPay.toISOString(),
                    },
                  ]);

                  await supabase.from("orders").insert([
                    {
                      user_id: user.id,
                      product_code: "SP-MUSH-100G",
                      quantity: 1,
                      unit_price: 5000,
                      total_price: 5000,
                      pv_earned: 5000,
                      status: "PAID",
                      notes: "Starter Pack: Mushroom Power 100g (SP-MUSH-100G)",
                    },
                  ]);
                }

                setShowSuccess(true);
              } catch (subErr) {
                console.warn("[Subscribe] Direct update notice:", subErr);
                setShowSuccess(true);
              } finally {
                setLoading(false);
              }
            } else {
              // Case B: Guest Checkout — show instant password creation modal
              setLoading(false);
              setShowPasswordModal(true);
            }
          } else {
            setLoading(false);
          }
        },
      });
    } catch (err: any) {
      Sentry.captureException(err);
      setLoading(false);
      setFormError("Could not initiate payment window. Please check connection and try again.");
    }
  };

  // Complete Guest Password Setup & Redirect to Member Area
  const handleCreateGuestPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSubmitting(true);
    const cleanEmail = guestEmail.trim().toLowerCase();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      // 1. Sign up user via Supabase Auth
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: newPassword,
        options: {
          data: {
            full_name: fullName,
            phone: guestPhone.replace(/\D/g, ""),
            referral_code: referralCode.trim() || undefined,
          },
        },
      });

      if (signUpErr) {
        // If user already exists, sign in directly with provided password
        if (signUpErr.message.toLowerCase().includes("already registered")) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: newPassword,
          });
          if (signInErr) {
            throw new Error("This email is already registered. Please sign in to link your Green Card.");
          }
        } else {
          throw signUpErr;
        }
      }

      // 2. Link Green Card subscription
      const authedUser = signUpData?.user;
      if (authedUser) {
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + LIFETIME_YEARS);

        await supabase.from("subscriptions").upsert(
          [
            {
              user_id: authedUser.id,
              plan: "green_card",
              status: "active",
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
          ],
          { onConflict: "user_id" },
        );

        const profUpdates: Record<string, any> = {
          is_green_card_holder: true,
          has_greencard: true,
          greencard_status: "active",
        };
        if (addComboUpsell) {
          profUpdates.has_purchased_starter_pack = true;
          profUpdates.is_wealth_creation_active = true;
        }

        await supabase
          .from("profiles")
          .update(profUpdates)
          .eq("id", authedUser.id);

        if (addComboUpsell) {
          const nextPay = new Date();
          nextPay.setDate(nextPay.getDate() + 365);

          await supabase.from("slot_subscriptions").insert([
            {
              user_id: authedUser.id,
              project_category: "Mushroom Village",
              slots: 1,
              amount: 5000,
              slotprice: 5000,
              status: "active",
              is_starter_pack: false,
              last_payment_date: now.toISOString(),
              next_payment_date: nextPay.toISOString(),
            },
          ]);

          await supabase.from("orders").insert([
            {
              user_id: authedUser.id,
              product_code: "SP-MUSH-100G",
              quantity: 1,
              unit_price: 5000,
              total_price: 5000,
              pv_earned: 5000,
              status: "PAID",
              notes: "Starter Pack: Mushroom Power 100g (SP-MUSH-100G)",
            },
          ]);
        }
      }

      showToast({
        variant: "success",
        title: addComboUpsell
          ? "Account Created, Green Card & Combo Active! 🚀"
          : "Account Created & Green Card Active! 🎉",
        description: addComboUpsell
          ? "Welcome to AgroHeal! You have advanced directly to Milestone 3."
          : "Welcome to AgroHeal! Your lifetime Digital Green Card is ready.",
      });

      setShowPasswordModal(false);
      navigate(addComboUpsell ? "/dashboard" : "/dashboard/profile/green-card");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to set up account. Please try again.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Top Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>Official Membership Pass</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            AgroHeal Green Card Pass
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Your certified passport to community farm clusters, 5×7 matrix spillover earnings, and accredited agronomy masterclasses.
          </p>
        </div>

        {/* Success Banner if Already Paid */}
        {showSuccess && (
          <div className="max-w-xl mx-auto mb-10 p-6 rounded-3xl bg-emerald-800 text-white text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black">
                {addComboUpsell ? "Green Card & Starter Combo Active! 🚀" : "Your Green Card is Active!"}
              </h3>
              <p className="text-xs text-emerald-200">
                {addComboUpsell
                  ? "Green Card + 1 Mushroom Village Farm Slot + Mushroom Power 100g unlocked! You have automatically jumped to Milestone 3."
                  : "Payment verified successfully. Your verified digital membership pass is unlocked."}
              </p>
            </div>
            <Button
              asChild
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-xs"
            >
              <Link to={addComboUpsell ? "/dashboard" : "/dashboard/profile/green-card"}>
                <span>{addComboUpsell ? "Go to Dashboard (Milestone 3)" : "View Digital Green Card"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* Main 2-Column Split: Benefits (Left) & Lightweight Checkout Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: What You Get & Benefits */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <span>Everything Included with Green Card</span>
                </h3>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">
                  Lifetime Pass
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((b) => (
                  <div
                    key={b.title}
                    className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-emerald-200 transition-all space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center shadow-2xs">
                      <b.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{b.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>

              {/* Checklist */}
              <div className="pt-4 border-t border-gray-100 space-y-2.5">
                {included.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right Column: Checkout Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    One-Time Platform Fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-gray-900">
                      {formatNaira(activeGreenCardFee)}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">/ lifetime</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                  <Crown className="w-5 h-5" />
                </div>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Logged in state notice */}
              {user ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Logged In Member
                  </span>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user.email}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Your Green Card Pass will be activated directly for this account.
                  </p>
                </div>
              ) : (
                /* Guest Input Fields */
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs font-bold text-gray-700">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="e.g. John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-10 rounded-xl text-xs font-medium border-gray-200 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs font-bold text-gray-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="e.g. Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-10 rounded-xl text-xs font-medium border-gray-200 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-bold text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="08012345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="pl-9 h-10 rounded-xl text-xs font-medium border-gray-200 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Email with Real-time Typo Detection */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={guestEmail}
                        onChange={handleEmailChange}
                        className="pl-9 h-10 rounded-xl text-xs font-medium border-gray-200 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Email Typo Notification & 1-Click Fix */}
                    {emailTypoSuggestion && (
                      <div className="flex items-center justify-between text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-1.5 truncate">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate">
                            Did you mean <strong>{emailTypoSuggestion}</strong>?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={applyEmailTypoFix}
                          className="text-[11px] font-bold text-amber-900 hover:text-black underline ml-2 shrink-0 cursor-pointer"
                        >
                          Apply fix
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Optional Referral Code */}
                  <div className="space-y-1">
                    <Label htmlFor="refCode" className="text-xs font-bold text-gray-700">
                      Sponsor Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="refCode"
                      placeholder="e.g. 356FV1"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="h-10 rounded-xl text-xs font-mono uppercase font-bold border-gray-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Optional Wealth Creation Combo Upsell (Available to Authenticated Members) */}
              {user ? (
                <div
                  onClick={() => setAddComboUpsell(!addComboUpsell)}
                  className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                    addComboUpsell
                      ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500/40 shadow-xs"
                      : "bg-gray-50/70 border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="comboUpsell"
                      checked={addComboUpsell}
                      onChange={(e) => setAddComboUpsell(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="comboUpsell" className="text-xs font-bold text-gray-900 cursor-pointer">
                          Add Starter Combo (Milestone 2)
                        </label>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          +₦10,000
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Your starter package is <strong>₦10,000</strong> (<strong>₦5,000</strong> Mushroom Group farm setup + <strong>₦5,000</strong> Mushroom Power 100g). Remember that a farm slot alone won't qualify without the Mushroom 100g product—we only sell it together as a combo.
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-emerald-800">
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          🚀 Jumps straight to Milestone 3
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          🔓 Unlocks Bank Withdrawals
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-900">
                      Minimal-Risk Guarantee: ₦{activeGreenCardFee.toLocaleString()} Pass
                    </h4>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      To prevent reconciliation risks and protect your funds, guests complete their ₦{activeGreenCardFee.toLocaleString()} Green Card account setup first. Once your account is active, you can seamlessly add commercial farm slots and starter combos from inside your dashboard.
                    </p>
                  </div>
                </div>
              )}

              {/* Checkout Trigger */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleFlutterwavePayment}
                  disabled={loading}
                  className="w-full h-12 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connecting Gateway...
                    </span>
                  ) : (
                    <>
                      <span>
                        {addComboUpsell
                          ? `Get Green Card + Starter Combo (${formatNaira(finalAmount)})`
                          : `Get Green Card Pass (${formatNaira(activeGreenCardFee)})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Instant Flutterwave 256-bit SSL checkout</span>
                </div>
              </div>

              {/* Existing Member Sign In Prompt */}
              {!user && (
                <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
                  <span>Already an AgroHeal member? </span>
                  <Link to="/signin" className="font-bold text-emerald-800 hover:underline">
                    Sign in to your account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── POST-PAYMENT INSTANT PASSWORD CREATION MODAL FOR GUESTS ── */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-8 space-y-5 text-center"
            >
              <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Payment Verified! Set Your Password
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your Green Card payment was successful. Create your account password to immediately view your Digital Green Card and access your farm dashboard.
                </p>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-mono">
                  {guestEmail}
                </Badge>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleCreateGuestPassword} className="space-y-4 text-left">
                <div className="space-y-1">
                  <Label htmlFor="pwd" className="text-xs font-bold text-gray-700">
                    Create Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="pwd"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 h-11 rounded-xl text-xs font-medium border-gray-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cpwd" className="text-xs font-bold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="cpwd"
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 h-11 rounded-xl text-xs font-medium border-gray-200 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={passwordSubmitting || !newPassword || !confirmPassword}
                  className="w-full h-11 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {passwordSubmitting ? (
                    "Activating Account..."
                  ) : (
                    <>
                      <span>Complete Setup & Open Green Card</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscribe;
