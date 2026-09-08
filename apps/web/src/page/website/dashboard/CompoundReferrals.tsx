import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  Users,
  GitBranch,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Award,
  TrendingUp,
  Wallet,
  Sprout,
  ChevronRight,
  Search,
  Filter,
  Layers,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Calculator,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CornerDownRight,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";

export interface OrganogramNode {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  memberId: string;
  parentId?: string | null;
  position: number; // 1 to 5
  level: number;
  slotsHeld: number;
  directReferralsCount: number;
  createdAt?: string;
  hasGreenCard: boolean;
  children: OrganogramNode[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
  memberId: string;
}

export const ESTHER_APEX_EMAIL = "estherbola888@gmail.com";
export const MIN_DIRECT_REFERRALS_FOR_MATRIX = 5;
export const MIN_PQV_FOR_MATRIX_WITHDRAWAL = 5000;
export const PQV_WINDOW_DAYS = 30;
export const MIN_DIRECT_REFERRAL_WITHDRAWAL = 2000;

export const MATRIX_COMMISSIONS = [
  { level: 1, percentage: 10, amount: 500, maxMembers: 5, potential: 2500 },
  { level: 2, percentage: 7, amount: 350, maxMembers: 25, potential: 8750 },
  { level: 3, percentage: 6, amount: 300, maxMembers: 125, potential: 37500 },
  { level: 4, percentage: 5, amount: 250, maxMembers: 625, potential: 156250 },
  { level: 5, percentage: 5, amount: 250, maxMembers: 3125, potential: 781250 },
  { level: 6, percentage: 4, amount: 200, maxMembers: 15625, potential: 3125000 },
  { level: 7, percentage: 3, amount: 150, maxMembers: 78125, potential: 11718750 },
];

const CompoundReferrals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"organogram" | "directory" | "rules">("organogram");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Authenticated Member State
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>("");

  // Qualification State
  const [directReferralEarnings, setDirectReferralEarnings] = useState<number>(0);
  const [matrixSpilloverEarnings, setMatrixSpilloverEarnings] = useState<number>(0);
  const [directReferralsCount, setDirectReferralsCount] = useState<number>(0);
  const [activePqv30d, setActivePqv30d] = useState<number>(0);
  const [pqvDaysRemaining, setPqvDaysRemaining] = useState<number>(30);
  const [userSlotsHeld, setUserSlotsHeld] = useState<number>(0);

  // Organogram Tree Navigation State
  const [activeRootId, setActiveRootId] = useState<string>("");
  const [activeRootNode, setActiveRootNode] = useState<OrganogramNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [downlineList, setDownlineList] = useState<OrganogramNode[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [directoryFilter, setDirectoryFilter] = useState<"ALL" | "DIRECT" | "SPILLOVER">("ALL");

  // Calculator State
  const [calcSlotsPerMember, setCalcSlotsPerMember] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProjectSubscribed, setIsProjectSubscribed] = useState<boolean>(false);

  // Load member and initial tree
  useEffect(() => {
    loadMemberGenealogy();
  }, []);

  const loadMemberGenealogy = async (customRootUserId?: string) => {
    try {
      if (!customRootUserId) setLoading(true);
      else setRefreshing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const authId = user.id;
      setCurrentUserId(authId);

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authId)
        .maybeSingle();

      if (profile) {
        setCurrentUserProfile(profile);
        setReferralCode(profile.referral_code || profile.member_id || "");
        setDirectReferralEarnings(Number(profile.referral_earnings || 0));
        setMatrixSpilloverEarnings(Number(profile.slot_bonus || 0));
      }

      // 2. Fetch User Slot Subscriptions
      const { data: slotSubs } = await supabase
        .from("slot_subscriptions")
        .select("slots, amount, status")
        .eq("user_id", authId);

      const totalSlots = (slotSubs || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);
      setUserSlotsHeld(totalSlots);

      // 3. Fetch Direct Referrals
      const { data: directRefs } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, member_id, created_at, referred_by, total_referrals")
        .eq("referred_by", authId);

      const directCount = directRefs ? directRefs.length : 0;
      setDirectReferralsCount(directCount);

      // 4. Fetch 30-Day PQV
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - PQV_WINDOW_DAYS);

