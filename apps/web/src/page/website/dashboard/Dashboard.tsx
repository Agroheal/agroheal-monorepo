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
  Sparkles,
  GitBranch,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { Toaster, toast } from "react-hot-toast";
import FarmingInitiativePopup from "./TelegramPopup";
import ShareReferralModal from "@/components/webComponents/shareModal";
import PhoneModal from "./PhoneModal";
import KinModal from "./KinModal";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NextStepModal from "@/components/dashboard/NextStepModal";

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
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [showKinModal, setShowKinModal] = useState<boolean>(false);
  const [showSecureSlotModal, setShowSecureSlotModal] =
    useState<boolean>(false);
  const [forceOpenNextStep, setForceOpenNextStep] = useState<boolean>(false);
  const [kinDetails, setKinDetails] = useState<KinDetails | null>(null);
  const [referralNumber, setReferralNumber] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError || !profileData) {
        setProfileError(true);
        return;
      }

      if (!profileData.phone) {
        setShowPhoneModal(true);
      }

      // Fetch all independent data in parallel
      const [
        { data: kinData, error: kinError },
        { data: referrals },
        { data: subscriptions },
        { data: checkoutsData },
      ] = await Promise.all([
        supabase
          .from("kin_details")
          .select("kin_name, kin_address, kin_number")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, full_name, phone, created_at")
          .eq("referred_by", user.id),
        supabase
          .from("slot_subscriptions")
          .select("id, slots, amount, last_payment_date, created_at")
          .eq("user_id", user.id),
        supabase
          .from("checkout")
          .select("id, amount, status, created_at, reference")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (!kinError) {
        setKinDetails(
          kinData || {
            kin_name: "",
            kin_address: "",
            kin_number: "",
          },
        );

        // Only show Kin modal if kin details are missing AND user has a phone number
        if (
          (!kinData?.kin_name ||
            !kinData?.kin_address ||
            !kinData?.kin_number) &&
          profileData.phone
        ) {
          setShowKinModal(true);
        }
      }

      profileData.referrals = referrals || [];

      const slotsCount = (subscriptions || []).reduce((total, item) => {
        const slotValue = Number(item?.slots ?? 0);
        return total + (Number.isNaN(slotValue) ? 0 : slotValue);
      }, 0);
      setTotalSlotsPurchased(slotsCount);

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
    return <LoadingSpinner message="Loading your overview..." />;
  }

  const stats = [
    {
      label: "Start Learning",
      value: "Organic Farming Courses",
      icon: BookOpen,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo: "/dashboard/courses",
      actionLabel: "View Modules",
    },
    {
      label: "LEAP Community",
      value: "Live trainings & updates",
      icon: SendHorizontal,
      bg: "bg-emerald-50/70",
      iconColor: "text-emerald-700",
      valueColor: "text-gray-900",
      actionHref: "https://t.me/+8a7pjUluliZjNTg0",
      whatsappHref:
        "https://chat.whatsapp.com/JNekCCmjxVq28tnhIz5vyy?s=cl&p=a&ilr=0&amv=3",
      actionLabel: undefined,
    },
    {
      label: "Total Farm Slots",
      value: `${totalSlotsPurchased}`,
      icon: Sprout,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo:
        totalSlotsPurchased > 0
          ? "/dashboard/slots-subscription"
          : "/dashboard/slots",
      actionLabel: totalSlotsPurchased > 0 ? "Manage Slots" : "Secure Slot",
    },
    {
      label: "Total Referrals",
      value: `${profile?.total_referrals ?? 0}`,
      icon: Users,
      bg: "bg-emerald-50/60",
      iconColor: "text-emerald-800",
      valueColor: "text-gray-900",
      actionTo: "/dashboard/my-network",
      actionLabel: "My Network",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <FarmingInitiativePopup />

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
              Organic Farming & Wealth Cooperative Dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setForceOpenNextStep(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border border-emerald-400/35 text-xs sm:text-sm font-semibold backdrop-blur-sm transition-all shadow-xs cursor-pointer"
              title="View Next Cooperative Milestone"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Next Milestone</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {profile?.member_id ? (
              <Link
                to="/dashboard/green-card"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-sm border border-white/20 transition-colors shadow-xs"
                title="View Official Green Card"
              >
                <Award className="w-4 h-4 text-emerald-300" />
                <span className="font-mono">{formatAgcId(profile?.member_id as string)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </Link>
            ) : (
              <Link
                to="/subscribe"
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
        {/* How It Works Quick Access Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0d2818] via-[#10331f] to-[#0a1e12] text-white border border-emerald-800/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#d1ef75]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                How Agroheal Works: Learn, Practice & Earn
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Master organic agriculture, activate Wealth Creation farm slots, and receive projected quarterly harvest dividends.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => outletContext?.openHowItWorks?.()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#d1ef75] hover:bg-[#bce055] text-emerald-950 font-bold text-xs shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            <span>Explore Guide</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

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
                  <Button
                    onClick={() => setShowSecureSlotModal(true)}
                    variant="outline"
                    className="mt-2.5 sm:mt-4 w-full rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                  >
                    Secure Slot
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2.5 sm:mt-4 w-full rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                  >
                    <Link to={stat.actionTo}>
                      {stat.actionLabel ?? (stat.label === "Start Learning" ? "View Modules" : stat.label)}
                    </Link>
                  </Button>
                ))}

              {(stat.actionHref || stat.whatsappHref) && (
                <div className="mt-2.5 sm:mt-4 flex w-full flex-col gap-1.5">
                  {stat.actionHref && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                      <a
                        href={stat.actionHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join Telegram
                      </a>
                    </Button>
                  )}

                  {stat.whatsappHref && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl border border-emerald-700 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                      <a
                        href={stat.whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {stat.label === "Total Referrals" && (
                <div className="mt-2.5 sm:mt-4 flex w-full gap-1.5">
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
                        toast.success("Referral link copied");
                      } catch {
                        toast.error("Failed to copy referral link");
                      }
                    }}
                    title="Copy Referral Link"
                    className="px-2.5 py-2 rounded-xl border border-emerald-800 bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── OFFICIAL GREEN CARD (AGC) QUICK BANNER ── */}
        <div className="bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-emerald-700/40 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                    to="/subscribe"
                    className="font-bold text-amber-300 hover:text-white underline underline-offset-2"
                    title="Click to activate your Green Card"
                  >
                    NO GREENCARD YET
                  </Link>
                )}{" "}
                · Qualifies for 5×7 community matrix upon securing a farm slot.
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
                  <Link to="/dashboard/green-card">View & Download Card</Link>
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
                <Link to="/subscribe">Purchase a Green Card (₦2,000)</Link>
              </Button>
            )}
          </div>
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
                    navigate("/dashboard/slots");
                  }}
                  className="w-full rounded-2xl border border-emerald-700 bg-emerald-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 text-left flex items-center justify-between shadow-xs"
                >
                  <div>
                    <p className="font-bold text-white">Mushroom Village (Flagship)</p>
                    <p className="text-xs text-emerald-100/90 font-normal">₦5,000/slot · Active commercial production</p>
                  </div>
                  <span className="text-xs font-bold uppercase bg-emerald-950/60 px-2 py-0.5 rounded text-emerald-200">Open</span>
                </button>

                <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/90 px-4 py-3 text-sm text-left flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-700">Pioneers Gingertown Farm</p>
                    <p className="text-xs text-gray-500">Funded via Mushroom Cycle 2 returns</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">Cycle 2 Funded</span>
                </div>

                <div className="w-full rounded-2xl border border-gray-200 bg-gray-50/90 px-4 py-3 text-sm text-left flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-700">Organic FoodNation</p>
                    <p className="text-xs text-gray-500">Integrated food cluster expansion</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Expansion Phase</span>
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
            className="order-2 lg:order-1 lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col h-full min-h-0 lg:min-h-[calc(100vh-11rem)] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Cooperative Farm Slots
                  </h2>
                  <p className="text-xs text-gray-500">
                    Active agricultural production units & harvest cycle tracking
                  </p>
                </div>
              </div>
              {totalSlotsPurchased > 0 ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {totalSlotsPurchased} {totalSlotsPurchased === 1 ? "Slot Active" : "Slots Active"} · Producer
                </span>
              ) : (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  No Farm Slots Yet
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0 gap-4">
              {totalSlotsPurchased > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-300 transition-colors shrink-0 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700/10 border border-emerald-700/20 flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm truncate">
                          Mushroom Flagship Slots
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {totalSlotsPurchased} {totalSlotsPurchased === 1 ? "Slot" : "Slots"} Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        Fully funded production · Zero monthly maintenance fees
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      asChild
                      size="sm"
                      className="h-8 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3 rounded-lg shadow-xs cursor-pointer"
                    >
                      <Link to="/dashboard/slots-subscription">Manage Slots</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:border-amber-300 transition-colors shrink-0 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5 text-amber-800" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        Mushroom Farm Slot
                      </h3>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        ₦5,000 / Slot · Up to 40% projected quarterly harvest returns from Cycle 2 onward
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        AgroHeal is an agricultural cooperative, not an investment platform.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      asChild
                      size="sm"
                      className="h-8 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3 rounded-lg shadow-xs cursor-pointer"
                    >
                      <Link to="/dashboard/slots">Secure Slot</Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
                <div className="px-4 py-3.5 sm:px-5 border-b border-emerald-700 bg-emerald-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Slot & Payment History
                    </h3>
                    <p className="text-[11px] text-emerald-100/80">
                      Transactions synchronized with cooperative ledger
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white cursor-pointer"
                  >
                    <Link to="/dashboard/transactions">See all</Link>
                  </Button>
                </div>

                <div className="overflow-x-auto px-4 sm:px-5 py-3">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="text-left font-semibold py-2.5 pr-2">
                          Number of Slots
                        </th>
                        <th className="text-left font-semibold py-2.5 pr-2">
                          Amount
                        </th>
                        <th className="text-left font-semibold py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotPaymentHistory.length > 0 ? (
                        slotPaymentHistory.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="py-3 pr-2 text-gray-800 font-semibold">
                              {item.slots}
                            </td>
                            <td className="py-3 pr-2 text-gray-700 font-medium">
                              ₦{Number(item.amount ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3 text-gray-500">
                              {item.last_payment_date
                                ? new Date(
                                    item.last_payment_date,
                                  ).toLocaleDateString("en-NG", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-6 text-center text-gray-400"
                          >
                            No slot payments yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex-1 min-h-2" aria-hidden />
            </div>

            <div className="mt-auto pt-5 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl -mx-4 sm:-mx-6 -mb-6 px-4 sm:px-6 pb-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    to: "/dashboard/courses",
                    icon: BookOpen,
                    label: "Continue Learning",
                    desc: "Pick up where you left off",
                    iconBg: "bg-emerald-50",
                    iconColor: "text-emerald-800",
                  },
                  totalSlotsPurchased > 0
                    ? {
                        to: "/dashboard/slots-subscription",
                        icon: Sprout,
                        label: "Producer Operations",
                        desc: "Active Producer · Slot allocation",
                        iconBg: "bg-emerald-50",
                        iconColor: "text-emerald-800",
                      }
                    : {
                        to: "/dashboard/slots",
                        icon: Sprout,
                        label: "Become a Producer",
                        desc: "Secure cooperative farm slot",
                        iconBg: "bg-emerald-50",
                        iconColor: "text-emerald-800",
                      },
                ].map((action, i) => (
                  <Link
                    key={i}
                    to={action.to}
                    className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${action.iconBg} flex items-center justify-center`}
                      >
                        <action.icon
                          className={`w-4 h-4 ${action.iconColor}`}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-[11px] text-gray-500">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-700 transition-colors" />
                  </Link>
                ))}
              </div>
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
                <h2 className="text-base font-bold text-gray-900">My Network & Affiliates</h2>
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
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${SITE_URL}/signup?ref=${profile?.referral_code ?? ""}`,
                        );
                        toast.success("Referral link copied!");
                      } catch {
                        toast.error("Failed to copy link");
                      }
                    }}
                    title="Copy Link"
                    className="w-10 h-10 rounded-xl bg-emerald-800 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    title="Share Referral"
                    className="px-3 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-600 flex items-center gap-1.5 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* 5×7 Community Matrix Locked Commission Banner */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-[#062414] to-[#0d3b22] text-white border border-emerald-600/30 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                      5×7 Community Matrix
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    7 Levels Depth
                  </span>
                </div>

                <div>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    Potential <strong className="text-white font-mono">₦12,212,500</strong> in Community Commissions across 7 tiers. Refer 5 active members per tier to unlock full depth withdrawal.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    asChild
                    size="sm"
                    className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Link to="/dashboard/my-network">
                      Genealogy Tree
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-emerald-400/40 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer"
                  >
                    <Link to="/dashboard/producer-network">
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
      {showPhoneModal && profile && (
        <PhoneModal
          userId={profile.id}
          onComplete={() => {
            setShowPhoneModal(false);
            setProfile((prev) => (prev ? { ...prev, phone: true } : prev));
          }}
        />
      )}
      {showKinModal && profile && kinDetails !== null && (
        <KinModal
          userId={profile.id}
          initialData={kinDetails}
          onComplete={(updatedData) => {
            setShowKinModal(false);
            setKinDetails(updatedData);
          }}
          onClose={() => setShowKinModal(false)}
        />
      )}
      {profile && (
        <NextStepModal
          hasGreenCard={Boolean(profile.member_id)}
          totalSlots={totalSlotsPurchased}
          directReferralsCount={profile.referrals?.length ?? 0}
          referralCode={profile.referral_code ?? ""}
          forceOpen={forceOpenNextStep}
          onCloseExternal={() => setForceOpenNextStep(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
