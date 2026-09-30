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


  // Merged Dashboard Primary Navigation & Status Tiles (Privacy-First: Cash amounts exclusively on Wallet)
  const menuTiles = [
    {
      id: "earnings",
      title: "My Earnings",
      metricValue: "View Ledger",
      subtitle: "Commissions, disbursements & bank withdrawals",
      badge: "Member Wallet",
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
      path: "/dashboard/transactions",
      icon: Wallet,
      iconBg: "bg-emerald-800 text-white",
      tag: "Wallet",
    },
    {
      id: "my-slots",
      title: "My Farm Slots",
      metricValue: `${totalSlotsPurchased} Active Slot${totalSlotsPurchased === 1 ? "" : "s"}`,
      subtitle: "Active crop cycles & substrate bags",
      badge: totalSlotsPurchased > 0 ? "Producer Active" : "Get Started",
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
      path: totalSlotsPurchased > 0 ? "/dashboard/farm-operations/my-slots" : "/dashboard/farm-operations/buy-slots",
      icon: Sprout,
      iconBg: "bg-emerald-700 text-white",
      tag: "Farms",
    },
    {
      id: "network",
      title: "My Network",
      metricValue: `${profile?.total_referrals ?? 0} Direct Enrollee${(profile?.total_referrals ?? 0) === 1 ? "" : "s"}`,
      subtitle: "5×7 Community matrix & team referrals",
      badge: "Community Matrix",
      badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
      path: "/dashboard/my-network",
      icon: GitBranch,
      iconBg: "bg-emerald-800 text-white",
      tag: "Matrix",
    },
    {
      id: "buy-slots",
      title: "Buy Farm Slots",
      metricValue: "Mushroom Village",
      subtitle: "Secure ₦5,000 slots in organic production",
      badge: "₦5,000 / Slot",
      badgeColor: "bg-amber-100 text-amber-950 border-amber-300",
      path: "/dashboard/farm-operations/buy-slots",
      icon: ShoppingBag,
      iconBg: "bg-amber-600 text-white",
      tag: "Store",
    },
    {
      id: "academy",
      title: "Learning Academy",
      metricValue: "Agribusiness Courses",
      subtitle: "Practical agronomy video masterclasses",
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
      metricValue: profile?.member_id ? formatAgcId(profile?.member_id as string) : "NO CARD YET",
      subtitle: "Verified digital ID card & credentials",
      badge: profile?.member_id ? "Verified Pass" : "Activate Pass",
      badgeColor: profile?.member_id ? "bg-emerald-100 text-emerald-950 border-emerald-300" : "bg-amber-100 text-amber-950 border-amber-300",
      path: profile?.member_id ? "/dashboard/profile/green-card" : "/dashboard/checkout?product=green_card",
      icon: IdCard,
      iconBg: "bg-[#0c2415] text-emerald-300",
      tag: "ID Card",
    },
    {
      id: "profile",
      title: "My Profile",
      metricValue: profile?.bank_account_number ? "NUBAN Linked" : "Setup Payouts",
      subtitle: "Personal settings & bank withdrawal account",
      badge: "KYC Account",
      badgeColor: "bg-slate-100 text-slate-900 border-slate-300",
      path: "/dashboard/profile",
      icon: User,
      iconBg: "bg-slate-700 text-white",
      tag: "Account",
    },
    {
      id: "support",
      title: "Help & Support",
      metricValue: "Help & FAQs",
      subtitle: "Support desk, how-it-works & assistance",
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
        {/* ── 3-STEP JOURNEY PROGRESSION ACCORDION (LEAP PATHWAY) ── */}
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

        {/* ── PLATFORM MODULES & QUICK ACCESS (8-MODULE GRID) ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3.5 px-1">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {menuTiles.map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
              >
                <Link
                  to={tile.path}
                  className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-emerald-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full overflow-hidden"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                        <tile.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[120px] ${tile.badgeColor}`}>
                        {tile.badge}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="text-xs text-gray-500 font-semibold mb-0.5">
                        {tile.title}
                      </p>
                      <p className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 group-hover:text-emerald-800 transition-colors tracking-tight">
                        {tile.metricValue}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 mt-2">
                    <span className="line-clamp-1">{tile.subtitle}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
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

        {/* ── AFFILIATE & COMMUNITY HUB (HORIZONTAL 3-COLUMN) ── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200/80 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Affiliate & Community Hub</h2>
                <p className="text-xs text-gray-500">5×7 Community network growth, fast-track links & direct referrals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
              >
                <Link to="/dashboard/my-network" className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>My Network</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Link to="/dashboard/my-network/producer" className="flex items-center gap-1.5">
                  <span>Producer Matrix</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Referral Code & Fast-Track Links */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Your Referral Code</span>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share</span>
                  </button>
                </div>
                <div className="px-3.5 py-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-900 font-mono text-base font-bold tracking-wider flex items-center justify-between mb-3 shadow-xs">
                  <span>{profile?.referral_code || "AGC-MEMBER"}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(profile?.referral_code || "");
                        toast.success("Referral code copied!");
                      } catch {
                        toast.error("Failed to copy code");
                      }
                    }}
                    className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                    title="Copy Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Fast-Track Share Links</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${SITE_URL}/signup?ref=${profile?.referral_code ?? ""}`);
                        toast.success("Standard signup link copied!");
                      } catch {
                        toast.error("Failed to copy link");
                      }
                    }}
                    className="rounded-xl border-emerald-700 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 py-1.5 h-auto cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Signup Link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${SITE_URL}/subscribe?ref=${profile?.referral_code ?? ""}`);
                        toast.success("Direct Green Card Pass link copied! Important: Follow up with guest to set account password after checkout.", { duration: 6500 });
                      } catch {
                        toast.error("Failed to copy link");
                      }
                    }}
                    className="rounded-xl border-amber-500 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 py-1.5 h-auto cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Direct Pass</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Column 2: Referred By */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">Referred By</span>
                {Boolean(profile?.referred_by || profile?.sponsor_id) ? (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200/70 shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                      {profile?.referrer_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {profile?.referrer_name ?? "Direct Sponsor"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {profile?.referrer_phone || "Contact via AgroHeal"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-gray-200/70 text-center py-5 shadow-xs">
                    <p className="text-xs font-semibold text-gray-700">Direct AgroHeal Pioneer</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Enrolled directly with the founding platform</p>
                  </div>
                )}
              </div>

              {referralNumber && referralNumber.length > 0 && (
                <div className="pt-3 border-t border-gray-200/60 mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Contact Sponsor:</span>
                  <a
                    href={`tel:${referralNumber}`}
                    className="text-emerald-800 font-bold hover:underline"
                  >
                    {referralNumber}
                  </a>
                </div>
              )}
            </div>

            {/* Column 3: People You Referred */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">People You Referred</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {profile?.referrals?.length ?? profile?.total_referrals ?? 0}
                  </span>
                </div>

                {(profile?.referrals?.length ?? 0) > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {profile?.referrals?.slice(0, 8).map((r: ReferralProps) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5 border border-gray-200/60 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {r.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-[120px]">
                            {r.full_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {new Date(r.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-gray-200/70 text-center py-5 shadow-xs">
                    <p className="text-xs font-semibold text-gray-700">No Direct Enrollees Yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Share your link to activate Milestone 3</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200/60 mt-2">
                <Link
                  to="/dashboard/my-network"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-between w-full"
                >
                  <span>View complete team directory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
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