      let paymentsData: any[] = [];
      const { data: opData } = await supabase
        .from("otherPayments")
        .select("amount, created_at")
        .eq("user_id", authId);

      if (opData && opData.length > 0) {
        paymentsData = opData;
      } else {
        const { data: opData2 } = await supabase
          .from("other_payments")
          .select("amount, created_at")
          .eq("user_id", authId);
        if (opData2) paymentsData = opData2;
      }

      let activePqv = 0;
      let latestPqvDate: Date | null = null;
      for (const p of paymentsData) {
        const pDate = new Date(p.created_at);
        if (pDate >= thirtyDaysAgo && pDate <= now) {
          activePqv += Number(p.amount) || 0;
          if (!latestPqvDate || pDate > latestPqvDate) latestPqvDate = pDate;
        }
      }
      setActivePqv30d(activePqv);

      if (latestPqvDate) {
        const expiry = new Date(latestPqvDate);
        expiry.setDate(expiry.getDate() + PQV_WINDOW_DAYS);
        const diff = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        setPqvDaysRemaining(diff);
      }

      // Check active project subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", authId)
        .eq("status", "active")
        .limit(1);

      const { data: coData } = await supabase
        .from("checkout")
        .select("id")
        .eq("user_id", authId)
        .eq("status", "paid")
        .limit(1);

      setIsProjectSubscribed(Boolean((subData && subData.length > 0) || (coData && coData.length > 0)));

