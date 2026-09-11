import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  Sprout,
  X,
  Phone,
  MessageCircle,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import PaymentGuidancePopup from "@/components/webComponents/PaymentGuidancePopup";

const Slots = () => {
  const slotPrice = "₦5,000";
  const [showPopup, setShowPopup] = useState(false);
  const [scenario, setScenario] = useState<"referred" | "independent">(
    "referred",
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentGuidancePopup />
      <main className="pb-16 px-4 md:px-8 pt-8 max-w-[96%] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 text-[#d17547] font-semibold text-xs uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d17547]" />
            Hands-On Experience
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-2">
            Secure Your Farm Slot
          </h1>
          <p className="text-gray-500 text-base max-w-xl">
            Put your knowledge of organic farming into practice. Limited slots
            available this season.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Slot Card — 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2"
          >
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* Header */}
              <div className="bg-green-800 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Mushroom Flagship Slot
                </h2>
                <p className="text-emerald-200 text-xs mt-1">
                  Cycle 1 Doubling · 40% Quarterly Returns from Cycle 2
                </p>
              </div>

              {/* Price */}
              <div className="px-6 py-5 text-center border-b border-gray-100 bg-emerald-50/50">
                <div className="text-4xl font-extrabold text-emerald-900">
                  {slotPrice}
                </div>
                <p className="text-gray-600 text-xs mt-1 font-medium">
                  per slot · Zero monthly maintenance fees
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-5 space-y-3">
                {[
                  "2 Commercial substrate fruiting bags included",
                  "Capacity doubles to 4 bags in Cycle 1 (Months 1–3)",
                  "40% quarterly returns from net harvest proceeds from Cycle 2",
                  "Expert agronomist oversight & managed fruiting house",
                  "Guaranteed off-taker contracts & supermarket distribution",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <Link to="/dashboard/checkout">
                  <Button
                    className="w-full bg-[#d17547] hover:bg-[#c06038] text-white rounded-xl h-11 font-semibold"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  >
                    Secure My Slot
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-center text-xs text-gray-400 mt-3">
                  You'll receive onboarding instructions after payment
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Panel — 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-3 space-y-4"
          >
            {/* Info cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: MapPin,
                  title: "Location",
                  desc: "Farm locations confirmed after booking based on availability.",
                },
                {
                  icon: Calendar,
                  title: "Season",
                  desc: "March – September 2026. Next season bookings open soon.",
                },
                {
                  icon: Users,
                  title: "Coordination",
                  desc: "Joined to a WhatsApp group for real-time support.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                    <item.icon className="w-4 h-4 text-green-700" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Next Steps Notice */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    What happens after you pay?
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    You'll be assigned to a Group Farm Coordinator. How you get
                    connected depends on how you joined the platform.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                  <p className="text-xs font-semibold text-green-800 mb-1.5 uppercase tracking-wide">
                    Joined via referral
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Contact the person who referred you. They'll link you to
                    your Group Farm Coordinator and WhatsApp group.
                  </p>
                </div>
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                  <p className="text-xs font-semibold text-[#c96a3a] mb-1.5 uppercase tracking-wide">
                    Joined independently
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    Call or WhatsApp to be assigned to a group farm.
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c96a3a]">
                    <Phone className="w-3 h-3" />
                    09168055000
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPopup(true)}
                className="mt-4 w-full text-xs text-green-700 font-semibold border border-green-200 bg-green-50 hover:bg-green-100 transition-colors rounded-xl py-2.5"
              >
                View full onboarding guide
              </button>
            </div>

            {/* FAQ */}
            <div className="bg-green-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">
                  Have Questions?
                </h3>
                <p className="text-green-300 text-xs">
                  Learn about the practical program and harvest sharing.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent text-xs rounded-xl flex-shrink-0 ml-4"
                asChild
              >
                <Link to="/dashboard/legal">View FAQ</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Onboarding Popup */}
      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto">
                {/* Popup Header */}
                <div className="bg-green-800 px-6 pt-6 pb-8 relative">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Next Steps After Payment
                  </h3>
                  <p className="text-green-200 text-sm">
                    How to get connected to your group farm
                  </p>
                </div>

                {/* Popup Body */}
                <div className="p-5">
                  {/* Toggle */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
                    {(["referred", "independent"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setScenario(s)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                          scenario === s
                            ? "bg-white text-green-800 shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        {s === "referred"
                          ? "Joined via referral"
                          : "Joined independently"}
                      </button>
                    ))}
                  </div>

                  {scenario === "referred" ? (
                    <div>
                      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-3">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">
                          What to do
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          If you joined the platform through a referral, kindly
                          ask the person who referred you to link you to your{" "}
                          <span className="font-semibold text-green-800">
                            Group Farm Coordinator
                          </span>
                          .
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed px-1">
                        Your referrer will add you to the appropriate WhatsApp
                        group and introduce you to your coordinator.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-3">
                        <p className="text-xs font-bold text-[#c96a3a] uppercase tracking-wide mb-2">
                          What to do
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          If you joined independent of any referrer, reach out
                          directly to be assigned to a group farm.
                        </p>
                        <div className="space-y-2">
                          <a
                            href="tel:09168055000"
                            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-orange-100 hover:border-orange-300 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#d17547] flex items-center justify-center flex-shrink-0">
                              <Phone className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">
                                Call
                              </p>
                              <p className="text-xs text-gray-500">
                                09168055000
                              </p>
                            </div>
                          </a>
                          <a
                            href="https://wa.me/2349168055000"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-orange-100 hover:border-orange-300 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">
                                WhatsApp
                              </p>
                              <p className="text-xs text-gray-500">
                                Message on WhatsApp
                              </p>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold rounded-2xl py-3 text-sm transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Slots;
