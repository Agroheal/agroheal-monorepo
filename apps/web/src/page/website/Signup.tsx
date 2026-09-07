import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Mail, Lock, User, Phone, EyeOff, Eye } from "lucide-react";
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
import { cleanName, cleanEmail, normalizePhoneNumber, cleanReferralCode } from "@shared/dataSanitizers";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const DEFAULT_SPONSOR_CODE = "356FV1"; // Adetola Esther (Co-founder Root Sponsor)
  const queryRef = searchParams.get("ref");
  const hasQueryRef = Boolean(queryRef);
  const [referral, setReferral] = useState<string>(() => {
    return queryRef || DEFAULT_SPONSOR_CODE;
  });

  // console.log("ref param:", searchParams.get("ref"));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

    const formattedPhone = normalizePhoneNumber(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      setLoading(false);
      showToast({
        variant: "error",
        title: "Valid phone number required",
        description: "Please enter a valid phone number (at least 10 digits).",
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

    showToast({
      variant: "success",
      title: "Signup successful!",
      description: "Your account has been created.",
    });

    Sentry.metrics.count("signup_completed", 1);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
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
    <div className="min-h-screen flex">
      <Toaster />
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#f8f7f4] relative">
        <motion.div
          {...fadeUp(0)}
          className="lg:hidden flex items-center gap-2 mb-10"
        >
          <div className="w-9 h-9 rounded-xl bg-green-800 flex items-center justify-center">
            <Leaf className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-green-900 font-semibold text-lg">Agroheal</span>
        </motion.div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <motion.div {...fadeUp(0.1)} className="mb-8">
            <h1
              className="text-3xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Create your Account
            </h1>
            <p className="text-gray-500 text-sm">
              Start your organic farming journey today
            </p>
          </motion.div>

          <motion.form
            {...fadeUp(0.2)}
            className="space-y-5"
            onSubmit={handleSignup}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="John Doe"
                  className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder="08012345678"
                  className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">
                Referral Code {hasQueryRef ? "(Applied)" : "(Optional)"}
              </Label>
              <Input
                id="referral"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                type="text"
                disabled={hasQueryRef}
                placeholder="Enter sponsor code (if any)"
                className="pl-4 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all uppercase"
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                required
                className="mt-0.5 rounded border-gray-300 data-[state=checked]:bg-green-800 data-[state=checked]:border-green-800"
              />
              <label
                htmlFor="terms"
                className="text-xs text-gray-500 leading-relaxed cursor-pointer"
              >
                I agree to Agroheal's{" "}
                <Link
                  to="/terms"
                  className="text-green-800 hover:text-green-700 font-semibold transition-colors underline-offset-2 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-green-800 hover:text-green-700 font-semibold transition-colors underline-offset-2 hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-green-800 hover:bg-green-800/90 text-white"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </motion.form>

          <div className="mt-8 text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-800 font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <AuthSidebar />
    </div>
  );
};

export default Signup;
