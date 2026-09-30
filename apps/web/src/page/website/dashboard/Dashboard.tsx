import { motion } from "framer-motion";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  BookOpen,
  Sprout,
  Users,
  Copy,
  CheckCircle,
  LoaderCircle,
  ArrowUpRight,
  SendHorizontal,
  AlertCircle,
  TrendingUp,
  IdCard,
  Award,
  ShieldCheck,
  GitBranch,
  Share2,
  MessageCircle,
  Send,
  Lock,
  Zap,
  Wallet,
  ShoppingBag,
  User,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { Toaster, toast } from "react-hot-toast";
import FarmingInitiativePopup from "./TelegramPopup";
import ShareReferralModal from "@/components/webComponents/shareModal";
import FarmCycleTracker from "@/components/dashboard/FarmCycleTracker";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import NextStepModal from "@/components/dashboard/NextStepModal";
import JourneyProgressionHeader from "@/components/dashboard/JourneyProgressionHeader";
import ForcePasswordChangeModal from "@/components/dashboard/ForcePasswordChangeModal";
import RegulatoryNotice from "@/components/webComponents/RegulatoryNotice";
import { isLegacyMember, getGreenCardFee, formatNaira } from "@shared/businessRules";

interface ReferralProps {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
}

interface SlotPaymentHistoryItem {
  id: string;
  slots: string;
  amount: number;
  last_payment_date: string;
}

interface DashboardProfile {
  id: string;
  full_name?: string;
  referral_code?: string;
  referred_by?: string;
  referrer_name?: string;
  referrer_phone?: string | null;
  total_referrals?: number;
  referral_earnings?: number;
  slot_bonus?: number;
  phone?: string | boolean | null;
  created_at?: string | null;
  referrals?: ReferralProps[];
  [key: string]: unknown;
}

