import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  IdCard,
  Lock,
  ShieldCheck,
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Sprout,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import DigitalGreenCard, { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export const GreenCardCommunity: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasGreenCard, setHasGreenCard] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const [memberSince, setMemberSince] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/signin");
          return;
        }

        // 1. Check Green Card Subscription status
        const { data: greenCard } = await supabase
          .from("subscriptions")
          .select("expires_at, started_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("plan", "green_card")
          .maybeSingle();

        const isActive =
          !!greenCard && new Date(greenCard.expires_at) > new Date();

        if (!isActive) {
          setHasGreenCard(false);
          setLoading(false);
          return;
        }

        setHasGreenCard(true);
        if (greenCard?.started_at) {
          setMemberSince(
            new Date(greenCard.started_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          );
        }

        // 2. Fetch Profile details
        const { data: profile } = await supabase
          .from("profiles")
          .select("referral_code, member_id, full_name")
          .eq("id", user.id)
          .maybeSingle();

        setFullName(profile?.full_name ?? "");
        if (profile?.referral_code) {
          setReferralCode(profile.referral_code);
        }

        if (profile?.member_id) {
          setMemberId(profile.member_id);
        } else {
          // Attempt fetch from Express API
          try {
            const cardData = await apiClient.member.getDigitalCard();
            if (cardData?.memberId && cardData.memberId !== "PENDING") {
              setMemberId(cardData.memberId);
            }
          } catch {
            // fallback
          }
        }
      } catch (err) {
        console.error("[GreenCardCommunity] Error loading Green Card:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading your Digital Green Card..." />;
  }

  // ── INACTIVE / UNLOCKED SCREEN ──
  if (!hasGreenCard) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs px-3 py-1 font-bold">
              Membership Credential Required
            </Badge>
            <h1 className="text-2xl font-black text-gray-900">
              Activate Your Digital Green Card
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              Your official AgroHeal Green Card unlocks verified cooperative membership, lifetime curriculum access, and ₦1,000 direct referral rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-gray-700">Digital ID with scannable verification QR</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-gray-700">₦1,000 direct sponsor bonus on every referral</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-gray-700">Full access to AgroHeal Learning Academy</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-gray-700">5×7 Matrix eligible upon farm slot purchase</span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/subscribe")}
            className="w-full h-12 bg-gradient-to-r from-emerald-800 to-green-900 hover:from-emerald-900 hover:to-green-950 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <IdCard className="w-5 h-5" />
            <span>Get Your Green Card — ₦2,000</span>
          </Button>
        </div>
      </div>
    );
  }

  const formattedId = formatAgcId(memberId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-16 font-sans">
      <Toaster position="top-right" />

      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-slate-950 text-white p-7 sm:p-9 shadow-xl border border-emerald-700/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Cooperative Credential
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                Verified Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AgroHeal Digital Green Card (AGC)
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              Your official, verifiable membership card. Use this credential for cooperative identity verification, event accreditation, and member privilege confirmations.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 text-center shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block mb-1">
              Member ID
            </span>
            <div className="font-mono text-base sm:text-lg font-black text-white">
              {formattedId}
            </div>
            <span className="text-[11px] text-emerald-200 block mt-1">
              Enrolled {memberSince || "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* ── CARD PRESENTATION ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90">
        <DigitalGreenCard
          memberName={fullName || undefined}
          memberId={memberId || undefined}
          memberSince={memberSince}
          referralCode={referralCode}
          isActive={hasGreenCard}
        />
      </div>

      {/* ── CREDENTIAL REGISTRY DETAILS ── */}
      <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-sm border border-gray-200/90 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Verified Credential Registry
              </h3>
              <p className="text-xs text-gray-500">
                Official attributes associated with this membership token
              </p>
            </div>
          </div>

          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-3 py-1 font-bold">
            ✓ In Good Standing
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1">
            <span className="text-gray-500 font-medium block">Cardholder Name</span>
            <strong className="text-sm font-bold text-gray-900 block truncate">
              {fullName || "AgroHeal Member"}
            </strong>
            <span className="text-[11px] text-emerald-700">Identity Verified</span>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1">
            <span className="text-gray-500 font-medium block">AGC Identifier</span>
            <strong className="text-sm font-mono font-bold text-emerald-800 block">
              {formattedId}
            </strong>
            <span className="text-[11px] text-gray-500">Permanent Ledger ID</span>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1">
            <span className="text-gray-500 font-medium block">Enrollment Cohort</span>
            <strong className="text-sm font-bold text-gray-900 block">
              {memberSince || "Active Member"}
            </strong>
            <span className="text-[11px] text-gray-500">Lifetime Validity</span>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1">
            <span className="text-gray-500 font-medium block">Direct Sponsor Rewards</span>
            <strong className="text-sm font-bold text-emerald-800 block">
              ₦1,000 / Direct Partner
            </strong>
            <span className="text-[11px] text-gray-500">Credited instantly to referral wallet</span>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1">
            <span className="text-gray-500 font-medium block">Educational Curriculum</span>
            <strong className="text-sm font-bold text-gray-900 block">
              Learning Academy
            </strong>
            <span className="text-[11px] text-emerald-700">Full Video Course Access</span>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-1">
            <span className="text-gray-500 font-medium block">Matrix Participation</span>
            <strong className="text-sm font-bold text-gray-900 block">
              5×7 Tree Eligible
            </strong>
            <span className="text-[11px] text-gray-500">Activates on ₦5k Farm Slot</span>
          </div>
        </div>

        {/* Security / Cryptographic Anti-Counterfeit Notice */}
        <div className="bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200/70 text-xs text-emerald-950 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-emerald-900 block font-bold">
              Cryptographic Fraud Prevention &amp; Real-Time Verification:
            </strong>
            <p className="text-emerald-800/90">
              Each AgroHeal Green Card features a dynamic QR token linked directly to our immutable member registry. Third parties, cooperative banks, and harvest depots can scan the QR code using any smartphone to instantly confirm your active status, identity, and voting accreditation without exposing private credentials.
            </p>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTION TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/dashboard/compound-referrals"
          className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors block">
                Producer Network &amp; 5×7 Organogram
              </span>
              <span className="text-xs text-gray-500">
                Manage downline partners &amp; affiliate links
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        <Link
          to="/dashboard/profile"
          className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 transition-colors block">
                Account &amp; Beneficiary Profile
              </span>
              <span className="text-xs text-gray-500">
                Update display picture &amp; next of kin record
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>
      </div>
    </div>
  );
};

export default GreenCardCommunity;
