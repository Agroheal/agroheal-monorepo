import React, { useEffect, useState } from "react";
import { Megaphone, AlertTriangle, ShieldAlert, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

interface SystemAnnouncement {
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

export const BroadcastAnnouncementModal: React.FC = () => {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    checkActiveAnnouncement();
  }, []);

  async function checkActiveAnnouncement() {
    try {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "system_announcements")
        .maybeSingle();

      if (error || !data?.value) return;

      const active: SystemAnnouncement = data.value.active_announcement;
      if (!active || !active.active || !active.channels?.modal) return;

      // Check if user has already dismissed this specific announcement
      const dismissed = localStorage.getItem(`dismissed_annc_${active.id}`);
      if (dismissed === "true") return;

      setAnnouncement(active);
      setIsOpen(true);
      setSecondsRemaining(5);
    } catch (err) {
      console.warn("Error fetching broadcast announcement:", err);
    }
  }

  // Mandatory 5-Second Countdown Lock
  useEffect(() => {
    if (!isOpen || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsRemaining]);

  // Escape key handler: blocked before 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && secondsRemaining === 0) {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, secondsRemaining, announcement]);

  if (!announcement || !isOpen) return null;

  const handleDismiss = () => {
    if (secondsRemaining > 0) return; // Hard block dismissal before 5 seconds
    localStorage.setItem(`dismissed_annc_${announcement.id}`, "true");
    setIsOpen(false);
  };

  const handleAction = () => {
    if (announcement.action_url) {
      if (announcement.action_url.startsWith("http")) {
        window.open(announcement.action_url, "_blank");
      } else {
        navigate(announcement.action_url);
      }
    }
    handleDismiss();
  };

  const isUrgent = announcement.priority === "urgent";
  const isWarning = announcement.priority === "warning";

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
        onClick={() => {
          if (secondsRemaining === 0) {
            handleDismiss();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl text-slate-100 shadow-2xl overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Banner */}
          <div
            className={`p-5 flex items-start gap-3.5 border-b ${
              isUrgent
                ? "bg-red-950/50 border-red-500/30 text-red-100"
                : isWarning
                ? "bg-amber-950/40 border-amber-500/30 text-amber-100"
                : "bg-emerald-950/40 border-emerald-500/30 text-emerald-100"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isUrgent
                  ? "bg-red-500/20 text-red-400"
                  : isWarning
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {isUrgent ? (
                <ShieldAlert className="w-5 h-5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Megaphone className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    isUrgent
                      ? "border-red-400 text-red-300"
                      : isWarning
                      ? "border-amber-400 text-amber-300"
                      : "border-emerald-400 text-emerald-300"
                  }`}
                >
                  {announcement.priority} Bulletin
                </Badge>
                <span className="text-[11px] text-slate-400">Official Notice</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {announcement.title}
              </h3>
            </div>

            {/* Close button (only functional after 5 seconds) */}
            <button
              type="button"
              onClick={handleDismiss}
              disabled={secondsRemaining > 0}
              aria-label="Dismiss Announcement"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                secondsRemaining > 0 
                  ? "text-slate-600 bg-slate-800/40 cursor-not-allowed" 
                  : "text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Message */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
              {announcement.message}
            </p>
          </div>

          {/* Footer with 5-Second Lock Countdown */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-[11px] text-slate-400">
              {secondsRemaining > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Dismiss enabled in {secondsRemaining}s
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">✓ You may dismiss this notice</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                disabled={secondsRemaining > 0}
                className={`flex-1 sm:flex-none text-xs h-9 border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-all ${
                  secondsRemaining > 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {secondsRemaining > 0 ? `Dismiss (${secondsRemaining}s)` : "Dismiss"}
              </Button>

              {announcement.action_label && (
                <Button
                  size="sm"
                  onClick={handleAction}
                  className="flex-1 sm:flex-none text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md cursor-pointer"
                >
                  <span>{announcement.action_label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BroadcastAnnouncementModal;
