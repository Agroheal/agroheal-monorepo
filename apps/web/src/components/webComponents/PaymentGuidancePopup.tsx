import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentGuidancePopup = () => {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          >
            <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
              <div className="bg-green-800 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-base sm:text-lg font-bold leading-tight">
                      Must Read Before Payment
                    </p>
                    <p className="text-green-200 text-xs sm:text-sm mt-1">
                      How to get the best experience when making payment
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 overflow-y-auto">
                <div className="rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        Make sure your internet connection is good.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        Pay immediately when the account number appears
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100 p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">
                        You can use different payment methods e.g Card, Bank
                        Transfer etc.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800 mb-1">
                        Need help?
                      </p>
                      <p className="text-sm text-amber-700 leading-relaxed text-justify">
                        If you still don't understand how to proceed, contact
                        our customer care line for more information:{" "}
                        <a
                          href="https://wa.me/2349168055000"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold underline hover:no-underline"
                        >
                          09168055000
                        </a>
                        .
                      </p>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-3 border-t border-gray-100 bg-white">
                <Button
                  onClick={() => setOpen(false)}
                  className="w-full h-11 bg-green-800 hover:bg-green-700 text-white rounded-xl font-semibold"
                >
                  I Understand, Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentGuidancePopup;
