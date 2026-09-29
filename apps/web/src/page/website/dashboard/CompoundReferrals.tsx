import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  ArrowLeft,
  Calculator,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CornerDownRight,
  ArrowUpRight,
  Info,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import { formatAgcId } from "@/components/greencard/DigitalGreenCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import OrganogramSkeleton from "@/components/dashboard/OrganogramSkeleton";
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
export const MIN_PQV_FOR_MATRIX_WITHDRAWAL = 10000;
export const PQV_WINDOW_DAYS = 30;
export const MIN_DIRECT_REFERRAL_WITHDRAWAL = 2000;

export const MATRIX_COMMISSIONS_TIERS = [
  { level: 1, percentage: 5.0, amount: 250, maxMembers: 5, potential: 1250, requiredDirects: 0 },
  { level: 2, percentage: 3.5, amount: 175, maxMembers: 25, potential: 4375, requiredDirects: 1 },
  { level: 3, percentage: 3.0, amount: 150, maxMembers: 125, potential: 18750, requiredDirects: 2 },
  { level: 4, percentage: 2.5, amount: 125, maxMembers: 625, potential: 78125, requiredDirects: 3 },
  { level: 5, percentage: 2.5, amount: 125, maxMembers: 3125, potential: 390625, requiredDirects: 4 },
  { level: 6, percentage: 2.5, amount: 125, maxMembers: 15625, potential: 1953125, requiredDirects: 5 },
  { level: 7, percentage: 2.5, amount: 125, maxMembers: 78125, potential: 9765625, requiredDirects: 6 },
];

export const getUnlockedMatrixLevel = (directCount: number): number => {
  if (directCount <= 0) return 0;
  return Math.min(7, directCount + 1);
};

export const getNextMatrixLevelTarget = (directCount: number) => {
  const currentLevel = directCount <= 0 ? 0 : Math.min(7, directCount + 1);
  if (currentLevel >= 7) {
    return { nextLevel: 7, requiredDirects: 6, remainingDirects: 0, progressPercent: 100, isMax: true };
  }
  const nextLevel = currentLevel === 0 ? 2 : currentLevel + 1;
  const requiredDirects = nextLevel - 1;
  const remainingDirects = Math.max(0, requiredDirects - directCount);
  const progressPercent = Math.min(100, Math.round((directCount / requiredDirects) * 100));
  return { nextLevel, requiredDirects, remainingDirects, progressPercent, isMax: false };
};

// In-Memory Session Cache: Enables instantaneous (0ms) render when navigating between tabs
interface GenealogyCacheEntry {
  treeRoot: OrganogramNode;
  allMembersRoster: OrganogramNode[];
  userSlotsHeld: number;
  directReferralsCount: number;
  activePqv30d: number;
  pqvDaysRemaining: number;
  isProjectSubscribed: boolean;
  currentUserProfile: any;
  userFarms: Array<{ id: string; name: string; project_category?: string }>;
  timestamp: number;
}

const genealogyMemoryCache = new Map<string, GenealogyCacheEntry>();
const CACHE_TTL_MS = 60_000; // 1-minute TTL for instant navigation

