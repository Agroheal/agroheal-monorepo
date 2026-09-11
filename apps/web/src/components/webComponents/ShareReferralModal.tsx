import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, X, Sprout, Share2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { SITE_URL } from "@/config/Index";
import { Button } from "@/components/ui/button";

interface ShareReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

export const ShareReferralModal = ({
  isOpen,
  onClose,
  referralCode,
}: ShareReferralModalProps) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const referralUrl = `${SITE_URL}/signup?ref=${referralCode}`;

  const textCopy = `Join me on AgroHeal and secure your Digital Green Card:

${referralUrl}

🌱 AgroHeal Cooperative Benefits:
• Lifetime access to Organic Farming & Mushroom Cultivation Academy
• Verified Digital Green Card (AGC) credential
• Earn ₦1,000 instant direct sponsor reward per enrolled member
• 5×7 community matrix spillover & quarterly harvest returns!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      toast.success("Affiliate link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(textCopy);
      setCopiedMessage(true);
      toast.success("Referral invitation message copied!");
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(textCopy)}`, "_blank");
  };

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent("Join me on AgroHeal Cooperative!")}`,
      "_blank"
    );
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-emerald-950 via-green-900 to-emerald-900 px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                    <Sprout className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      Share &amp; Earn ₦1,000
                    </h3>
                    <p className="text-xs text-emerald-200/80">
                      Invite members to your 5×7 organogram matrix
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Sponsor Code & Link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Your Affiliate Referral Link
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Code: {referralCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralUrl}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-700 select-all focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <Button
                      onClick={handleCopyLink}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Social Share Shortcuts */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Share WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTelegram}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    Share Telegram
                  </button>
                </div>

                {/* Message preview block */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Ready-to-Send Invitation Message
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      {copiedMessage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedMessage ? "Copied" : "Copy Text"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed max-h-28 overflow-y-auto whitespace-pre-line select-all scrollbar-thin">
                    {textCopy}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 pt-1 flex justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-gray-200 text-xs font-semibold px-5 h-9"
                >
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareReferralModal;
