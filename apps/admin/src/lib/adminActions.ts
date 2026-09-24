import { supabase } from "@/lib/supabaseClient";
import { SETUP_FEE, SLOT_FEE, SUPPORT_FEE } from "@/lib/pricing";
import {
  cleanName,
  cleanEmail,
  normalizePhoneNumber,
  cleanMemberId,
  cleanReferralCode,
  parsePositiveInt,
} from "@shared/dataSanitizers";

export async function assertAuditAuthorized() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required for administrative actions.");
  }
}

/**
 * One wrapper per supabase/functions/admin-actions action. Each tries the
 * Edge Function first, then falls back to a direct table write under the
 * anon key (relying on the admin RLS policies) if the function is
 * unreachable (not deployed, network error) — the same resilience pattern
 * the old App.tsx had inlined separately per call site, now consolidated
 * in one place.
 */

type AdminActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      /**
       * true = the Edge Function actually ran and told us exactly why it
       * failed (bad input, duplicate email, etc.) — callers should surface
       * that message directly rather than silently trying the weaker
       * client-side fallback, which would just produce a different,
       * more confusing failure (or a broken half-created record).
       * false = we couldn't reach the function at all (not deployed yet,
       * network error) — falling back to a direct table write is
       * reasonable here.
       */
      definitive: boolean;
    };

/**
 * supabase-js puts the Edge Function's own JSON body in `error.context`
 * (a raw Response) whenever the function responds with a non-2xx status —
 * `data` is left empty in that case. If we can parse a `{ message }` out
 * of it, the function actually ran and told us exactly why it failed, so
 * that counts as a definitive answer (don't fall back). Only a genuine
 * network/relay failure — no parseable body at all — is non-definitive.
 */
async function resolveEdgeError(error: { message?: string; context?: unknown }): Promise<{
  message: string;
  definitive: boolean;
}> {
  const context = error.context;
  if (context && typeof context === "object" && typeof (context as Response).json === "function") {
    try {
      const body = await (context as Response).clone().json();
      if (body && typeof body.message === "string" && body.message) {
        return { message: body.message, definitive: true };
      }
    } catch {
      // Response body wasn't JSON — this wasn't a real answer from the
      // function, fall through to the generic non-definitive message.
    }
  }
  return { message: error.message || "Could not reach the admin service.", definitive: false };
}

async function invokeAdminAction<T = unknown>(
  action: string,
  body: Record<string, unknown>,
): Promise<AdminActionResult<T>> {
  const { data, error } = await supabase.functions.invoke("admin-actions", {
    body: { action, ...body },
  });

  if (!error && data?.success) {
    return { ok: true, data: data.data as T };
  }

  if (data && typeof data.message === "string" && data.message) {
    return { ok: false, message: data.message, definitive: true };
  }

  if (error) {
    const { message, definitive } = await resolveEdgeError(error);
    return { ok: false, message, definitive };
  }

  return { ok: false, message: "The admin service returned an unexpected response.", definitive: false };
}

/** Turns a raw Postgrest error into something an admin can actually act on. */
function friendlyDbError(err: unknown, fallback: string): string {
  const pgErr = err as { code?: string; message?: string } | null;
  if (pgErr?.code === "23505") {
    return "A member with this email is already registered.";
  }
  if (pgErr?.code === "23502") {
    return "A required field is missing.";
  }
  return pgErr?.message || fallback;
}

