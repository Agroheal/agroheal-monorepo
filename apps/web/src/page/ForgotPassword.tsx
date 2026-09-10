import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import AuthSidebar from "@/components/webComponents/authSidebar";
import { Leaf, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
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

      {/* ── Left panel — form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#f8f7f4]">
        {/* Mobile logo */}
        <motion.div
          {...fadeUp(0)}
          className="lg:hidden flex items-center gap-2 mb-10"
        >
          <div className="w-9 h-9 rounded-xl bg-green-800 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-green-900 font-semibold text-lg">Agroheal</span>
        </motion.div>

        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait">
            {/* ── Success state ── */}
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                {/* Cyclic icon */}
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <h2
                  className="text-2xl font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Check your inbox
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                  We sent a password reset link to
                </p>
                <p className="text-sm font-semibold text-gray-900 mb-8">
                  {email}
                </p>

                <div className="bg-white border border-gray-100 rounded-xl p-4 text-left mb-8">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-green-800 font-semibold hover:underline"
                    >
                      try a different email
                    </button>
                    .
                  </p>
                </div>

                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4 }}
              >
                {/* Heading */}
                <motion.div {...fadeUp(0.1)} className="mb-8">
                  <h1
                    className="text-3xl font-bold text-gray-900 mb-2"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    Forgot password?
                  </h1>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    No worries — enter your registered email and we'll send you
                    a reset link.
                  </p>
                </motion.div>

                {/* Form */}
                <motion.form
                  {...fadeUp(0.2)}
                  onSubmit={handleForgotPassword}
                  className="space-y-5"
                >
                  {/* Email field */}
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
                        placeholder="you@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Inline error */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send reset link
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.form>

                {/* Divider */}
                <motion.div
                  {...fadeUp(0.3)}
                  className="flex items-center gap-3 my-6"
                >
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </motion.div>

                {/* Back to login */}
                <motion.p
                  {...fadeUp(0.4)}
                  className="text-center text-sm text-gray-500"
                >
                  Remember your password?{" "}
                  <Link
                    to="/signin"
                    className="text-green-800 font-semibold hover:text-green-700 transition-colors"
                  >
                    Sign in
                  </Link>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right panel — brand sidebar ───────────────────────────────────── */}
      <AuthSidebar />
    </div>
  );
}
