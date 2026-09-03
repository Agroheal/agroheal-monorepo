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
}

interface RawFarmRecordRow {
  email: string;
  project_category: string;
  farm_slots: number;
}

/**
 * Slots purchased (slot_subscriptions) and a member's farm_records row are
 * two independently-maintained things — nothing in the schema keeps them in
 * sync. This surfaces anyone whose purchased slots, per category, exceed
 * what's actually assigned to a farm — the same gap that left two real
 * customers with paid-for slots missing from their coordinator's dashboard.
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
      const { data, error: fetchErr } = await supabase
        .from("farm_records")
        .select("email, project_category, farm_slots");
      if (fetchErr) throw fetchErr;

      const totals = new Map<string, number>();
      ((data || []) as RawFarmRecordRow[]).forEach((row) => {
        const key = `${(row.email || "").trim().toLowerCase()}::${row.project_category}`;
        totals.set(key, (totals.get(key) || 0) + (Number(row.farm_slots) || 0));
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
      .map((program) => {
        const assigned = farmRecordTotals.get(`${email}::${program.category}`) || 0;
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