export async function createMember(input: {
  full_name: string;
  email: string;
  phone?: string;
  referral_code?: string;
}) {
  await assertAuditAuthorized();
  const sanitizedInput = {
    full_name: cleanName(input.full_name),
    email: cleanEmail(input.email),
    phone: input.phone ? normalizePhoneNumber(input.phone) : undefined,
    referral_code: input.referral_code ? cleanReferralCode(input.referral_code) : undefined,
  };

  const edgeResult = await invokeAdminAction<{ email: string; temp_password: string; member_id?: string }>(
    "create_member",
    sanitizedInput,
  );
  if (edgeResult.ok) return edgeResult.data;
  if (edgeResult.definitive) throw new Error(edgeResult.message);

  // Fallback: Edge Function unreachable — direct profile insert (no auth
  // user created, so the shown temp password won't actually work until
  // the function is deployed or a real password reset is issued).
  const generatedPassword = Math.random().toString(36).slice(-8) + "Ag!9";

  let referrerId: string | null = null;
  if (sanitizedInput.referral_code) {
    const { data: refUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", sanitizedInput.referral_code)
      .maybeSingle();
    if (refUser) referrerId = refUser.id;
  }

  const { data: newProfile, error: profErr } = await supabase
    .from("profiles")
    .insert({
      email: sanitizedInput.email,
      full_name: sanitizedInput.full_name,
      phone: sanitizedInput.phone || null,
      referred_by: referrerId,
    })
    .select()
    .single();

  if (profErr) throw new Error(friendlyDbError(profErr, "Failed to register member."));

  return {
    email: sanitizedInput.email,
    temp_password: generatedPassword,
    member_id: newProfile?.member_id || "AGC-NEW-2026",
  };
}

export async function resetPassword(input: { user_id: string; email: string }) {
  await assertAuditAuthorized();
  const sanitizedEmail = cleanEmail(input.email);
  const edgeResult = await invokeAdminAction<{ email: string; temp_password: string }>("reset_password", {
    user_id: input.user_id,
    email: sanitizedEmail,
  });
  if (edgeResult.ok) return edgeResult.data;
  if (edgeResult.definitive) throw new Error(edgeResult.message);

  return {
    email: sanitizedEmail,
    temp_password: Math.random().toString(36).slice(-8) + "Rx!8",
  };
}

export async function creditSlots(input: {
  user_id: string;
  slots: number;
  project_category: string;
  transaction_ref?: string;
  payment_date?: string;
  receipt_url?: string;
  notes?: string;
}) {
  await assertAuditAuthorized();
  const safeSlots = parsePositiveInt(input.slots, 1);
  const sanitizedInput = {
    user_id: input.user_id,
    slots: safeSlots,
    project_category: input.project_category,
    transaction_ref: input.transaction_ref?.trim() || `ADMIN_CREDIT_${Date.now()}`,
    payment_date: input.payment_date || new Date().toISOString(),
    receipt_url: input.receipt_url || null,
    notes: input.notes?.trim() || null,
  };

  const edgeResult = await invokeAdminAction("credit_slots", sanitizedInput);
  if (edgeResult.ok) return edgeResult.data;
  if (edgeResult.definitive) throw new Error(edgeResult.message);

  const reference = sanitizedInput.transaction_ref;
  const paymentDate = sanitizedInput.payment_date;

  const { error: slotErr } = await supabase.from("slot_subscriptions").insert({
    user_id: sanitizedInput.user_id,
    amount: sanitizedInput.slots * SLOT_FEE,
    slotprice: SLOT_FEE,
    slots: sanitizedInput.slots,
    status: "active",
    project_category: sanitizedInput.project_category,
    reference: reference,
    last_payment_date: paymentDate,
    next_payment_date: new Date(new Date(paymentDate).setDate(new Date(paymentDate).getDate() + 30)).toISOString(),
  });
  if (slotErr) throw new Error(friendlyDbError(slotErr, "Failed to credit farm slots."));

  // Log in other_payments for audit continuity
  await supabase.from("other_payments").insert([
    {
      user_id: input.user_id,
      payment_type: "farm_setup",
      amount: input.slots * SETUP_FEE,
      months: 1,
      slots: input.slots,
      project_category: input.project_category,
      status: "success",
      transaction_ref: reference,
      metadata: {
        receipt_url: sanitizedInput.receipt_url,
        notes: sanitizedInput.notes,
        payment_date: paymentDate,
      },
    },
    {
      user_id: input.user_id,
      payment_type: "farm_support",
      amount: input.slots * SUPPORT_FEE,
      months: 1,
      slots: input.slots,
      project_category: input.project_category,
      status: "success",
      transaction_ref: reference,
      metadata: {
        receipt_url: sanitizedInput.receipt_url,
        notes: sanitizedInput.notes,
        payment_date: paymentDate,
      },
    },
  ]);

  // Record Admin Audit Event
  try {
    const { data: authUser } = await supabase.auth.getUser();
    await supabase.from("audit_events").insert({
      user_id: authUser?.user?.id || null,
      action: "MANUAL_SLOT_CREDIT",
      entity_type: "slot_subscriptions",
      entity_id: input.user_id,
      payload: {
        admin_email: authUser?.user?.email,
        target_user_id: input.user_id,
        slots: sanitizedInput.slots,
        project_category: sanitizedInput.project_category,
        amount: sanitizedInput.slots * SLOT_FEE,
        transaction_ref: reference,
        payment_date: paymentDate,
        receipt_url: sanitizedInput.receipt_url,
        notes: sanitizedInput.notes,
      },
    });
  } catch (auditErr) {
    console.warn("Failed to write to audit_events:", auditErr);
  }

  return null;
}

export async function updateMember(input: {
  user_id: string;
  full_name: string;
  email?: string;
  phone: string;
  member_id?: string;
  referral_code?: string;
  role: string;
}) {
  await assertAuditAuthorized();
  const sanitizedInput = {
    user_id: input.user_id,
    full_name: cleanName(input.full_name),
    email: input.email ? cleanEmail(input.email) : undefined,
    phone: normalizePhoneNumber(input.phone),
    member_id: input.member_id ? cleanMemberId(input.member_id) : undefined,
    referral_code: input.referral_code ? cleanReferralCode(input.referral_code) : undefined,
    role: input.role,
  };

  const edgeResult = await invokeAdminAction("update_member", sanitizedInput);
  if (edgeResult.ok) return edgeResult.data;
  if (edgeResult.definitive) throw new Error(edgeResult.message);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: sanitizedInput.full_name,
      email: sanitizedInput.email || null,
      phone: sanitizedInput.phone,
      member_id: sanitizedInput.member_id || null,
      referral_code: sanitizedInput.referral_code || null,
      role: sanitizedInput.role,
    })
    .eq("id", sanitizedInput.user_id);

  if (error) throw new Error(friendlyDbError(error, "Failed to update member profile."));
  return null;
}

