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
  Camera,
  LoaderCircle,
  Trash2,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import ProfileCompletionModal from "@/components/dashboard/ProfileCompletionModal";
import toast, { Toaster } from "react-hot-toast";
import UserAvatar from "@/components/ui/UserAvatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProfileSkeleton from "@/components/dashboard/ProfileSkeleton";

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
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_code?: string | null;
  bank_updated_at?: string | null;
  bank_verified?: boolean | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [openBankSectionDirectly, setOpenBankSectionDirectly] = useState(false);
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

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/pjpeg", "image/x-png"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isExtAllowed = ["jpg", "jpeg", "png"].includes(ext);
    const isMimeAllowed = allowedTypes.includes(file.type.toLowerCase());

    if (!isMimeAllowed || !isExtAllowed) {
      toast.error("Only JPEG (.jpg, .jpeg) and PNG (.png) images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be 5MB or less");
      return;
    }

    setUploadingAvatar(true);
    try {
      const cleanExt = ext === "jpeg" ? "jpg" : ext;
      const filePath = `${profile.id}/avatar_${Date.now()}.${cleanExt}`;

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
    return <ProfileSkeleton />;
  }

  const agcIdFormatted = formatAgcId(profile?.member_id);
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Member";

  const hasLinkedBank = Boolean(
    profile?.bank_name &&
    profile?.bank_account_number &&
    profile.bank_account_number.trim().length >= 10
  );

  const isBankLocked = Boolean(
    profile?.bank_account_number &&
    profile?.bank_updated_at &&
    (Date.now() - new Date(profile.bank_updated_at).getTime()) / (1000 * 60 * 60 * 24) < 30
  );

  const bankDaysRemaining = isBankLocked
    ? Math.max(1, Math.ceil(30 - (Date.now() - new Date(profile!.bank_updated_at!).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 pb-16 font-sans">
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
                roundedClassName="rounded-full"
                className="ring-4 ring-emerald-400/40 shadow-2xl"
              />

              {/* Upload trigger button overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border-2 border-white ring-2 ring-emerald-500/50 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
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
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black truncate">
                  {profile?.full_name || "AgroHeal Member"}
                </h1>
                {profile?.member_id ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] font-mono">
                    {agcIdFormatted}
                  </Badge>
                ) : (
                  <Link
                    to="/dashboard/checkout?bundle=starter"
                    className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors uppercase tracking-wider hover:underline"
                    title="Click to activate your AgroHeal Green Card"
                  >
                    <IdCard className="w-3 h-3 text-amber-300" />
                    <span>NO GREENCARD YET</span>
                  </Link>
                )}
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
              to="/dashboard/profile/green-card"
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
        <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-sm border border-gray-200/90 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Personal Account Details</h3>
                <p className="text-[11px] text-gray-500">Verified membership information</p>
              </div>
            </div>
            <button
              onClick={() => setShowCompletionModal(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              Edit Details
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Full Legal Name</span>
              <span className="font-bold text-gray-900 text-right">{profile?.full_name || "Not provided"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Email Address</span>
              <span className="font-mono font-medium text-gray-900 text-right">{profile?.email}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Phone Number</span>
              <span className="font-bold text-gray-900 text-right">
                {profile?.phone || <span className="text-amber-600 font-normal">Pending</span>}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">AGC Member ID</span>
              {profile?.member_id ? (
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg">
                  {agcIdFormatted}
                </span>
              ) : (
                <Link
                  to="/dashboard/checkout?bundle=starter"
                  className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-0.5 rounded-lg transition-colors underline underline-offset-2 uppercase"
                  title="Click to activate your AgroHeal Green Card"
                >
                  <span>NO GREENCARD YET</span>
                  <ArrowRight className="w-3 h-3 text-amber-600" />
                </Link>
              )}
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">Affiliate Referral Code</span>
              <span className="font-mono font-bold text-gray-900 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg">
                {profile?.referral_code || profile?.member_id || "None"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500 font-medium">State &amp; LGA</span>
              <span className="font-medium text-gray-900 text-right">
                {profile?.state && profile?.lga ? (
                  <span className="text-emerald-800 font-semibold">{profile.lga}, {profile.state}</span>
                ) : (
                  <span className="text-amber-600 font-normal">Pending Configuration</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-gray-500 font-medium">Country</span>
              <span className="font-semibold text-gray-900 text-right">
                {profile?.country || "Nigeria"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Banking & Payout Account (Always Previewable) */}
        <div
          className={`bg-white rounded-3xl p-7 sm:p-8 shadow-sm border ${
            hasLinkedBank ? "border-gray-200/90" : "border-amber-300 bg-amber-50/20"
          } space-y-6 flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${
                    hasLinkedBank ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  } flex items-center justify-center`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Banking & Payout Account</h3>
                  <p className="text-[11px] text-gray-500">Destination for wallet withdrawals</p>
                </div>
              </div>
              {isBankLocked ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Locked ({bankDaysRemaining}d left)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toast("Withdrawal bank account is locked for 30 days after each update to protect funds against unauthorized changes. Please contact AgroHeal Admin to change your bank details.", {
                        icon: "🔒",
                        duration: 6000,
                      });
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                    title="30-Day Security Lock Information"
                  >
                    Help
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOpenBankSectionDirectly(true);
                    setShowCompletionModal(true);
                  }}
                  className={`text-xs font-bold ${
                    hasLinkedBank
                      ? "text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                      : "text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border-amber-300"
                  } px-3 py-1.5 rounded-xl border transition-colors cursor-pointer`}
                >
                  {hasLinkedBank ? "Edit Bank" : "Add Bank"}
                </button>
              )}
            </div>

            {hasLinkedBank ? (
              <div className="space-y-4 text-xs mt-6">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Bank Name</span>
                  <span className="font-bold text-gray-900 text-right">{profile?.bank_name}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Account Number</span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-right">
                    {profile?.bank_account_number}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Account Holder</span>
                  <span className="font-bold text-gray-900 text-right">
                    {profile?.bank_account_name || profile?.full_name}
                  </span>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-gray-100 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    {profile?.bank_verified ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-semibold">NIBSS Verified Account</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-amber-800 font-semibold">Verification Pending (Re-verify to withdraw)</span>
                      </>
                    )}
                  </div>

                  {!profile?.bank_verified && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setOpenBankSectionDirectly(true);
                        setShowCompletionModal(true);
                      }}
                      className="h-7 text-[10px] font-bold px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Verify Bank Now
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3 bg-amber-50/70 rounded-2xl border border-dashed border-amber-200/90 mt-4 p-4">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900">No Bank Account Linked</p>
                  <p className="text-[11px] text-amber-800/80 max-w-xs mx-auto">
                    You have not configured your payout bank details. Link your verified Nigerian bank account now so you can withdraw cleared earnings.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setOpenBankSectionDirectly(true);
                    setShowCompletionModal(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-4 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Link Bank Account Now
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Next of Kin / POD Record */}
        <div
          className={`bg-white rounded-3xl p-7 sm:p-8 shadow-sm border ${
            kin?.kin_name ? "border-gray-200/90" : "border-emerald-200/70 bg-emerald-50/15"
          } space-y-6 flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Next of Kin / Beneficiary</h3>
                  <p className="text-[11px] text-gray-500">Payable on Death (POD) asset record</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOpenBankSectionDirectly(false);
                  setShowCompletionModal(true);
                }}
                className={`text-xs font-bold ${
                  kin?.kin_name
                    ? "text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                    : "text-emerald-900 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border-emerald-300"
                } px-3 py-1.5 rounded-xl border transition-colors cursor-pointer`}
              >
                {kin?.kin_name ? "Edit Details" : "Add Beneficiary"}
              </button>
            </div>

            {kin?.kin_name ? (
              <div className="space-y-4 text-xs mt-6">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Beneficiary Name</span>
                  <span className="font-bold text-gray-900 text-right">{kin.kin_name}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Phone Contact</span>
                  <span className="font-mono font-bold text-emerald-900 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-right">
                    {kin.kin_number || "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Residential Address</span>
                  <span className="font-medium text-gray-800 text-right max-w-[220px] truncate" title={kin.kin_address || undefined}>
                    {kin.kin_address || "Not specified"}
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Designated legal beneficiary for farm shares &amp; harvest dividends</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200/80 mt-4 p-4">
                <Users className="w-8 h-8 text-emerald-600/70 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900">No Beneficiary Configured</p>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Designate your primary Next of Kin for community agricultural assets and dividend succession.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setOpenBankSectionDirectly(false);
                    setShowCompletionModal(true);
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-8 px-4 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Configure Next of Kin
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Security & Standing (Perfect 2x2 Grid Consistency) */}
        <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-sm border border-gray-200/90 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Security &amp; Credentials</h3>
                  <p className="text-[11px] text-gray-500">Authentication &amp; member standing</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                Active &amp; Protected
              </span>
            </div>

            <div className="space-y-4 text-xs mt-6">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Account Standing</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 text-right">
                  ✓ In Good Standing
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Password Protection</span>
                <span className="font-mono text-gray-600 text-right tracking-widest">
                  ••••••••••••
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Enrollment Protocol</span>
                <span className="font-medium text-gray-900 text-right">
                  Verified Member Ecosystem
                </span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Enterprise encryption &amp; secure session tokens enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Covenant Agreement Notice */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            By using this platform, I, <strong className="font-bold text-gray-900">{profile?.full_name || "the undersigned member"}</strong>, agree to the{" "}
            <Link
              to="/dashboard/legal"
              className="font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
            >
              Terms of Service, Community Guidelines, and Mutual Covenant
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Unified Profile Completion Modal */}
      {showCompletionModal && profile && (
        <ProfileCompletionModal
          userId={profile.id}
          initialPhone={profile.phone || ""}
          initialCountry={profile.country || "Nigeria"}
          initialState={profile.state || ""}
          initialLga={profile.lga || ""}
          initialKin={kin}
          initialBank={{
            bank_name: profile.bank_name || "",
            bank_account_number: profile.bank_account_number || "",
            bank_account_name: profile.bank_account_name || "",
            bank_code: profile.bank_code || "",
            bank_updated_at: profile.bank_updated_at || undefined,
            bank_verified: Boolean(profile.bank_verified),
          }}
          defaultOpenBankSection={openBankSectionDirectly}
          canDismiss={
            Boolean(
              profile.phone &&
                String(profile.phone).trim().length >= 10 &&
                kin?.kin_name &&
                kin?.kin_number &&
                String(kin.kin_number).trim().length >= 10 &&
                profile.state &&
                profile.lga &&
                String(profile.state).trim().length > 0 &&
                String(profile.lga).trim().length > 0,
            )
          }
          onClose={() => {
            setShowCompletionModal(false);
            setOpenBankSectionDirectly(false);
          }}
          onComplete={() => {
            setShowCompletionModal(false);
            setOpenBankSectionDirectly(false);
            fetchProfile();
          }}
        />
      )}
    </div>
  );
};

export default ProfileComponent;
