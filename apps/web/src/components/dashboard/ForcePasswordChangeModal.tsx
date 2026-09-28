import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";
import {
  PasswordRequirementsTracker,
  checkPasswordRequirements,
} from "@/components/common/PasswordRequirementsTracker";

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid } = checkPasswordRequirements(newPassword);
    if (!isValid) {
      toast.error("Please meet all password requirements before proceeding.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          force_password_change: false,
          password_updated_at: new Date().toISOString(),
        },
      });

      if (error) throw error;

      toast.success("Password successfully updated! Your account is now secured.", {
        duration: 5000,
      });
      onSuccess();
    } catch (err: any) {
      console.error("[ForcePasswordChange] Error updating password:", err);
      toast.error(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-green-900 p-6 text-white text-center relative">
            <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 mx-auto flex items-center justify-center mb-3">
              <ShieldAlert className="w-7 h-7 text-amber-300" />
            </div>
            <h2 className="text-xl font-bold">Secure Your Account</h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto">
              Your account was activated by an administrator with a temporary password. Please set your own secure password to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-semibold text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="pr-10 rounded-xl"
                  required
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

            {/* Password Requirements Tracker */}
            <PasswordRequirementsTracker password={newPassword} />

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md transition-all cursor-pointer mt-2"
            >
              {loading ? "Updating Password..." : "Update Password & Secure Account"}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ForcePasswordChangeModal;
