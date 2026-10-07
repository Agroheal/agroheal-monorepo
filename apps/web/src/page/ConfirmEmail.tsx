import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Leaf, Mail, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "react-hot-toast";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import AuthSidebar from "@/components/webComponents/authSidebar";
import { cleanEmail } from "@shared/dataSanitizers";
import * as Sentry from "@sentry/react";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEmail = searchParams.get("email") || "";
  const queryCode = searchParams.get("code") || searchParams.get("token") || "";
  const tokenHash = searchParams.get("token_hash");

  const [email, setEmail] = useState<string>(queryEmail);
  const [code, setCode] = useState<string>(queryCode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Check if session already active or if URL contains hash/token_hash for automatic verification
  useEffect(() => {
    const handleUrlVerification = async () => {
      // 1. If user already has an active authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
        return;
      }

      // 2. If token_hash is in URL query
      if (tokenHash) {
        setIsLoading(true);
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "signup",
          });

          if (!error) {
            setIsSuccess(true);
            showToast({
              variant: "success",
              title: "Email confirmed",
              description: "Your email has been verified successfully.",
            });
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1800);
            return;
          }
          // If signup type failed, try email type
          const { error: retryError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          });
          if (!retryError) {
            setIsSuccess(true);
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1800);
            return;
          }
          setErrorMessage(retryError.message || error.message);
        } catch (err: unknown) {
          console.error("Token hash verification error:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleUrlVerification();
  }, [tokenHash, navigate]);

  // Handle Verify Code Submit
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formattedEmail = cleanEmail(email);
    const cleanedCode = code.trim();

    if (!formattedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!cleanedCode) {
      setErrorMessage("Please enter your verification code.");
      return;
    }

    setIsLoading(true);

    try {
      // First attempt with type 'signup'
      let { error } = await supabase.auth.verifyOtp({
        email: formattedEmail,
        token: cleanedCode,
        type: "signup",
      });

      // Fallback attempt with type 'email' if signup type returns error
      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email: formattedEmail,
          token: cleanedCode,
          type: "email",
        });
        error = fallback.error;
      }

      if (error) {
        setErrorMessage(error.message || "Invalid or expired confirmation code.");
        showToast({
          variant: "error",
          title: "Verification failed",
          description: error.message || "Invalid code. Please check and try again.",
        });
        return;
      }

      setIsSuccess(true);
      showToast({
        variant: "success",
        title: "Email confirmed successfully",
        description: "Redirecting to your dashboard...",
      });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify code.";
      setErrorMessage(msg);
      Sentry.captureException(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Confirmation Email
  const handleResend = async () => {
    const formattedEmail = cleanEmail(email);
    if (!formattedEmail) {
      setErrorMessage("Please enter your email address above to resend confirmation.");
      return;
    }

    setResending(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formattedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        showToast({
          variant: "error",
          title: "Resend failed",
          description: error.message || "Could not resend confirmation email.",
        });
      } else {
        setResendCooldown(60);
        showToast({
          variant: "success",
          title: "Confirmation email sent",
          description: `A new confirmation link and code have been sent to ${formattedEmail}.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resending email.";
      setErrorMessage(msg);
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
    <div className="min-h-screen flex">
      <Toaster />

      {/* ── Left panel — Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#f8f7f4] relative overflow-y-auto">
        {/* Mobile logo */}
        <motion.div
          {...fadeUp(0)}
          className="lg:hidden flex items-center gap-2 mb-8"
        >
          <div className="w-8 h-8 rounded-xl bg-green-800 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-green-900 font-semibold text-base">Agroheal</span>
        </motion.div>

        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              /* ── Success State ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <h1
                  className="text-2xl font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Email Confirmed
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Your email address has been successfully verified. You are being redirected to your dashboard.
                </p>

                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all"
                >
                  Go to Dashboard
                </Button>
              </motion.div>
            ) : (
              /* ── Form State ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4 }}
              >
                {/* Heading */}
                <motion.div {...fadeUp(0.1)} className="mb-6">
                  <h1
                    className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    Confirm your email
                  </h1>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    Enter the confirmation code sent to your inbox, or request a fresh confirmation link.
                  </p>
                </motion.div>

                {/* Form */}
                <motion.form
                  {...fadeUp(0.2)}
                  onSubmit={handleVerifyCode}
                  className="space-y-4"
                >
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Code Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="code"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Confirmation Code
                      </Label>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. 123456"
                        maxLength={12}
                        className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm tracking-wider font-mono focus:border-green-700 focus:ring-green-700/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Error display */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs"
                    >
                      {errorMessage}
                    </motion.div>
                  )}

                  {/* Verify button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying code...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Verify Code
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.form>

                {/* Resend Confirmation Section */}
                <motion.div
                  {...fadeUp(0.3)}
                  className="mt-6 pt-5 border-t border-gray-200/80 space-y-3"
                >
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">
                      Didn't receive an email or code?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResend}
                      disabled={resending || resendCooldown > 0}
                      className="w-full h-10 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      {resending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-500" />
                          Sending confirmation email...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>Resend available in {resendCooldown}s</>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-green-700" />
                          Resend Confirmation Email
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <Link
                      to="/signin"
                      className="inline-flex items-center gap-1.5 text-gray-500 hover:text-green-800 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="text-green-800 hover:text-green-700 font-medium transition-colors"
                    >
                      Need an account?
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right panel — Brand sidebar ── */}
      <AuthSidebar />
    </div>
  );
}
