import React, { useState, useEffect, useMemo } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Video,
  Users,
  Sprout,
  Award,
  GitBranch,
  FileText,
  Layers,
  MousePointerClick,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { SITE_URL } from "@/config/Index";
import { apiClient } from "@/lib/apiClient";

export interface DestinationPage {
  id: string;
  title: string;
  path: string;
  category: string;
  badge?: string;
  icon: React.ElementType;
  description: string;
  shareMessage: string;
}

const DESTINATION_PAGES: DestinationPage[] = [
  {
    id: "funnel1",
    title: "Mushroom Wealth Video Funnel",
    path: "/join/funnel1",
    category: "Funnel",
    badge: "Recommended",
    icon: Video,
    description: "Explainer video page for Mushroom Village farm operations and community qualifications.",
    shareMessage: "Watch this short explainer video on AgroHeal Mushroom Village and learn how to earn compound agricultural wealth:",
  },
  {
    id: "signup",
    title: "Direct Sign Up",
    path: "/signup",
    category: "Registration",
    badge: "Fast Enrolment",
    icon: Users,
    description: "Standard member registration page with your sponsor code pre-filled and locked in.",
    shareMessage: "Join my AgroHeal 5×7 community network today and start your journey towards sustainable agro-wealth:",
  },
  {
    id: "home",
    title: "AgroHeal Home",
    path: "/",
    category: "Overview",
    icon: Globe,
    description: "Main homepage featuring platform overview, ecosystem pillars, and agricultural missions.",
    shareMessage: "Discover AgroHeal, Africa's technology-driven agro-wealth and mushroom production ecosystem:",
  },
  {
    id: "farm-slots",
    title: "Farm Slots Overview",
    path: "/farm-slots",
    category: "Production",
    icon: Sprout,
    description: "Mushroom Village production slots, farm pricing, yields, and monthly harvest returns.",
    shareMessage: "Explore AgroHeal Mushroom Village farm slots and earn returns on agricultural production:",
  },
  {
    id: "courses",
    title: "AgroHeal Academy",
    path: "/courses",
    category: "Education",
    icon: Award,
    description: "Educational courses and masterclasses on mushroom cultivation and agribusiness.",
    shareMessage: "Learn practical agribusiness and agro-wealth strategies on AgroHeal Academy:",
  },
  {
    id: "affiliate",
    title: "Affiliate & Partner Network",
    path: "/affiliate",
    category: "Comp Plan",
    icon: GitBranch,
    description: "Detailed overview of the 5×7 compound matrix commissions, PQV rules, and growth pools.",
    shareMessage: "Learn how the AgroHeal 5×7 Partner & Referral Network creates sustainable residual income:",
  },
  {
    id: "presentation",
    title: "Official Presentation",
    path: "/how-it-works/presentation",
    category: "Presentation",
    icon: FileText,
    description: "Official presentation breakdown and walkthrough of the AgroHeal ecosystem.",
    shareMessage: "Review the full AgroHeal Official Presentation and discover how our community model works:",
  },
];

interface ReferralCampaignToolProps {
  referralCode: string;
  directReferralsCount?: number;
}

