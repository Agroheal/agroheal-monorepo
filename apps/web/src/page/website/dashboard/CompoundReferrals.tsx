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
import { apiClient } from "@/lib/apiClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RegulatoryNotice from "@/components/webComponents/RegulatoryNotice";
import { SITE_URL } from "@/config/Index";

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
  isSpillover?: boolean;
  sponsorName?: string;
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
  { level: 1, percentage: 5.0, amount: 250, maxMembers: 5, potential: 1250, requiredDirects: 5 },
  { level: 2, percentage: 3.5, amount: 175, maxMembers: 25, potential: 4375, requiredDirects: 10 },
  { level: 3, percentage: 3.0, amount: 150, maxMembers: 125, potential: 18750, requiredDirects: 15 },
  { level: 4, percentage: 2.5, amount: 125, maxMembers: 625, potential: 78125, requiredDirects: 20 },
  { level: 5, percentage: 2.5, amount: 125, maxMembers: 3125, potential: 390625, requiredDirects: 25 },
  { level: 6, percentage: 2.5, amount: 125, maxMembers: 15625, potential: 1953125, requiredDirects: 30 },
  { level: 7, percentage: 2.5, amount: 125, maxMembers: 78125, potential: 9765625, requiredDirects: 35 },
];

export const getUnlockedMatrixLevel = (directCount: number): number => {
  return Math.min(7, Math.floor(directCount / 5));
};

export const getNextMatrixLevelTarget = (directCount: number) => {
  const currentLevel = Math.min(7, Math.floor(directCount / 5));
  if (currentLevel >= 7) {
    return { nextLevel: 7, requiredDirects: 35, remainingDirects: 0, progressPercent: 100, isMax: true };
  }
  const nextLevel = currentLevel + 1;
  const requiredDirects = nextLevel * 5;
  const remainingDirects = Math.max(0, requiredDirects - directCount);
  const tierProgress = directCount - currentLevel * 5;
  const progressPercent = Math.min(100, Math.round((tierProgress / 5) * 100));
  return { nextLevel, requiredDirects, remainingDirects, progressPercent, isMax: false };
};

