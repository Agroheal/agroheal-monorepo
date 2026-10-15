import React, { useEffect, useState, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Sprout,
  DollarSign,
  AlertTriangle,
  Megaphone,
  ArrowRight,
  Filter,
  CheckCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "greencard" | "slot" | "dividend" | "withdrawal" | "bonus" | "system" | "matrix" | "announcement";
  created_at: string;
  read: boolean;
  link?: string;
  priority?: "info" | "warning" | "urgent";
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "announcement" | "bonus">("all");
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");
  const navigate = useNavigate();

  useEffect(() => {
    loadAllNotifications();

    const handleSync = () => {
      loadAllNotifications();
    };
    window.addEventListener("agroheal_notifications_updated", handleSync);
    return () => window.removeEventListener("agroheal_notifications_updated", handleSync);
  }, []);

  async function loadAllNotifications() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const LEGACY_CUTOFF_MS = new Date("2026-09-27T00:00:00.000Z").getTime();

      const [
        { data: profile },
        { data: subscriptions },
        { data: liveLedger },
        { data: userWithdrawals },
        { data: announcementConfig },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("member_id, referral_code, created_at, total_referrals, is_legacy")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("plan, status, started_at, slots")
          .eq("user_id", user.id),
        supabase
          .from("wallet_ledger")
          .select("id, amount, entry_type, category, description, created_at, status")
          .eq("user_id", user.id)
          .eq("entry_type", "CREDIT")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("withdrawals")
          .select("id, amount, status, reference, bank_name, account_number, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("system_configs")
          .select("value")
          .eq("key", "system_announcements")
          .maybeSingle(),
      ]);

      const items: NotificationItem[] = [];

      // 1. Active Broadcast Announcement (if notification channel is enabled)
      const activeAnnc = announcementConfig?.value?.active_announcement;
      if (activeAnnc && activeAnnc.active && activeAnnc.channels?.notification) {
        items.push({
          id: `annc-${activeAnnc.id}`,
          title: `📢 ${activeAnnc.title}`,
          message: activeAnnc.message,
          type: "announcement",
          created_at: activeAnnc.created_at || new Date().toISOString(),
          read: false,
          link: activeAnnc.action_url || undefined,
          priority: activeAnnc.priority || "info",
        });
      }

      // 2. Live Wallet Double-Entry Credits & Bonuses
      (liveLedger || []).forEach((entry: any) => {
        const isLegacy =
          entry.category !== "CORE_DRIVER_BONUS" &&
          entry.created_at &&
          new Date(entry.created_at).getTime() < LEGACY_CUTOFF_MS;
        if (isLegacy) return; // Strict barricade: zero legacy system notifications

        const amt = Number(entry.amount) || 0;
        let title = "Bonus Credited";
        let type: NotificationItem["type"] = "bonus";

        if (entry.category === "REFERRAL_BONUS") {
          title = "Direct Referral Bonus";
        } else if (entry.category === "CORE_DRIVER_BONUS") {
          title = "Core Driver Growth Pool Bonus";
        } else if (entry.category === "MATRIX_COMMISSION") {
          title = "Matrix Commission Earned";
          type = "matrix";
        } else if (entry.category === "SLOT_BONUS") {
          title = "Sponsor Farm Slot Commission";
          type = "slot";
        }

        items.push({
          id: `ledger-${entry.id}`,
          title: `💰 ${title}`,
          message: `₦${amt.toLocaleString()} credited: ${entry.description || "Earned bonus"}`,
          type,
          created_at: entry.created_at,
          read: false,
          link: "/dashboard/transactions",
        });
      });

      // 3. Live Member Withdrawals & Status Updates
      (userWithdrawals || []).forEach((w: any) => {
        const statusUpper = (w.status || "").toUpperCase();
        const amt = Number(w.amount) || 0;
        let title = "Withdrawal Update";
        let message = `Withdrawal of ₦${amt.toLocaleString()} to ${w.bank_name || "bank"} (${w.account_number || ""})`;

        if (statusUpper === "QUEUED" || statusUpper === "PENDING" || statusUpper === "PROCESSING") {
          title = "Withdrawal Request Queued";
          message = `Your withdrawal request of ₦${amt.toLocaleString()} is queued for processing. Reference: ${w.reference || w.id.slice(0, 8)}`;
        } else if (statusUpper === "COMPLETED") {
          title = "Withdrawal Disbursed";
          message = `Your payout of ₦${amt.toLocaleString()} has been approved and disbursed to ${w.bank_name} (${w.account_number}).`;
        } else if (statusUpper === "REVERSED" || statusUpper === "FAILED") {
          title = "Withdrawal Reversed";
          message = `Your withdrawal request of ₦${amt.toLocaleString()} was reversed and funds restored to your wallet.`;
        }

        items.push({
          id: `wdr-${w.id}`,
          title: `🏦 ${title}`,
          message,
          type: "withdrawal",
          created_at: w.updated_at || w.created_at,
          read: false,
          link: "/dashboard/transactions",
        });
      });

      // 4. Green Card Digital Credential Status
      const greenCardSub = (subscriptions || []).find(
        (s) => s.plan === "green_card" && s.status === "active"
      );
      if (greenCardSub) {
        items.push({
          id: "notif-gc-active",
          title: "AgroHeal Green Card Validated",
          message:
            "Your digital membership is active. Unlocks practical organic farming masterclasses, ₦1,000 instant direct sponsor commission, and commercial farm slot eligibility.",
          type: "greencard",
          created_at: greenCardSub.started_at || profile?.created_at || "2026-09-27T00:00:00.000Z",
          read: false,
          link: "/dashboard/profile/green-card",
        });
      } else {
        items.push({
          id: "notif-gc-pending",
          title: "Activate Your Green Card",
          message:
            "Secure your AgroHeal Green Card for ₦2,000 to unlock direct referral commissions and commercial farm slots.",
          type: "greencard",
          created_at: profile?.created_at || "2026-09-27T00:00:00.000Z",
          read: false,
          link: "/dashboard/checkout?product=green_card",
        });
      }

      // 5. FIRST 5 Mission Milestone
      const totalReferrals = Number(profile?.total_referrals || 0);
      if (totalReferrals >= 5) {
        items.push({
          id: "notif-first-5-complete",
          title: "🎉 I HAVE MY 5! Mission Complete",
          message:
            "Congratulations! You have completed your FIRST 5. Help your direct 5 build their 5 to create an unstoppable food ecosystem duplication!",
          type: "bonus",
          created_at: profile?.created_at || "2026-09-27T00:00:00.000Z",
          read: false,
          link: "/dashboard/my-network",
        });
      } else if (totalReferrals > 0) {
        items.push({
          id: "notif-first-5-progress",
          title: `🌱 FIRST 5 MISSION (${totalReferrals}/5 Active)`,
          message: `You have activated ${totalReferrals} member${totalReferrals === 1 ? "" : "s"}. Bring ${5 - totalReferrals} more to unlock your First 5 Pioneer Badge!`,
          type: "matrix",
          created_at: profile?.created_at || "2026-09-27T00:00:00.000Z",
          read: false,
          link: "/dashboard/my-network",
        });
      }

      // 6. Farm Slots Held
      const totalSlots = (subscriptions || []).reduce(
        (sum, s) => sum + (Number(s.slots) || 0),
        0
      );
      if (totalSlots > 0) {
        items.push({
          id: "notif-slots-held",
          title: "Active Mushroom Farm Slots",
          message: `You hold ${totalSlots} active farm slot(s). Production yields and harvest dividends are tracked in your Farm Operations ledger.`,
          type: "slot",
          created_at: subscriptions?.[0]?.started_at || profile?.created_at || "2026-09-27T00:00:00.000Z",
          read: false,
          link: "/dashboard/farm-operations/my-slots",
        });
      }

      // Overlay LocalStorage read state
      const readIds: string[] = JSON.parse(
        localStorage.getItem(`read_notifs_${user.id}`) || "[]"
      );

      const finalized = items.map((n) => ({
        ...n,
        read: n.read || readIds.includes(n.id),
      }));

      // STRICT SORT BY RECENCY: Most recent first by default
      finalized.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(finalized);
    } catch (err) {
      console.warn("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(allIds));

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    window.dispatchEvent(new CustomEvent("agroheal_notifications_updated"));

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
    } catch {
      // offline fallback
    }
  };

  const markItemAsRead = async (id: string, link?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const stored = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || "[]");
      if (!stored.includes(id)) {
        stored.push(id);
        localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(stored));
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    window.dispatchEvent(new CustomEvent("agroheal_notifications_updated"));

    if (link) {
      if (link.startsWith("http")) window.open(link, "_blank");
      else navigate(link);
    }
  };

  const filteredItems = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === "unread") return !n.read;
      if (filterTab === "announcement") return n.type === "announcement";
      if (filterTab === "bonus") return n.type === "bonus" || n.type === "dividend";
      return true;
    });
  }, [notifications, filterTab]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const formatWATTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-5 h-5 text-emerald-600" />;
      case "greencard":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "slot":
        return <Sprout className="w-5 h-5 text-emerald-700" />;
      case "bonus":
      case "dividend":
        return <DollarSign className="w-5 h-5 text-amber-600" />;
      case "matrix":
        return <Award className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-emerald-600" />
            Notifications &amp; Activity
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600 text-white font-semibold text-xs ml-1">
                {unreadCount} New
              </Badge>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time activity feed, official broadcast notices, and commission ledger alerts sorted by recency.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs h-9 gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-100 shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={filterTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTab("all")}
          className={`text-xs h-8 ${filterTab === "all" ? "bg-emerald-700 text-white" : ""}`}
        >
          All Activity ({notifications.length})
        </Button>
        <Button
          variant={filterTab === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTab("unread")}
          className={`text-xs h-8 ${filterTab === "unread" ? "bg-emerald-700 text-white" : ""}`}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filterTab === "announcement" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTab("announcement")}
          className={`text-xs h-8 ${filterTab === "announcement" ? "bg-emerald-700 text-white" : ""}`}
        >
          Announcements
        </Button>
        <Button
          variant={filterTab === "bonus" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTab("bonus")}
          className={`text-xs h-8 ${filterTab === "bonus" ? "bg-emerald-700 text-white" : ""}`}
        >
          Bonuses &amp; Dividends
        </Button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
                <div className="h-2.5 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed border-gray-300 text-center py-12 bg-white">
          <CardContent className="space-y-3">
            <Bell className="w-10 h-10 mx-auto text-gray-300" />
            <h3 className="text-sm font-bold text-gray-800">No notifications found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You are completely caught up! New notices, commissions, and system events will appear here in real time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isHighlighted = highlightedId === item.id;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                  item.read
                    ? "bg-white border-gray-200 hover:border-gray-300"
                    : "bg-emerald-50/50 border-emerald-300 shadow-2xs"
                } ${isHighlighted ? "ring-2 ring-emerald-500" : ""}`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    item.read ? "bg-gray-100" : "bg-emerald-100"
                  }`}
                >
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-sm font-bold leading-tight ${
                        item.read ? "text-gray-900" : "text-emerald-950 font-extrabold"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatWATTime(item.created_at)} WAT
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap mb-3">
                    {item.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                    {item.link && (
                      <Button
                        size="sm"
                        onClick={() => markItemAsRead(item.id, item.link)}
                        className="h-7 px-3 text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}

                    {!item.read && (
                      <button
                        onClick={() => markItemAsRead(item.id)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-1 rounded hover:bg-emerald-100/60 transition-colors cursor-pointer"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