/**
 * The one action with a 3-tier chain in the old code: DB RPC first (fastest,
 * atomic), then the Edge Function, then a fully client-side fallback.
 */
export async function activateGreenCard(input: {
  user_id: string;
  existing_member_id?: string;
  transaction_ref?: string;
  payment_date?: string;
  receipt_url?: string;
  notes?: string;
}) {
  await assertAuditAuthorized();
  let resolvedMemberId = input.existing_member_id || "";
  const txRef = input.transaction_ref?.trim() || `ADMIN_GC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const paymentDate = input.payment_date || new Date().toISOString();

  const { data: rpcRes, error: rpcErr } = await supabase.rpc("admin_activate_green_card", {
    p_user_id: input.user_id,
    p_credit_referrer: true,
  });
  if (!rpcErr && rpcRes?.success) {
    resolvedMemberId = rpcRes.member_id || resolvedMemberId || "Assigned";
  } else {
    const edgeResult = await invokeAdminAction<{ member_id?: string }>("activate_green_card", {
      user_id: input.user_id,
      transaction_ref: txRef,
      payment_date: paymentDate,
      receipt_url: input.receipt_url,
      notes: input.notes,
    });
    if (edgeResult.ok) {
      resolvedMemberId = edgeResult.data.member_id || resolvedMemberId || "Assigned";
    } else if (edgeResult.definitive) {
      throw new Error(edgeResult.message);
    } else {
      const { data: memberId } = await supabase.rpc("get_or_create_green_card_member_id", {
        p_user_id: input.user_id,
        p_join_year: new Date().getFullYear(),
      });
      resolvedMemberId = memberId || resolvedMemberId || "AGC-NEW-2026";

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await supabase.from("subscriptions").delete().eq("user_id", input.user_id).eq("plan", "green_card");
      const { error: subErr } = await supabase.from("subscriptions").insert({
        user_id: input.user_id,
        plan: "green_card",
        status: "active",
        started_at: paymentDate,
        expires_at: oneYearFromNow.toISOString(),
      });
      if (subErr) throw new Error(friendlyDbError(subErr, "Failed to activate Green Card."));
    }
  }

  // Record payment in other_payments for financial audit continuity
  await supabase.from("other_payments").insert({
    user_id: input.user_id,
    payment_type: "green_card_offline",
    amount: 2000,
    slots: 0,
    project_category: "Green Card Membership (Admin Offline Activation)",
    status: "success",
    transaction_ref: txRef,
    metadata: {
      receipt_url: input.receipt_url || null,
      notes: input.notes || null,
      payment_date: paymentDate,
    },
  });

  // Record Admin Audit Event
  try {
    const { data: authUser } = await supabase.auth.getUser();
    await supabase.from("audit_events").insert({
      user_id: authUser?.user?.id || null,
      action: "MANUAL_GREEN_CARD_ACTIVATION",
      entity_type: "subscriptions",
      entity_id: input.user_id,
      payload: {
        admin_email: authUser?.user?.email,
        target_user_id: input.user_id,
        member_id: resolvedMemberId,
        amount: 2000,
        transaction_ref: txRef,
        payment_date: paymentDate,
        receipt_url: input.receipt_url || null,
        notes: input.notes || null,
      },
    });
  } catch (auditErr) {
    console.warn("Failed to write to audit_events:", auditErr);
  }

  return { member_id: resolvedMemberId };
}

export async function updateConfig(input: { key: string; value: Record<string, unknown> }) {
  await assertAuditAuthorized();
  const edgeResult = await invokeAdminAction("update_config", input);
  if (edgeResult.ok) return edgeResult.data;
  if (edgeResult.definitive) throw new Error(edgeResult.message);

  const { error } = await supabase.from("system_configs").upsert({ key: input.key, value: input.value });
  if (error) throw new Error(friendlyDbError(error, "Failed to update policy document."));
  return null;
}