interface KinDetails {
  kin_name: string;
  kin_address: string;
  kin_number: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<{ openHowItWorks?: () => void; setHowItWorksOpen?: (open: boolean) => void } | null>();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [totalSlotsPurchased, setTotalSlotsPurchased] = useState(0);
  const [slotPaymentHistory, setSlotPaymentHistory] = useState<
    SlotPaymentHistoryItem[]
  >([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [showSecureSlotModal, setShowSecureSlotModal] =
    useState<boolean>(false);
  const [hasGreenCard, setHasGreenCard] = useState<boolean>(false);
  const [forceOpenNextStep, setForceOpenNextStep] = useState<boolean>(false);
  const [kinDetails, setKinDetails] = useState<KinDetails | null>(null);
  const [referralNumber, setReferralNumber] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [assignedFarms, setAssignedFarms] = useState<
    Array<{ id: string; name: string; project_category: string; slots: number }>
  >([]);
  const [milestone3ActiveDate, setMilestone3ActiveDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user was manually created and needs to set their personal password
      if (user.user_metadata?.force_password_change) {
        navigate("/reset-password?forced=true");
        return;
      }

      // Fetch all dashboard data in a single parallel round-trip
      const [
        { data: profileData, error: selectError },
        { data: kinData, error: kinError },
        { data: referrals },
        { data: subscriptions },
        { data: checkoutsData },
        { data: greenCardSub },
        farmRecordsRes,
        farmGroupsRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("kin_details")
          .select("kin_name, kin_address, kin_number")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, full_name, phone, created_at")
          .or(`referred_by.eq.${user.id},sponsor_id.eq.${user.id}`),
        supabase
          .from("slot_subscriptions")
          .select("id, slots, amount, last_payment_date, created_at, farm_group_id, project_category")
          .eq("user_id", user.id),
        supabase
          .from("transactions")
          .select("id, amount, status, created_at, reference")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("subscriptions")
          .select("id, plan, status, expires_at")
          .eq("user_id", user.id)
          .eq("plan", "green_card")
          .eq("status", "active")
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        user.email
          ? supabase
              .from("farm_records")
              .select("id, farm_slots, project_category, farm_id, farm_groups(*)")
              .ilike("email", user.email.trim())
          : Promise.resolve({ data: [] }),
        supabase.from("farm_groups").select("id, name, project_category, coordinator_id"),
      ]);

      if (selectError || !profileData) {
        setProfileError(true);
        return;
      }

      const isSubActive = Boolean(
        greenCardSub && (!greenCardSub.expires_at || new Date(greenCardSub.expires_at).getTime() > Date.now())
      );
      const isCardHolder = Boolean(profileData.member_id || isSubActive);
      setHasGreenCard(isCardHolder);

      if (!kinError) {
        setKinDetails(
          kinData || {
            kin_name: "",
            kin_address: "",
            kin_number: "",
          },
        );
      }

      const directReferralsList = referrals || [];
      const computedTotalReferrals = Math.max(
        Number(profileData.total_referrals) || 0,
        directReferralsList.length
      );
      profileData.total_referrals = computedTotalReferrals;
      profileData.referrals = directReferralsList;

      // Calculate total slots combining slot_subscriptions AND physical farm_records
      const subSlotsCount = (subscriptions || []).reduce((total, item) => {
        const slotValue = Number(item?.slots ?? 0);
        return total + (Number.isNaN(slotValue) ? 0 : slotValue);
      }, 0);

      const farmRecs = (farmRecordsRes?.data || []) as any[];
      const farmRecordSlots = farmRecs.reduce((sum, r) => sum + (Number(r.farm_slots) || 0), 0);
      const effectiveTotalSlots = subSlotsCount > 0 ? subSlotsCount : farmRecordSlots;
      setTotalSlotsPurchased(effectiveTotalSlots);

      // Resolve user's assigned group farms
      const groupsMap = new Map((farmGroupsRes?.data || []).map((g: any) => [g.id, g]));
      const userAssignedFarms: Array<{ id: string; name: string; project_category: string; slots: number }> = [];

      (subscriptions || []).forEach((s: any) => {
        if (s.farm_group_id && groupsMap.has(s.farm_group_id)) {
          const g = groupsMap.get(s.farm_group_id);
          if (!userAssignedFarms.some((a) => a.id === g.id)) {
            userAssignedFarms.push({
              id: g.id,
              name: g.name,
              project_category: g.project_category || s.project_category || "Mushroom Village",
              slots: Number(s.slots) || 1,
            });
          }
        }
      });

      farmRecs.forEach((r: any) => {
        const g = r.farm_groups || (r.farm_id ? groupsMap.get(r.farm_id) : null);
        if (g && !userAssignedFarms.some((a) => a.id === g.id)) {
          userAssignedFarms.push({
            id: g.id,
            name: g.name,
            project_category: g.project_category || r.project_category || "Mushroom Village",
            slots: Number(r.farm_slots) || 0,
          });
        }
      });
      setAssignedFarms(userAssignedFarms);

      // Track earliest slot date when Milestone 3 began
      let earliestSlotDate: string | null = null;
      (subscriptions || []).forEach((s: any) => {
        const d = s.created_at || s.last_payment_date;
        if (d && (!earliestSlotDate || new Date(d) < new Date(earliestSlotDate))) {
          earliestSlotDate = d;
        }
      });
      farmRecs.forEach((r: any) => {
        const d = r.created_at || r.subscription_date;
        if (d && (!earliestSlotDate || new Date(d) < new Date(earliestSlotDate))) {
          earliestSlotDate = d;
        }
      });
      setMilestone3ActiveDate(earliestSlotDate);

      // Build unified recent payments from subscriptions and checkouts
      const combinedHistory: SlotPaymentHistoryItem[] = [];
      (subscriptions || []).forEach((s) => {
        combinedHistory.push({
          id: s.id,
          slots: `${s.slots || 1} Slot${Number(s.slots) > 1 ? "s" : ""}`,
          amount: Number(s.amount) || (Number(s.slots) || 1) * 5000,
          last_payment_date: s.last_payment_date || s.created_at || "",
        });
      });
      (checkoutsData || []).forEach((c) => {
        const isPaid = ["paid", "success", "completed", "confirmed"].includes(c.status?.toLowerCase());
        if (isPaid) {
          const estimatedSlots = Math.floor(Number(c.amount) / 5000);
          combinedHistory.push({
            id: c.id,
            slots: estimatedSlots > 0 ? `${estimatedSlots} Slot${estimatedSlots > 1 ? "s" : ""}` : "Checkout",
            amount: Number(c.amount) || 0,
            last_payment_date: c.created_at || "",
          });
        }
      });
      combinedHistory.sort((a, b) => new Date(b.last_payment_date).getTime() - new Date(a.last_payment_date).getTime());
      setSlotPaymentHistory(combinedHistory.slice(0, 5));

      // Handle pending referral code
      const pendingReferral = user.user_metadata?.referral_code;
      if (pendingReferral && !profileData.referred_by) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", pendingReferral)
          .maybeSingle();

        if (referrer) {
          await supabase
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", user.id);
          profileData.referred_by = referrer.id;
        }

        await supabase.auth.updateUser({ data: { referral_code: null } });
      }

      // Fetch referrer data if referral exists (supports both dual-hierarchy sponsor_id and legacy referred_by)
      const effectiveReferrerId = profileData.sponsor_id || profileData.referred_by;
      if (effectiveReferrerId) {
        const { data: referrerData } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("id", effectiveReferrerId)
          .single();

        profileData.referrer_phone = referrerData?.phone || null;
        profileData.referrer_name = referrerData?.full_name || "Unknown";
        setReferralNumber(profileData?.referrer_phone);
      }

      setProfile({ ...profileData });
    };

