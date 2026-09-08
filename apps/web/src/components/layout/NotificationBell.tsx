import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: "greencard" | "bonus" | "slot" | "matrix" | "system";
  created_at: string;
  read: boolean;
  link?: string;
}

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile and subscriptions to synthesize real-time notifications
        const [
          { data: profile },
          { data: subscriptions },
          { data: otherPayments },
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
            .from("otherPayments")
            .select("payment_type, amount, created_at, status")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const notifs: InAppNotification[] = [];

        // 1. Green Card Notification
        const greenCardSub = (subscriptions || []).find(
          (s) => s.plan === "green_card" && s.status === "active",
        );
        if (greenCardSub) {
          const agcId = formatAgcId(profile?.member_id);
          notifs.push({
            id: "notif-gc-active",
            title: "AgroHeal Green Card Active",
            message: `Your official digital credential ${agcId} is validated. You are eligible for matrix placement upon securing a farm slot.`,
            type: "greencard",
            created_at: greenCardSub.started_at || new Date().toISOString(),
            read: false,
            link: "/dashboard/green-card",
          });
        } else {
          notifs.push({
            id: "notif-gc-pending",
            title: "Activate Your Green Card",
            message: "Get your AgroHeal Green Card for ₦2,000 to unlock referral commissions and 5×7 matrix placement.",
            type: "greencard",
            created_at: profile?.created_at || new Date().toISOString(),
            read: false,
            link: "/subscribe",
          });
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
            message: `You hold ${totalSlots} active farm slot(s). Matrix tree participation and harvest dividends are active.`,
            type: "slot",
            created_at: new Date().toISOString(),
            read: false,
            link: "/dashboard/slots",
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

        // Read state from localStorage
        const readIds: string[] = JSON.parse(
          localStorage.getItem(`read_notifs_${user.id}`) || "[]",
        );
        const finalized = notifs.map((n) => ({
          ...n,
          read: n.read || readIds.includes(n.id),
        }));

        setNotifications(finalized);
        setUnreadCount(finalized.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };

    fetchNotifications();

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(allIds));
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: InAppNotification["type"]) => {
    switch (type) {
      case "greencard":
        return <IdCard className="w-4 h-4 text-emerald-600" />;
      case "bonus":
        return <Award className="w-4 h-4 text-amber-600" />;
      case "slot":
        return <Sprout className="w-4 h-4 text-green-600" />;
      case "matrix":
        return <Users className="w-4 h-4 text-blue-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

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
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors ${
                    n.read ? "bg-white hover:bg-gray-50/80" : "bg-emerald-50/40 hover:bg-emerald-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline mt-1"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-100 bg-gray-50/60 text-center">
            <Link
              to="/dashboard/transactions"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-800 hover:underline block py-1"
            >
              View Full Transaction Ledger →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
