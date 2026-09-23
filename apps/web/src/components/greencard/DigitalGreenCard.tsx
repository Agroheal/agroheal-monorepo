import React, { useState, useRef, useEffect } from "react";
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
  RotateCw,
  Smartphone,
  Info,
  Radio,
  Wifi,
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
  showControls?: boolean;
}

export function formatAgcId(id?: string): string {
  if (!id) return "NO GREENCARD YET";
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
  showControls = true,
}) => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "classic">("3d");
  const [showWalletModal, setShowWalletModal] = useState(false);

  // 3D Tilt & Specular Lighting state
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const formattedId = formatAgcId(memberId);
  const verificationUrl = `${SITE_URL}/verify-card/${encodeURIComponent(formattedId)}`;
  const referralLink = referralCode ? `${SITE_URL}/signup?ref=${referralCode}` : "";

  // Mouse move handler for realistic 3D card tilt & holographic reflection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = (x / rect.width - 0.5) * 2; // -1 to 1
    const yPct = (y / rect.height - 0.5) * 2; // -1 to 1

    // Moderate tilt angles for luxury feel (max ~12 deg)
    setTilt({
      rotateX: -yPct * 11,
      rotateY: xPct * 11,
    });

    // Holographic glare position follows cursor
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.55,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

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
    const text = `I'm an official verified member of AgroHeal with Digital Green Card ${formattedId}! Check out my official card:`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AgroHeal Digital Green Card",
          text,
          url: verificationUrl,
        });
      } catch {
        // user cancelled share
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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/60 flex items-center justify-center text-emerald-900 shadow-xs">
            <Award className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">
                AgroHeal Green Card (AGC)
              </span>
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
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

        {/* Action badges: View Mode & Copy ID */}
        <div className="flex items-center gap-2">
          {isActive && (
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === "3d" ? "classic" : "3d"))}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              title="Toggle between 3D Interactive Card and Flat 2D View"
            >
              {viewMode === "3d" ? "Flat 2D View" : "3D Interactive"}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors border border-gray-200 shadow-2xs"
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
      </div>

      {/* ── CARD DISPLAY WRAPPER ── */}
      {!isActive ? (
        /* Locked State Preview */
        <div className="relative rounded-2xl p-6 sm:p-10 text-center text-white space-y-5 bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 border border-emerald-700/40 shadow-xl overflow-hidden">
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
              <span className="font-semibold text-amber-300 block mb-1">Curriculum Access</span>
              Full lifetime access to AgroHeal Academy courses &amp; practicals.
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
      ) : viewMode === "classic" ? (
        /* Flat 2D Card View without outer background box */
        <div className="w-full flex justify-center py-2">
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
      ) : (
        /* ── LUXURY 3D INTERACTIVE GREEN CARD (FRONT & BACK FLIP) ── */
        <div className="perspective-1200 w-full select-none py-2">
          {/* Card 3D Tilt Anchor */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => setIsFlipped((f) => !f)}
            style={{
              transform: `rotateY(${isFlipped ? 180 + tilt.rotateY : tilt.rotateY}deg) rotateX(${tilt.rotateX}deg)`,
              transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease",
            }}
            className="transform-style-3d relative w-full aspect-[1.586/1] max-w-[580px] mx-auto rounded-2xl sm:rounded-3xl cursor-pointer shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(4,46,26,0.6)]"
          >
            {/* ═══════════════════════════════════════════════ */}
            {/* ── CARD FRONT FACE ── */}
            {/* ═══════════════════════════════════════════════ */}
            <div
              className="backface-hidden absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/40 p-5 sm:p-7 flex flex-col justify-between"
              style={{
                background: `
                  radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.25) 0%, transparent 40%),
                  radial-gradient(circle at 20% 85%, rgba(217, 119, 6, 0.18) 0%, transparent 45%),
                  linear-gradient(135deg, #022013 0%, #064024 45%, #08381e 75%, #021a0d 100%)
                `,
                boxShadow: "inset 0 0 0 1px rgba(251, 191, 36, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.2)",
              }}
            >
              {/* Dynamic Prismatic Holographic Glare Overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  opacity: glare.opacity,
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.35) 0%, rgba(212, 175, 55, 0.2) 25%, rgba(16, 185, 129, 0.15) 50%, transparent 70%)`,
                  mixBlendMode: "overlay",
                }}
              />

              {/* Brushed Texture Subtle Security Micro-Lattice */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 0,20 Q 10,0 20,20 T 40,20" fill="none" stroke="#fcd34d" strokeWidth="0.75" />
                    <path d="M 0,20 Q 10,40 20,20 T 40,20" fill="none" stroke="#6ee7b7" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#guilloche)" />
              </svg>

              {/* ── CARD FRONT: TOP ROW ── */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                {/* AgroHeal Holographic Crest */}
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-[1.5px] shadow-md">
                    <div className="w-full h-full rounded-[10px] bg-emerald-950 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm sm:text-base font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 uppercase drop-shadow-xs">
                      AGROHEAL
                    </span>
                    <span className="block text-[9px] sm:text-[10px] font-medium tracking-wider text-emerald-200/90 uppercase">
                      LEAP Community Verified Pass
                    </span>
                  </div>
                </div>

                {/* Card Type Foil & Contactless Waves */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-300 bg-amber-400/10 border border-amber-300/30 uppercase">
                      GREEN CARD
                    </span>
                    <span className="block text-[9px] text-emerald-300/70 font-mono tracking-tighter mt-0.5">
                      LEAP ALLIANCE
                    </span>
                  </div>
                  <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200/80 rotate-90" />
                </div>
              </div>

              {/* ── CARD FRONT: MIDDLE ROW (COMMUNITY SECURITY EMBLEM & PRISMATIC SEAL) ── */}
              <div className="relative z-10 flex items-center justify-between my-auto py-1">
                {/* Official Community Pass Security Seal */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-emerald-900/60 border border-emerald-400/30 backdrop-blur-xs shadow-inner">
                  <div className="w-5 h-5 rounded-lg bg-emerald-400/20 flex items-center justify-center border border-emerald-400/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-mono tracking-widest text-emerald-300/80 uppercase leading-none">
                      COMMUNITY PASS
                    </span>
                    <span className="block text-[10px] sm:text-[11px] font-bold tracking-wider font-mono text-amber-300 leading-tight">
                      LEAP SECURE ID
                    </span>
                  </div>
                </div>

                {/* Holographic Security Emblem */}
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-1.5 shadow-inner">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-100 tracking-wide">
                    VERIFIED SECURE
                  </span>
                </div>
              </div>

              {/* ── CARD FRONT: BOTTOM EMBOSSED DETAILS ── */}
              <div className="relative z-10 space-y-2 sm:space-y-3">
                {/* Embossed Member ID Code */}
                <div>
                  <div className="text-[9px] sm:text-[10px] font-mono tracking-widest text-emerald-300/80 uppercase">
                    MEMBER CREDENTIAL ID
                  </div>
                  <div
                    className="font-mono text-base sm:text-2xl font-bold tracking-[0.18em] sm:tracking-[0.24em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-300"
                    style={{
                      textShadow:
                        "0 1px 1px rgba(255,255,255,0.4), 0 -1px 2px rgba(0,0,0,0.9), 1px 2px 3px rgba(0,0,0,0.8)",
                    }}
                  >
                    {formattedId}
                  </div>
                </div>

                {/* Member Name & Dates */}
                <div className="flex items-end justify-between gap-3 pt-0.5 border-t border-white/10">
                  <div className="truncate max-w-[65%]">
                    <span className="block text-[8px] sm:text-[9px] font-semibold text-emerald-300/70 uppercase tracking-wider">
                      CARDHOLDER NAME
                    </span>
                    <span
                      className="block text-xs sm:text-sm font-bold tracking-wider text-white uppercase truncate"
                      style={{
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      {memberName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[8px] sm:text-[9px] font-semibold text-emerald-300/70 uppercase tracking-wider">
                      MEMBER SINCE
                    </span>
                    <span className="block text-xs sm:text-sm font-mono font-bold text-amber-200">
                      {memberSince}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hint badge: Click to flip */}
              <div className="absolute bottom-1.5 right-3 text-[9px] text-emerald-300/40 flex items-center gap-1">
                <RotateCw className="w-2.5 h-2.5" />
                <span>Click to flip</span>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* ── CARD BACK FACE ── */}
            {/* ═══════════════════════════════════════════════ */}
            <div
              className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/30 flex flex-col justify-between"
              style={{
                background: "linear-gradient(145deg, #021a0e 0%, #052c18 50%, #02160b 100%)",
                boxShadow: "inset 0 0 0 1px rgba(251, 191, 36, 0.25)",
              }}
            >
              {/* Magnetic Stripe Bar */}
              <div className="w-full mt-4 sm:mt-5">
                <div className="w-full h-9 sm:h-12 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-y border-white/15 flex items-center px-4">
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-neutral-400/80 truncate">
                    AGROHEAL LEAP COMMUNITY - VERIFIED PASS • NON-TRANSFERABLE
                  </span>
                </div>
              </div>

              {/* Central Section: Signature Strip & Crisp Scannable QR Code */}
              <div className="px-5 sm:px-7 py-2 grid grid-cols-3 gap-3 items-center">
                {/* Signature Panel & Disclosure */}
                <div className="col-span-2 space-y-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] sm:text-[9px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                      AUTHORIZED CARDHOLDER SIGNATURE
                    </span>
                    <div className="h-7 sm:h-8 rounded-md bg-stone-100 border border-stone-300 flex items-center justify-between px-3">
                      <span className="font-serif italic text-xs sm:text-sm text-gray-800 font-semibold truncate">
                        {memberName}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-gray-500">
                        AGC
                      </span>
                    </div>
                  </div>

                  <p className="text-[8px] sm:text-[9px] text-emerald-200/60 leading-tight">
                    Issued by Agroheal LEAP Community. Not a banking deposit instrument.
                    Confirms active participation in LEAP group farming clusters and 5×7 community matrix dividends.
                  </p>
                </div>

                {/* Scannable Public QR Code */}
                <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-white border border-amber-300 shadow-md">
                  <QRCode
                    value={verificationUrl}
                    size={84}
                    bgColor="#ffffff"
                    fgColor="#032b16"
                    className="w-16 h-16 sm:w-20 sm:h-20"
                  />
                  <span className="text-[8px] font-mono font-bold text-emerald-950 mt-1 uppercase">
                    SCAN TO VERIFY
                  </span>
                </div>
              </div>

              {/* Bottom Support & Security Verification Bar */}
              <div className="px-5 sm:px-7 pb-4 sm:pb-5 pt-1 border-t border-white/10 flex items-center justify-between text-[8px] sm:text-[9px] text-emerald-300/70">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Official Verification: {SITE_URL.replace(/^https?:\/\//, "")}/verify</span>
                </div>
                <div className="font-mono text-amber-200/80">
                  REF: {formattedId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CARD ACTION TOOLBAR ── */}
      {isActive && showControls && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 print:hidden">
          {/* Flip 3D Card Toggle */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (viewMode !== "3d") setViewMode("3d");
              setIsFlipped((f) => !f);
            }}
            className="h-11 px-3.5 rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{isFlipped ? "Show Front" : "Show Back (QR)"}</span>
          </Button>

          {/* Download Flat Card (PNG) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setViewMode("classic")}
            className="h-11 px-3.5 rounded-xl border-emerald-300 bg-emerald-100/60 hover:bg-emerald-200/70 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>Download (2D)</span>
          </Button>

          {/* Add to Mobile Wallet */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowWalletModal(true)}
            className="h-11 px-3.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-gray-600 shrink-0" />
            <span>Save to Wallet</span>
          </Button>

          {/* Share Card */}
          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            className="h-11 px-3.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-gray-600 shrink-0" />
            <span>Share Card</span>
          </Button>

          {/* Copy Public Link */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyVerificationLink}
            className="h-11 px-3.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ExternalLink className="w-4 h-4 text-gray-600 shrink-0" />
            )}
            <span>Copy Link</span>
          </Button>

          {/* Public Verification Page */}
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(verificationUrl, "_blank")}
            className="h-11 px-3.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Verify Page</span>
          </Button>
        </div>
      )}

      {/* ── MOBILE WALLET MODAL (Apple Wallet / Google Wallet) ── */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-gray-900 text-base">
                  Save to Mobile Wallet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Your AgroHeal Green Card is fully compliant with mobile digital pass standards.
              Keep your card in your phone for farm gate access and verified cluster training sessions.
            </p>

            <div className="space-y-2.5">
              {/* Apple Wallet Option */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold">
                    
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">Apple Wallet</div>
                    <div className="text-[11px] text-gray-500">iOS Passbook pass format</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setViewMode("classic");
                    setShowWalletModal(false);
                    showToast({
                      variant: "success",
                      title: "Digital Pass Ready",
                      description: "Switched to printable pass mode. Click 'Download Card' to save high-res pass.",
                    });
                  }}
                  className="h-8 text-xs font-semibold rounded-lg"
                >
                  Download Pass
                </Button>
              </div>

              {/* Google Wallet Option */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    G
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">Google Wallet</div>
                    <div className="text-[11px] text-gray-500">Android Wallet / Web Pass</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setViewMode("classic");
                    setShowWalletModal(false);
                    showToast({
                      variant: "success",
                      title: "Digital Pass Ready",
                      description: "Switched to printable pass mode. Click 'Download Card' to save high-res pass.",
                    });
                  }}
                  className="h-8 text-xs font-semibold rounded-lg"
                >
                  Download Pass
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Tip: You can take a screenshot or download the PNG to add this pass to your photo gallery for offline presentation.
              </span>
            </div>

            <Button
              type="button"
              onClick={() => setShowWalletModal(false)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs h-10"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalGreenCard;