export const ReferralCampaignTool: React.FC<ReferralCampaignToolProps> = ({
  referralCode,
  directReferralsCount = 0,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string>("funnel1");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customPath, setCustomPath] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Analytics State
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<{
    totalClicks: number;
    uniqueVisitors: number;
    totalSignups: number;
    conversionRate: number;
    clicksByPage: Array<{ page: string; path: string; count: number }>;
    recentClicks: Array<{ id: string; created_at: string; page: string; path: string; userAgent: string | null }>;
  } | null>(null);

  const selectedPage = useMemo(() => {
    return DESTINATION_PAGES.find((p) => p.id === selectedPageId) || DESTINATION_PAGES[0];
  }, [selectedPageId]);

  // Clean code fallback
  const cleanCode = referralCode ? referralCode.trim() : "AGC-PENDING";

  // Base URL
  const baseUrl = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : SITE_URL;

  // Compute Full Appended Referral Link
  const fullReferralLink = useMemo(() => {
    let targetPath = isCustomMode ? customPath.trim() : selectedPage.path;
    if (!targetPath) targetPath = "/";
    if (!targetPath.startsWith("/")) targetPath = `/${targetPath}`;

    const separator = targetPath.includes("?") ? "&" : "?";
    return `${baseUrl}${targetPath}${separator}ref=${cleanCode}`;
  }, [baseUrl, isCustomMode, customPath, selectedPage, cleanCode]);

  // Copy referral link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullReferralLink);
      setCopiedLink(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Copy sponsor code only
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopiedCode(true);
      toast.success("Sponsor code copied!");
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const introText = isCustomMode
      ? "Join me on AgroHeal and discover our agricultural wealth community:"
      : selectedPage.shareMessage;
    const text = `${introText} ${fullReferralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Fetch Referral Analytics
  const fetchAnalytics = async () => {
    try {
      setLoadingStats(true);
      const res = await apiClient.genealogy.getReferralStats();
      setAnalytics(res);
    } catch (err) {
      console.error("[ReferralCampaignTool] Failed to load referral stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-emerald-100 space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Share2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-gray-900">
              Referral Link Generator &amp; Destination Selector
            </h2>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
              5×7 Linked
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select any AgroHeal page below to automatically append your personal referral code and track prospect clicks in real time.
          </p>
        </div>

        {/* Sponsor Code Pill */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              Your Sponsor Code
            </span>
            <button
              onClick={handleCopyCode}
              title="Click to copy code"
              className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-extrabold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              <span>{cleanCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── CLUSTER CONTEXT ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
        <div className="flex items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold text-emerald-950">
            Referral Farm Cluster: <span className="font-bold text-emerald-800">Mushroom Village</span>
          </span>
        </div>
        <span className="text-[11px] font-medium text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-full border border-emerald-200/70 shrink-0">
          Auto-assigned to your farm group (Spillover at 1,000 slots)
        </span>
      </div>

      {/* ── STEP 1: DESTINATION PAGE SELECTOR ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
            <span>1. Choose Destination Page</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </label>
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3 h-3" />
            <span>{isCustomMode ? "Choose from standard pages" : "Enter custom page path"}</span>
          </button>
        </div>

        {isCustomMode ? (
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-gray-700 block">
              Custom Page Path (relative to agroheal domain):
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono bg-white px-2.5 py-2 rounded-lg border border-gray-200">
                {baseUrl}/
              </span>
              <input
                type="text"
                placeholder="e.g. how-it-works/locked-withdrawals"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value.replace(/^\/+/, ""))}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Enter any internal platform path. Your sponsor code <span className="font-mono font-bold text-emerald-800">?ref={cleanCode}</span> will be appended automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DESTINATION_PAGES.map((page) => {
              const isSelected = selectedPageId === page.id;
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                      : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {page.title}
                      </span>
                    </div>
                    {page.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          page.badge === "Recommended"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {page.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {page.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-gray-100">
                    <span className="truncate">{page.path}</span>
                    {isSelected && (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5 shrink-0">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── STEP 2: GENERATED LINK & ACTION BUTTONS ── */}
      <div className="space-y-2 pt-2">
        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center justify-between">
          <span>2. Generated Referral Link</span>
          <span className="text-[10px] text-gray-400 font-normal lowercase">
            ready to share
          </span>
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={fullReferralLink}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-800 select-all"
          />
          <Button
            onClick={handleCopyLink}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
          </Button>
          <Button
            onClick={handleShareWhatsApp}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </Button>
          <a
            href={fullReferralLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview destination in new tab"
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ── STEP 3: REAL-TIME REFERRAL CLICK ANALYTICS ── */}
      <div className="pt-4 border-t border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-emerald-700" />
              <span>Referral Link Click Counter &amp; Basic Analytics</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Track how many prospective members have clicked your promotional links and converted into signups.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loadingStats}
            className="text-xs h-8 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loadingStats ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Clicks */}
          <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
              <span>Total Clicks</span>
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono">
                {analytics?.totalClicks ?? 0}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Across all shared links
              </span>
            </div>
          </div>

          {/* Unique Visitors */}
          <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
              <span>Unique Visitors</span>
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono">
                {analytics?.uniqueVisitors ?? 0}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Distinct prospect devices
              </span>
            </div>
          </div>

          {/* Total Signups */}
          <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
              <span>Direct Signups</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono">
                {analytics?.totalSignups ?? directReferralsCount}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Enrolled under your code
              </span>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
              <span>Conversion Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            </span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono">
                {analytics?.conversionRate ?? 0}%
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Clicks turned into members
              </span>
            </div>
          </div>
        </div>

        {/* Page Performance Breakdown & Recent Stream */}
        {analytics && analytics.clicksByPage.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
            {/* Clicks by Page */}
            <div className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 space-y-2.5">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Clicks by Destination Page
              </span>
              <div className="space-y-2">
                {analytics.clicksByPage.map((item, idx) => {
                  const pct = analytics.totalClicks > 0
                    ? Math.round((item.count / analytics.totalClicks) * 100)
                    : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800 truncate max-w-[200px]">
                          {item.page || item.path}
                        </span>
                        <span className="font-mono text-gray-600 font-semibold shrink-0">
                          {item.count} click{item.count === 1 ? "" : "s"} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Click Activity */}
            <div className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/70 space-y-2.5">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Recent Prospect Clicks
              </span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {analytics.recentClicks.map((click) => {
                  const dateStr = new Date(click.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={click.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-gray-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-mono text-gray-700 truncate">
                          {click.path}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-2">
                        {dateStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 px-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
            No link clicks recorded yet. Copy your <span className="font-semibold text-emerald-800">Mushroom Wealth Video Funnel</span> or <span className="font-semibold text-emerald-800">Direct Sign Up</span> link above and share with prospects to begin tracking clicks in real time!
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralCampaignTool;
