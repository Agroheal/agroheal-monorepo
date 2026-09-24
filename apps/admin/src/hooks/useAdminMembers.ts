import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Member, PaymentLog } from "@/types/admin";

interface RawProfileRow {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  member_id?: string;
  referral_code?: string;
  referred_by?: string;
  role?: string;
  created_at?: string;
}

interface RawSlotRow {
  id?: string;
  user_id: string;
  status?: string;
  project_category?: string;
  slots?: number;
  amount?: number;
  last_payment_date?: string;
}

interface RawPaymentRow {
  id?: string;
  user_id: string;
  amount?: number;
  project_category?: string;
  created_at?: string;
  slots?: number;
  status?: string;
}

interface RawSubscriptionRow {
  user_id: string;
  status?: string;
  expires_at: string;
}

export function useAdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profilesRes, slotsRes, otherPayRes, subscriptionsRes] = await Promise.all([
        supabase.rpc("get_admin_members").then((res) => {
          if (res.error) {
            return supabase.from("profiles").select("*").order("created_at", { ascending: false });
          }
          return res;
        }),
        supabase.from("slot_subscriptions").select("*").order("last_payment_date", { ascending: false }),
        supabase.from("other_payments").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").eq("plan", "green_card"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (otherPayRes.error) throw otherPayRes.error;

      const profiles = (profilesRes.data || []) as RawProfileRow[];
      const slots = (slotsRes.data || []) as RawSlotRow[];
      const otherPayments = (otherPayRes.data || []) as RawPaymentRow[];
      const subscriptions = (subscriptionsRes?.data || []) as RawSubscriptionRow[];

      // High-performance O(1) index maps to replace nested O(N*M) filters
      const activeSlotsByUser = new Map<string, RawSlotRow[]>();
      for (const s of slots) {
        if (s.status === "active") {
          const list = activeSlotsByUser.get(s.user_id);
          if (list) list.push(s);
          else activeSlotsByUser.set(s.user_id, [s]);
        }
      }

      const now = new Date();
      const activeGreenCardsByUser = new Map<string, RawSubscriptionRow>();
      for (const sub of subscriptions) {
        if (sub.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > now)) {
          activeGreenCardsByUser.set(sub.user_id, sub);
        }
      }

      const mappedMembers: Member[] = profiles.map((p) => {
        const userSlots = activeSlotsByUser.get(p.id) || [];
        const userGreenCard = activeGreenCardsByUser.get(p.id);
        const hasGreenCard = Boolean(userGreenCard || (p.member_id && p.member_id.startsWith("AGC-")));

        const programMap: Record<string, { category: string; slots: number; status: string }> = {};
        let totalSlots = 0;

        userSlots.forEach((s) => {
          const category = s.project_category || "Mushroom Village";
          const slotCount = Number(s.slots) || 0;
          totalSlots += slotCount;

          if (!programMap[category]) {
            programMap[category] = { category, slots: 0, status: s.status || "active" };
          }
          programMap[category].slots += slotCount;
        });

        return {
          id: p.id,
          full_name: p.full_name || "Unnamed Member",
          email: p.email || (p.phone || p.phone_number ? `Phone: ${p.phone || p.phone_number}` : "No Email"),
          phone: p.phone || p.phone_number || "",
          member_id: p.member_id || "No ID Assigned",
          referral_code: p.referral_code || "",
          referred_by: p.referred_by || "",
          role: p.role || "user",
          created_at: p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A",
          has_green_card: hasGreenCard,
          green_card_expires_at: userGreenCard?.expires_at,
          total_slots: totalSlots,
          slots_by_program: Object.values(programMap),
        };
      });

      const nameById = new Map(mappedMembers.map((m) => [m.id, m.full_name]));
      const membersWithReferrerNames = mappedMembers.map((m) =>
        m.referred_by ? { ...m, referred_by: nameById.get(m.referred_by) || "Unknown Referrer" } : m,
      );

      setMembers(membersWithReferrerNames);

      const combinedLogs: PaymentLog[] = [];

      slots.forEach((s) => {
        const member = mappedMembers.find((m) => m.id === s.user_id);
        combinedLogs.push({
          id: s.id || `SLOT-${Math.random().toString(36).slice(2, 6)}`,
          user_email: member?.email || "Unknown",
          amount: s.amount || 0,
          project_category: s.project_category || "Mushroom Village",
          created_at: s.last_payment_date ? new Date(s.last_payment_date).toLocaleString() : "N/A",
          slots: s.slots || 0,
          status: s.status || "active",
          type: "slot_subscription",
        });
      });

      otherPayments.forEach((p) => {
        const member = mappedMembers.find((m) => m.id === p.user_id);
        combinedLogs.push({
          id: p.id || `PAY-${Math.random().toString(36).slice(2, 6)}`,
          user_email: member?.email || "Unknown",
          amount: p.amount || 0,
          project_category: p.project_category || "Mushroom Village",
          created_at: p.created_at ? new Date(p.created_at).toLocaleString() : "N/A",
          slots: p.slots || 0,
          status: p.status || "success",
          type: "other_payment",
        });
      });

      combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPaymentLogs(combinedLogs);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch database information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { members, paymentLogs, loading, error, refetch };
}
