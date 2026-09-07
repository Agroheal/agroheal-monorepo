import { supabase } from "@/lib/supabaseClient";
import { SETUP_FEE, SUPPORT_FEE } from "@/lib/pricing";
import {
  cleanName,
  cleanEmail,
  normalizePhoneNumber,
  parsePositiveInt,
} from "@shared/dataSanitizers";

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
  if (user?.email !== "developerelijah360@gmail.com") {
    throw new Error(
      "System is in Read-Only Audit Mode. Farm assignments are restricted to developerelijah360@gmail.com during financial reconciliation.",
    );
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

  if (existing) {
    const newTotal = existing.farm_slots + slots;
    const { error: updateErr } = await supabase
      .from("farm_records")
      .update({
        farm_slots: newTotal,
        months_farm_setup: String(newTotal * SETUP_FEE),
        months_farm_support: String(newTotal * SUPPORT_FEE),
      })
      .eq("id", existing.id);
    if (updateErr) throw new Error(`Updating the farm record failed: ${updateErr.message}`);
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
  });
  if (insertErr) throw new Error(`Creating the farm record failed: ${insertErr.message}`);
}
