import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Leaf, Mail, Lock, EyeOff, Eye, ArrowRight, ShieldCheck, Tractor } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Toaster } from "react-hot-toast";
import { showToast } from "@/components/ui/ToastComponent";

const LegacyLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/legacy/group-farm-accounts";
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(redirectUrl, { replace: true });
      }
    });
  }, [navigate, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      showToast({
        variant: "error",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
      return;
    }

    showToast({
      variant: "success",
      title: "Welcome back!",
      description: "Redirecting to your legacy farm dashboard...",
    });

    navigate(redirectUrl, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster position="top-right" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
            <Tractor className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Legacy Farm Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Coordinator & Member Access for Centralized Farm Rosters
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white py-8 px-6 shadow-xl shadow-green-900/5 sm:rounded-2xl sm:px-10 border border-green-100"
        >
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-green-600 focus:ring-green-600 rounded-lg text-sm"
                  placeholder="coordinator@agroheal.org"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-green-700 hover:text-green-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-300 focus:border-green-600 focus:ring-green-600 rounded-lg text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md shadow-green-700/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Legacy Farm</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium bg-emerald-50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Centralized Coordinator & Member Portal</span>
            </div>
            <Link
              to="/signin"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              Switch to Standard AgroHeal Login →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LegacyLogin;