const CompoundReferrals: React.FC = () => {
  const navigate = useNavigate();
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

  // 30-Hour Grace Period & Holding Tank State
  const [holdingTankMembers, setHoldingTankMembers] = useState<Array<{
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    member_id: string;
    created_at: string;
    holding_tank_expires_at: string;
    placement_status: string;
    remainingMinutes: number;
    formattedTimeRemaining: string;
    isExpired: boolean;
  }>>([]);
  const [selectedHoldingEnrollee, setSelectedHoldingEnrollee] = useState<any | null>(null);
  const [targetPlacementLeg, setTargetPlacementLeg] = useState<number>(1);
  const [isPlacingEnrollee, setIsPlacingEnrollee] = useState<boolean>(false);

  // Qualification Gates & Matrix Access Locks
  const isLegacyNeedsStarterPack = Boolean(
    currentUserProfile?.is_legacy && !currentUserProfile?.has_purchased_starter_pack
  );
  const isNonLegacyNeedsSlots = Boolean(
    !currentUserProfile?.is_legacy && userSlotsHeld === 0
  );
  const isMatrixLocked = isLegacyNeedsStarterPack || isNonLegacyNeedsSlots;

  const handlePlaceHoldingEnrollee = async () => {
    if (!selectedHoldingEnrollee) return;
    setIsPlacingEnrollee(true);
    try {
      await apiClient.genealogy.placeDownline({
        enrolleeId: selectedHoldingEnrollee.id,
        placementParentId: currentUserId,
        position: targetPlacementLeg,
      });
      toast.success(`${selectedHoldingEnrollee.full_name} placed into Leg #${targetPlacementLeg}!`);
      setSelectedHoldingEnrollee(null);
      loadMemberGenealogy(undefined, true);
    } catch (err: any) {
      toast.error(err.message || "Failed to place downline. Please verify leg availability.");
    } finally {
      setIsPlacingEnrollee(false);
    }
  };

  // Load member and initial tree
  useEffect(() => {
    loadMemberGenealogy();
  }, []);

  const loadMemberGenealogy = async (customRootUserId?: string, forceRefresh = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const authId = user.id;
      setCurrentUserId(authId);
      const rootToLoad = customRootUserId || authId;

      // Check In-Memory Cache first for instant 0ms render when switching tabs
      if (!forceRefresh && !customRootUserId) {
        const cached = genealogyMemoryCache.get(authId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setCurrentUserProfile(cached.currentUserProfile);
          setReferralCode(cached.currentUserProfile?.referral_code || cached.currentUserProfile?.member_id || "");
          setUserSlotsHeld(cached.userSlotsHeld);
          setDirectReferralsCount(cached.directReferralsCount);
          setActivePqv30d(cached.activePqv30d);
          setPqvDaysRemaining(cached.pqvDaysRemaining);
          setIsProjectSubscribed(cached.isProjectSubscribed);
          setUserFarms(cached.userFarms);
          setActiveRootNode(cached.treeRoot);
          setDownlineList(cached.allMembersRoster);
          setBreadcrumbs([{ id: cached.treeRoot.id, name: "My Organogram Tree", memberId: cached.treeRoot.memberId }]);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      if (!customRootUserId) setLoading(true);
      else setRefreshing(true);

      // Fast, non-blocking telemetry from Express API with 2.5s timeout (prevents hanging)
      try {
        const apiQuals = await apiClient.genealogy.getQualifications({ timeout: 2500 });
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
      } catch (apiErr: any) {
        console.info("[CompoundReferrals] Express Genealogy API fast fallback:", apiErr.message);
      }

      // Fetch holding tank members for sponsor
      try {
        const tank = await apiClient.genealogy.getHoldingTank({ timeout: 3500 });
        setHoldingTankMembers(tank || []);
      } catch (tankErr) {
        console.info("[CompoundReferrals] Holding tank note:", tankErr);
      }

      // Parallelize All Independent Root Database Queries (Single Network Round-Trip)
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - PQV_WINDOW_DAYS);

      const [
        profileRes,
        slotSubsRes,
        directRefsRes,
        paymentsRes,
        subDataRes,
        coDataRes,
        coordFarmsRes,
        publicFarmsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", authId).maybeSingle(),
        supabase.from("slot_subscriptions").select("slots, amount, status").eq("user_id", authId),
        supabase.from("profiles").select("id, full_name, email, phone, member_id, created_at, referred_by, total_referrals").eq("referred_by", authId),
        supabase.from("other_payments").select("amount, created_at").eq("user_id", authId),
        supabase.from("subscriptions").select("id").eq("user_id", authId).eq("status", "active").limit(1),
        supabase.from("transactions").select("id").eq("user_id", authId).eq("status", "paid").limit(1),
        supabase.from("farm_groups").select("id, name, project_category").eq("coordinator_id", authId),
        supabase.from("farm_groups").select("id, name, project_category").limit(10),
      ]);

      const profile = profileRes.data;
      if (profile) {
        setCurrentUserProfile(profile);
        setReferralCode(profile.referral_code || profile.member_id || "");
      }

      const totalSlots = (slotSubsRes.data || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);
      setUserSlotsHeld(totalSlots);

      const directCount = directRefsRes.data ? directRefsRes.data.length : 0;
      setDirectReferralsCount(directCount);

      // Compute 30-Day PQV
      let activePqv = 0;
      let latestPqvDate: Date | null = null;
      for (const p of paymentsRes.data || []) {
        const pDate = new Date(p.created_at);
        if (pDate >= thirtyDaysAgo && pDate <= now) {
          activePqv += Number(p.amount) || 0;
          if (!latestPqvDate || pDate > latestPqvDate) latestPqvDate = pDate;
        }
      }
      setActivePqv30d(activePqv);

      let daysRemaining = 30;
      if (latestPqvDate) {
        const expiry = new Date(latestPqvDate);
        expiry.setDate(expiry.getDate() + PQV_WINDOW_DAYS);
        daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        setPqvDaysRemaining(daysRemaining);
      }

      const isSubscribed = Boolean(
        (subDataRes.data && subDataRes.data.length > 0) ||
        (coDataRes.data && coDataRes.data.length > 0)
      );
      setIsProjectSubscribed(isSubscribed);

      // Fetch user-associated farms
      let memberFarms: any[] = [];
      const memberEmail = user.email || profile?.email;
      if (memberEmail) {
        try {
          const { data: mRecords } = await supabase
            .from("farm_records")
            .select("farm_id, farm_groups!inner(id, name, project_category)")
            .eq("email", memberEmail);
          memberFarms = (mRecords || []).map((r: any) => r.farm_groups).filter(Boolean);
        } catch {
          // ignore fallback
        }
      }

      const allFarms = [...(coordFarmsRes.data || []), ...memberFarms, ...(publicFarmsRes.data || [])];
      const uniqueFarms = Array.from(new Map(allFarms.map((f: any) => [f.id, f])).values()) as Array<{ id: string; name: string; project_category?: string }>;
      setUserFarms(uniqueFarms);

      // Build Subtree using High-Performance Batch Queries
      const subtreeResult = await buildSubtree(rootToLoad, authId === rootToLoad);

      // Write to In-Memory Cache if loading self root
      if (subtreeResult && rootToLoad === authId) {
        genealogyMemoryCache.set(authId, {
          treeRoot: subtreeResult.builtRoot,
          allMembersRoster: subtreeResult.allRoster,
          userSlotsHeld: totalSlots,
          directReferralsCount: directCount,
          activePqv30d: activePqv,
          pqvDaysRemaining: daysRemaining,
          isProjectSubscribed: isSubscribed,
          currentUserProfile: profile,
          userFarms: uniqueFarms,
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      console.error("Failed to load genealogy", err);
      toast.error(err.message || "Failed to load genealogy");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Builds an Organogram tree node and up to 5 child slots,
   * integrating direct referrals and balanced round-robin upline spillover.
   * Uses high-performance SQL batching (.in queries) to eliminate N+1 latency.
   */
  const buildSubtree = async (targetId: string, isSelf: boolean) => {
    setActiveRootId(targetId);

    // 1. Fetch target node profile, slots, and downline children in 1 parallel network round-trip!
    const [rootProfileRes, rootSlotsRes, childrenProfilesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, member_id, referred_by, total_referrals, created_at")
        .eq("id", targetId)
        .maybeSingle(),
      supabase
        .from("slot_subscriptions")
        .select("slots")
        .eq("user_id", targetId),
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, member_id, created_at, referred_by, total_referrals, placement_parent_id, matrix_position, placement_status")
        .or(`placement_parent_id.eq.${targetId},referred_by.eq.${targetId}`)
        .order("created_at", { ascending: true })
        .limit(100),
    ]);

    const rootProfile = rootProfileRes.data;
    if (!rootProfile) {
      toast.error("Target member profile not found.");
      return null;
    }

    const slotsCount = (rootSlotsRes.data || []).reduce((sum, s) => sum + (Number(s.slots) || 0), 0);
    const childrenProfiles = childrenProfilesRes.data || [];

    const childrenNodes: OrganogramNode[] = [];
    const allRoster: OrganogramNode[] = [];

    // 2. High-Performance BATCH Query for all children's slots and grandchildren counts!
    // Replaces 2*N sequential queries with 2 single batch queries.
    if (childrenProfiles.length > 0) {
      const childIds = childrenProfiles.map((cp) => cp.id);

      const [childSlotsRes, grandChildrenRes] = await Promise.all([
        supabase.from("slot_subscriptions").select("user_id, slots").in("user_id", childIds),
        supabase.from("profiles").select("referred_by").in("referred_by", childIds),
      ]);

      const slotsMap = new Map<string, number>();
      for (const row of childSlotsRes.data || []) {
        const cur = slotsMap.get(row.user_id) || 0;
        slotsMap.set(row.user_id, cur + (Number(row.slots) || 0));
      }

      const grandChildrenCountMap = new Map<string, number>();
      for (const row of grandChildrenRes.data || []) {
        if (row.referred_by) {
          const cur = grandChildrenCountMap.get(row.referred_by) || 0;
          grandChildrenCountMap.set(row.referred_by, cur + 1);
        }
      }

      // Map explicit matrix placements first (legs 1 to 5)
      const occupiedLegs = new Map<number, any>();
      const unplacedChildren: any[] = [];

      for (const cp of childrenProfiles) {
        if (cp.placement_parent_id === targetId && cp.matrix_position >= 1 && cp.matrix_position <= 5) {
          occupiedLegs.set(cp.matrix_position, cp);
        } else {
          unplacedChildren.push(cp);
        }
      }

      // For unplaced direct children, allocate any open legs 1..5 in order
      let nextAvailableLeg = 1;
      for (const cp of unplacedChildren) {
        while (nextAvailableLeg <= 5 && occupiedLegs.has(nextAvailableLeg)) {
          nextAvailableLeg++;
        }
        if (nextAvailableLeg <= 5) {
          occupiedLegs.set(nextAvailableLeg, cp);
          nextAvailableLeg++;
        }
      }

      for (let leg = 1; leg <= 5; leg++) {
        const cp = occupiedLegs.get(leg);
        if (cp) {
          const cSlotCount = slotsMap.get(cp.id) || 0;
          const grandChildrenCount = grandChildrenCountMap.get(cp.id) || 0;
          const memberItem: OrganogramNode = {
            id: cp.id,
            fullName: cp.full_name || "Downline Partner",
            email: cp.email || "",
            phone: cp.phone || null,
            memberId: formatAgcId(cp.member_id),
            parentId: targetId,
            position: leg,
            level: 1,
            slotsHeld: cSlotCount,
            directReferralsCount: grandChildrenCount,
            createdAt: cp.created_at,
            hasGreenCard: Boolean(cp.member_id),
            isSpillover: cp.referred_by !== targetId,
            children: [],
          };
          allRoster.push(memberItem);
          childrenNodes.push(memberItem);
        }
      }

      // Also add remaining unplaced members to roster for directory & search
      for (const cp of unplacedChildren) {
        if (!Array.from(occupiedLegs.values()).some((p) => p.id === cp.id)) {
          const cSlotCount = slotsMap.get(cp.id) || 0;
          const grandChildrenCount = grandChildrenCountMap.get(cp.id) || 0;
          allRoster.push({
            id: cp.id,
            fullName: cp.full_name || "Downline Partner",
            email: cp.email || "",
            phone: cp.phone || null,
            memberId: formatAgcId(cp.member_id),
            parentId: targetId,
            position: 0,
            level: 2,
            slotsHeld: cSlotCount,
            directReferralsCount: grandChildrenCount,
            createdAt: cp.created_at,
            hasGreenCard: Boolean(cp.member_id),
            isSpillover: cp.referred_by !== targetId,
            children: [],
          });
        }
      }
    }

    // 3. Balanced Round-Robin Spillover from Upline (Batch Evaluated)
    // If target has fewer than 5 active legs and has an upline sponsor, check if the upline
    // has overflow beyond their 5 frontline slots (Index >= 5).
    // The overflow is evenly distributed to frontline children via (index - 5) % 5.
    if (childrenNodes.length < 5 && rootProfile.referred_by) {
      try {
        const uplineId = rootProfile.referred_by;
        const [uplineProfileRes, uplineChildrenRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, member_id").eq("id", uplineId).maybeSingle(),
          supabase.from("profiles").select("id, full_name, email, phone, member_id, created_at").eq("referred_by", uplineId).order("created_at", { ascending: true }).limit(100),
        ]);

        const uplineProfile = uplineProfileRes.data;
        const uplineChildren = uplineChildrenRes.data || [];

        if (uplineChildren.length > 5) {
          const uplineChildIds = uplineChildren.map((uc) => uc.id);
          const { data: ucSlotsData } = await supabase
            .from("slot_subscriptions")
            .select("user_id, slots")
            .in("user_id", uplineChildIds);

          const uplineSlotsMap = new Map<string, number>();
          for (const row of ucSlotsData || []) {
            const cur = uplineSlotsMap.get(row.user_id) || 0;
            uplineSlotsMap.set(row.user_id, cur + (Number(row.slots) || 0));
          }

          const uplineSlotChildren: any[] = [];
          for (const uc of uplineChildren) {
            const ucSlotsCount = uplineSlotsMap.get(uc.id) || 0;
            if (ucSlotsCount > 0) {
              uplineSlotChildren.push({ ...uc, slotsHeld: ucSlotsCount });
            }
          }

          const myLegIndex = uplineSlotChildren.findIndex((u) => u.id === targetId);
          if (myLegIndex >= 0 && myLegIndex < 5) {
            const candidateSpillovers: any[] = [];
            for (let i = 5; i < uplineSlotChildren.length; i++) {
              if ((i - 5) % 5 === myLegIndex && childrenNodes.length + candidateSpillovers.length < 5) {
                const spillCandidate = uplineSlotChildren[i];
                if (!allRoster.some((m) => m.id === spillCandidate.id) && !candidateSpillovers.some((m) => m.id === spillCandidate.id)) {
                  candidateSpillovers.push(spillCandidate);
                }
              }
            }

            const spillCandidateIds = candidateSpillovers.map((s) => s.id);
            const spillGrandChildrenMap = new Map<string, number>();
            if (spillCandidateIds.length > 0) {
              const { data: spillGrandChildrenData } = await supabase
                .from("profiles")
                .select("referred_by")
                .in("referred_by", spillCandidateIds);
              for (const row of spillGrandChildrenData || []) {
                if (row.referred_by) {
                  const cur = spillGrandChildrenMap.get(row.referred_by) || 0;
                  spillGrandChildrenMap.set(row.referred_by, cur + 1);
                }
              }
            }

            for (const spillCandidate of candidateSpillovers) {
              const spillGrandChildren = spillGrandChildrenMap.get(spillCandidate.id) || 0;
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
                directReferralsCount: spillGrandChildren,
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
      directReferralsCount: childrenProfiles.length,
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

    return { builtRoot, allRoster };
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
  const [linkMode, setLinkMode] = useState<"signup" | "subscribe">("signup");
  const activeReferralCode = referralCode || currentUserProfile?.referral_code || currentUserProfile?.member_id || currentUserId;

  const activeReferralLink = useMemo(() => {
    if (linkMode === "subscribe") {
      return `${SITE_URL}/subscribe?ref=${activeReferralCode}`;
    }
    if (selectedFarmId && selectedFarmId !== "all") {
      const targetFarm = userFarms.find((f) => f.id === selectedFarmId);
      const farmSlug = targetFarm?.name
        ? encodeURIComponent(targetFarm.name.toLowerCase().replace(/\s+/g, "-"))
        : selectedFarmId;
      return `${SITE_URL}/signup?ref=${activeReferralCode}&farm=${farmSlug}`;
    }
    return `${SITE_URL}/signup?ref=${activeReferralCode}`;
  }, [linkMode, selectedFarmId, userFarms, activeReferralCode]);

  // Copy Referral Link
  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(activeReferralLink);
      setCopiedLink(true);
      if (linkMode === "subscribe") {
        toast.success("Fast-Track Direct Pass link copied! Note: Enrollees can pay before setting a password; please follow up with them to help them complete account login!", { duration: 6500 });
      } else {
        toast.success("Affiliate signup link copied to clipboard!");
      }
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    if (linkMode === "subscribe") {
      const text = `Secure your AgroHeal Digital Green Card directly! Get permanent access to the LEAP organic curriculum and affiliate earnings: ${activeReferralLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      return;
    }
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
    return <OrganogramSkeleton />;
  }

  const isFullscreen = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "fullscreen";

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        <Toaster position="top-right" />

        {/* Minimal Fullscreen Header */}
        <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  navigate("/dashboard/my-network");
                }
              }}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs rounded-xl h-8 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <GitBranch className="w-4 h-4" />
              </span>
              <h1 className="text-sm font-bold text-white hidden sm:block">
                5×7 Organogram Matrix — Full Landscape Canvas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
              🔄 Switch to Landscape
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
              Landscape Format Mode
            </span>
            {activeRootNode && activeRootNode.id !== currentUserId && (
              <Button
                type="button"
                size="sm"
                onClick={handleResetToSelf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-xl cursor-pointer"
              >
                Reset to My Tree
              </Button>
            )}
          </div>
        </header>

        {/* Search bar in landscape */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downline name, email, or AGC ID..."
                className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8"
              />
            </div>
            <Button
              type="submit"
              disabled={refreshing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-xl shrink-0 cursor-pointer"
            >
              {refreshing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Inspect"}
            </Button>
          </form>
          {searchStatus && (
            <div className="text-xs text-emerald-400 flex items-center gap-2">
              <span>{searchStatus}</span>
              <button
                onClick={() => {
                  setSearchStatus("");
                  setSearchQuery("");
                  handleResetToSelf();
                }}
                className="text-[11px] underline text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Wide Landscape Canvas with generous room for 5 legs */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center">
          {activeRootNode ? (
            <div className="min-w-[1050px] flex flex-col items-center py-4">
              {/* Qualification banner */}
              <div className="w-full max-w-2xl mb-8 bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white text-sm block">
                    5×7 Matrix Qualified: 7-Level Commissions
                  </span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    {directReferralsCount >= 5
                      ? "Congratulations! Sponsoring 5 active direct partners has unlocked all 7 tiers of community matrix commissions."
                      : `Refer 5 active members to unlock all 7 tiers of community matrix commissions simultaneously (${5 - Math.min(5, directReferralsCount)} more needed). Direct referral bounties of ₦1,000 credit immediately.`}
                  </p>
                </div>
              </div>

              {/* 1. ROOT NODE CARD */}
              <div className="relative group flex flex-col items-center">
                <div className="w-80 bg-slate-800 rounded-2xl p-5 border-2 border-emerald-500 shadow-xl flex flex-col items-center text-center relative z-20">
                  <div className="absolute -top-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                    {activeRootNode.id === currentUserId ? "Your Root Position" : "Active Tree Pivot"}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center mt-1 shadow-inner">
                    {(activeRootNode.fullName || "M").charAt(0).toUpperCase()}
                  </div>

                  <h3 className="font-extrabold text-white text-base mt-2 line-clamp-1">
                    {activeRootNode.fullName || "AgroHeal Member"}
                  </h3>
                  <p className="font-mono text-xs text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md mt-1">
                    {activeRootNode.memberId}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{activeRootNode.email}</p>

                  <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-slate-700 text-xs">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Slots Held</span>
                      <span className="font-bold text-slate-200">{activeRootNode.slotsHeld} Slots</span>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Direct Recruits</span>
                      <span className="font-bold text-emerald-400">{activeRootNode.directReferralsCount} Partners</span>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-8 bg-emerald-500 relative z-10" />
              </div>

              {/* Horizontal distribution bar spanning all 5 child slots */}
              <div className="w-[88%] max-w-5xl h-0.5 bg-emerald-500 -mt-0.5 relative z-10" />

              {/* 2. FIVE CHILD SLOTS in fixed 5-column landscape grid */}
              <div className="grid grid-cols-5 gap-4 w-full max-w-6xl mt-0 relative z-20">
                {[0, 1, 2, 3, 4].map((slotIndex) => {
                  const legNumber = slotIndex + 1;
                  const child = activeRootNode.children.find((c) => c.position === legNumber);

                  if (child) {
                    return (
                      <div key={child.id} className="flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-emerald-400" />
                        <div className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between text-center relative">
                          <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                            {child.isSpillover ? (
                              <span className="bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                                🌊 Spillover
                              </span>
                            ) : (
                              <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full text-[10px]">
                                ⭐ Leg #{legNumber}
                              </span>
                            )}
                            <span className="text-slate-400 font-normal">Level 1</span>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-emerald-900 text-emerald-200 font-bold mx-auto flex items-center justify-center text-sm shadow-inner">
                            {(child.fullName || "M").charAt(0).toUpperCase()}
                          </div>

                          <div className="mt-2">
                            <h4 className="font-bold text-white text-xs line-clamp-1">{child.fullName}</h4>
                            <p className="font-mono text-[11px] text-emerald-400 font-semibold mt-0.5">{child.memberId}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-700 text-[11px] text-slate-300 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Slots:</span>
                              <span className="font-bold text-white">{child.slotsHeld}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Direct:</span>
                              <span className="font-bold text-emerald-400">{child.directReferralsCount}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() => buildSubtree(child.id, false)}
                            className="mt-3 w-full text-[11px] h-7 border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg flex items-center justify-center gap-1 font-semibold cursor-pointer"
                          >
                            Drill Down <CornerDownRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={`empty-${legNumber}`} className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-slate-700" />
                      <div className="w-full bg-slate-900/60 rounded-2xl p-4 border-2 border-dashed border-slate-800 flex flex-col justify-between items-center text-center min-h-[200px]">
                        <div className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          Leg #{legNumber} (Open)
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center my-2">
                          <Users className="w-4 h-4 text-slate-500" />
                        </div>
                        <p className="text-xs font-semibold text-slate-400">Open Slot</p>
                        <p className="text-[10px] text-slate-500 mt-1">Available for referral or spillover</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">No tree node found.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50/60 font-sans pb-16 ${isFullscreen ? "p-2 sm:p-4" : "p-4 sm:p-6 lg:p-8"}`}>
      <Toaster position="top-right" />

      <div className={`mx-auto space-y-6 ${isFullscreen ? "max-w-[99%]" : "max-w-7xl"}`}>
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
                Buy your Starter package (₦10,000) to enter the tree.
              </h1>
              <p className="text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                Maintain a monthly PQV of ₦10,000 worth of food products to unlock matrix commissions across 7 levels.
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

        {/* ── POTENTIAL COMMISSION BANNER ── */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-white">
                  Potential ₦12,212,500 in Community Commissions Waiting to be Unlocked
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  7 Matrix Tiers
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 max-w-3xl leading-relaxed">
                You have up to 7 matrix tiers waiting to be unlocked. Refer 5 active members to unlock the entire 7-tier community commissions simultaneously.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
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

          {/* Link Format Mode Selector */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">Link Mode:</span>
              <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLinkMode("signup")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    linkMode === "signup"
                      ? "bg-white text-emerald-900 shadow-xs font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Standard Registration (/signup)
                </button>
                <button
                  type="button"
                  onClick={() => setLinkMode("subscribe")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    linkMode === "subscribe"
                      ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Fast-Track Pass (/subscribe)
                </button>
              </div>
            </div>
            {linkMode === "subscribe" && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                Direct Green Card Pass Checkout
              </Badge>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Farm Selector Dropdown (Active for standard signup) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Assign to Specific Farm {linkMode === "subscribe" ? "(Optional)" : ""}
              </label>
              <select
                disabled={linkMode === "subscribe"}
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  linkMode === "subscribe"
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                }`}
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
              <label className="block text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>
                  {linkMode === "subscribe" ? "Fast-Track Direct Pass Link" : "Generated Invite Link"}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Sponsor code attached
                </span>
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
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Follow-up advisory banner for Fast-Track Pass */}
          {linkMode === "subscribe" && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950 text-xs">Direct Pass Follow-up Advisory</p>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  When guests purchase their Green Card through the <strong>Fast-Track Pass (/subscribe)</strong> link, your sponsor referral code is permanently preserved and they can pay immediately without pre-registering an account password. Because guests pay first, please follow up with your direct enrollee after payment using their phone or email to ensure they complete setting their password and log in to activate their 5×7 network organogram!
                </p>
              </div>
            </div>
          )}
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
                  Starter Package Required
                </span>
                <h3 className="text-2xl font-black text-gray-900">
                  5×7 Farm Matrix is Locked
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
                  Your <strong>₦2,000 Green Card</strong> entitles you to lifetime educational curriculum access and <strong>₦1,000 direct referral rewards</strong>.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-lg mx-auto">
                  The <strong>5×7 Matrix</strong> is reserved for members who have subscribed to the <strong>₦10,000 starter package (₦5,000 Starter Mushroom farm slot and ₦5,000 Mushroom Power)</strong>. Remember that a farm slot alone won't qualify without a mushroom 100g product—we only sell it together as a combo. Once secured, you will be assigned an active node in the tree with automated spillover and 7-level commissions.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/dashboard/farm-operations/buy-slots"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all"
                >
                  <Sprout className="w-4 h-4" />
                  Secure your Starter Package (₦10,000)
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      window.open("/dashboard/my-network?view=fullscreen", "_blank");
                    }}
                    className="text-xs h-9 border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/70 rounded-xl shrink-0 flex items-center gap-1.5"
                    title="Open 5×7 Organogram in a dedicated full page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open in New Page</span>
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

              {/* 30-Hour Placement Holding Tank Banner (if sponsor has waiting enrollees) */}
              {holdingTankMembers.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-2 shadow-xs">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                        <h4 className="font-extrabold text-amber-900 text-sm sm:text-base">
                          Placement Holding Tank ({holdingTankMembers.length} Partner{holdingTankMembers.length > 1 ? "s" : ""})
                        </h4>
                        <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          30-Hour Grace Window
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                        You have directly enrolled partners waiting to be placed into your 5×7 organogram. You have a 30-hour grace period to place them into specific frontline legs before automated spillover balancing takes place.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {holdingTankMembers.map((member) => (
                      <div key={member.id} className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{member.full_name}</p>
                          <p className="font-mono text-[11px] text-emerald-700">{member.member_id || member.email}</p>
                          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            ⏳ {member.formattedTimeRemaining} left
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setSelectedHoldingEnrollee(member)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-7 px-2.5 rounded-lg"
                        >
                          Place
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matrix Locked Warning Overlay */}
              {isMatrixLocked && (
                <div className="bg-white/95 border-2 border-dashed border-amber-300 rounded-3xl p-6 sm:p-8 text-center max-w-2xl mx-auto my-6 shadow-md">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900">
                    5×7 Compound Referral Matrix Locked
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    {isLegacyNeedsStarterPack ? (
                      <>
                        As a valued Founding member, please activate your account with the{" "}
                        <strong className="text-emerald-700 font-bold">Mushroom Starter Pack (₦5,000)</strong> to unlock your 5×7 organogram matrix, downline spillover placements, and commercial wallet withdrawals.
                      </>
                    ) : (
                      <>
                        You must own at least <strong className="text-emerald-700 font-bold">1 Farm Slot (₦5,000)</strong> to activate your position inside the 5×7 matrix and receive spillover from your upline team.
                      </>
                    )}
                  </p>
                  <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {isLegacyNeedsStarterPack ? (
                      <Button
                        onClick={() => navigate("/dashboard/slots/buy?type=starter_pack")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md w-full sm:w-auto text-xs"
                      >
                        Acquire Starter Pack (₦5,000)
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate("/dashboard/slots/buy")}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md w-full sm:w-auto text-xs"
                      >
                        Buy Farm Slot (₦5,000)
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950 text-sm">
                      5×7 Matrix Qualified: 7-Level Commissions
                    </span>
                    <Badge className="bg-emerald-200 text-emerald-900 border-emerald-300 text-[10px]">
                      {directReferralsCount >= 5 ? "✓ All 7 Tiers Unlocked" : `${directReferralsCount} of 5 Direct Partners Sponsored`}
                    </Badge>
                  </div>
                  <p className="text-emerald-800/90 leading-relaxed">
                    {directReferralsCount >= 5
                      ? "Congratulations! Sponsoring 5 active direct partners has unlocked all 7 tiers of community matrix commissions."
                      : `Refer 5 active members to unlock all 7 tiers of community matrix commissions simultaneously (${5 - Math.min(5, directReferralsCount)} more needed). Direct referral bounties of ₦1,000 credit immediately.`}
                  </p>
                </div>
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
                    const legNumber = slotIndex + 1;
                    const child = activeRootNode.children.find((c) => c.position === legNumber);

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

      {/* Manual Placement Dialog Modal */}
      {selectedHoldingEnrollee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Place Downline Member</h3>
                  <p className="text-xs text-gray-500">30-Hour Grace Window</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHoldingEnrollee(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                <p className="font-bold text-gray-900 text-sm">{selectedHoldingEnrollee.full_name}</p>
                <p className="font-mono text-emerald-800 text-xs mt-0.5">{selectedHoldingEnrollee.member_id || selectedHoldingEnrollee.email}</p>
                <p className="text-gray-500 text-[11px] mt-1">
                  Enrolled: {new Date(selectedHoldingEnrollee.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Select Frontline Matrix Leg (1 to 5):
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((leg) => {
                    const isOccupied = activeRootNode?.children.some((c) => c.position === leg);
                    return (
                      <button
                        key={leg}
                        type="button"
                        onClick={() => setTargetPlacementLeg(leg)}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                          targetPlacementLeg === leg
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                            : isOccupied
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50"
                        }`}
                      >
                        <span className="block text-sm">#{leg}</span>
                        <span className="text-[9px] block font-normal mt-0.5">
                          {isOccupied ? "Occupied" : "Open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Choosing an open leg places them directly on your frontline. If you select an occupied leg, our system will place them under that leg's subteam.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHoldingEnrollee(null)}
                disabled={isPlacingEnrollee}
                className="rounded-xl h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePlaceHoldingEnrollee}
                disabled={isPlacingEnrollee}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl h-9 px-5 shadow-sm"
              >
                {isPlacingEnrollee ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  `Confirm Leg #${targetPlacementLeg} Placement`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompoundReferrals;
