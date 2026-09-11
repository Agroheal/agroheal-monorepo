import { Link } from "react-router-dom";
import {
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Clock,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";

export default function CustomerService() {
  const handleComingSoon = (channel: string) => {
    showToast({
      variant: "info",
      title: `${channel} Support Coming Soon`,
      description: "This channel is currently undergoing maintenance. Please connect with our team on WhatsApp for instant resolution.",
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── HEADER BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041d0f] via-[#09351d] to-[#03170c] text-white p-7 sm:p-10 shadow-2xl border border-emerald-600/30">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
              <Headphones className="w-3.5 h-3.5" />
              <span>Dedicated Member Care</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Customer Service & Support
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Have questions about your Green Card credential, farm slot allocation, or transaction ledger? Choose your preferred contact channel below.
            </p>

            {/* Operating Hours Pill */}
            <div className="pt-2 flex items-center gap-3 flex-wrap text-xs text-emerald-200/80">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Operating Hours: Mon – Sat (8:00 AM – 8:00 PM WAT)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>WhatsApp Response: &lt; 15 mins</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 3 CORE CHANNEL CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. WHATSAPP SUPPORT (ACTIVE & DIRECT) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/50 shadow-md flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -mr-8 -mt-8 transition-transform group-hover:scale-110" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                  <MessageCircle className="w-6 h-6 text-emerald-700" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Now
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">WhatsApp Support</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Direct real-time coordinator chat for payment verification, cluster assignment, and onboarding assistance.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant Payment Reconciliation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cluster Farm Group Coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono font-medium">+234 916 8055 000</span>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <Button
                asChild
                className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <a
                  href="https://wa.link/5ff5ww"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              </Button>
            </div>
          </div>

          {/* 2. EMAIL SUPPORT (# AS REQUESTED) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-gray-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold shadow-xs">
                  <Mail className="w-6 h-6 text-blue-700" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  Coming Soon
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Email Support</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Formal helpdesk ticketing for cooperative documentation, Next-of-Kin updates, and audit requests.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="font-mono text-gray-700">admin@agroheal.solutions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Standard SLA: 24 Business Hours</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                asChild
                variant="outline"
                className="w-full h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleComingSoon("Email");
                  }}
                >
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>Email Support (#)</span>
                </a>
              </Button>
            </div>
          </div>

          {/* 3. LIVE CHAT (# AS REQUESTED) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-gray-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold shadow-xs">
                  <Headphones className="w-6 h-6 text-amber-700" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  Coming Soon
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">In-App Live Chat</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Direct conversational support widget integrated seamlessly into your member dashboard.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Authenticated Member Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Instant In-App Responses</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                asChild
                variant="outline"
                className="w-full h-11 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleComingSoon("Live Chat");
                  }}
                >
                  <Headphones className="w-4 h-4 text-gray-500" />
                  <span>Start Live Chat (#)</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* ── ESCALATION CHECKLIST & HELPFUL RESOURCES ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Before You Reach Out: Fast-Track Your Request
              </h3>
              <p className="text-xs text-gray-500">
                Having the following details ready enables our coordinators to resolve your inquiry within minutes:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">1. Member ID</span>
              <p className="text-gray-500">
                Your unique AGC ID format (e.g. AGC-XXXXXX) located on your dashboard header or Green Card.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">2. Payment Reference</span>
              <p className="text-gray-500">
                Transaction reference or bank transfer receipt for slot purchases or subscription activations.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="font-bold text-gray-900 block">3. Group Farm Name</span>
              <p className="text-gray-500">
                Your assigned cluster or location (e.g. Olowe Farm Cluster) for operational farm slot questions.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <FileQuestion className="w-4 h-4 text-emerald-700" />
              <span>Looking for self-service answers first?</span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold"
            >
              <Link to="/dashboard/help/knowledge-base">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Browse Knowledge Base
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