      // 5. Build Organogram Subtree for target root
      const rootToLoad = customRootUserId || authId;
      await buildSubtree(rootToLoad, authId === rootToLoad);
    } catch (err: any) {
      console.error("Failed to load genealogy", err);
      toast.error(err.message || "Failed to load genealogy");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Builds an Organogram tree node and up to 5 child slots
   */
  const buildSubtree = async (targetId: string, isSelf: boolean) => {
    setActiveRootId(targetId);

    // Fetch target node profile
    const { data: rootProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, member_id, referred_by, total_referrals, created_at")
      .eq("id", targetId)
      .maybeSingle();

    if (!rootProfile) {
      toast.error("Target member profile not found.");
      return;
    }

    // Target slots
    const { data: rootSlots } = await supabase
      .from("slot_subscriptions")
      .select("slots")
      .eq("user_id", targetId);
    const slotsCount = (rootSlots || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);

    // Fetch direct children (downline)
    const { data: childrenProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, member_id, created_at, referred_by, total_referrals")
      .eq("referred_by", targetId)
      .order("created_at", { ascending: true })
      .limit(10);

    const childrenNodes: OrganogramNode[] = [];
    const allRoster: OrganogramNode[] = [];

    if (childrenProfiles && childrenProfiles.length > 0) {
      for (let i = 0; i < Math.min(5, childrenProfiles.length); i++) {
        const cp = childrenProfiles[i];
        const { data: cSlots } = await supabase
          .from("slot_subscriptions")
          .select("slots")
          .eq("user_id", cp.id);
        const cSlotCount = (cSlots || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);

        const { data: grandChildren } = await supabase
          .from("profiles")
          .select("id")
          .eq("referred_by", cp.id);

        const childNode: OrganogramNode = {
          id: cp.id,
          fullName: cp.full_name || "Downline Partner",
          email: cp.email || "",
          phone: cp.phone || null,
          memberId: formatAgcId(cp.member_id),
          parentId: targetId,
          position: i + 1,
          level: 1,
          slotsHeld: cSlotCount,
          directReferralsCount: grandChildren ? grandChildren.length : 0,
          createdAt: cp.created_at,
          hasGreenCard: Boolean(cp.member_id),
          children: [],
        };
        childrenNodes.push(childNode);
        allRoster.push(childNode);
      }

      // Add remaining for directory list
      for (let j = 5; j < childrenProfiles.length; j++) {
        const cp = childrenProfiles[j];
        allRoster.push({
          id: cp.id,
          fullName: cp.full_name || "Downline Partner",
          email: cp.email || "",
          phone: cp.phone || null,
          memberId: formatAgcId(cp.member_id),
          parentId: targetId,
          position: j + 1,
          level: 1,
          slotsHeld: 0,
          directReferralsCount: 0,
          createdAt: cp.created_at,
          hasGreenCard: Boolean(cp.member_id),
          children: [],
        });
      }
    }

    const builtRoot: OrganogramNode = {
      id: rootProfile.id,
      fullName: rootProfile.full_name || (isSelf ? "You (Root Node)" : "AgroHeal Member"),
      email: rootProfile.email || "",
      phone: rootProfile.phone || null,
      memberId: formatAgcId(rootProfile.member_id),
      parentId: rootProfile.referred_by || null,
      position: 1,
      level: 0,
      slotsHeld: slotsCount,
      directReferralsCount: childrenProfiles ? childrenProfiles.length : 0,
      createdAt: rootProfile.created_at,
      hasGreenCard: Boolean(rootProfile.member_id),
      children: childrenNodes,
    };

    setActiveRootNode(builtRoot);
    setDownlineList(allRoster);

    // Update Breadcrumbs
    if (isSelf) {
      setBreadcrumbs([{ id: builtRoot.id, name: "My Organogram Tree", memberId: builtRoot.memberId }]);
    } else {
      setBreadcrumbs((prev) => {
        const existsIndex = prev.findIndex((b) => b.id === builtRoot.id);
        if (existsIndex >= 0) return prev.slice(0, existsIndex + 1);
        return [...prev, { id: builtRoot.id, name: builtRoot.fullName, memberId: builtRoot.memberId }];
      });
    }
  };

  // Search by Email or Member ID
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter an email or AGC Member ID");
      return;
    }

    setRefreshing(true);
    setSearchStatus("Searching member...");
    try {
      const query = searchQuery.trim().toLowerCase();
      let targetUser: any = null;

      if (query.includes("@")) {
        const { data: userIdData } = await supabase.rpc("get_user_id_by_email", {
          p_email: query,
        });
        if (userIdData) {
          const { data } = await supabase.from("profiles").select("*").eq("id", userIdData).maybeSingle();
          targetUser = data;
        }
      }

      if (!targetUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .ilike("member_id", `%${query}%`)
          .maybeSingle();
        targetUser = data;
      }

      if (!targetUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .ilike("full_name", `%${query}%`)
          .limit(1)
          .maybeSingle();
        targetUser = data;
      }

      if (!targetUser) {
        toast.error("No member found matching query.");
        setSearchStatus("No matching member found.");
        return;
      }

      toast.success(`Loaded tree for ${targetUser.full_name || targetUser.email}`);
      setSearchStatus(`Viewing organogram for ${targetUser.full_name || targetUser.email}`);
      await buildSubtree(targetUser.id, targetUser.id === currentUserId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to search member tree");
      setSearchStatus("Search failed.");
    } finally {
      setRefreshing(false);
    }
  };

  // Jump to Esther Apex Root
  const handleJumpToApex = async () => {
    setRefreshing(true);
    try {
      const { data: estherId } = await supabase.rpc("get_user_id_by_email", {
        p_email: ESTHER_APEX_EMAIL,
      });

      if (estherId) {
        await buildSubtree(estherId as string, estherId === currentUserId);
        toast.success("Loaded Apex Root (Esther Adetayo)");
      } else {
        // Fallback search profile
        const { data: estherProf } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", ESTHER_APEX_EMAIL)
          .maybeSingle();

        if (estherProf) {
          await buildSubtree(estherProf.id, false);
          toast.success("Loaded Apex Root (Esther Adetayo)");
        } else {
          toast.error("Apex Root account not located in database.");
        }
      }
    } catch (err) {
      toast.error("Could not load apex root.");
    } finally {
      setRefreshing(false);
    }
  };

  // Reset to Self
  const handleResetToSelf = () => {
    if (currentUserId) {
      buildSubtree(currentUserId, true);
      toast.success("Reset to your root organogram");
    }
  };

  // Copy Referral Link
  const handleCopyReferralLink = async () => {
    const code = referralCode || currentUserProfile?.referral_code || currentUserId;
    const link = `${SITE_URL}/signup?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success("Affiliate link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const code = referralCode || currentUserProfile?.referral_code || currentUserId;
    const link = `${SITE_URL}/signup?ref=${code}`;
    const text = `Join me on AgroHeal! Secure your Digital Green Card, activate your 5x7 Producer-Consumer network, and build sustainable agro-wealth. Sign up here: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Qualification Calculations
  const isDirectWithdrawable = isProjectSubscribed && directReferralEarnings >= MIN_DIRECT_REFERRAL_WITHDRAWAL;
  const canSubscribeWithWallet = !isProjectSubscribed && directReferralEarnings >= 10000;
  const directRemaining = Math.max(0, MIN_DIRECT_REFERRAL_WITHDRAWAL - directReferralEarnings);

  const hasEnoughReferrals = directReferralsCount >= MIN_DIRECT_REFERRALS_FOR_MATRIX;
  const hasEnoughPqv = activePqv30d >= MIN_PQV_FOR_MATRIX_WITHDRAWAL;
  const isMatrixQualified = hasEnoughReferrals && hasEnoughPqv;

  // Filtered Downline Directory
  const filteredDirectory = useMemo(() => {
    return downlineList.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.memberId.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch && searchQuery) return false;
      if (directoryFilter === "DIRECT") return item.position <= 5;
      if (directoryFilter === "SPILLOVER") return item.position > 5;
      return true;
    });
  }, [downlineList, searchQuery, directoryFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/30 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Loading 5×7 Organogram</h3>
            <p className="text-xs text-gray-500 mt-1">Retrieving matrix nodes, BFS spillover legs, and qualifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-3 sm:p-6 lg:p-8 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── HEADER BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/30">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <GitBranch className="w-3.5 h-3.5" /> 5×7 Forced Matrix Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Award className="w-3.5 h-3.5" /> 40% Commission Waterfall
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                5×7 Matrix Organogram &amp; Referrals
              </h1>
              <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                Visual geometric tree with BFS automated spillover. Buy at least 1 farm slot (₦5,000) to enter the tree.
                Fill 5 direct legs and maintain ₦5,000 rolling 30-day PQV to unlock matrix commissions across 7 levels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={handleCopyReferralLink}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Link Copied!" : "Copy Affiliate Link"}
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> WhatsApp Invite
              </Button>
              <Button
                variant="outline"
                onClick={handleResetToSelf}
                className="border-emerald-700/60 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 text-xs px-3 py-2.5 rounded-xl transition-all"
              >
                My Tree
              </Button>
              <Button
                variant="outline"
                onClick={handleJumpToApex}
                className="border-amber-600/40 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40 text-xs px-3 py-2.5 rounded-xl transition-all"
              >
                Apex Root (Esther)
              </Button>
            </div>
          </div>
        </div>

        {/* ── DUAL-WALLET & QUALIFICATION HUD ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Direct Referral Wallet */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-blue-600" /> Direct Referral Wallet
                </span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  ₦{directReferralEarnings.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <Badge
                className={
                  isDirectWithdrawable
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : canSubscribeWithWallet
                    ? "bg-purple-100 text-purple-800 border-purple-300 font-bold"
                    : !isProjectSubscribed
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }
              >
                {isDirectWithdrawable
                  ? "Withdrawable Now"
                  : canSubscribeWithWallet
                  ? "₦10k Ready to Activate"
                  : !isProjectSubscribed
                  ? "Project Subscription Required"
                  : "Below ₦2,000 Min"}
              </Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Withdrawal Status:</span>
                <span className="font-semibold text-gray-900">
                  {isProjectSubscribed ? "Active Project Member" : "Registered Member"}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {isDirectWithdrawable
                  ? "✓ Unrestricted. Direct earnings can be withdrawn immediately without 5-direct or PQV requirements."
                  : canSubscribeWithWallet
                  ? "🎉 You have reached ₦10,000 in referral earnings! Visit Wallet & Ledger to activate your project subscription using your wallet balance and unlock bank withdrawals."
                  : !isProjectSubscribed
                  ? "Your referral earnings accumulate safely in your wallet. Bank withdrawals unlock once you pay for a project, or once your wallet credit reaches ₦10,000 to subscribe directly using your balance."
                  : `₦${directRemaining.toLocaleString("en-NG")} more required to reach minimum withdrawal threshold.`}
              </p>
              {!isProjectSubscribed && (
                <div className="pt-2">
                  <Link
                    to={canSubscribeWithWallet ? "/dashboard/transactions" : "/subscribe"}
                    className="inline-flex items-center text-xs font-semibold text-emerald-800 hover:text-emerald-900 gap-1"
                  >
                    {canSubscribeWithWallet ? "Activate in Wallet & Ledger →" : "Subscribe to Project (₦2,000) →"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 2. 5x7 Matrix Spillover Wallet */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-600" /> 5×7 Matrix Spillover Wallet
                </span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  ₦{matrixSpilloverEarnings.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <Badge
                className={
                  isMatrixQualified
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                    : "bg-purple-100 text-purple-800 border-purple-300 font-medium"
                }
              >
                {isMatrixQualified ? "Qualified to Withdraw" : "Locked (Accumulating)"}
              </Badge>
            </div>

            {/* Progress Bars */}
            <div className="mt-3 space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-1">
                  <span>Requirement 1: 5 Direct Referrals</span>
                  <span className={hasEnoughReferrals ? "text-emerald-700 font-bold" : "text-amber-700"}>
                    {directReferralsCount} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${hasEnoughReferrals ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (directReferralsCount / 5) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-gray-700 mb-1">
                  <span>Requirement 2: ₦5,000 30-Day PQV</span>
                  <span className={hasEnoughPqv ? "text-emerald-700 font-bold" : "text-amber-700"}>
                    ₦{activePqv30d.toLocaleString()} / ₦5,000
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${hasEnoughPqv ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (activePqv30d / 5000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" /> Rolling 30d Window:
              </span>
              <span className="font-semibold text-gray-800">{pqvDaysRemaining} days remaining</span>
            </div>
          </div>

          {/* 3. Slot Entry & Member Overview */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-5 shadow-sm border border-emerald-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Matrix Entry Status
                </span>
                <Badge className="bg-emerald-600 text-white">
                  {userSlotsHeld > 0 ? "Active Slot Holder" : "Slot Required"}
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-950">
                  <span>Farm Slots Held:</span>
                  <span className="font-bold text-base text-emerald-900">{userSlotsHeld} Slot(s)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-950">
                  <span>AGC Member ID:</span>
                  <span className="font-mono font-bold text-xs text-emerald-800">
                    {formatAgcId(currentUserProfile?.member_id)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-950">
                  <span>Affiliate Code:</span>
                  <span className="font-mono font-bold text-xs text-emerald-800">
                    {referralCode || "PENDING"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-[11px] text-emerald-800/90 leading-relaxed">
              💡 <em>Purchasing at least 1 farm slot (₦5,000) unlocks your 5×7 matrix tree position for spillover.</em>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS & SEARCH BAR ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-xl self-start">
            <button
              onClick={() => setActiveTab("organogram")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "organogram"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Visual Organogram
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "directory"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Downline Directory ({downlineList.length})
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "rules"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" /> 40% Waterfall &amp; Calculator
            </button>
          </div>

          {/* Quick Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, or AGC ID..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 border-gray-200 h-9"
              />
            </div>
            <Button
              type="submit"
              disabled={refreshing}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-9 px-3.5 rounded-xl shrink-0"
            >
              {refreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Inspect"}
            </Button>
          </form>
        </div>

        {searchStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-xl flex items-center justify-between">
            <span>{searchStatus}</span>
            <button
              onClick={() => {
                setSearchStatus("");
                setSearchQuery("");
                handleResetToSelf();
              }}
              className="font-bold underline text-emerald-900 ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* ── TAB 1: VISUAL 5x7 ORGANOGRAM ── */}
        {activeTab === "organogram" && activeRootNode && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-8">
            {/* Breadcrumb Trail */}
            <div className="flex items-center flex-wrap gap-1 text-xs text-gray-500 pb-4 border-b border-gray-100">
              <span className="font-semibold text-gray-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Navigation Trail:
              </span>
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                  <button
                    onClick={() => buildSubtree(b.id, b.id === currentUserId)}
                    className={`hover:underline font-semibold ${
                      idx === breadcrumbs.length - 1 ? "text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md" : "text-gray-600"
                    }`}
                  >
                    {b.name} ({b.memberId})
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Tree Canvas */}
            <div className="flex flex-col items-center">
              {/* 1. ROOT NODE CARD */}
              <div className="relative group flex flex-col items-center">
                <div className="w-72 sm:w-80 bg-gradient-to-b from-white to-emerald-50/40 rounded-2xl p-4 sm:p-5 border-2 border-emerald-600 shadow-md flex flex-col items-center text-center relative z-20">
                  <div className="absolute -top-3 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                    {activeRootNode.id === currentUserId ? "Your Root Position" : "Active Tree Pivot"}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-black text-lg flex items-center justify-center mt-1 shadow-inner">
                    {activeRootNode.fullName.charAt(0).toUpperCase()}
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-base mt-2 line-clamp-1">
                    {activeRootNode.fullName}
                  </h3>
                  <p className="font-mono text-xs text-emerald-800 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md mt-1">
                    {activeRootNode.memberId}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activeRootNode.email}</p>

                  <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-emerald-100 text-xs">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Slots Held</span>
                      <span className="font-bold text-gray-800">{activeRootNode.slotsHeld} Slots</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Direct Legs</span>
                      <span className="font-bold text-emerald-700">{activeRootNode.children.length} / 5</span>
                    </div>
                  </div>
                </div>

                {/* SVG Branch Connector */}
                <div className="w-full flex justify-center mt-2">
                  <div className="w-0.5 h-8 bg-emerald-400" />
                </div>
              </div>

              {/* Connecting Horizontal Line across 5 children */}
              <div className="w-full max-w-5xl px-8 hidden sm:block">
                <div className="w-full h-0.5 bg-emerald-300 relative">
                  <div className="absolute left-1/2 -top-1 w-2 h-2 rounded-full bg-emerald-600 -translate-x-1/2" />
                </div>
              </div>

              {/* 2. THE 5 MATRIX CHILDREN LEGS (1 to 5) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-6xl mt-2 sm:mt-0">
                {[1, 2, 3, 4, 5].map((legPosition) => {
                  const childNode = activeRootNode.children.find((c) => c.position === legPosition);

                  if (childNode) {
                    return (
                      <motion.div
                        key={childNode.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                      >
                        {/* Vertical connection pip */}
                        <div className="w-0.5 h-4 bg-emerald-300 hidden sm:block" />

                        <div className="w-full bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between text-center relative group">
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 mb-2">
                            <span className="bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              Leg #{legPosition}
                            </span>
                            <span className="text-gray-400 font-normal">Level 1</span>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold mx-auto flex items-center justify-center text-sm shadow-inner">
                            {childNode.fullName.charAt(0).toUpperCase()}
                          </div>

                          <div className="mt-2">
                            <h4 className="font-bold text-gray-900 text-xs line-clamp-1">
                              {childNode.fullName}
                            </h4>
                            <p className="font-mono text-[11px] text-emerald-700 font-semibold mt-0.5">
                              {childNode.memberId}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Slots:</span>
                              <span className="font-bold text-gray-800">{childNode.slotsHeld}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Direct:</span>
                              <span className="font-bold text-emerald-700">{childNode.directReferralsCount}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => buildSubtree(childNode.id, false)}
                            className="mt-3 w-full text-[11px] h-7 border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-1 font-semibold"
                          >
                            Drill Down <CornerDownRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  }

                  // Empty Slot (Open for spillover / new direct referral)
                  return (
                    <div key={`empty-${legPosition}`} className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-gray-200 hidden sm:block" />

                      <div className="w-full bg-slate-50/70 rounded-2xl p-4 border-2 border-dashed border-gray-200 flex flex-col justify-between items-center text-center min-h-[220px]">
                        <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Leg #{legPosition} (Open)
                        </div>

                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-300 flex items-center justify-center my-2">
                          <Users className="w-4 h-4 text-gray-400" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600">Available Spillover Slot</p>
                          <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                            Ready to be filled by your next referral or upline spillover.
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          onClick={handleCopyReferralLink}
                          className="mt-2 text-[11px] h-7 text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold w-full"
                        >
                          + Invite to Fill Leg
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spillover Explanation Footer */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 text-xs text-gray-600 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block font-semibold">How Automated BFS Spillover Works:</strong>
                Each node accommodates exactly 5 direct children on Level 1. Any subsequent 6th, 7th, or 8th member referred
                by you automatically spills over into your downline branches, filling shallowest positions from left to right (Leg 1 through Leg 5).
                <strong> You still receive 100% of the ₦1,000 direct sponsor bonus</strong> regardless of where the member lands in the 5×7 tree!
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DOWNLINE DIRECTORY ── */}
        {activeTab === "directory" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Downline Members Directory</h3>
                <p className="text-xs text-gray-500">
                  Comprehensive roster of all members in your downline structure with contact actions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={directoryFilter === "ALL" ? "default" : "outline"}
                  onClick={() => setDirectoryFilter("ALL")}
                  className={`text-xs h-8 rounded-lg ${directoryFilter === "ALL" ? "bg-emerald-800" : ""}`}
                >
                  All ({downlineList.length})
                </Button>
                <Button
                  variant={directoryFilter === "DIRECT" ? "default" : "outline"}
                  onClick={() => setDirectoryFilter("DIRECT")}
                  className={`text-xs h-8 rounded-lg ${directoryFilter === "DIRECT" ? "bg-emerald-800" : ""}`}
                >
                  Direct Legs ({Math.min(5, downlineList.length)})
                </Button>
                <Button
                  variant={directoryFilter === "SPILLOVER" ? "default" : "outline"}
                  onClick={() => setDirectoryFilter("SPILLOVER")}
                  className={`text-xs h-8 rounded-lg ${directoryFilter === "SPILLOVER" ? "bg-emerald-800" : ""}`}
                >
                  Extended ({Math.max(0, downlineList.length - 5)})
                </Button>
              </div>
            </div>

            {filteredDirectory.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No downline members found.</p>
                <p className="text-xs text-gray-400 mt-1">Share your referral link to recruit your first 5 partners!</p>
                <Button onClick={handleCopyReferralLink} className="mt-4 bg-emerald-800 text-white text-xs">
                  Copy Referral Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">AGC Member ID</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Slots Held</th>
                      <th className="py-3 px-4">Position</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDirectory.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3 px-4 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">{m.fullName}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                          {m.memberId}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div>{m.email}</div>
                          {m.phone && <div className="text-[11px] text-gray-400">{m.phone}</div>}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-800">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            {m.slotsHeld} Slots
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-700">Leg #{m.position}</span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {m.phone && (
                            <button
                              onClick={() => window.open(`https://wa.me/${m.phone?.replace(/[^0-9]/g, "")}`, "_blank")}
                              className="text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md text-[11px]"
                            >
                              WhatsApp
                            </button>
                          )}
                          <button
                            onClick={() => buildSubtree(m.id, false)}
                            className="text-blue-700 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md text-[11px]"
                          >
                            Inspect Tree
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: 40% WATERFALL & CALCULATOR ── */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            {/* Waterfall Table Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Sustainable MLM Math
                  </span>
                  <span className="text-xs text-gray-400">• PRD §9 &amp; SRS §6 Authoritative Reference</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mt-2">
                  7-Level Matrix Commission Schedule (40% Maximum Payout Cap)
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-3xl leading-relaxed">
                  Every ₦5,000 farm slot purchase distributes exactly <strong>₦2,000 (40%)</strong> in multilevel matrix
                  commissions up 7 levels to qualified uplines. The remaining ₦3,000 is safely allocated to production capex (₦3,500)
                  and company farm management.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Level Depth</th>
                      <th className="py-3 px-4">Commission %</th>
                      <th className="py-3 px-4">Payout Per ₦5k Slot</th>
                      <th className="py-3 px-4">Max Capacity ($5^L$)</th>
                      <th className="py-3 px-4 rounded-r-xl">Potential Earnings (1 Slot/Member)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {MATRIX_COMMISSIONS.map((tier) => (
                      <tr key={tier.level} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">Level {tier.level}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-800">{tier.percentage}%</td>
                        <td className="py-3 px-4 font-bold text-gray-900">₦{tier.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">{tier.maxMembers.toLocaleString()} members</td>
                        <td className="py-3 px-4 font-black text-emerald-700">
                          ₦{tier.potential.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/80 font-black text-emerald-950">
                      <td className="py-3 px-4">TOTALS (7 Levels)</td>
                      <td className="py-3 px-4">40.0%</td>
                      <td className="py-3 px-4">₦2,000.00</td>
                      <td className="py-3 px-4">97,655 members</td>
                      <td className="py-3 px-4 text-emerald-900">₦15,830,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Calculator */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Earnings Simulation Engine
                  </span>
                  <h4 className="text-xl font-black">Interactive Matrix Income Forecaster</h4>
                  <p className="text-xs text-emerald-100/80 max-w-xl leading-relaxed">
                    Estimate your cumulative multilevel harvest dividends when your 5 legs duplicate downline slots.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10">
                  <label className="text-xs font-semibold">Average Slots per Member:</label>
                  <select
                    value={calcSlotsPerMember}
                    onChange={(e) => setCalcSlotsPerMember(Number(e.target.value))}
                    className="bg-emerald-950 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40"
                  >
                    {[1, 2, 3, 4, 5, 10, 20].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Slot" : "Slots"} (₦{(num * 5000).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 block">Level 1 (5 Members)</span>
                  <span className="text-lg font-black text-white">
                    ₦{(2500 * calcSlotsPerMember).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 block">Level 2 (25 Members)</span>
                  <span className="text-lg font-black text-white">
                    ₦{(8750 * calcSlotsPerMember).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 block">Level 3 (125 Members)</span>
                  <span className="text-lg font-black text-white">
                    ₦{(37500 * calcSlotsPerMember).toLocaleString()}
                  </span>
                </div>
                <div className="bg-emerald-500/20 p-3.5 rounded-xl border border-emerald-400/40">
                  <span className="text-[10px] text-amber-300 font-bold block">Levels 1–3 Cumulative</span>
                  <span className="text-lg font-black text-amber-300">
                    ₦{((2500 + 8750 + 37500) * calcSlotsPerMember).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompoundReferrals;
