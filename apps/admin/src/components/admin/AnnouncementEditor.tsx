import { useEffect, useState } from "react";
import {
  Megaphone,
  Send,
  AlertTriangle,
  Bell,
  Mail,
  Layers,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: "info" | "warning" | "urgent";
  channels: {
    modal: boolean;
    notification: boolean;
    email: boolean;
  };
  action_label?: string;
  action_url?: string;
  created_at: string;
  active: boolean;
  created_by?: string;
}

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function AnnouncementEditor({ onSuccess, onError }: Props) {
  const { isReadOnly, profile } = useAdminAuth();
  const [activeAnnouncement, setActiveAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [history, setHistory] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"info" | "warning" | "urgent">("info");
  const [channelModal, setChannelModal] = useState(true);
  const [channelNotification, setChannelNotification] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [actionLabel, setActionLabel] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  const hasAtLeastOneChannel = channelModal || channelNotification || channelEmail;

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "system_announcements")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setActiveAnnouncement(data.value.active_announcement || null);
        setHistory(data.value.history || []);
      }
    } catch (err: any) {
      console.warn("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!title.trim() || !message.trim()) {
      onError("Please provide both an announcement title and message content.");
      return;
    }
    if (!hasAtLeastOneChannel) {
      onError("Please select at least one delivery channel (In-App Modal, Notification, or Email).");
      return;
    }

    setPublishing(true);
    try {
      const newAnnouncement: SystemAnnouncement = {
        id: `annc_${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        priority,
        channels: {
          modal: channelModal,
          notification: channelNotification,
          email: channelEmail,
        },
        action_label: actionLabel.trim() || undefined,
        action_url: actionUrl.trim() || undefined,
        created_at: new Date().toISOString(),
        active: true,
        created_by: profile?.full_name || profile?.email || "Admin",
      };

      const updatedHistory = activeAnnouncement
        ? [activeAnnouncement, ...history.filter((h) => h.id !== activeAnnouncement.id)].slice(0, 20)
        : history.slice(0, 20);

      // 1. Save announcement in system_configs
      const { error: configError } = await supabase
        .from("system_configs")
        .upsert({
          key: "system_announcements",
          value: {
            active_announcement: newAnnouncement,
            history: updatedHistory,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });

      if (configError) throw configError;

      // 2. If Notification channel selected, insert into notifications table
      if (channelNotification) {
        try {
          await supabase.from("notifications").insert({
            user_id: null, // Broadcast to all
            title: `Announcement: ${newAnnouncement.title}`,
            message: newAnnouncement.message,
            type: "system_broadcast",
            metadata: {
              announcement_id: newAnnouncement.id,
              priority: newAnnouncement.priority,
              action_url: newAnnouncement.action_url,
            },
            created_at: new Date().toISOString(),
          });
        } catch (notifErr) {
          console.warn("Notice dispatched to config, but notifications insert logged warning:", notifErr);
        }
      }

      // 3. If Email channel selected, log dispatch task
      if (channelEmail) {
        try {
          await supabase.from("audit_logs").insert({
            action: "BROADCAST_EMAIL_DISPATCHED",
            user_id: profile?.id,
            details: {
              announcement_id: newAnnouncement.id,
              title: newAnnouncement.title,
              recipient_target: "ALL_ACTIVE_MEMBERS",
            },
            created_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      setActiveAnnouncement(newAnnouncement);
      setHistory(updatedHistory);
      setTitle("");
      setMessage("");
      setActionLabel("");
      setActionUrl("");
      onSuccess("Announcement published across selected channels successfully.");
    } catch (err: any) {
      onError(err.message || "Failed to publish announcement");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeactivate() {
    if (!activeAnnouncement) return;
    setPublishing(true);
    try {
      const updatedHistory = [
        { ...activeAnnouncement, active: false },
        ...history.filter((h) => h.id !== activeAnnouncement.id),
      ].slice(0, 20);

      const { error } = await supabase
        .from("system_configs")
        .upsert({
          key: "system_announcements",
          value: {
            active_announcement: null,
            history: updatedHistory,
            updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setActiveAnnouncement(null);
      setHistory(updatedHistory);
      onSuccess("Active announcement retracted successfully.");
    } catch (err: any) {
      onError(err.message || "Failed to deactivate announcement");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-8 flex items-center justify-center gap-3 text-muted-foreground text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading broadcast announcements...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Broadcast Status Banner */}
      {activeAnnouncement && activeAnnouncement.active ? (
        <Card className="border-emerald-500/40 bg-emerald-950/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <CardTitle className="text-base text-foreground font-semibold flex items-center gap-2">
                  Active Member Broadcast
                  <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                    LIVE
                  </Badge>
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeactivate}
                disabled={publishing || isReadOnly}
                className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Retract / Deactivate
              </Button>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Broadcasted on {formatWATDateTime(activeAnnouncement.created_at)} by {activeAnnouncement.created_by}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="p-3 rounded-lg bg-card border border-border">
              <h4 className="text-sm font-bold text-foreground mb-1">{activeAnnouncement.title}</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {activeAnnouncement.message}
              </p>
              {activeAnnouncement.action_label && (
                <div className="mt-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[11px]">
                    Action: {activeAnnouncement.action_label} ({activeAnnouncement.action_url || "#"})
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Active Channels:</span>
              {activeAnnouncement.channels.modal && (
                <Badge variant="secondary" className="text-[11px] bg-secondary text-foreground flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" /> In-App Modal (5s Unskippable Lock)
                </Badge>
              )}
              {activeAnnouncement.channels.notification && (
                <Badge variant="secondary" className="text-[11px] bg-secondary text-foreground flex items-center gap-1">
                  <Bell className="w-3 h-3 text-blue-400" /> In-App Notification
                </Badge>
              )}
              {activeAnnouncement.channels.email && (
                <Badge variant="secondary" className="text-[11px] bg-secondary text-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3 text-amber-400" /> Member Email
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card/60">
          <CardContent className="p-4 flex items-center gap-3 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>No active broadcast announcement running right now. Ready to dispatch.</span>
          </CardContent>
        </Card>
      )}

      {/* Broadcast Composer */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base text-foreground font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Dispatch Broadcast Announcement
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Create an announcement that displays to members across selected channels. Modals enforce a strict 5-second countdown lock before members can dismiss.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Announcement Title <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. Special Mushroom Village Harvest Cycle Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Priority Level
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["info", "warning", "urgent"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`text-xs py-2 px-3 rounded-lg border font-medium transition-all capitalize cursor-pointer ${
                    priority === p
                      ? p === "urgent"
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : p === "warning"
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Message Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Type the full announcement message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="text-xs font-mono resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Action Button Label (Optional)
              </Label>
              <Input
                placeholder="e.g. Go to Checkout, Learn More"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Action Target Route / URL (Optional)
              </Label>
              <Input
                placeholder="e.g. /dashboard/checkout?product=green_card"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Delivery Channels */}
          <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
            <div>
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" /> Delivery Channels
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Select where this announcement will be delivered. At least one channel must be checked to publish.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channelModal
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelModal}
                  onChange={(e) => setChannelModal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold block flex items-center gap-1">
                    <Layers className="w-3 h-3 text-primary" /> In-App Modal
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                    Persistent popup on member login. Locked for 5 seconds before dismissable.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channelNotification
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelNotification}
                  onChange={(e) => setChannelNotification(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold block flex items-center gap-1">
                    <Bell className="w-3 h-3 text-blue-400" /> In-App Notification
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                    Dispatched to member notification bell and dedicated notification history.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channelEmail
                    ? "border-primary/50 bg-primary/5 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold block flex items-center gap-1">
                    <Mail className="w-3 h-3 text-amber-400" /> Member Email
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                    Queued for broadcast email dispatch to all verified member accounts.
                  </span>
                </div>
              </label>
            </div>

            {!hasAtLeastOneChannel && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>You must select at least one delivery channel before publishing.</span>
              </div>
            )}
          </div>

          <Button
            onClick={handlePublish}
            disabled={!hasAtLeastOneChannel || !title.trim() || !message.trim() || publishing || isReadOnly}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium cursor-pointer"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing ? "Publishing Broadcast..." : "Publish Broadcast Announcement"}
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      {history.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Broadcast History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {history.slice(0, 5).map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{item.message}</p>
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {formatWATDateTime(item.created_at)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AnnouncementEditor;
