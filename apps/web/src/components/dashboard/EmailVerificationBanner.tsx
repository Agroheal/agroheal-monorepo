import React, { useState } from "react";
import { Mail, AlertCircle, ArrowRight, X, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { showToast } from "@/components/ui/ToastComponent";
import { useNavigate } from "react-router-dom";

export default function EmailVerificationBanner() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("dismissed_email_verification_banner") === "true";
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // If email is already verified, or banner was dismissed for this session, don't show
  if (!profile || profile.is_email_verified !== false || dismissed) {
    return null;
  }

  const email = profile.email || "your email";

  const handleSendVerification = async () => {
    setSending(true);
    try {
      const res = await apiClient.member.sendVerificationEmail();
      setSentSuccess(true);
      showToast({
        variant: "success",
        title: "Verification link sent!",
        description: (res as any)?.message || `We sent a link to ${email}. Check your inbox or spam folder.`,
      });
    } catch (err: any) {
      console.error("[EmailVerificationBanner] send failed:", err);
      showToast({
        variant: "error",
        title: "Failed to send link",
        description: err.message || "Please check your network connection and try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("dismissed_email_verification_banner", "true");
  };

  return (
    <div className="mx-4 sm:mx-6 mt-3 mb-2 p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-950 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-amber-900 flex items-center gap-1.5">
            <span>Email verification recommended</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200/70 text-amber-800 uppercase tracking-wider">
              Soft Check
            </span>
          </p>
          <p className="text-amber-800/90 mt-0.5">
            Your email (<strong className="font-semibold text-amber-950">{email}</strong>) is not yet verified. Verify it to fully secure your account and enable bank cash withdrawals.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        {sentSuccess ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Link sent!</span>
          </span>
        ) : (
          <button
            onClick={handleSendVerification}
            disabled={sending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>{sending ? "Sending..." : "Send Verification Link"}</span>
          </button>
        )}

        <button
          onClick={() => navigate("/dashboard/profile")}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-amber-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <span>Edit Email</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-900 hover:bg-amber-100/60 transition-all cursor-pointer"
          title="Dismiss for this session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

