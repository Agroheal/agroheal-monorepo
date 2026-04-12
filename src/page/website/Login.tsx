import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Mail, Lock, EyeOff, Eye, ArrowRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Toaster } from "react-hot-toast";
import { showToast } from "@/components/ui/ToastComponent";
import AuthSidebar from "@/components/webComponents/authSidebar";
import * as Sentry from "@sentry/react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Sentry.captureException(error, {
        extra: {
          action: "login",
        },
      });

      const errorNotify = () =>
        showToast({
          variant: "error",
          title: "Login failed",
          description:
            "Check that your email and password are correct. Also check your internet connections",
        });
      errorNotify();
      return;
    }

    const notify = () =>
      showToast({
        variant: "success",
        title: "SignIn successful!",
        description: "Login Successful, Redirecting to dashboard",
      });
    Sentry.metrics.count("login_completed", 1);
    notify();
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
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
              Welcome back
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to continue your farming journey
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            {...fadeUp(0.2)}
            className="space-y-5"
            onSubmit={handleLogin}
          >
            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-green-800 hover:text-green-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-white border-gray-200 rounded-xl text-sm focus:border-green-700 focus:ring-green-700/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-red-600">
              New users should check their email (or spam) to verify their
              accounts before the first login.
            </p>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </motion.form>

          {/* Divider */}
          <motion.div {...fadeUp(0.3)} className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </motion.div>

          {/* Sign up */}
          <motion.p
            {...fadeUp(0.4)}
            className="text-center text-sm text-gray-500"
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-green-800 font-semibold hover:text-green-700 transition-colors"
            >
              Create an account
            </Link>
          </motion.p>

          {/* Back to home */}
          <motion.div {...fadeUp(0.5)} className="text-center mt-8">
            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to home
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <AuthSidebar />
    </div>
  );
};

export default Login;
