import { AgrohealImages } from "@/constant/Image";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Calendar, Clock, MapPin, User } from "lucide-react";
import { useEffect, useState } from "react";

const FarmingInitiativePopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Small delay so dashboard loads first
    const timer = setTimeout(() => setIsOpen(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleJoin = () => {
    window.open("https://t.me/+8a7pjUluliZjNTg0", "_blank", "noreferrer");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md pointer-events-auto overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col">
              {/* Header — clean emerald gradient */}
              <div className="relative bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-900 px-6 py-6 text-white overflow-hidden">
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Telegram Popup"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-xs font-semibold tracking-wide uppercase">
                    Official Community
                  </span>
                </div>

                <h2 className="text-white text-xl font-bold leading-snug mb-1">
                  Mushroom Flagship
                  <br />
                  &amp; Wealth Creation Hub 🌱
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm">
                  Real-time harvest updates, production cycles &amp; live community webinars
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Join our official Telegram community to connect directly with cooperative coordinators, receive harvest batch announcements, and attend interactive training sessions.
                </p>

                {/* CTA */}
                <button
                  onClick={handleJoin}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-bold text-sm rounded-2xl py-3.5 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Join Telegram Group</span>
                  <span className="text-base">→</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-700 py-1 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FarmingInitiativePopup;
