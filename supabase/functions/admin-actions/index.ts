// supabase/functions/admin-actions/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey;

    // 1. Verify that the caller is an authenticated administrator
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: { user: callerUser }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !callerUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Initialize admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Check admin role in profiles
    const { data: callerProfile, error: profileErr } = await adminClient
      .from("profiles")
      .select("role, full_name")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (profileErr || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ success: false, message: "Forbidden: Admin privileges required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    const { action } = payload;

    // ── ACTION: create_member ───────────────────────────────────────────────────
    if (action === "create_member") {
      const { full_name, email, phone, referral_code } = payload;
      if (!full_name || !email) {
        return new Response(
          JSON.stringify({ success: false, message: "Full name and email are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate secure temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "Ag!9";

      // 1. Create auth user with force_password_change flag
      const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name,
          phone,
          force_password_change: true,
          is_manually_activated: true,
        },
      });

      if (createErr) throw createErr;
      const newUser = authData.user;
      if (!newUser) throw new Error("Failed to create user account.");

      // 2. Resolve referrer if referral code provided
      let referrerId = null;
      if (referral_code?.trim()) {
        const { data: refUser } = await adminClient
          .from("profiles")
          .select("id")
          .eq("referral_code", referral_code.trim().toUpperCase())
          .maybeSingle();
        if (refUser) referrerId = refUser.id;
      }

      // 3. Update profile record
      const holdingExpiresAt = referrerId
        ? new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString()
        : null;

      await adminClient
        .from("profiles")
        .update({
          email: newUser.email || email.trim().toLowerCase(),
          full_name,
          phone: phone?.trim() || null,
          referred_by: referrerId,
          sponsor_id: referrerId,
          placement_status: referrerId ? "HOLDING_TANK" : "LOCKED",
          holding_tank_expires_at: holdingExpiresAt,
        })
        .eq("id", newUser.id);

      // 4. Generate official 6-character referral code
      await adminClient.rpc("get_or_create_referral_code", {
        p_user_id: newUser.id,
      });

      // 5. Activate Green Card using official atomic procedure (generates AGC-XXXXXX-2026, credits 1k referrer, credits core drivers)
      const { data: rpcRes, error: rpcErr } = await adminClient.rpc("admin_activate_green_card", {
        p_user_id: newUser.id,
        p_credit_referrer: Boolean(referrerId),
      });

      let memberId = rpcRes?.member_id;
      if (rpcErr || !memberId) {
        // Fallback to direct ID generator if RPC had warning
        const { data: fallbackId } = await adminClient.rpc("get_or_create_green_card_member_id", {
          p_user_id: newUser.id,
          p_join_year: new Date().getFullYear(),
        });
        memberId = fallbackId;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Member ${full_name} successfully registered.`,
          data: {
            user_id: newUser.id,
            email: newUser.email,
            member_id: memberId,
            temp_password: tempPassword,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: reset_password ──────────────────────────────────────────────────
    if (action === "reset_password") {
      const { user_id, email } = payload;
      if (!user_id && !email) {
        return new Response(
          JSON.stringify({ success: false, message: "User ID or email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let targetUserId = user_id;
      let targetEmail = email;

      if (!targetUserId) {
        const { data: targetUser } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();
        if (!targetUser) throw new Error("User not found for provided email.");
        targetUserId = targetUser.id;
      }

      const tempPassword = Math.random().toString(36).slice(-8) + "Rx!8";

      const { error: resetErr } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: tempPassword }
      );

      if (resetErr) throw resetErr;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password reset successful.",
          data: {
            user_id: targetUserId,
            email: targetEmail,
            temp_password: tempPassword
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: credit_slots ────────────────────────────────────────────────────
    if (action === "credit_slots") {
      const { user_id, slots, project_category } = payload;
      if (!user_id || !slots || slots < 1) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid user or slot quantity" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const category = project_category || "Mushroom Village";
      const SLOT_FEE = 1000;
      const SETUP_FEE = 3500;
      const SUPPORT_FEE = 500;
      const txRef = `ADMIN_CREDIT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // 1. Insert slot subscription
      const { error: slotErr } = await adminClient.from("slot_subscriptions").insert({
        user_id,
        amount: slots * SLOT_FEE,
        slotprice: SLOT_FEE,
        slots,
        status: "active",
        project_category: category,
        last_payment_date: new Date().toISOString(),
        next_payment_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString()
      });

      if (slotErr) throw slotErr;

      // 2. Insert setup & support logs in other_payments
      const { error: payErr } = await adminClient.from("other_payments").insert([
        {
          user_id,
          payment_type: "farm_setup",
          amount: slots * SETUP_FEE,
          months: 1,
          slots,
          project_category: category,
          status: "success",
          transaction_ref: txRef
        },
        {
          user_id,
          payment_type: "farm_support",
          amount: slots * SUPPORT_FEE,
          months: 1,
          slots,
          project_category: category,
          status: "success",
          transaction_ref: txRef
        }
      ]);

      if (payErr) throw payErr;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully credited ${slots} ${category} slots.`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: update_member ───────────────────────────────────────────────────
    if (action === "update_member") {
      const { user_id, full_name, email, phone, member_id, referral_code, role } = payload;
      if (!user_id) {
        return new Response(
          JSON.stringify({ success: false, message: "User ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updatePayload: Record<string, any> = {};
      if (full_name !== undefined) updatePayload.full_name = full_name.trim();
      if (email !== undefined) updatePayload.email = email.trim().toLowerCase();
      if (phone !== undefined) updatePayload.phone = phone.trim();
      if (member_id !== undefined) updatePayload.member_id = member_id.trim();
      if (referral_code !== undefined) updatePayload.referral_code = referral_code.trim().toUpperCase();
      if (role !== undefined) updatePayload.role = role;

      const { error: updateErr } = await adminClient
        .from("profiles")
        .update(updatePayload)
        .eq("id", user_id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Member profile updated successfully."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: activate_green_card ────────────────────────────────────────────
    if (action === "activate_green_card") {
      const { user_id, credit_referrer = true } = payload;
      if (!user_id) {
        return new Response(
          JSON.stringify({ success: false, message: "User ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Execute atomic DB procedure: assigns AGC-XXXXXX-2026, activates 1-yr sub, credits ₦1,000 to referrer, credits ₦50 to each driver
      const { data: rpcRes, error: rpcErr } = await adminClient.rpc("admin_activate_green_card", {
        p_user_id: user_id,
        p_credit_referrer: credit_referrer,
      });

      if (rpcErr) {
        throw rpcErr;
      }

      const memberId = rpcRes?.member_id || "Assigned";
      const expiresAt = rpcRes?.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      return new Response(
        JSON.stringify({
          success: true,
          message: `Green Card activated successfully. Member ID: ${memberId}`,
          data: {
            member_id: memberId,
            expires_at: expiresAt,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: update_config ───────────────────────────────────────────────────
    if (action === "update_config") {
      const { key, value } = payload;
      if (!key || value === undefined) {
        return new Response(
          JSON.stringify({ success: false, message: "Key and value are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: cfgErr } = await adminClient.from("system_configs").upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: callerUser.id
      });

      if (cfgErr) throw cfgErr;

      return new Response(
        JSON.stringify({ success: true, message: `Configuration '${key}' updated successfully.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