const CompoundReferrals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Authenticated Member State
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>("");

  // Qualification State
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

  const [copiedLink, setCopiedLink] = useState(false);
  const [isProjectSubscribed, setIsProjectSubscribed] = useState<boolean>(false);
  const [userFarms, setUserFarms] = useState<Array<{ id: string; name: string; project_category?: string }>>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("all");

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

      // 1. Attempt to fetch qualifications & schedule from Express API v1 (/api/v1/genealogy/qualifications)
      let apiQuals: any = null;
      try {
        apiQuals = await apiClient.genealogy.getQualifications();
        if (apiQuals?.matrixSpilloverWallet) {
          if (apiQuals.matrixSpilloverWallet.directReferralsCount !== undefined) {
            setDirectReferralsCount(Number(apiQuals.matrixSpilloverWallet.directReferralsCount));
          }
          if (apiQuals.matrixSpilloverWallet.activePqv30d !== undefined) {
            setActivePqv30d(Number(apiQuals.matrixSpilloverWallet.activePqv30d));
          }
          if (apiQuals.matrixSpilloverWallet.daysRemaining !== undefined) {
            setPqvDaysRemaining(Number(apiQuals.matrixSpilloverWallet.daysRemaining));
          }
        }
        if (apiQuals?.directReferralWallet?.currentBalance !== undefined) {
          setDirectReferralEarnings(Number(apiQuals.directReferralWallet.currentBalance));
        }
      } catch (apiErr: any) {
        console.info("[CompoundReferrals] Express Genealogy API unavailable, relying on database records:", apiErr.message);
      }

      // 2. Fetch Profile from Database
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authId)
        .maybeSingle();

      if (profile) {
        setCurrentUserProfile(profile);
        setReferralCode(profile.referral_code || profile.member_id || "");
        if (apiQuals?.directReferralWallet?.currentBalance === undefined) {
          setDirectReferralEarnings(Number(profile.referral_earnings || 0));
        }
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

      // 5. Fetch user-associated farms for referral link targeting
      try {
        const { data: coordFarms } = await supabase
          .from("farm_groups")
          .select("id, name, project_category")
          .eq("coordinator_id", authId);

        const memberEmail = user.email || profile?.email;
        let memberFarms: any[] = [];
        if (memberEmail) {
          const { data: mRecords } = await supabase
            .from("farm_records")
            .select("farm_id, farm_groups!inner(id, name, project_category)")
            .eq("email", memberEmail);
          memberFarms = (mRecords || []).map((r: any) => r.farm_groups).filter(Boolean);
        }

        const { data: publicFarms } = await supabase
          .from("farm_groups")
          .select("id, name, project_category")
          .limit(10);

        const allFarms = [...(coordFarms || []), ...memberFarms, ...(publicFarms || [])];
        const uniqueFarms = Array.from(new Map(allFarms.map((f: any) => [f.id, f])).values());
        setUserFarms(uniqueFarms as Array<{ id: string; name: string; project_category?: string }>);
      } catch (fErr) {
        console.info("[CompoundReferrals] Farm groups fetch fallback", fErr);
      }

      // 6. Build Organogram Subtree for target root
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
  /**
   * Builds an Organogram tree node and up to 5 child slots,
   * integrating direct referrals and balanced round-robin upline spillover.
   */
  const buildSubtree = async (targetId: string, isSelf: boolean) => {
    setActiveRootId(targetId);

    // 1. Fetch target node profile
    const { data: rootProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, member_id, referred_by, total_referrals, created_at")
      .eq("id", targetId)
      .maybeSingle();

    if (!rootProfile) {
      toast.error("Target member profile not found.");
      return;
    }

    // 2. Target slots
    const { data: rootSlots } = await supabase
      .from("slot_subscriptions")
      .select("slots")
      .eq("user_id", targetId);
    const slotsCount = (rootSlots || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);

    // 3. Fetch direct referrals (downline)
    const { data: childrenProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, member_id, created_at, referred_by, total_referrals")
      .eq("referred_by", targetId)
      .order("created_at", { ascending: true })
      .limit(100);

    const childrenNodes: OrganogramNode[] = [];
    const allRoster: OrganogramNode[] = [];

    if (childrenProfiles && childrenProfiles.length > 0) {
      for (let i = 0; i < childrenProfiles.length; i++) {
        const cp = childrenProfiles[i];
        const { data: cSlots } = await supabase
          .from("slot_subscriptions")
          .select("slots")
          .eq("user_id", cp.id);
        const cSlotCount = (cSlots || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);

        const { count: grandChildrenCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("referred_by", cp.id);

        // In the 5x7 matrix, ONLY members who hold at least 1 farm slot occupy matrix positions (Leg 1-5)!
        // Members who only paid ₦2,000 Green Card remain direct enrollees (Leg 0) until they subscribe to a slot.
        let assignedLeg = 0;
        if (cSlotCount > 0 && childrenNodes.length < 5) {
          assignedLeg = childrenNodes.length + 1;
        }

        const memberItem: OrganogramNode = {
          id: cp.id,
          fullName: cp.full_name || "Downline Partner",
          email: cp.email || "",
          phone: cp.phone || null,
          memberId: formatAgcId(cp.member_id),
          parentId: targetId,
          position: assignedLeg,
          level: 1,
          slotsHeld: cSlotCount,
          directReferralsCount: grandChildrenCount || 0,
          createdAt: cp.created_at,
          hasGreenCard: Boolean(cp.member_id),
          isSpillover: false,
          children: [],
        };

        // All direct referrals are preserved in the directory roster
        allRoster.push(memberItem);

        if (assignedLeg > 0) {
          childrenNodes.push(memberItem);
        }
      }
    }

    // 4. Balanced Round-Robin Spillover from Upline:
    // If target has fewer than 5 active legs and has an upline sponsor, check if the upline
    // has overflow beyond their 5 frontline slots (Index >= 5).
    // The overflow is evenly distributed to frontline children via (index - 5) % 5.
    if (childrenNodes.length < 5 && rootProfile.referred_by) {
      try {
        const uplineId = rootProfile.referred_by;
        const { data: uplineProfile } = await supabase
          .from("profiles")
          .select("id, full_name, member_id")
          .eq("id", uplineId)
          .maybeSingle();

        const { data: uplineChildren } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, member_id, created_at")
          .eq("referred_by", uplineId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (uplineChildren && uplineChildren.length > 5) {
          // Identify frontline slot holders of the upline
          const uplineSlotChildren: any[] = [];
          for (const uc of uplineChildren) {
            const { data: ucSlots } = await supabase
              .from("slot_subscriptions")
              .select("slots")
              .eq("user_id", uc.id);
            const ucSlotsCount = (ucSlots || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);
            if (ucSlotsCount > 0) {
              uplineSlotChildren.push({ ...uc, slotsHeld: ucSlotsCount });
            }
          }

          // Determine target's leg position under upline (0 to 4)
          const myLegIndex = uplineSlotChildren.findIndex((u) => u.id === targetId);
          if (myLegIndex >= 0 && myLegIndex < 5) {
            // Any upline slot child at index >= 5 with (i - 5) % 5 === myLegIndex spills into this node
            for (let i = 5; i < uplineSlotChildren.length; i++) {
              if ((i - 5) % 5 === myLegIndex && childrenNodes.length < 5) {
                const spillCandidate = uplineSlotChildren[i];
                if (!allRoster.some((m) => m.id === spillCandidate.id)) {
                  const { count: spillGrandChildren } = await supabase
                    .from("profiles")
                    .select("id", { count: "exact", head: true })
                    .eq("referred_by", spillCandidate.id);

                  const spillNode: OrganogramNode = {
                    id: spillCandidate.id,
                    fullName: spillCandidate.full_name || "Spillover Partner",
                    email: spillCandidate.email || "",
                    phone: spillCandidate.phone || null,
                    memberId: formatAgcId(spillCandidate.member_id),
                    parentId: targetId,
                    position: childrenNodes.length + 1,
                    level: 1,
                    slotsHeld: spillCandidate.slotsHeld,
                    directReferralsCount: spillGrandChildren || 0,
                    createdAt: spillCandidate.created_at,
                    hasGreenCard: Boolean(spillCandidate.member_id),
                    isSpillover: true,
                    sponsorName: uplineProfile?.full_name || "Upline Sponsor",
                    children: [],
                  };

                  childrenNodes.push(spillNode);
                  allRoster.push(spillNode);
                }
              }
            }
          }
        }
      } catch (spillErr) {
        console.warn("Spillover evaluation fallback", spillErr);
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
      isSpillover: false,
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

  // Active Referral Link & Multi-Farm Resolution
  const activeReferralCode = referralCode || currentUserProfile?.referral_code || currentUserProfile?.member_id || currentUserId;

  const activeReferralLink = useMemo(() => {
    if (selectedFarmId && selectedFarmId !== "all") {
      const targetFarm = userFarms.find((f) => f.id === selectedFarmId);
      const farmSlug = targetFarm?.name
        ? encodeURIComponent(targetFarm.name.toLowerCase().replace(/\s+/g, "-"))
        : selectedFarmId;
      return `${SITE_URL}/signup?ref=${activeReferralCode}&farm=${farmSlug}`;
    }
    return `${SITE_URL}/signup?ref=${activeReferralCode}`;
  }, [selectedFarmId, userFarms, activeReferralCode]);

  // Copy Referral Link
  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(activeReferralLink);
      setCopiedLink(true);
      toast.success("Affiliate link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const selectedFarm = userFarms.find((f) => f.id === selectedFarmId);
    const farmNote = selectedFarm ? ` to participate in ${selectedFarm.name}` : "";
    const text = `Join me on AgroHeal${farmNote}! Secure your Digital Green Card, activate your 5×7 Producer-Consumer network, and build sustainable agro-wealth. Sign up here: ${activeReferralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Qualification Calculations
  const unlockedLevel = getUnlockedMatrixLevel(directReferralsCount);
  const nextLevelTarget = getNextMatrixLevelTarget(directReferralsCount);
  const hasEnoughReferrals = unlockedLevel >= 1;
  const hasEnoughPqv = activePqv30d >= MIN_PQV_FOR_MATRIX_WITHDRAWAL;

  // Filtered Downline Directory
  const filteredDirectory = useMemo(() => {
    return (downlineList || []).filter((item) => {
      if (!item) return false;
      const q = (searchQuery || "").trim().toLowerCase();
      const matchSearch =
        (item.fullName || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q) ||
        (item.memberId || "").toLowerCase().includes(q);

      if (!matchSearch && q) return false;
      if (directoryFilter === "DIRECT") return !item.isSpillover;
      if (directoryFilter === "SPILLOVER") return Boolean(item.isSpillover);
      return true;
    });
  }, [downlineList, searchQuery, directoryFilter]);

  if (loading) {
    return (
      <LoadingSpinner message="Loading 5×7 Organogram matrix & qualifications..." />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 pb-16 font-sans">
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

        {/* ── POTENTIAL LOCKED COMMISSION BANNER ── */}
        <div className="bg-gradient-to-r from-amber-950 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-amber-200">
                  Potential ₦12,212,500 in Community Commissions Waiting to be Unlocked
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  7 Matrix Tiers
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5 max-w-3xl leading-relaxed">
                You have up to 7 matrix tiers waiting to be unlocked. Refer 5 active members per tier and maintain ₦5,000 rolling 30-day PQV to unlock full matrix depth withdrawal. See Wallet page for details.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
          >
            <Link to="/dashboard/transactions">View Wallet &amp; Ledger</Link>
          </Button>
        </div>

        {/* ── MULTI-FARM REFERRAL CODE & AFFILIATE SHARING TOOL ── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Share2 className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-gray-900">
                  Affiliate Referral Link &amp; Farm Specific Codes
                </h2>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                  5×7 Linked
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share your personal affiliate link to enrol members into your 5×7 organogram matrix. If you manage or participate in multiple farms, select a specific farm below to generate an auto-assigned invite link.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Your Sponsor / MLM Code</span>
                <span className="font-mono text-sm font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {referralCode || currentUserProfile?.referral_code || currentUserProfile?.member_id || "AGC-PENDING"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Farm Selector Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Assign to Specific Farm (Optional)
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="all">General Platform Enrolment (No Specific Farm)</option>
                {userFarms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} {farm.project_category ? `(${farm.project_category})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Link Preview & Copy */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Generated Invite Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeReferralLink}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-700 select-all"
                />
                <Button
                  onClick={handleCopyReferralLink}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5×7 VISUAL ORGANOGRAM ── */}
        {activeRootNode ? (
          activeRootNode.id === currentUserId && userSlotsHeld === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-emerald-800/15 text-center space-y-6 max-w-2xl mx-auto my-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 text-amber-700" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Farm Slot Subscription Required
                </span>
                <h3 className="text-2xl font-black text-gray-900">
                  5×7 Farm Matrix is Locked
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
                  Your <strong>₦2,000 Green Card</strong> entitles you to lifetime educational curriculum access and <strong>₦1,000 direct referral rewards</strong>.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-lg mx-auto">
                  However, the <strong>5×7 Matrix</strong> is an operational farm cluster structure reserved for members who subscribe to an active farm slot. Once you subscribe for a Farm Slot (₦5,000), you will be assigned a placement node under your Group Farm cluster, unlocking the 5×7 organogram tree, community spillover, and 7-level harvest distributions.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/dashboard/checkout"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all"
                >
                  <Sprout className="w-4 h-4" />
                  Secure a Farm Slot (₦5,000)
                </Link>
                <button
                  type="button"
                  onClick={() => document.getElementById("downline-directory")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  View Direct Referrals ({directReferralsCount})
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-8">
              {/* Header with Title and Quick Tree Inspector Form */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                      <GitBranch className="w-4 h-4" />
                    </span>
                    <h2 className="text-base font-bold text-gray-900">
                      Visual 5×7 Organogram Tree
                    </h2>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                      5 Legs · Level 1 Active
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Interactive geometric tree with automated spillover placement. Click any child to drill down.
                  </p>
                </div>

                {/* Quick Tree Search & Inspect Form */}
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-72">
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
                  {activeRootNode.id !== currentUserId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetToSelf}
                      className="text-xs h-9 border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-xl shrink-0"
                    >
                      Reset to My Tree
                    </Button>
                  )}
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

              {/* Breadcrumb Trail */}
              <div className="flex items-center flex-wrap gap-1 text-xs text-gray-500 pb-2 border-b border-gray-100">
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

              {/* Qualification Status & Pivot Notice */}
              {activeRootNode.id !== currentUserId && (
                <div className="bg-blue-50/80 border border-blue-200 text-blue-900 text-xs px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Inspecting downline sub-tree for <strong>{activeRootNode.fullName}</strong> ({activeRootNode.memberId}).
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetToSelf}
                    className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100/60 rounded-lg"
                  >
                    Return to My Tree
                  </Button>
                </div>
              )}

              {unlockedLevel >= 1 ? (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950 text-sm">
                        Matrix Depth: Level {unlockedLevel} of 7 Unlocked
                      </span>
                      <Badge className="bg-emerald-200 text-emerald-900 border-emerald-300 text-[10px]">
                        ✓ {directReferralsCount} Direct Partners Sponsored
                      </Badge>
                    </div>
                    <p className="text-emerald-800/90 leading-relaxed">
                      You qualify to earn matrix harvest dividends through <strong>Level {unlockedLevel}</strong>.
                      {unlockedLevel < 7 ? (
                        <> Sponsor <strong>{nextLevelTarget.remainingDirects} more direct partner(s)</strong> (total {nextLevelTarget.requiredDirects}) to unlock Level {nextLevelTarget.nextLevel} dividends. Deeper level commissions remain safely locked in escrow until unlocked.</>
                      ) : (
                        <> You have unlocked all 7 levels of matrix harvest dividends as an Apex Producer!</>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950 text-sm">Matrix Depth Protection Gate: Level 0</span>
                      <Badge className="bg-amber-200/90 text-amber-900 border-amber-300 text-[10px]">
                        {directReferralsCount} of 5 Direct Recruits
                      </Badge>
                    </div>
                    <p className="text-amber-800/90 leading-relaxed">
                      Per cooperative matrix rules, each batch of <strong>5 direct recruits unlocks the next matrix level</strong>.
                      You have sponsored <strong>{directReferralsCount}/5</strong> direct partners needed for Level 1.
                      Deeper downline and spillover harvest payouts remain <strong>locked</strong> until you sponsor your first 5 direct partners ({5 - directReferralsCount} more needed). Personal <strong>₦1,000 direct referral bonuses are never locked</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Tree Canvas */}
              <div className="flex flex-col items-center">
                {/* 1. ROOT NODE CARD */}
                <div className="relative group flex flex-col items-center">
                  <div className="w-72 sm:w-80 bg-gradient-to-b from-white to-emerald-50/40 rounded-2xl p-4 sm:p-5 border-2 border-emerald-600 shadow-md flex flex-col items-center text-center relative z-20">
                    <div className="absolute -top-3 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                      {activeRootNode.id === currentUserId ? "Your Root Position" : "Active Tree Pivot"}
                    </div>

                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-black text-lg flex items-center justify-center mt-1 shadow-inner">
                      {(activeRootNode.fullName || "M").charAt(0).toUpperCase()}
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-base mt-2 line-clamp-1">
                      {activeRootNode.fullName || "AgroHeal Member"}
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
                        <span className="text-[10px] text-gray-500 block">Direct Recruits</span>
                        <span className="font-bold text-emerald-800">{activeRootNode.directReferralsCount} Partners</span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical connector from Root down */}
                  <div className="w-0.5 h-8 bg-emerald-600 relative z-10" />
                </div>

                {/* Horizontal distribution bar spanning all 5 child slots */}
                <div className="hidden lg:block w-[88%] max-w-5xl h-0.5 bg-emerald-600 -mt-0.5 relative z-10" />

                {/* 2. FIVE CHILD SLOTS (LEVEL 1 / FRONTLINE) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 w-full mt-4 lg:mt-0 relative z-20">
                  {[0, 1, 2, 3, 4].map((slotIndex) => {
                    const child = activeRootNode.children[slotIndex];
                    const legNumber = slotIndex + 1;

                    if (child) {
                      return (
                        <motion.div
                          key={child.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center"
                        >
                          {/* Vertical connection pip */}
                          <div className="w-0.5 h-4 bg-emerald-300 hidden sm:block" />

                          <div className="w-full bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between text-center relative group">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                              {child.isSpillover ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                  🌊 Spillover (Leg #{legNumber})
                                </span>
                              ) : (
                                <span className="bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full">
                                  ⭐ Leg #{legNumber}
                                </span>
                              )}
                              <span className="text-gray-400 font-normal">Level 1</span>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold mx-auto flex items-center justify-center text-sm shadow-inner">
                              {(child.fullName || "M").charAt(0).toUpperCase()}
                            </div>

                            <div className="mt-2">
                              <h4 className="font-bold text-gray-900 text-xs line-clamp-1">
                                {child.fullName}
                              </h4>
                              <p className="font-mono text-[11px] text-emerald-700 font-semibold mt-0.5">
                                {child.memberId}
                              </p>
                              {child.isSpillover && child.sponsorName && (
                                <p className="text-[10px] text-blue-600 font-medium mt-0.5 line-clamp-1">
                                  Sponsor: {child.sponsorName}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Slots:</span>
                                <span className="font-bold text-gray-800">{child.slotsHeld}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Direct:</span>
                                <span className="font-bold text-emerald-700">{child.directReferralsCount}</span>
                              </div>
                            </div>

                            <div className="mt-2 text-[10px] font-semibold">
                              {child.isSpillover ? (
                                hasEnoughReferrals ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    🔓 Comm. Active
                                  </span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    🔒 Comm. Locked (Need 5)
                                  </span>
                                )
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  ✓ Direct Partner
                                </span>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              onClick={() => buildSubtree(child.id, false)}
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
                      <div key={`empty-${legNumber}`} className="flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-gray-200 hidden sm:block" />

                        <div className="w-full bg-slate-50/70 rounded-2xl p-4 border-2 border-dashed border-gray-200 flex flex-col justify-between items-center text-center min-h-[220px]">
                          <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Leg #{legNumber} (Open)
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
        )) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200 text-center space-y-4 max-w-xl mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
              <GitBranch className="w-7 h-7 text-emerald-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Unable to load organogram root</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Could not locate your account node in the tree. Please click below to refresh your network connection.
            </p>
            <Button onClick={() => loadMemberGenealogy()} className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Reload Organogram
            </Button>
          </div>
        )}

        {/* ── DOWNLINE MEMBERS DIRECTORY ── */}
        <div id="downline-directory" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-gray-900">Downline Members Directory</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Comprehensive roster of all members in your downline structure with contact actions.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={directoryFilter === "ALL" ? "default" : "outline"}
                onClick={() => setDirectoryFilter("ALL")}
                className={`text-xs h-8 rounded-lg ${directoryFilter === "ALL" ? "bg-emerald-800 text-white" : ""}`}
              >
                All ({downlineList.length})
              </Button>
              <Button
                variant={directoryFilter === "DIRECT" ? "default" : "outline"}
                onClick={() => setDirectoryFilter("DIRECT")}
                className={`text-xs h-8 rounded-lg ${directoryFilter === "DIRECT" ? "bg-emerald-800 text-white" : ""}`}
              >
                Direct Personal ({downlineList.filter((d) => !d.isSpillover).length})
              </Button>
              <Button
                variant={directoryFilter === "SPILLOVER" ? "default" : "outline"}
                onClick={() => setDirectoryFilter("SPILLOVER")}
                className={`text-xs h-8 rounded-lg ${directoryFilter === "SPILLOVER" ? "bg-emerald-800 text-white" : ""}`}
              >
                Spillover ({downlineList.filter((d) => d.isSpillover).length})
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
                    <th className="py-3 px-4">Source / Sponsor</th>
                    <th className="py-3 px-4">Slots Held</th>
                    <th className="py-3 px-4">Tree Position</th>
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
                      <td className="py-3 px-4">
                        {m.isSpillover ? (
                          <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200/60 font-medium inline-flex items-center gap-1 text-[11px]">
                            🌊 Spillover ({m.sponsorName || "Upline"})
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-medium inline-flex items-center gap-1 text-[11px]">
                            ⭐ Direct Personal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {m.slotsHeld > 0 ? (
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-medium inline-flex items-center gap-1">
                            🟢 Active Farm Slot ({m.slotsHeld})
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200/60 font-medium inline-flex items-center gap-1">
                            🟡 ₦2k Member (No Farm Slot)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {m.position > 0 ? (
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md text-[11px] border border-emerald-100">
                            Leg #{m.position}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md text-[11px]">
                            Direct Enrollee
                          </span>
                        )}
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
                          onClick={() => {
                            buildSubtree(m.id, false);
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
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

        {/* Statutory Regulatory & Non-Investment Notice */}
        <RegulatoryNotice linkHref="/dashboard/legal#terms" className="mt-4" />
      </div>
    </div>
  );
};

export default CompoundReferrals;
