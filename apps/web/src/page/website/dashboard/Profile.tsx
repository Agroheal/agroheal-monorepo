import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  IdCard,
  ShieldCheck,
  Calendar,
  Share2,
  Copy,
  Check,
  Users,
  Sprout,
  ArrowRight,
  ExternalLink,
  Camera,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import PhoneModal from "./PhoneModal";
import KinModal from "./KinModal";
import toast, { Toaster } from "react-hot-toast";
import UserAvatar from "@/components/ui/UserAvatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  member_id?: string;
  phone?: string | null;
  referral_code?: string;
  created_at?: string;
  total_referrals?: number;
  referral_earnings?: number;
  avatar_url?: string | null;
}

interface KinData {
  kin_name: string;
  kin_address: string;
  kin_number: string;
}

export const ProfileComponent: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kin, setKin] = useState<KinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showKinModal, setShowKinModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (prof) {
        setProfile({
          ...prof,
          email: user.email || prof.email,
        });
      }

      const { data: kinData } = await supabase
        .from("kin_details")
        .select("kin_name, kin_address, kin_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (kinData) {
        setKin(kinData);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopyLink = async () => {
    const code = profile?.referral_code || profile?.member_id || profile?.id;
    const link = `${SITE_URL}/signup?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success("Affiliate referral link copied!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WebP)");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image file size must be less than 3MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${profile.id}/avatar_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      toast.success("Display picture updated!");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      toast.error(err.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.id) return;
    setUploadingAvatar(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
      toast.success("Display picture removed, reverted to default initials");
    } catch (err: any) {
      console.error("Avatar removal failed:", err);
      toast.error("Failed to remove display picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  const agcIdFormatted = formatAgcId(profile?.member_id);
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Member";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Top-Left DP Avatar with Upload Trigger */}
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <UserAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                email={profile?.email}
                sizeClassName="w-20 h-20 sm:w-24 sm:h-24"
                textClassName="text-2xl sm:text-3xl font-black"
                roundedClassName="rounded-3xl"
                className="ring-4 ring-emerald-400/30 shadow-2xl"
              />

              {/* Upload trigger button overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border-2 border-emerald-950 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
                title="Change display picture"
                aria-label="Upload display picture"
              >
                {uploadingAvatar ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black truncate">
                  {profile?.full_name || "AgroHeal Member"}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-mono">
                  {agcIdFormatted}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5 truncate">
                {profile?.email}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                  <Calendar className="w-3 h-3" />
                  <span>Enrolled {joinDate}</span>
                </div>

                {profile?.avatar_url && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="text-[11px] text-rose-300 hover:text-rose-200 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleCopyLink}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? "Link Copied!" : "Copy Referral Link"}
            </Button>
            <Link
              to="/dashboard/green-card"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <IdCard className="w-4 h-4 text-emerald-300" />
              Digital ID Card
            </Link>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Account Information */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" /> Personal Account Details
            </h3>
            <button
              onClick={() => setShowPhoneModal(true)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Edit Phone
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-500">Full Legal Name</span>
              <span className="font-bold text-gray-900">{profile?.full_name || "Not provided"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-500">Email Address</span>
              <span className="font-mono text-gray-900">{profile?.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-500">Phone Number</span>
              <span className="font-bold text-gray-900">
                {profile?.phone || <span className="text-amber-600 font-normal">Pending</span>}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-50">
              <span className="text-gray-500">AGC Member ID</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {agcIdFormatted}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Affiliate Referral Code</span>
              <span className="font-mono font-bold text-gray-900">
                {profile?.referral_code || profile?.member_id || "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Next of Kin / POD Record */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" /> Next of Kin / Beneficiary (POD)
            </h3>
            <button
              onClick={() => setShowKinModal(true)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {kin?.kin_name ? "Update Kin" : "Add Kin"}
            </button>
          </div>

          {kin?.kin_name ? (
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Beneficiary Name</span>
                <span className="font-bold text-gray-900">{kin.kin_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Phone Contact</span>
                <span className="font-mono text-gray-900">{kin.kin_number || "None"}</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-gray-500 mb-1">Residential Address</span>
                <span className="text-gray-800 leading-snug">{kin.kin_address || "None"}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-gray-500">No Next of Kin record attached yet.</p>
              <Button
                onClick={() => setShowKinModal(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-8 px-4 rounded-xl"
              >
                Configure Next of Kin
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/dashboard/transactions"
          className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Wallet & Ledger</span>
            <span className="text-base font-black text-gray-900 group-hover:text-emerald-800 transition-colors">
              ₦{Number(profile?.referral_earnings || 0).toLocaleString()} Balance
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/dashboard/compound-referrals"
          className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">5×7 Organogram</span>
            <span className="text-base font-black text-gray-900 group-hover:text-emerald-800 transition-colors">
              {profile?.total_referrals || 0} Direct Partners
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/dashboard/slots"
          className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Farm Slots</span>
            <span className="text-base font-black text-gray-900 group-hover:text-emerald-800 transition-colors">
              Practicals & Harvest
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Modals */}
      {showPhoneModal && profile && (
        <PhoneModal
          userId={profile.id}
          onComplete={() => {
            setShowPhoneModal(false);
            fetchProfile();
          }}
        />
      )}

      {showKinModal && profile && (
        <KinModal
          userId={profile.id}
          initialData={kin ?? undefined}
          onClose={() => setShowKinModal(false)}
          onComplete={() => {
            setShowKinModal(false);
            fetchProfile();
          }}
        />
      )}
    </div>
  );
};

export default ProfileComponent;
