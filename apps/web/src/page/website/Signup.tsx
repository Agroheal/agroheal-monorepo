import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Mail, Lock, User, Phone, EyeOff, Eye, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@/components/ui/ToastComponent";

import * as Sentry from "@sentry/react";
import AuthSidebar from "@/components/webComponents/authSidebar";
import { cleanName, cleanEmail, normalizePhoneNumber, cleanReferralCode, validatePhoneNumber, SUPPORTED_COUNTRY_CODES } from "@shared/dataSanitizers";
import { PasswordRequirementsTracker, checkPasswordRequirements } from "@/components/common/PasswordRequirementsTracker";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(redirectUrl, { replace: true });
      }
    });
  }, [navigate, redirectUrl]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+234");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isEmailConfirmationPending, setIsEmailConfirmationPending] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const DEFAULT_SPONSOR_CODE = "356FV1"; // Adetola Esther (Co-founder Root Sponsor)
  const queryRef = searchParams.get("ref");
  const storedRef = typeof window !== "undefined" ? localStorage.getItem("agroheal_ref") : null;
  const effectiveRef = (queryRef || storedRef || DEFAULT_SPONSOR_CODE).trim().toUpperCase();
  const hasQueryRef = Boolean(queryRef || storedRef);
  const [referral, setReferral] = useState<string>(effectiveRef);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // console.log("ref param:", searchParams.get("ref"));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!termsAccepted) {
      setLoading(false);
      showToast({
        variant: "error",
        title: "Terms & Conditions Required",
        description: "Please read and accept Agroheal's Terms of Service and Privacy Policy to proceed.",
      });
      return;
    }

    const cleanedName = cleanName(name);
    if (!cleanedName) {
      setLoading(false);
      showToast({
        variant: "error",
        title: "Full name required",
        description: "Please enter your full name.",
      });
      return;
    }

    const phoneValidation = validatePhoneNumber(phone, countryCode);
    if (!phoneValidation.isValid) {
      setLoading(false);
      showToast({
        variant: "error",
        title: "Invalid phone number",
        description: phoneValidation.error || "Please enter a valid phone number.",
      });
      return;
    }
    const formattedPhone = phoneValidation.normalized;

    const { isValid: isPasswordValid } = checkPasswordRequirements(password);
    if (!isPasswordValid) {
      setLoading(false);
      showToast({
        variant: "error",
        title: "Password requirements not met",
        description: "Password must be at least 8 characters long and contain both letters and numbers.",
      });
      return;
    }

    const formattedEmail = cleanEmail(email);
    const cleanedReferral = cleanReferralCode(referral) || DEFAULT_SPONSOR_CODE;

    // Check if email already registered
    const { data: emailExists, error: rpcError } = await supabase.rpc(
      "check_email_exists",
      {
        email_input: formattedEmail,
      }
    );

    if (rpcError) {
      console.error("RPC Error (check_email_exists):", rpcError);
      // We continue to signUp even if RPC fails, as signUp will also check for existing users
    }

    // if email exist call this
    if (emailExists) {
      setLoading(false);
      showToast({
        variant: "error",
        title: "Email already exists",
        description:
          "An account with this email already exists. Please sign in.",
      });
      return;
    }

    // 1️Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: formattedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: cleanedName,
          phone: formattedPhone,
          referral_code: cleanedReferral,
        },
      },
    });

    if (error) {
      setLoading(false);
      console.error("Signup Error Details:", error);
      Sentry.captureException(error, {
        extra: {
          action: "signup",
          errorDetails: error,
        },
      });

      showToast({
        variant: "error",
        title: "Signup not successful!",
        description: error.message || "Account failed to create, Retry or check your Network.",
      });
      return;
    }

    const user = data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { error: phoneUpdateError } = await supabase
      .from("profiles")
      .update({ phone: formattedPhone })
      .eq("id", user.id);

    if (phoneUpdateError) {
      console.error("Failed to save phone number on profile:", phoneUpdateError);
      Sentry.captureException(phoneUpdateError, {
        extra: { action: "signup_phone_update", userId: user.id },
      });
    }

    setLoading(false);

    if (data.session) {
      // Direct session granted (email confirmation disabled or auto-confirmed)
      showToast({
        variant: "success",
        title: "Signup successful!",
        description: "Your account has been created. Redirecting...",
      });

      Sentry.metrics.count("signup_completed", 1);
      if (typeof window !== "undefined") {
        localStorage.removeItem("agroheal_ref");
      }
      setTimeout(() => {
        navigate(redirectUrl);
      }, 1000);
    } else {
      // Email confirmation is required by Supabase Auth
      setIsEmailConfirmationPending(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem("agroheal_ref");
      }
      showToast({
        variant: "success",
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail(email),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        showToast({
          variant: "error",
          title: "Resend failed",
          description: error.message || "Could not resend verification email.",
        });
      } else {
        showToast({
          variant: "success",
          title: "Verification email resent!",
          description: `A new link has been sent to ${email}.`,
        });
      }
    } catch (err) {
      console.error("Resend error:", err);
    } finally {
      setResending(false);
    }
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

  return (
    <div className="h-screen max-h-screen overflow-hidden flex">
      <Toaster />
      <div className="flex-1 h-full flex flex-col justify-start sm:justify-center items-center px-4 sm:px-6 py-3 sm:py-4 bg-[#f8f7f4] relative overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <motion.div
          {...fadeUp(0)}
          className="lg:hidden flex items-center gap-2 mb-2 sm:mb-3"
        >
          <div className="w-7 h-7 sm:w-8 h-8 rounded-xl bg-green-800 flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-green-900 font-semibold text-sm sm:text-base">Agroheal</span>
        </motion.div>

        <div className="w-full max-w-[420px] my-auto">
          {isEmailConfirmationPending ? (
            <motion.div {...fadeUp(0.1)} className="text-center py-6 px-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7" />
              </div>
              <h1
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Verify your Email
              </h1>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                We've sent a verification link to{" "}
                <span className="font-semibold text-gray-900">{email}</span>.
              </p>
              <div className="p-3.5 bg-green-50/80 border border-green-200/60 rounded-xl text-left text-xs text-green-900 mb-6 space-y-1.5">
                <p className="font-semibold text-green-950">Next steps:</p>
                <p>1. Open your inbox (check Spam or Junk if not found).</p>
                <p>2. Click the verification link inside the email.</p>
                <p>3. Return here and sign in to access your dashboard.</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full h-11 border-green-700 text-green-700 hover:bg-green-50 rounded-xl font-medium"
                  disabled={resending}
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </Button>
                <Link
                  to={redirectUrl !== "/dashboard" ? `/signin?redirect=${encodeURIComponent(redirectUrl)}` : "/signin"}
                  className="block w-full py-2.5 bg-green-800 hover:bg-green-900 text-white font-medium text-sm rounded-xl text-center transition-colors"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Heading */}
              <motion.div {...fadeUp(0.1)} className="mb-2 sm:mb-3">
                <h1
                  className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Create your Account
                </h1>
                <p className="text-gray-500 text-xs">
                  Start your organic farming journey today
                </p>
              </motion.div>

          <motion.form
            {...fadeUp(0.2)}
            className="space-y-2 sm:space-y-2.5"
            onSubmit={handleSignup}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-[11px] sm:text-xs font-semibold text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="John Doe"
                    className="pl-9 h-9 sm:h-10 bg-white border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-[11px] sm:text-xs font-semibold text-gray-700">Phone Number</Label>
                <div className="flex gap-1.5 sm:gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-9 sm:h-10 px-2 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:border-green-700 focus:ring-green-700/20 transition-all outline-none"
                    aria-label="Country Code"
                  >
                    {SUPPORTED_COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.flag} {item.code} ({item.country})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      placeholder={countryCode === "+234" ? "08012345678" : "Phone number"}
                      className="pl-9 h-9 sm:h-10 bg-white border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[11px] sm:text-xs font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9 h-9 sm:h-10 bg-white border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[11px] sm:text-xs font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-9 pr-9 h-9 sm:h-10 bg-white border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <PasswordRequirementsTracker password={password} />
            </div>

            {/* Referral Code */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="referral" className="text-[11px] sm:text-xs font-semibold text-gray-700 truncate">
                  Referral Code
                </Label>
                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                  {hasQueryRef ? "(Applied)" : "(Optional)"}
                </span>
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  id="referral"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  type="text"
                  disabled={hasQueryRef}
                  placeholder="Sponsor code"
                  className="pl-9 h-9 sm:h-10 bg-white border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:border-green-700 focus:ring-green-700/20 transition-all uppercase tracking-wider"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-0.5">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                className="mt-0.5 rounded border-gray-300 data-[state=checked]:bg-green-800 data-[state=checked]:border-green-800"
              />
              <label
                htmlFor="terms"
                className="text-xs text-gray-500 leading-tight cursor-pointer"
              >
                I agree to Agroheal's{" "}
                <Link
                  to="/legal#terms"
                  className="text-green-800 hover:text-green-700 font-semibold transition-colors underline-offset-2 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/legal#privacy"
                  className="text-green-800 hover:text-green-700 font-semibold transition-colors underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1.5 sm:pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-10 sm:h-11 bg-green-800 hover:bg-green-700 text-white font-bold rounded-lg sm:rounded-xl text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </motion.form>

          {/* Already have account */}
          <div className="mt-2.5 sm:mt-3 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link
              to={redirectUrl !== "/dashboard" ? `/signin?redirect=${encodeURIComponent(redirectUrl)}` : "/signin"}
              className="text-green-800 font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>

          {/* Back to home */}
          <div className="text-center mt-1.5">
            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <AuthSidebar />
    </div>
  );
};

export default Signup;
