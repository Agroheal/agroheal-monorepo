import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, X, Sprout, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ShareReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

const ShareReferralModal = ({
  isOpen,
  onClose,
  referralCode,
}: ShareReferralModalProps) => {
  const [copied, setCopied] = useState(false);

  const textCopy = `Click the link below to register for the Challenge:

https://www.agroheal.solutions/signup?ref=${referralCode}

🌍 Grow Food, Build Impact!

The 100 Day Container Garden Challenge isn’t just about food—it’s about impact.

Imagine thousands of families across Nigeria growing their own Ugu, Okra, Tomatoes, Pepper, Yam, Fish, etc around their homes.

That is why we cannot keep this to ourselves or look away; we must reach our family, friends, and neighbours to join the challenge. Together, we can build food sufficiency and resilience.

Join Weekly Training Sessions on Sundays 8pm on Google Meet

All trainings are uploaded to the Agroheal dashboard. Once you register you immediately gain access to your user dashboard for resources for the Challenge and 30+ prior learning resources on Organic food production.

🎟️ Registration: ₦2,000 only.

📍 Venue: Meeting links are shared to Telegram and Whatsapp groups, which participants join through their dashboard after signing up.

🍄 Mushroom Village Slots: Join in Group farming at ₦5,000 per slot — own multiple slots for multiple return`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textCopy);
      setCopied(true);
      toast.success(`Referral message copied!`, {
        duration: 3000,
        position: "top-right",
        style: {
          background: "green",
          color: "#fff",
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Failed to copy", {
        duration: 3000,
        position: "top-right",
        style: {
          background: "crimson",
          color: "#fff",
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      });
    }
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
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Top green band */}
              <div className="relative bg-green-800 px-8 pt-10 pb-16 text-center overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                  <div className="absolute top-4 left-1/3 w-2 h-2 rounded-full bg-white/20" />
                  <div className="absolute bottom-8 right-1/4 w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>

                {/* Sparkles */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center gap-2 mb-4"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <Sparkles className="w-3 h-3 text-yellow-200 mt-1" />
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.15,
                  }}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
                >
                  <Sprout className="w-10 h-10 text-green-700" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Share & Earn!
                  </h2>
                  <p className="text-green-200 text-sm">
                    Invite friends and earn ₦1,000 per referral
                  </p>
                </motion.div>
              </div>

              {/* Referral code card — overlaps green band */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="relative -mt-8 mx-4 bg-white rounded-2xl border border-gray-100 shadow-md p-4 mb-4"
              >
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                  Your Referral Code
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-green-50 border border-green-100 rounded-xl text-green-800 font-mono text-sm font-bold tracking-widest text-center">
                    {referralCode}
                  </div>
                </div>
              </motion.div>

              {/* Message preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mx-4 mb-4 bg-gray-50 rounded-2xl border border-gray-100 p-4 max-h-36 overflow-y-auto"
              >
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                  Message Preview
                </p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line text-justify">
                  {textCopy}
                </p>
              </motion.div>

              {/* Footer actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="px-4 pb-6 space-y-3"
              >
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Referral Message
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-center text-sm font-medium text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareReferralModal;