    fetchProfile();
  }, []);

  if (profileError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-gray-700 font-semibold">
            Failed to load your profile.
          </p>
          <p className="text-gray-500 text-sm">
            Please refresh the page or contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <DashboardSkeleton />;
  }

  const availableWalletBalance = Number(profile?.wallet_balance || profile?.referral_earnings || 0);

  const stats = [
    {
      label: "My Earnings",
      value: `₦${availableWalletBalance.toLocaleString()}`,
      icon: Wallet,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo: "/dashboard/transactions",
      actionLabel: "View Earnings",
    },
    {
      label: "My Farm Slots",
      value: `${totalSlotsPurchased} Active Slot${totalSlotsPurchased === 1 ? "" : "s"}`,
      icon: Sprout,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo:
        totalSlotsPurchased > 0
          ? "/dashboard/farm-operations/my-slots"
          : "/dashboard/farm-operations/buy-slots",
      actionLabel: totalSlotsPurchased > 0 ? "Manage Slots" : "Secure Slot",
    },
    {
      label: "My Direct Team",
      value: `${profile?.total_referrals ?? 0} Enrollees`,
      icon: Users,
      bg: "bg-emerald-50/60",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo: "/dashboard/my-network",
      actionLabel: "My Network",
    },
    {
      label: "Learning Academy",
      value: "Agribusiness Courses",
      icon: BookOpen,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo: "/dashboard/courses",
      actionLabel: "Open Courses",
    },
  ];

  // Simplified Representation of ALL Dashboard Menus as High-Contrast Interactive Tiles
  const menuTiles = [
    {
      id: "earnings",
      title: "My Earnings",
      subtitle: "Wallet balance, payouts & ledger",
      badge: `₦${availableWalletBalance.toLocaleString()}`,
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
      path: "/dashboard/transactions",
      icon: Wallet,
      iconBg: "bg-emerald-800 text-white",
      tag: "Wallet",
    },
    {
      id: "my-slots",
      title: "My Farm Slots",
      subtitle: "Active crop cycles & substrate bags",
      badge: `${totalSlotsPurchased} Slot${totalSlotsPurchased === 1 ? "" : "s"}`,
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
      path: "/dashboard/farm-operations/my-slots",
      icon: Sprout,
      iconBg: "bg-emerald-700 text-white",
      tag: "Farms",
    },
    {
      id: "buy-slots",
      title: "Buy Farm Slots",
      subtitle: "Secure ₦5,000 slots in Mushroom Village",
      badge: "₦5,000 / Slot",
      badgeColor: "bg-amber-100 text-amber-950 border-amber-300",
      path: "/dashboard/farm-operations/buy-slots",
      icon: ShoppingBag,
      iconBg: "bg-amber-600 text-white",
      tag: "Store",
    },
    {
      id: "network",
      title: "My Network",
      subtitle: "5×7 Community matrix & team referrals",
      badge: `${profile?.total_referrals ?? 0} Directs`,
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
      path: "/dashboard/my-network",
      icon: GitBranch,
      iconBg: "bg-emerald-800 text-white",
      tag: "Matrix",
    },
    {
      id: "academy",
      title: "Learning Academy",
      subtitle: "Practical agribusiness video training",
      badge: "LEAP Academy",
      badgeColor: "bg-teal-100 text-teal-950 border-teal-300",
      path: "/dashboard/courses",
      icon: BookOpen,
      iconBg: "bg-teal-700 text-white",
      tag: "Courses",
    },
    {
      id: "green-card",
      title: "My Green Card",
      subtitle: "Verified digital ID card & credentials",
      badge: profile?.member_id ? formatAgcId(profile?.member_id as string) : "NO CARD YET",
      badgeColor: profile?.member_id ? "bg-emerald-100 text-emerald-950 border-emerald-300" : "bg-amber-100 text-amber-950 border-amber-300",
      path: profile?.member_id ? "/dashboard/profile/green-card" : "/dashboard/checkout?product=green_card",
      icon: IdCard,
      iconBg: "bg-[#0c2415] text-emerald-300",
      tag: "ID Card",
    },
    {
      id: "profile",
      title: "My Profile",
      subtitle: "Personal info & payout bank account",
      badge: "Settings",
      badgeColor: "bg-slate-100 text-slate-900 border-slate-300",
      path: "/dashboard/profile",
      icon: User,
      iconBg: "bg-slate-700 text-white",
      tag: "Account",
    },
    {
      id: "support",
      title: "Help & Support",
      subtitle: "FAQs, how-it-works & assistance",
      badge: "24/7 Desk",
      badgeColor: "bg-blue-100 text-blue-950 border-blue-300",
      path: "/dashboard/help/knowledge-base",
      icon: HelpCircle,
      iconBg: "bg-blue-700 text-white",
      tag: "Support",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <FarmingInitiativePopup />
      <ForcePasswordChangeModal
        isOpen={mustChangePassword}
        onSuccess={() => setMustChangePassword(false)}
      />

      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[96%] mx-auto flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome, {profile?.full_name?.split(" ")[0]}
            </h1>
            <p className="text-xs sm:text-sm text-green-200 mt-0.5">
              Learn to Earn Agribusiness Platform (LEAP) Dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {profile?.member_id ? (
              <Link
                to="/dashboard/profile/green-card"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm border border-white/20 transition-colors shadow-xs"
                title="View Official Green Card"
              >
                <Award className="w-4 h-4 text-emerald-300" />
                <span className="font-mono">{formatAgcId(profile?.member_id as string)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </Link>
            ) : (
              <Link
                to="/dashboard/checkout?product=green_card"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 text-xs sm:text-sm font-bold backdrop-blur-sm border border-amber-400/40 transition-colors shadow-xs"
                title="Get your AgroHeal Green Card"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>NO GREENCARD YET</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-[96%] mx-auto">
        {/* Journey Progression Infographic Banner (Active through Milestones 1, 2, and 3 - stops after 21 days in Milestone 3) */}
        {!Boolean(hasGreenCard && totalSlotsPurchased > 0 && (profile?.total_referrals || 0) >= 5) && (
          <JourneyProgressionHeader
            hasGreenCard={hasGreenCard}
            memberId={profile?.member_id as string}
            totalSlots={totalSlotsPurchased}
            directReferralsCount={profile?.total_referrals || 0}
            referralCode={profile?.referral_code}
            walletBalance={Number(profile?.wallet_balance || profile?.referral_earnings || 0)}
            createdAt={profile?.created_at}
            milestone3ActiveDate={milestone3ActiveDate}
            onOpenShareModal={() => setShowShareModal(true)}
          />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 flex flex-col h-full items-center text-center sm:items-start sm:text-left"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div
                  className={`flex w-9 h-9 rounded-xl ${stat.bg} items-center justify-center`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1 text-center sm:text-left">
                {stat.label}
              </p>
              <p
                className={`${
                  stat.actionTo ||
                  stat.actionHref ||
                  stat.label === "Total Referrals" ||
                  stat.label === "Referral Earnings"
                    ? "text-base sm:text-lg leading-snug sm:leading-relaxed"
                    : "text-xl sm:text-3xl"
                } font-bold ${stat.valueColor} text-center sm:text-left`}
              >
                {stat.value}
              </p>

              {stat.actionTo &&
                (stat.actionLabel === "Secure Slot" ? (
                  hasGreenCard ? (
                    <Button
                      asChild
                      variant="outline"
                      className="mt-2.5 sm:mt-4 w-full rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                      <Link to="/dashboard/farm-operations/buy-slots">Secure Slot</Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast("A Green Card is required to secure farm slots. Bundling both together for you...", { icon: "🌿" });
                        navigate("/dashboard/checkout?product=green_card_combo");
                      }}
                      className="mt-2.5 sm:mt-4 w-full rounded-xl border border-gray-200 bg-gray-100 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 text-gray-500 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Requires Green Card</span>
                    </Button>
                  )
                ) : stat.label === "Start Learning" && !hasGreenCard ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      toast("Active Green Card required to access courses. Redirecting to checkout...", { icon: "💳" });
                      navigate("/dashboard/checkout?product=green_card");
                    }}
                    className="mt-2.5 sm:mt-4 w-full rounded-xl border border-gray-200 bg-gray-100 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 text-gray-500 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Requires Green Card</span>
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2.5 sm:mt-4 w-full rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                  >
                    <Link to={stat.actionTo}>
                      {stat.actionLabel || stat.label}
                    </Link>
                  </Button>
                ))}

              {(stat.actionHref || stat.whatsappHref) && (
                <div className="mt-2.5 sm:mt-4 flex w-full flex-col gap-1.5">
                  {stat.actionHref && (
                    hasGreenCard ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <a
                          href={stat.actionHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Send className="w-3.5 h-3.5 shrink-0" />
                          <span>Join Telegram</span>
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.error("Active Green Card required to join exclusive LEAP Community channels.");
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Join Telegram</span>
                      </Button>
                    )
                  )}

                  {stat.whatsappHref && (
                    hasGreenCard ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-xl border border-emerald-700 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <a
                          href={stat.whatsappHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Join WhatsApp</span>
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.error("Active Green Card required to join exclusive LEAP Community channels.");
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Join WhatsApp</span>
                      </Button>
                    )
                  )}
                </div>
              )}

              {stat.label === "Total Referrals" && (
                <div className="mt-2.5 sm:mt-4 space-y-2">
                  <div className="flex w-full gap-1.5">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 min-w-0 rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                      <Link to="/dashboard/my-network">
                        My Network
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${SITE_URL}/signup?ref=${profile?.referral_code ?? ""}`,
                          );
                          if (!hasGreenCard) {
                            toast.success(
                              "Standard signup link copied! Share to enrol new members directly.",
                              { duration: 5000 }
                            );
                          } else {
                            toast.success("Standard signup link copied!");
                          }
                        } catch {
                          toast.error("Failed to copy referral link");
                        }
                      }}
                      title="Copy Standard Signup Link (/signup?ref=...)"
                      className="px-2.5 py-2 rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden xs:inline">Signup</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${SITE_URL}/subscribe?ref=${profile?.referral_code ?? ""}`,
                          );
                          toast.success(
                            "Fast-Track Pass link (/subscribe) copied! Important: Guests can pay directly before setting a password, so be sure to follow up with your enrollee to help them complete account login!",
                            { duration: 6500 }
                          );
                        } catch {
                          toast.error("Failed to copy pass link");
                        }
                      }}
                      title="Copy Direct Green Card Pass Link (/subscribe?ref=...)"
                      className="px-2.5 py-2 rounded-xl border border-amber-500 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] sm:text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[10px] hidden xs:inline">Direct Pass</span>
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Tip: <strong>Direct Pass</strong> allows instant checkout on <code>/subscribe</code>. Remember to follow up with guests to set their password.
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── INTERACTIVE QUICK MENU TILES HUB ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <span>Platform Quick Access</span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                8 Core Modules
              </span>
            </h2>
            <span className="text-xs text-gray-500 hidden sm:inline font-medium">
              Tap any tile to navigate directly
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {menuTiles.map((tile) => (
              <Link
                key={tile.id}
                to={tile.path}
                className="group relative bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 hover:border-emerald-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className={`w-9 h-9 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                    <tile.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[110px] ${tile.badgeColor}`}>
                    {tile.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-800 transition-colors flex items-center justify-between">
                    <span>{tile.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {tile.subtitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── OFFICIAL GREEN CARD (AGC) QUICK BANNER ── */}
        <div className="bg-[#0c2415] rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-emerald-800/60 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <IdCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">AgroHeal Digital Green Card (AGC)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Credential
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Member ID:{" "}
                {profile?.member_id ? (
                  <span className="font-mono font-bold text-white">{formatAgcId(profile?.member_id as string)}</span>
                ) : (
                  <Link
                    to="/dashboard/checkout?product=green_card"
                    className="font-bold text-amber-300 hover:text-white underline underline-offset-2"
                    title="Click to activate your Green Card"
                  >
                    NO GREENCARD YET
                  </Link>
                )}{" "}
                · Unlocks your 5×7 community network once you activate the ₦10,000 Starter Combo (Farm Slot + Mushroom Power 100g).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {profile?.member_id ? (
              <>
                <Button
                  asChild
                  className="flex-1 md:flex-initial h-9 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs px-4 border border-emerald-500/40 shadow-xs cursor-pointer"
                >
                  <Link to="/dashboard/profile/green-card">View & Download Card</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const id = formatAgcId(profile?.member_id as string);
                    try {
                      await navigator.clipboard.writeText(id);
                      toast.success(`Copied ${id}`);
                    } catch {
                      toast.error("Could not copy ID");
                    }
                  }}
                  className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-mono font-medium cursor-pointer"
                  title="Copy Member ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Button
                asChild
                className="flex-1 md:flex-initial h-9 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs px-4 shadow-sm cursor-pointer"
              >
                <Link to="/dashboard/checkout?product=green_card">
                  Purchase a Green Card ({formatNaira(getGreenCardFee(profile?.created_at))})
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ── ASSIGNED GROUP FARM BANNER ── */}
        {totalSlotsPurchased > 0 && assignedFarms.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 text-gray-900 shadow-sm border border-emerald-200/70 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 shadow-inner">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-gray-900">
                    {assignedFarms.length === 1
                      ? `Your Farm Group is: ${assignedFarms[0]?.name}`
                      : `Your Farm Groups are: ${Array.from(new Set(assignedFarms.map((f) => f.name))).join(", ")}`}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Active Production Cluster
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Category: <span className="font-semibold text-emerald-800">{Array.from(new Set(assignedFarms.map((f) => f.project_category))).join(", ")}</span> · Your agricultural production slots are physically hosted in this community farm.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                asChild
                className="flex-1 md:flex-initial h-9 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs px-4 shadow-xs cursor-pointer"
              >
                <Link to="/dashboard/farm-operations/farm-records">View Cluster Records</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 md:flex-initial h-9 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs px-4 shadow-xs cursor-pointer"
              >
                <Link to="/dashboard/farm-operations/my-slots">My Farm Slots</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ── REAL-TIME FARM PRODUCTION CYCLE TRACKER (MILESTONE 3) ── */}
        <div className="mb-6">
          <FarmCycleTracker />
        </div>

        {showSecureSlotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Choose a Project
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the project category you want to secure.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecureSlotModal(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSecureSlotModal(false);
                    navigate("/dashboard/farm-operations/buy-slots");
                  }}
                  className="w-full rounded-2xl border border-emerald-700 bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 text-left flex items-center justify-between shadow-xs"
                >
                  <div>
                    <p className="font-bold text-white">Mushroom Village</p>
                    <p className="text-xs text-emerald-100/90 font-normal">Organic Mushrooms · Active commercial production</p>
                  </div>
                  <span className="text-xs font-bold uppercase bg-emerald-950/60 px-2 py-0.5 rounded text-emerald-200">Open</span>
                </button>

                <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/90 px-4 py-3 text-sm text-left flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-700">Gingertown</p>
                    <p className="text-xs text-gray-500">Organic Ginger · ₦33,000/slot · Funded via Mushroom proceeds</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">Opens Q2</span>
                </div>

                <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/90 px-4 py-3 text-sm text-left flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-700">Organic FoodNation</p>
                    <p className="text-xs text-gray-500">Organic Food Crops & Livestock · ₦15,000/slot · Funded via Mushroom proceeds</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">Opens Q2</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-6 lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="order-2 lg:order-1 lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Platform Actions & Shortcuts
                    </h2>
                    <p className="text-xs text-gray-500">
                      Direct access to learning, producer clusters, matrix network &amp; ledger
                    </p>
                  </div>
                </div>
                {totalSlotsPurchased > 0 ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {totalSlotsPurchased} {totalSlotsPurchased === 1 ? "Slot Active" : "Slots Active"} · Producer
                  </span>
                ) : (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {hasGreenCard ? "Certified Member" : "Welcome Member"}
                  </span>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  to: hasGreenCard ? "/dashboard/courses" : "/dashboard/checkout?product=green_card",
                  icon: hasGreenCard ? BookOpen : Lock,
                  label: hasGreenCard ? "Continue Learning" : "Unlock Courses",
                  desc: hasGreenCard ? "Practical organic masterclasses" : "Requires Green Card — ₦2,000",
                  iconBg: hasGreenCard ? "bg-emerald-50" : "bg-amber-50",
                  iconColor: hasGreenCard ? "text-emerald-800" : "text-amber-800",
                },
                {
                  to: "/dashboard/farm-operations/my-slots",
                  icon: Sprout,
                  label: totalSlotsPurchased > 0 ? "Producer Operations" : "Mushroom Production Slots",
                  desc: totalSlotsPurchased > 0 ? `${totalSlotsPurchased} active slot${totalSlotsPurchased > 1 ? "s" : ""} in production` : "Mushroom Village Group Farming",
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-800",
                },
                {
                  to: "/dashboard/my-network",
                  icon: GitBranch,
                  label: "5×7 Community Network",
                  desc: "View genealogy, team spillovers & downlines",
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-800",
                },
                {
                  to: "/dashboard/transactions",
                  icon: TrendingUp,
                  label: "Financial Ledger",
                  desc: "Wallet transactions, commissions & history",
                  iconBg: "bg-emerald-50",
                  iconColor: "text-emerald-800",
                },
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.to}
                  className="flex items-center justify-between p-4 bg-gray-50/70 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <action.icon
                        className={`w-5 h-5 ${action.iconColor}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-gray-500">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-700 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="order-1 lg:order-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 h-full min-h-0 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Affiliate & Community Hub</h2>
                <p className="text-xs text-gray-500">5×7 Community & Referral Hub</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 block">
                  Your Referral Code
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-sm font-bold tracking-widest flex items-center justify-between">
                    <span>{profile?.referral_code || "AGC-MEMBER"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    title="Share Referral"
                    className="px-4 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-600 flex items-center gap-1.5 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* 5×7 Community Matrix Commission Banner */}
              <div className="rounded-2xl p-4 bg-[#0c2415] text-white border border-emerald-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                      5×7 Community Matrix
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
                    7 Matrix Tiers
                  </span>
                </div>

                <div>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    Potential <strong className="text-white font-mono">₦12,212,500</strong> community commissions across 7 tiers. Refer 5 active members to unlock 7-tier commissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <Button
                    asChild
                    className="w-full h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs cursor-pointer shadow-xs justify-center px-3"
                  >
                    <Link to="/dashboard/my-network">
                      My Network
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-9 rounded-xl border-emerald-400/40 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer justify-center px-3"
                  >
                    <Link to="/dashboard/my-network/producer">
                      Producer Matrix
                    </Link>
                  </Button>
                </div>
              </div>

              {Boolean(profile?.referred_by || profile?.sponsor_id) && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Referred by
                  </p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-800/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-800">
                          {profile?.referrer_name?.charAt(0)?.toUpperCase() ??
                            "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700">
                          {profile?.referrer_name ?? "Unknown referrer"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {profile?.referrer_phone ?? "No phone number"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(profile?.referrals?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    People You Referred
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {profile?.referrals?.map((r: ReferralProps) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-7 h-7 rounded-full bg-green-800/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-green-800">
                              {r.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 block">
                              {r.full_name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {r.phone || "No Phone No."}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                {referralNumber.length <= 0 ? (
                  ""
                ) : (
                  <>
                    For Further information contact your referral - <br />
                    <a
                      className="text-green-800 font-bold"
                      href={`tel:${referralNumber}`}
                    >
                      Call: {referralNumber}
                    </a>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <ShareReferralModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        referralCode={profile?.referral_code ?? ""}
      />
      {profile && totalSlotsPurchased === 0 && (
        <NextStepModal
          hasGreenCard={Boolean(profile.member_id || hasGreenCard)}
          totalSlots={totalSlotsPurchased}
          directReferralsCount={profile.referrals?.length ?? 0}
          referralCode={profile.referral_code ?? ""}
          forceOpen={forceOpenNextStep}
          createdAt={profile.created_at}
          onCloseExternal={() => setForceOpenNextStep(false)}
        />
      )}

      <RegulatoryNotice className="mt-8 mb-2" />
    </div>
  );
};

export default Dashboard;
