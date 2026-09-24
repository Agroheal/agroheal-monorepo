import { supabase } from "@/lib/supabaseClient";
import { SETUP_FEE, SUPPORT_FEE } from "@/lib/pricing";
import {
  cleanName,
  cleanEmail,
  normalizePhoneNumber,
  parsePositiveInt,
} from "@shared/dataSanitizers";
import { recordAuditEvent } from "@/lib/adminActions";

export interface FarmGroup {
  id: string;
  name: string;
  project_category: string;
}

export async function fetchFarmGroups(): Promise<FarmGroup[]> {
  const { data, error } = await supabase.from("farm_groups").select("id, name, project_category").order("name");
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Adds `slots` to a member's farm_records row for the given farm group,
 * creating the row if none exists yet. This only ever touches farm_records —
 * it never re-credits slot_subscriptions, so it's safe to call both at the
 * moment slots are credited and later, to backfill a gap the reconciliation
 * report finds.
 */
export async function assignSlotsToFarmGroup(input: {
  farmGroupId: string;
  category: string;
  name: string;
  email: string;
  phone: string;
  slots: number;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required for farm assignments.");
  }

  const farmGroupId = input.farmGroupId;
  const category = input.category;
  const name = cleanName(input.name);
  const email = cleanEmail(input.email);
  const phone = normalizePhoneNumber(input.phone);
  const slots = parsePositiveInt(input.slots, 1);

  const { data: existing, error: lookupErr } = await supabase
    .from("farm_records")
    .select("id, farm_slots")
    .eq("farm_id", farmGroupId)
    .ilike("email", email)
    .maybeSingle();

  if (lookupErr) throw new Error(`Farm assignment lookup failed: ${lookupErr.message}`);

  const auditString = user?.email
    ? `[Super Admin] Developer Elijah (${user.email})`
    : `[Super Admin] Admin`;

  if (existing) {
    const newTotal = existing.farm_slots + slots;
    const { error: updateErr } = await supabase
      .from("farm_records")
      .update({
        farm_slots: newTotal,
        months_farm_setup: String(newTotal * SETUP_FEE),
        months_farm_support: String(newTotal * SUPPORT_FEE),
        updated_by: user?.id,
        updated_by_name: auditString,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateErr) throw new Error(`Updating the farm record failed: ${updateErr.message}`);

    await recordAuditEvent({
      action: "FARM_GROUP_ASSIGNMENT",
      entity_type: "farm_records",
      entity_id: existing.id,
      payload: {
        farm_group_id: farmGroupId,
        target_name: name,
        target_email: email,
        target_phone: phone,
        slots_assigned: slots,
        category,
        is_update: true,
        previous_slots: existing.farm_slots,
        total_slots_after: newTotal,
      },
    });
    return;
  }

  const { error: insertErr } = await supabase.from("farm_records").insert({
    name,
    email,
    phone,
    farm_slots: slots,
    farm_id: farmGroupId,
    project_category: category,
    months_farm_setup: String(slots * SETUP_FEE),
    months_farm_support: String(slots * SUPPORT_FEE),
    absentee_fine: "0",
    created_by: user?.id,
    created_by_name: auditString,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (insertErr) throw new Error(`Creating the farm record failed: ${insertErr.message}`);

  await recordAuditEvent({
    action: "FARM_GROUP_ASSIGNMENT",
    entity_type: "farm_records",
    entity_id: farmGroupId,
    payload: {
      farm_group_id: farmGroupId,
      target_name: name,
      target_email: email,
      target_phone: phone,
      slots_assigned: slots,
      category,
      is_update: false,
      previous_slots: 0,
      total_slots_after: slots,
    },
  });
}

/**
 * Resolves the appropriate farm group for a member based on referrer lineage:
 * 1. Looks up member's sponsor_id in profiles.
 * 2. Checks which farm group the sponsor holds slots in for the given category.
 * 3. Checks if that farm group has available capacity (< 1,000 slots).
 * 4. If yes, returns that farm group.
 * 5. If maxed out (>= 1,000 slots) or sponsor has no farm group, returns the first unmaxed active farm group in that category (< 1,000 slots).
 */
export async function resolveAutoAssignedFarmGroup(
  memberUserId: string,
  category: string = "Mushroom Village"
): Promise<FarmGroup | null> {
  // 1. Fetch sponsor_id
  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("sponsor_id")
    .eq("id", memberUserId)
    .maybeSingle();

  if (memberProfile?.sponsor_id) {
    // 2. Check sponsor's farm group in farm_records
    const { data: sponsorRecords } = await supabase
      .from("farm_records")
      .select("farm_id, farm_slots, farm_groups!inner(id, name, project_category)")
      .eq("user_id", memberProfile.sponsor_id)
      .eq("project_category", category)
      .order("farm_slots", { ascending: false })
      .limit(1);

    if (sponsorRecords && sponsorRecords.length > 0) {
      const sponsorFarmId = sponsorRecords[0].farm_id;
      // Check total slots in this farm
      const { data: clusterSlots } = await supabase
        .from("farm_records")
        .select("farm_slots")
        .eq("farm_id", sponsorFarmId);

      const totalSlots = (clusterSlots || []).reduce(
        (sum, r) => sum + (Number(r.farm_slots) || 0),
        0
      );

      if (totalSlots < 1000) {
        const fg = sponsorRecords[0].farm_groups as any;
        return {
          id: fg.id,
          name: fg.name,
          project_category: fg.project_category,
        };
      }
    }
  }

  // 3. Fallback: Find the first unmaxed farm group (< 1,000 slots) in the category
  const { data: allFarms } = await supabase
    .from("farm_groups")
    .select("id, name, project_category")
    .eq("project_category", category)
    .order("created_at", { ascending: true });

  if (!allFarms || allFarms.length === 0) return null;

  for (const farm of allFarms) {
    const { data: clusterSlots } = await supabase
      .from("farm_records")
      .select("farm_slots")
      .eq("farm_id", farm.id);

    const totalSlots = (clusterSlots || []).reduce(
      (sum, r) => sum + (Number(r.farm_slots) || 0),
      0
    );

    if (totalSlots < 1000) {
      return farm;
    }
  }

  // If all are full, return the first one as fallback
  return allFarms[0];
}

