import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Toaster, toast } from "react-hot-toast";
import FarmingInitiativePopup from "./TelegramPopup";
import ShareReferralModal from "@/components/webComponents/shareModal";
import PhoneModal from "./PhoneModal";
import KinModal from "./KinModal";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
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
  const [kinDetails, setKinDetails] = useState<any>(null);
  const [referralNumber, setReferralNumber] = useState("");
  const [otherSubscriptions, setOtherSubscriptions] = useState<{
    setup: { status: "active" | "inactive"; expiryDate?: Date };
    support: { status: "active" | "inactive"; expiryDate?: Date };
    platform: { status: "active" | "inactive"; expiryDate?: Date };
  }>({
    setup: { status: "inactive" },
    support: { status: "inactive" },
    platform: { status: "active" }, // Default to active for initial UI
  });
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);

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
        { data: otherPayments },
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
          .select("id, slots, amount, last_payment_date")
          .eq("user_id", user.id),
        supabase
          .from("other_payments")
          .select("payment_type, created_at, months")
          .eq("user_id", user.id)
          .eq("status", "success")
          .order("created_at", { ascending: false }),
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
      setSlotPaymentHistory((subscriptions || []).slice(0, 5));

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

      // Fetch referrer data if referral exists
      if (profileData.referred_by) {
        const { data: referrerData } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("id", profileData.referred_by)
          .single();

        profileData.referrer_phone = referrerData?.phone || null;
        profileData.referrer_name = referrerData?.full_name || "Unknown";
        setReferralNumber(profileData?.referrer_phone);
      }

      // Handle subscriptions and show subscription popup
      if (otherPayments) {
        const calculateStatus = (type: string) => {
          const latest = otherPayments.find((p) => p.payment_type === type);
          if (!latest) return { status: "inactive" as const };

          const paymentDate = new Date(latest.created_at);
          const monthsPaid = Number(latest.months || 0);
          const expiryDate = new Date(paymentDate);
          expiryDate.setMonth(expiryDate.getMonth() + monthsPaid);

          const isActive = new Date() < expiryDate;
          return {
            status: (isActive ? "active" : "inactive") as "active" | "inactive",
            expiryDate,
          };
        };

        const setupStatus = calculateStatus("farm_setup");
        const supportStatus = calculateStatus("farm_support");

        // Fetch Platform Subscription from 'subscriptions' table
        const { data: platformSub } = await supabase
          .from("subscriptions")
          .select("expires_at")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let platformStatus: {
          status: "active" | "inactive";
          expiryDate?: Date;
        } = { status: "inactive" };
        if (platformSub?.expires_at) {
          const expiry = new Date(platformSub.expires_at);
          platformStatus = {
            status: new Date() < expiry ? "active" : "inactive",
            expiryDate: expiry,
          };
        }

        setOtherSubscriptions({
          setup: setupStatus,
          support: supportStatus,
          platform: platformStatus,
        });

        // Show popup if any are inactive (only for users with slots) AND kin details are complete
        if (
          slotsCount > 0 &&
          kinData?.kin_name &&
          kinData?.kin_address &&
          kinData?.kin_number
        ) {
          if (
            setupStatus.status === "inactive" ||
            supportStatus.status === "inactive" ||
            platformStatus.status === "inactive"
          ) {
            setShowSubscriptionPopup(true);
          }
        }
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
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Toaster />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-800/10 flex items-center justify-center">
            <LoaderCircle className="animate-spin text-green-800" size={32} />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Start Learning",
      value: "Organic Farming Courses",
      icon: BookOpen,
      bg: "bg-green-50",
      iconColor: "text-green-700",
      valueColor: "text-gray-700",
      actionTo: "/dashboard/courses",
      actionLabel: undefined,
    },
    {
      label: "LEAP Community",
      value: "Live trainings & updates",
      icon: SendHorizontal,
      bg: "bg-[#e8f4ff]",
      iconColor: "text-[#229ED9]",
      valueColor: "text-gray-700",
      actionHref: "https://t.me/+8a7pjUluliZjNTg0",
      whatsappHref:
        "https://chat.whatsapp.com/JNekCCmjxVq28tnhIz5vyy?s=cl&p=a&ilr=0&amv=3",
      actionLabel: undefined,
    },
    {
      label: "Total Farm Slots",
      value: `${totalSlotsPurchased}`,
      icon: Sprout,
      bg: "bg-green-50",
      iconColor: "text-green-700",
      valueColor: "text-gray-700",
      actionTo: "/dashboard/slots",
      actionLabel: "Secure Slot",
    },
    {
      label: "Total Referrals",
      value: `${profile?.total_referrals ?? 0}`,
      icon: Users,
      bg: "bg-yellow-50",
      iconColor: "text-[#e8b130]",
      valueColor: "text-gray-900",
      actionLabel: undefined,
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
          className="max-w-[96%] mx-auto"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome, {profile?.full_name?.split(" ")[0]}
          </h1>
        </motion.div>
      </div>

      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-[96%] mx-auto">
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
                  stat.label === "Total Referrals"
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
                    className="mt-2.5 sm:mt-4 w-full rounded-lg border border-[#d17547] bg-[#d17547] text-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold shadow-sm transition-all duration-200"
                  >
                    Secure Slot
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2.5 sm:mt-4 w-full rounded-lg border border-green-800 bg-green-800 text-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold shadow-sm transition-all duration-200"
                  >
                    <Link to={stat.actionTo}>
                      {stat.label === "Start Learning"
                        ? "View Modules"
                        : (stat.actionLabel ?? stat.label)}
                    </Link>
                  </Button>
                ))}

              {(stat.actionHref || stat.whatsappHref) && (
                <div className="mt-2.5 sm:mt-4 flex w-full flex-col sm:flex-row gap-2">
                  {stat.actionHref && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full flex-1 min-w-0 rounded-lg border border-green-800 bg-green-800 text-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold shadow-sm transition-all duration-200"
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
                      className="w-full flex-1 min-w-0 rounded-lg border border-[#25D366] bg-[#25D366] text-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold shadow-sm transition-all duration-200"
                    >
                      <a
                        href={stat.whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join Whatsapp
                      </a>
                    </Button>
                  )}
                </div>
              )}

              {stat.label === "Total Referrals" && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/signup?ref=${profile?.referral_code ?? ""}`,
                      );
                      toast.success("Referral link copied");
                    } catch {
                      toast.error("Failed to copy referral link");
                    }
                  }}
                  className="mt-2.5 sm:mt-4 w-full rounded-lg border border-green-800 bg-green-800 text-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold shadow-sm transition-all duration-200"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  Referral Link
                </Button>
              )}
            </motion.div>
          ))}
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
                    navigate("/dashboard/mushroom-village");
                  }}
                  className="w-full rounded-2xl border border-green-800 bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Mushroom Village
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecureSlotModal(false);
                    navigate("/dashboard/slots");
                  }}
                  className="w-full rounded-2xl border border-green-800 bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Gingertown
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecureSlotModal(false);
                    navigate("/dashboard/slots");
                  }}
                  className="w-full rounded-2xl border border-green-800 bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Organic FoodNation
                </button>
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
              <h2 className="text-base font-bold text-gray-900">
                Your Subscriptions
              </h2>
            </div>

            <div className="flex-1 flex flex-col min-h-0 gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors shrink-0 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-800/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Platform Subscription
                    </h3>
                    <p className="text-xs text-gray-500">
                      {otherSubscriptions.platform.expiryDate
                        ? `Expires ${otherSubscriptions.platform.expiryDate.toLocaleDateString()}`
                        : "Access to all courses"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center self-start sm:self-auto gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                      otherSubscriptions.platform.status === "active"
                        ? "text-green-700 bg-green-50"
                        : "text-red-700 bg-red-50"
                    }`}
                  >
                    {otherSubscriptions.platform.status === "active" ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs font-semibold capitalize">
                      {otherSubscriptions.platform.status}
                    </span>
                  </div>
                  {otherSubscriptions.platform.status === "inactive" && (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 bg-green-800 hover:bg-green-700 text-xs"
                    >
                      <Link to="/subscription">Renew</Link>
                    </Button>
                  )}
                </div>
              </div>

              {totalSlotsPurchased > 0 && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors shrink-0 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-800/10 flex items-center justify-center shrink-0">
                        <Sprout className="w-5 h-5 text-green-800" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          Farm Setup Fee
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {otherSubscriptions.setup.expiryDate
                            ? `Valid until ${otherSubscriptions.setup.expiryDate.toLocaleDateString()}`
                            : "5 months setup fee"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 ${
                          otherSubscriptions.setup.status === "active"
                            ? "text-green-700 bg-green-50"
                            : "text-red-700 bg-red-50"
                        }`}
                      >
                        {otherSubscriptions.setup.status === "active" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] sm:text-xs font-semibold capitalize">
                          {otherSubscriptions.setup.status}
                        </span>
                      </div>
                      {otherSubscriptions.setup.status === "inactive" && (
                        <Button
                          asChild
                          size="sm"
                          className="h-7 sm:h-8 bg-green-800 hover:bg-green-700 text-[10px] sm:text-xs px-2 sm:px-3"
                        >
                          <Link to="/dashboard/other-payments">Pay Now</Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors shrink-0 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-800/10 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-green-800" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          Farm Support Fee
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {otherSubscriptions.support.expiryDate
                            ? `Valid until ${otherSubscriptions.support.expiryDate.toLocaleDateString()}`
                            : "Monthly maintenance support"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 ${
                          otherSubscriptions.support.status === "active"
                            ? "text-green-700 bg-green-50"
                            : "text-red-700 bg-red-50"
                        }`}
                      >
                        {otherSubscriptions.support.status === "active" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] sm:text-xs font-semibold capitalize">
                          {otherSubscriptions.support.status}
                        </span>
                      </div>
                      {otherSubscriptions.support.status === "inactive" && (
                        <Button
                          asChild
                          size="sm"
                          className="h-7 sm:h-8 bg-green-800 hover:bg-green-700 text-[10px] sm:text-xs px-2 sm:px-3"
                        >
                          <Link to="/dashboard/other-payments">Pay Now</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
                <div className="px-4 py-3.5 sm:px-5 border-b border-green-700 bg-green-800 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">
                    Slot & Payment History
                  </h3>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link to="/dashboard/slots-subscription">See all</Link>
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

              <div className="flex-1 min-h-4" aria-hidden />
            </div>

            <div className="mt-auto pt-5 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl -mx-4 sm:-mx-6 -mb-6 px-4 sm:px-6 pb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    to: "/dashboard/courses",
                    icon: BookOpen,
                    label: "Continue Learning",
                    desc: "Pick up where you left off",
                    iconBg: "bg-green-50",
                    iconColor: "text-green-800",
                  },
                  {
                    to: "/dashboard/slots-subscription",
                    icon: Sprout,
                    label: "Slot Management",
                    desc: "Manage secured farm slot",
                    iconBg: "bg-orange-50",
                    iconColor: "text-[#d17547]",
                  },
                ].map((action, i) => (
                  <Link
                    key={i}
                    to={action.to}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all group"
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
                        <p className="text-sm font-semibold text-gray-900">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-400">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-green-700 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="order-1 lg:order-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full min-h-0 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Affiliate</h2>
              <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-2 block uppercase tracking-wider">
                  Your Referral Code
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl text-green-800 font-mono text-sm font-bold tracking-widest">
                    {profile?.referral_code}
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-xl p-5 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-0.5">
                        Total Earnings
                      </p>
                      <p className="text-3xl font-bold">
                        ₦
                        {(
                          Number(profile?.referral_earnings ?? 0) +
                          Number(profile?.slot_bonus ?? 0)
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm border border-white/10">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-200">Referral Earnings</span>
                      <span className="font-semibold font-mono">
                        ₦
                        {Number(
                          profile?.referral_earnings ?? 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-green-200">Slot Bonus</span>
                      <span className="font-semibold font-mono text-green-300">
                        + ₦{Number(profile?.slot_bonus ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              </div>

              <div className="pt-2">
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: "#15803da" }}
                  onClick={() => navigate("/dashboard/compound-referrals")}
                >
                  View Compound Referrals
                </Button>
              </div>

              {profile?.referred_by && (
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

              {profile?.referrals?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    People You Referred
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {profile.referrals.map((r: ReferralProps) => (
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
        referralCode={profile?.referral_code}
      />
      {showPhoneModal && profile && (
        <PhoneModal
          userId={profile.id}
          onComplete={() => {
            setShowPhoneModal(false);
            setProfile((prev: any) => ({ ...prev, phone: true }));
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
      {showSubscriptionPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Subscription Alert
                </h2>
                <p className="text-sm text-gray-500">
                  Some of your services are inactive
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                The following subscriptions require your attention to ensure
                uninterrupted access:
              </p>

              <div className="space-y-3">
                {otherSubscriptions.platform.status === "inactive" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-green-800" />
                      <span className="text-sm font-medium text-gray-700">
                        Platform Subscription
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 uppercase px-2 py-0.5 bg-red-50 rounded-full">
                      Inactive
                    </span>
                  </div>
                )}
                {otherSubscriptions.setup.status === "inactive" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Sprout className="w-4 h-4 text-green-800" />
                      <span className="text-sm font-medium text-gray-700">
                        Farm Setup Fee
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 uppercase px-2 py-0.5 bg-red-50 rounded-full">
                      Inactive
                    </span>
                  </div>
                )}
                {otherSubscriptions.support.status === "inactive" && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-green-800" />
                      <span className="text-sm font-medium text-gray-700">
                        Farm Support Fee
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 uppercase px-2 py-0.5 bg-red-50 rounded-full">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  asChild
                  className="w-full bg-green-800 hover:bg-green-700 h-11"
                >
                  <Link to="/dashboard/other-payments">Make Payment Now</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSubscriptionPopup(false)}
                  className="w-full text-gray-400 hover:text-gray-600 text-sm h-10"
                >
                  Dismiss for now
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
