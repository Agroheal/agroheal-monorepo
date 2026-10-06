import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  CreditCard,
  IdCard,
  Sprout,
  Users,
  Award,
  ExternalLink,
  X,
  TrendingUp,
  Inbox,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: "greencard" | "bonus" | "slot" | "matrix" | "system" | "dividend" | "withdrawal";
  created_at: string;
  read: boolean;
  link?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Play subtle audio chime for real-time notification
  const playChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profile },
        { data: subscriptions },
        { data: otherPayments },
        { data: dbNotifications },
        { data: announcementConfig },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("member_id, referral_code, referral_earnings, created_at, total_referrals")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("plan, status, started_at, slots")
          .eq("user_id", user.id),
        supabase
          .from("other_payments")
          .select("payment_type, amount, created_at, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("system_configs")
          .select("value")
          .eq("key", "system_announcements")
          .maybeSingle(),
      ]);

      const notifs: InAppNotification[] = [];

      // 0a. Broadcast Announcement (if notification channel is enabled)
      const activeAnnc = announcementConfig?.value?.active_announcement;
      if (activeAnnc && activeAnnc.active && activeAnnc.channels?.notification) {
        notifs.push({
          id: `annc-${activeAnnc.id}`,
          title: `📢 ${activeAnnc.title}`,
          message: activeAnnc.message,
          type: "system",
          created_at: activeAnnc.created_at || new Date().toISOString(),
          read: false,
          link: activeAnnc.action_url || "/dashboard/notifications",
        });
      }

      // 0b. Live Database Notifications (from real-time system and webhook events)
      (dbNotifications || []).forEach((n: any) => {
        let mappedType: InAppNotification["type"] = "system";
        if (n.type === "green_card") mappedType = "greencard";
        else if (n.type === "slot_assigned") mappedType = "slot";
        else if (n.type === "harvest_dividend") mappedType = "dividend";
        else if (n.type === "withdrawal_update") mappedType = "withdrawal";
        else if (n.type === "bonus") mappedType = "bonus";

        notifs.push({
          id: n.id,
          title: n.title,
          message: n.message,
          type: mappedType,
          created_at: n.created_at,
          read: Boolean(n.is_read),
          link: n.action_url || undefined,
        });
      });

      // 1. Green Card Notification
      const greenCardSub = (subscriptions || []).find(
        (s) => s.plan === "green_card" && s.status === "active",
      );
      if (greenCardSub) {
        const agcId = formatAgcId(profile?.member_id);
        notifs.push({
          id: "notif-gc-active",
          title: "AgroHeal Green Card Active",
          message: `Your official digital credential ${agcId} is validated. You are eligible for matrix placement upon securing your ₦10,000 starter package (₦5,000 Mushroom farm slot + ₦5,000 Mushroom Power 100g combo).`,
          type: "greencard",
          created_at: greenCardSub.started_at || new Date().toISOString(),
          read: false,
          link: "/dashboard/profile/green-card",
        });
      } else {
        notifs.push({
          id: "notif-gc-pending",
          title: "Activate Your Green Card",
          message: "Get your AgroHeal Green Card for ₦2,000 to unlock referral commissions and 5×7 matrix placement.",
          type: "greencard",
          created_at: profile?.created_at || new Date().toISOString(),
          read: false,
          link: "/dashboard/checkout?product=green_card",
        });
      }

      // 1b. GREEN CARD FIRST 5™ Dynamic Notifications
      if (greenCardSub || profile?.member_id) {
        const totalReferrals = Number(profile?.total_referrals || 0);
        if (totalReferrals >= 5) {
          notifs.push({
            id: "notif-first-5-complete",
            title: "🎉 I HAVE MY 5! (Mission Complete)",
            message: "Congratulations! You have completed your FIRST 5. Your next mission is to help your 5 build their 5 to create an unstoppable food ecosystem duplication!",
            type: "bonus",
            created_at: new Date().toISOString(),
            read: false,
            link: "/dashboard/my-network",
          });
        } else {
          notifs.push({
            id: "notif-first-5-progress",
            title: `🌱 FIRST 5 MISSION (${totalReferrals}/5 Active)`,
            message: `Your Green Card journey begins with your FIRST 5. You have activated ${totalReferrals} member${totalReferrals === 1 ? "" : "s"}. Bring ${5 - totalReferrals} more to unlock your First 5 Pioneer Badge!`,
            type: "matrix",
            created_at: new Date().toISOString(),
            read: false,
            link: "/dashboard",
          });
        }
      }

      // 2. Direct Referral Earnings
      const earnings = Number(profile?.referral_earnings || 0);
      if (earnings > 0) {
        notifs.push({
          id: "notif-referral-earnings",
          title: "Direct Referral Bonus",
          message: `You have earned ₦${earnings.toLocaleString()} in referral bonuses. Direct referral earnings are withdrawable once they reach ₦2,000.`,
          type: "bonus",
          created_at: new Date().toISOString(),
          read: false,
          link: "/dashboard/transactions",
        });
      }

      // 3. Farm Slots
      const totalSlots = (subscriptions || []).reduce(
        (sum, s) => sum + (Number(s.slots) || 0),
        0,
      );
      if (totalSlots > 0) {
        notifs.push({
          id: "notif-slots-held",
          title: "Farm Slots Confirmed",
          message: `You hold ${totalSlots} active farm slot(s). Production yields and harvest dividends are active.`,
          type: "slot",
          created_at: new Date().toISOString(),
          read: false,
          link: "/dashboard/farm-operations/my-slots",
        });
      }

      // 4. Recent Payments
      (otherPayments || []).forEach((p, idx) => {
        notifs.push({
          id: `notif-payment-${idx}`,
          title: "Payment Recorded",
          message: `₦${Number(p.amount || 0).toLocaleString()} recorded for ${p.payment_type.replace(/_/g, " ")}.`,
          type: "system",
          created_at: p.created_at,
          read: true,
          link: "/dashboard/transactions",
        });
      });

      // LocalStorage read state overlay for synthetic items
      const readIds: string[] = JSON.parse(
        localStorage.getItem(`read_notifs_${user.id}`) || "[]",
      );
      const finalized = notifs.map((n) => ({
        ...n,
        read: n.read || readIds.includes(n.id),
      }));

      // Strictly sort by recency (newest first)
      finalized.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setNotifications(finalized);
      setUnreadCount(finalized.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    let channel: any = null;

    // Supabase Real-Time Listener for instant in-app alerts
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const n = payload.new as any;
            let mappedType: InAppNotification["type"] = "system";
            if (n.type === "green_card") mappedType = "greencard";
            else if (n.type === "slot_assigned") mappedType = "slot";
            else if (n.type === "harvest_dividend") mappedType = "dividend";
            else if (n.type === "withdrawal_update") mappedType = "withdrawal";
            else if (n.type === "bonus") mappedType = "bonus";

            const newNotif: InAppNotification = {
              id: n.id,
              title: n.title,
              message: n.message,
              type: mappedType,
              created_at: n.created_at || new Date().toISOString(),
              read: Boolean(n.is_read),
              link: n.action_url || undefined,
            };

            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((c) => c + 1);
            playChime();
          }
        )
        .subscribe();
    });

    // Close on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications, playChime]);

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(allIds));

      // Persist to database
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n: InAppNotification) => {
    if (!n.read) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const readIds: string[] = JSON.parse(
          localStorage.getItem(`read_notifs_${user.id}`) || "[]",
        );
        if (!readIds.includes(n.id)) {
          readIds.push(n.id);
          localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(readIds));
        }

        if (!n.id.startsWith("notif-")) {
          await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
        }
      }

      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setOpen(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate(`/dashboard/notifications?id=${n.id}`);
    }
  };

  const getIcon = (type: InAppNotification["type"]) => {
    switch (type) {
      case "greencard":
        return <IdCard className="w-4 h-4 text-emerald-600" />;
      case "bonus":
        return <Award className="w-4 h-4 text-purple-600" />;
      case "dividend":
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      case "slot":
        return <Sprout className="w-4 h-4 text-green-600" />;
      case "withdrawal":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case "matrix":
        return <Users className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const displayedNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-0.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100 bg-white text-xs font-semibold text-gray-500">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                activeTab === "all"
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-transparent hover:text-gray-800"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`flex-1 py-2 text-center border-b-2 transition-all ${
                activeTab === "unread"
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-transparent hover:text-gray-800"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2">
                <Inbox className="w-8 h-8 text-gray-300" />
                <p>
                  {activeTab === "unread"
                    ? "You have caught up with all notifications!"
                    : "No notifications right now."}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    n.read
                      ? "bg-white hover:bg-gray-50/80"
                      : "bg-emerald-50/40 hover:bg-emerald-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${n.read ? "font-semibold text-gray-800" : "font-bold text-gray-900"}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {formatRelativeTime(n.created_at)}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline mt-1">
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/70 text-center">
            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-800 hover:underline block py-1"
            >
              View All Notifications &amp; Activity →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
