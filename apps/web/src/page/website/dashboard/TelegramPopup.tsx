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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md pointer-events-auto overflow-hidden rounded-3xl shadow-2xl">
              {/* Header — deep green with pattern */}
              <div
                className="relative px-6 pt-7 pb-10 overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.77), rgba(0,0,0,0.80)), url('${AgrohealImages.initiative}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundBlendMode: "darken",
                }}
              >
                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 bg-[#e8b130]/20 border border-[#e8b130]/40 rounded-full px-3 py-1 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8b130] animate-pulse" />
                  <span className="text-[#e8b130] text-xs font-semibold tracking-wide uppercase">
                    Official Community
                  </span>
                </div>

                <h2 className="text-white text-xl font-bold leading-snug mb-1 relative z-10">
                  Mushroom Flagship
                  <br />
                  & Wealth Creation Hub 🌱
                </h2>
                <p className="text-green-300 text-[12px] sm:text-sm relative z-10">
                  Real-time harvest updates, production cycles & live webinars
                </p>

                {/* Yield badges */}
                <div className="hidden gap-2 mt-4 relative z-10">
                  <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center">
                    <p className="text-white font-bold text-base">300%+</p>
                    <p className="text-green-300 text-xs">Pepper Yield</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center">
                    <p className="text-white font-bold text-base">200%+</p>
                    <p className="text-green-300 text-xs">Ginger Yield</p>
                  </div>
                  <div className="hidden bg-[#e8b130]/20 border border-[#e8b130]/40 rounded-xl px-3 py-2 text-center">
                    <p className="text-[#e8b130] font-bold text-base">₦2,000</p>
                    <p className="text-green-300 text-xs">Reg. Fee</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="bg-white px-6 pt-5 pb-6 -mt-4 rounded-t-3xl relative">
                {/* Benefits list */}
                <div className="hidden">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    What you get
                  </p>
                  <ul className="space-y-2 mb-5">
                    {[
                      "Double profits with Pepper & Ginger inter-crop",
                      "Collective bargaining power after harvest",
                      "Seeds, rhizomes & compost at reduced cost",
                      "Training, land access & expert support",
                      "Session recorded & available on your dashboard",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-2.5 h-2.5 text-green-700" />
                        </span>
                        <span className="text-[12px] sm:text-sm text-gray-600 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Event details */}
                <div className="hidden bg-gray-50 rounded-2xl p-4 mb-5 grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-xs font-semibold text-gray-800">
                        March 1st, 2026
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Time</p>
                      <p className="text-xs font-semibold text-gray-800">
                        4pm – 6pm
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#d17547] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Venue</p>
                      <p className="text-xs font-semibold text-gray-800">
                        Telegram Group
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#d17547] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Trainer</p>
                      <p className="text-xs font-semibold text-gray-800">
                        Saka Adesoji
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleJoin}
                  className="w-full bg-green-800 hover:bg-green-700 active:scale-[0.98] text-white font-semibold text-sm rounded-2xl py-3.5 transition-all flex items-center justify-center gap-2"
                >
                  <span>Join Telegram Group</span>
                  <span className="text-base">→</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="hidden sm:inline-block w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
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
