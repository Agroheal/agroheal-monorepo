import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Sprout,
  ArrowRight,
  ExternalLink,
  Award,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import GreenCardImage from "@/components/webComponents/GreenCardImage";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import { SITE_URL } from "@/config/Index";

interface VerificationData {
  valid: boolean;
  memberId: string;
  fullName: string;
  memberSince: string;
  status: "active" | "inactive" | "not_found";
  tier: string;
  verifiedAt: string;
}

export const VerifyCard: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!memberId) {
        setLoading(false);
        return;
      }

      const formattedId = formatAgcId(memberId);
      const rawNumber = formattedId.replace(/[^0-9]/g, "");

      try {
        // Query profile by formatted member_id or loose match
        let query = supabase
          .from("profiles")
          .select("id, full_name, member_id, created_at");

        if (memberId.toUpperCase().startsWith("AGC-")) {
          query = query.ilike("member_id", formattedId);
        } else {
          // If searched by raw number, try matching both formats
          query = query.or(`member_id.ilike.%${memberId}%,member_id.ilike.%${formattedId}%`);
        }

        const { data: profile, error } = await query.maybeSingle();

        if (error || !profile) {
          setData({
            valid: false,
            memberId: formattedId,
            fullName: "Unknown Member",
            memberSince: "N/A",
            status: "not_found",
            tier: "Unregistered",
            verifiedAt: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }

        // Check active Green Card subscription
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("expires_at, started_at, status, plan")
          .eq("user_id", profile.id)
          .eq("plan", "green_card")
          .eq("status", "active")
          .maybeSingle();

        const isActive =
          !!subscription &&
          new Date(subscription.expires_at) > new Date();

        const joinDate = subscription?.started_at || profile.created_at;
        const formattedDate = joinDate
          ? new Date(joinDate).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }).toUpperCase()
          : "AUGUST 2026";

        setData({
          valid: isActive,
          memberId: profile.member_id ? formatAgcId(profile.member_id) : formattedId,
          fullName: profile.full_name || "AgroHeal Member",
          memberSince: formattedDate,
          status: isActive ? "active" : "inactive",
          tier: "AgroHeal Green Card Pioneer",
          verifiedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Verification lookup error", err);
        setData({
          valid: false,
          memberId: formattedId,
          fullName: "System Error",
          memberSince: "N/A",
          status: "not_found",
          tier: "Unverified",
          verifiedAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [memberId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-emerald-50/20 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            AgroHeal
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Official Credential Verification
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Public verification portal for the AgroHeal Green Card (AGC) registry.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-600">Verifying credential on AgroHeal registry...</p>
          </div>
        ) : !data || data.status === "not_found" ? (
          /* NOT FOUND / INVALID */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-rose-100 shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Credential Not Found</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                No active member record was found matching ID{" "}
                <span className="font-mono font-bold text-gray-800">{formatAgcId(memberId)}</span>. Please verify the code on your physical or digital card.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/">Go to Homepage</Link>
              </Button>
              <Button asChild className="rounded-xl bg-emerald-800 text-white hover:bg-emerald-700">
                <Link to="/signup">Register with AgroHeal</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* VERIFIED CARD DETAILS */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100/80 shadow-sm space-y-6">
              {/* Top Verified Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        Official AgroHeal Green Card
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      ID: {data.memberId}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Verification Stamp
                  </span>
                  <span className="text-xs font-mono font-medium text-emerald-700">
                    AUTHENTICATED
                  </span>
                </div>
              </div>

              {/* Credential Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <User className="w-3.5 h-3.5" />
                    Member Name
                  </div>
                  <p className="text-base font-bold text-gray-900">{data.fullName}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <Award className="w-3.5 h-3.5" />
                    Membership Tier
                  </div>
                  <p className="text-base font-bold text-gray-900">{data.tier}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    Member Since
                  </div>
                  <p className="text-base font-bold text-gray-900">{data.memberSince}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Registry Status
                  </div>
                  <p className="text-base font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active & Validated
                  </p>
                </div>
              </div>

              {/* Card Visualization */}
              <div className="pt-2">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-950 p-2 sm:p-4 shadow-md">
                  <GreenCardImage
                    memberName={data.fullName}
                    memberId={data.memberId}
                    memberSince={data.memberSince}
                    qrValue={`${SITE_URL}/verify-card/${encodeURIComponent(data.memberId)}`}
                    fileName={data.memberId}
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
              </div>

              {/* Security Seal Footer */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-1 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  AgroHeal Distributed Cooperative Registry
                </p>
                <p className="text-emerald-800/90">
                  This digital credential is tied directly to the AgroHeal database. Verification proves the cardholder is an active member entitled to cooperative benefits, agricultural training, and 5×7 community matrix distribution.
                </p>
              </div>
            </div>

            {/* Bottom Join CTA */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-green-800 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-bold">Grow Healthy Food, Restore Health, Create Wealth</h3>
                <p className="text-xs text-emerald-100/80">
                  Get your own AgroHeal Green Card today for just ₦2,000.
                </p>
              </div>
              <Button asChild className="rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold px-6 h-11 shrink-0">
                <Link to="/signup" className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCard;
