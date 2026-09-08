import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Lock,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import GreenCardImage from "@/components/webComponents/GreenCardImage";
import { SITE_URL } from "@/config/Index";

export interface DigitalGreenCardProps {
  memberName?: string;
  memberId?: string;
  memberSince?: string;
  referralCode?: string | null;
  isActive?: boolean;
  className?: string;
}

export function formatAgcId(id?: string): string {
  if (!id) return "AGC-PENDING";
  const trimmed = id.trim().toUpperCase();
  if (trimmed.startsWith("AGC-")) return trimmed;
  if (trimmed.startsWith("AGC")) return `AGC-${trimmed.replace(/^AGC/i, "").replace(/^-*/, "")}`;
  return `AGC-${trimmed}`;
}

export const DigitalGreenCard: React.FC<DigitalGreenCardProps> = ({
  memberName = "AgroHeal Member",
  memberId,
  memberSince = "SEPTEMBER 2026",
  referralCode,
  isActive = true,
  className = "",
}) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const formattedId = formatAgcId(memberId);
  const verificationUrl = `${SITE_URL}/verify-card/${encodeURIComponent(formattedId)}`;
  const referralLink = referralCode ? `${SITE_URL}/signup?ref=${referralCode}` : "";

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(formattedId);
      setCopiedId(true);
      showToast({
        variant: "success",
        title: "Member ID Copied",
        description: `${formattedId} copied to clipboard.`,
      });
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      showToast({
        variant: "error",
        title: "Copy Failed",
        description: "Please manually copy your Member ID.",
      });
    }
  };

  const handleCopyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      showToast({
        variant: "success",
        title: "Verification Link Copied",
        description: "Official public verification link copied.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast({
        variant: "error",
        title: "Copy Failed",
        description: "Could not copy verification link.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `I'm a verified member of AgroHeal with Digital Green Card ${formattedId}! Check out my official card:`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AgroHeal Digital Green Card",
          text,
          url: verificationUrl,
        });
      } catch {
        // user cancelled share or not supported
      }
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${verificationUrl}`)}`;
      window.open(waUrl, "_blank");
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-4 ${className}`}>
      {/* ── CARD HEADER & STATUS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">
                AgroHeal Green Card (AGC)
              </span>
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock className="w-3 h-3" />
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Official Digital Credential & Identification
            </p>
          </div>
        </div>

        {/* Member ID Quick Copy Pill */}
        <button
          type="button"
          onClick={handleCopyId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors border border-gray-200"
          title="Click to copy Member ID"
        >
          <span>{formattedId}</span>
          {copiedId ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-500" />
          )}
        </button>
      </div>

      {/* ── MAIN DIGITAL CARD CONTAINER ── */}
      <div className="relative rounded-2xl p-2 sm:p-4 bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 border border-emerald-700/40 shadow-xl overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Subtle decorative golden/emerald glow elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        {!isActive ? (
          /* Locked State Preview */
          <div className="relative p-6 sm:p-10 text-center text-white space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto text-amber-300">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold tracking-tight">
                Unlock Your Official Green Card (AGC)
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Your AgroHeal Green Card unlocks your 5×7 matrix placement, ₦1,000 direct referral rewards, and official verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs text-emerald-100/90">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-semibold text-amber-300 block mb-1">Matrix Eligible</span>
                Ready for 5×7 auto-placement upon farm slot purchase.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-semibold text-amber-300 block mb-1">₦1,000 Direct Bonus</span>
                Withdrawable immediately once balance reaches ₦2,000.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-semibold text-amber-300 block mb-1">Seedling Rewards</span>
                Free ginger seedlings unlocked per 50 community members.
              </div>
            </div>

            <Button
              onClick={() => navigate("/subscribe")}
              className="w-full sm:w-auto px-8 h-11 bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 hover:from-amber-300 hover:to-amber-400 font-bold rounded-xl shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Activate Green Card — ₦2,000
            </Button>
          </div>
        ) : (
          /* Active Card SVG Display */
          <div className="relative">
            <GreenCardImage
              memberName={memberName}
              memberId={formattedId}
              memberSince={memberSince}
              qrValue={verificationUrl}
              fileName={formattedId}
              qrRenderer={(value, size) => (
                <QRCode
                  value={value}
                  size={size}
                  bgColor="#ffffff"
                  fgColor="#064e3b"
                />
              )}
            />
          </div>
        )}
      </div>

      {/* ── CARD ACTION TOOLBAR (for active members) ── */}
      {isActive && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="h-10 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            Print / PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyVerificationLink}
            className="h-10 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
            )}
            Copy Link
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            className="h-10 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-600" />
            Share Card
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(verificationUrl, "_blank")}
            className="h-10 rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Verify Page
          </Button>
        </div>
      )}
    </div>
  );
};

export default DigitalGreenCard;
