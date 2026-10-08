import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAdminMembers } from "@/hooks/useAdminMembers";

export interface FarmAssignmentGap {
  memberId: string;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  slotsPurchased: number;
  slotsAssigned: number;
  shortfall: number;
  is_legacy?: boolean;
}

interface RawFarmRecordRow {
  email?: string;
  project_category?: string;
  farm_slots?: number;
  user_id?: string;
}

/**
 * Slots purchased (slot_subscriptions) and a member's farm_records row are
 * two independently-maintained things — nothing in the schema keeps them in
 * sync. This surfaces anyone whose purchased slots, per category, exceed
 * what's actually assigned to a farm — auditing both modern slot_subscriptions
 * (farm_group_id assignments) and legacy farm records (farm_records & lg_farm_records).
 */
export function useFarmAssignmentGaps() {
  const { members, loading: membersLoading, error: membersError, refetch: refetchMembers } = useAdminMembers();
  const [farmRecordTotals, setFarmRecordTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFarmRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recordsRes, lgRecordsRes, assignedSubsRes] = await Promise.all([
        supabase
          .from("farm_records")
          .select("email, project_category, farm_slots"),
        supabase
          .from("lg_farm_records")
          .select("email, project_category, farm_slots"),
        supabase
          .from("slot_subscriptions")
          .select("user_id, project_category, slots, farm_group_id")
          .not("farm_group_id", "is", null),
      ]);

      if (recordsRes.error) throw recordsRes.error;

      const totals = new Map<string, number>();

      // 1. Live farm_records
      ((recordsRes.data || []) as RawFarmRecordRow[]).forEach((row) => {
        const key = `${(row.email || "").trim().toLowerCase()}::${row.project_category || "Mushroom Village"}`;
        totals.set(key, (totals.get(key) || 0) + (Number(row.farm_slots) || 0));
      });

      // 2. Legacy farm records (lg_farm_records)
      ((lgRecordsRes.data || []) as RawFarmRecordRow[]).forEach((row) => {
        const key = `${(row.email || "").trim().toLowerCase()}::${row.project_category || "Mushroom Village"}`;
        totals.set(key, (totals.get(key) || 0) + (Number(row.farm_slots) || 0));
      });

      // 3. Modern slot_subscriptions assigned via farm_group_id
      (assignedSubsRes.data || []).forEach((sub: any) => {
        if (sub.user_id) {
          const uidKey = `${sub.user_id}::${sub.project_category || "Mushroom Village"}`;
          totals.set(uidKey, (totals.get(uidKey) || 0) + (Number(sub.slots) || 0));
        }
      });

      setFarmRecordTotals(totals);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch farm records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmRecords();
  }, [fetchFarmRecords]);

  const gaps: FarmAssignmentGap[] = members.flatMap((member) => {
    const email = (member.email || "").trim().toLowerCase();
    if (!email || email === "no email") return [];

    return member.slots_by_program
      .map((program): FarmAssignmentGap | null => {
        const assignedByEmail = farmRecordTotals.get(`${email}::${program.category}`) || 0;
        const assignedByUid = farmRecordTotals.get(`${member.id}::${program.category}`) || 0;
        const assigned = Math.max(assignedByEmail, assignedByUid);
        const shortfall = program.slots - assigned;
        if (shortfall <= 0) return null;
        return {
          memberId: member.id,
          fullName: member.full_name,
          email: member.email,
          phone: member.phone,
          category: program.category,
          slotsPurchased: program.slots,
          slotsAssigned: assigned,
          shortfall,
          is_legacy: Boolean(member.is_legacy),
        };
      })
      .filter((gap): gap is FarmAssignmentGap => gap !== null);
  });

  gaps.sort((a, b) => b.shortfall - a.shortfall);

  const refetch = useCallback(() => {
    refetchMembers();
    fetchFarmRecords();
  }, [refetchMembers, fetchFarmRecords]);

  return {
    gaps,
    loading: loading || membersLoading,
    error: error || membersError,
    refetch,
  };
}
