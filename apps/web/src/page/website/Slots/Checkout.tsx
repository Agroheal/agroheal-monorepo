import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Plus,
  Shield,
  ShieldCheck,
  Sprout,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Phone,
  Check,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import * as Sentry from "@sentry/react";
import { DEFAULT_CATEGORY } from "@/constant/projectCategories";
import { cleanName, cleanEmail, normalizePhoneNumber } from "@shared/dataSanitizers";
import { NIGERIA_STATES, getLgasForState } from "@shared/nigeriaLocations";
import {
  BASE_SLOT_PRICE as SLOT_UNIT_PRICE,
  GREEN_CARD_FEE,
  getGreenCardFee,
} from "@shared/businessRules";
import { FLUTTERWAVE_KEYS } from "@/config/Index";

async function ensureFlutterwaveScript(): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
    return true;
  }
  return new Promise((resolve) => {
    let script = document.getElementById("flutterwave-script") as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
    let done = false;
    script.onload = () => {
      if (!done) {
        done = true;
        resolve(true);
      }
    };
    script.onerror = () => {
      if (!done) {
        done = true;
        resolve(false);
      }
    };
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
        clearInterval(interval);
        if (!done) {
          done = true;
          resolve(true);
        }
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      if (!done) {
        done = true;
        resolve(Boolean(typeof window !== "undefined" && (window as any).FlutterwaveCheckout));
      }
    }, 6000);
  });
}

async function recordSubscriptionWithFarmGroupSplit({
  userId,
  checkoutId,
  amount,
  slotPrice,
  slots,
  category,
  isStarterPack,
  isCombo,
  isGreenCardOnly,
  isFirstSlotPurchase,
}: {
  userId: string;
  checkoutId: string;
  amount: number;
  slotPrice: number;
  slots: number;
  category: string;
  isStarterPack: boolean;
  isCombo?: boolean;
  isGreenCardOnly?: boolean;
  isFirstSlotPurchase?: boolean;
}) {
  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 365);
  const DEFAULT_GROUP_ID = "230ab237-0770-4dce-84fe-221f224276bc"; // Pioneers Farm [Mushroom Village]

  // If user only bought green card without combo or slots, return early
  if (isGreenCardOnly || (!isStarterPack && !isCombo && slots === 0)) {
    return;
  }

  // If pure starter pack product purchase
  if (isStarterPack) {
    let productCode = "SP-MUSH-100G";
    let productId: string | null = null;
    let pvEarned = amount;
    let productName = "Mushroom Power 100g";

    try {
      const { data: prod } = await supabase
        .from("products")
        .select("id, code, name, price, pv")
        .eq("category", "STARTER_PACK")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (prod) {
        productId = prod.id;
        productCode = prod.code || productCode;
        pvEarned = Number(prod.pv) || pvEarned;
        productName = prod.name || productName;
      }
    } catch (e) {
      console.warn("Could not query products table, falling back to default starter pack code:", e);
    }

    try {
      await supabase.from("orders").insert([
        {
          user_id: userId,
          transaction_id: checkoutId,
          product_id: productId,
          product_code: productCode,
          quantity: 1,
          unit_price: amount,
          total_price: amount,
          pv_earned: pvEarned,
          status: "PAID",
          notes: `Starter Pack Activation: ${productName} (${productCode})`,
        },
      ]);
    } catch (orderErr) {
      console.error("Failed to insert into orders table:", orderErr);
    }

    await supabase
      .from("profiles")
      .update({ has_purchased_starter_pack: true, is_wealth_creation_active: true })
      .eq("id", userId);

    return;
  }

  // If Combo or First Slot Purchase, allocate Starter Pack (Mushroom Power 100g) as part of the package
  if (isCombo || isFirstSlotPurchase) {
    let productId: string | null = null;
    let productCode = "SP-MUSH-100G";
    let productName = "Mushroom Power 100g";
    let pvEarned = 5000;

    try {
      const { data: prod } = await supabase
        .from("products")
        .select("id, code, name, price, pv")
        .eq("code", "SP-MUSH-100G")
        .maybeSingle();

      if (prod) {
        productId = prod.id;
        productCode = prod.code || productCode;
        pvEarned = Number(prod.pv) || pvEarned;
        productName = prod.name || productName;
      }
    } catch (e) {
      console.warn("Could not query products table for SP-MUSH-100G:", e);
    }

    try {
      await supabase.from("orders").insert([
        {
          user_id: userId,
          transaction_id: checkoutId,
          product_id: productId,
          product_code: productCode,
          quantity: 1,
          unit_price: 5000,
          total_price: 5000,
          pv_earned: pvEarned,
          status: "PAID",
          notes: `Starter Pack: ${productName} (${productCode}) included in package`,
        },
      ]);
    } catch (orderErr) {
      console.warn("Could not record starter pack order:", orderErr);
    }

    await supabase
      .from("profiles")
      .update({ has_purchased_starter_pack: true, is_wealth_creation_active: true })
      .eq("id", userId);
  }

  // Farm Slot Allocation (Strictly Mushroom Village with Sponsor Group & 1,000-slot overflow clusters)
  try {
    let targetGroupId = DEFAULT_GROUP_ID;

    // 1. Fetch sponsor/referrer to link to their Mushroom Village cluster
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("referred_by, sponsor_id")
      .eq("id", userId)
      .maybeSingle();

    const sponsorId = userProfile?.sponsor_id || userProfile?.referred_by;
    if (sponsorId) {
      // 1a. Check if sponsor coordinates a Mushroom Village farm group
      const { data: coordGroup } = await supabase
        .from("farm_groups")
        .select("id, name")
        .eq("coordinator_id", sponsorId)
        .eq("project_category", "Mushroom Village")
        .maybeSingle();

      if (coordGroup?.id) {
        targetGroupId = coordGroup.id;
      } else {
        // 1b. Check if sponsor has slots in a Mushroom Village farm group
        const { data: sponsorSlot } = await supabase
          .from("slot_subscriptions")
          .select("farm_group_id")
          .eq("user_id", sponsorId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sponsorSlot?.farm_group_id) {
          targetGroupId = sponsorSlot.farm_group_id;
        }
      }
    }

    // 2. Fetch base group details
    const { data: baseGroup } = await supabase
      .from("farm_groups")
      .select("id, name, slug, coordinator_id, project_category")
      .eq("id", targetGroupId)
      .maybeSingle();

    if (baseGroup) {
      const baseRootName = baseGroup.name.replace(/\s*\(\d+\)$/, "").trim();
      const baseRootSlug = (baseGroup.slug || "mushroom-farm").replace(/-\d+$/, "").trim();

      // Find all clusters in this family
      const { data: familyClusters } = await supabase
        .from("farm_groups")
        .select("id, name, slug, coordinator_id")
        .ilike("name", `${baseRootName}%`)
        .order("created_at", { ascending: true });

      const clustersList = familyClusters && familyClusters.length > 0 ? familyClusters : [baseGroup];
      let resolvedGroupId: string | null = null;

      for (const cluster of clustersList) {
        const { data: subs } = await supabase
          .from("slot_subscriptions")
          .select("slots")
          .eq("farm_group_id", cluster.id)
          .eq("status", "active");

        const totalSlots = (subs || []).reduce((acc: number, curr: any) => acc + (Number(curr.slots) || 1), 0);
        if (totalSlots + slots <= 1000) {
          resolvedGroupId = cluster.id;
          break;
        }
      }

      if (resolvedGroupId) {
        targetGroupId = resolvedGroupId;
      } else {
        // All existing clusters are full (>= 1,000 slots) -> create the next overflow cluster!
        const nextIndex = clustersList.length + 1;
        const nextClusterName = `${baseRootName} (${nextIndex})`;
        const nextClusterSlug = `${baseRootSlug}-${nextIndex}`;

        const { data: newCluster } = await supabase
          .from("farm_groups")
          .insert([
            {
              name: nextClusterName,
              slug: nextClusterSlug,
              project_category: "Mushroom Village",
              coordinator_id: baseGroup.coordinator_id || null,
              description: `Sub-Cluster ${nextIndex} for ${baseRootName} (Capacity: 1,000 slots)`,
            },
          ])
          .select("id")
          .single();

        if (newCluster?.id) {
          targetGroupId = newCluster.id;
        }
      }
    }

    await supabase.from("slot_subscriptions").insert([
      {
        user_id: userId,
        checkout_id: checkoutId,
        amount: amount,
        slotprice: slotPrice,
        status: "active",
        slots: slots,
        last_payment_date: new Date().toISOString(),
        next_payment_date: nextPaymentDate.toISOString(),
        project_category: category || "Mushroom Village",
        farm_group_id: targetGroupId,
        is_starter_pack: false,
      },
    ]);
  } catch (farmErr) {
    console.warn("Farm group slot assignment fallback:", farmErr);
    await supabase.from("slot_subscriptions").insert([
      {
        user_id: userId,
        checkout_id: checkoutId,
        amount: amount,
        slotprice: slotPrice,
        status: "active",
        slots: slots,
        last_payment_date: new Date().toISOString(),
        next_payment_date: nextPaymentDate.toISOString(),
        project_category: category || "Mushroom Village",
        farm_group_id: DEFAULT_GROUP_ID,
        is_starter_pack: false,
      },
    ]);
  }
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const productParam = searchParams.get("product") || "";
  const itemParam = searchParams.get("item") || "";
  const bundleParam = searchParams.get("bundle") || "";
  const codeParam = searchParams.get("code") || "";

  const isStarterPack =
    itemParam === "starter_pack" ||
    productParam === "starter_pack" ||
    productParam === "SP-MUSH-100G" ||
    codeParam === "SP-MUSH-100G";
  const requestedProductCode = codeParam || (productParam === "SP-MUSH-100G" ? "SP-MUSH-100G" : "SP-MUSH-100G");

  const [starterProduct, setStarterProduct] = useState<{
    id?: string;
    code: string;
    name: string;
    price: number;
    pv: number;
    product_spec?: any;
    description?: string;
  }>({
    code: "SP-MUSH-100G",
    name: "Mushroom Power 100g",
    price: 5000,
    pv: 5000,
    product_spec: { weight: "100g" },
  });

  useEffect(() => {
    if (isStarterPack) {
      supabase
        .from("products")
        .select("id, code, name, price, pv, product_spec, description")
        .or(`code.eq.${requestedProductCode},code.eq.SP-MUSH-100G`)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setStarterProduct({
              id: data.id,
              code: data.code,
              name: data.name,
              price: Number(data.price) || 5000,
              pv: Number(data.pv) || 5000,
              product_spec: data.product_spec,
              description: data.description,
            });
          }
        });
    }
  }, [isStarterPack, requestedProductCode]);

  const isStarterCompletion = bundleParam === "starter_completion";

  const isComboRequested =
    itemParam === "combo" ||
    productParam === "combo" ||
    productParam === "green_card_combo" ||
    bundleParam === "starter" ||
    bundleParam === "starter_completion";

  // Per Management Decision: No more standalone ₦2,000 Green Card payment.
  // Starting requires the full ₦12,000 Starter Combo (Green Card + 1 Slot + Mushroom Power 100g).
  const isGreenCardOnly = false;

  const rawUrlSlots = searchParams.get("slots");
  const parsedSlots = rawUrlSlots !== null ? parseInt(rawUrlSlots, 10) : 1;
  const initialSlots = isStarterPack
    ? 0
    : (!isNaN(parsedSlots) && parsedSlots >= 1 ? parsedSlots : 1);

  const [slotQuantity, setSlotQuantity] = useState(initialSlots);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);

  const [hasGreenCard, setHasGreenCard] = useState<boolean>(false);
  const [hasPriorSlots, setHasPriorSlots] = useState<boolean>(false);
  const [hasPurchasedStarterPack, setHasPurchasedStarterPack] = useState<boolean>(false);
  const [memberCreatedAt, setMemberCreatedAt] = useState<string | null>(null);
  const [profileResidenceState, setProfileResidenceState] = useState<string>("");
  const [profileResidenceLga, setProfileResidenceLga] = useState<string>("");
  const [hasResidenceSlot, setHasResidenceSlot] = useState<boolean>(false);

  // The Combo is the initial slot (₦5,000) + starter mushroom product (Mushroom Power 100g, ₦5,000) = ₦10,000
  // Non-cardholders starting out or users without starter packs are required to get the combo
  const isNewStarter = !hasGreenCard && !isStarterPack && !isStarterCompletion;
  const isCombo = !isStarterPack && (isComboRequested || isNewStarter || (!hasPriorSlots && !hasPurchasedStarterPack));
  const isFirstSlotPurchase = !isStarterPack && (isCombo || !hasPriorSlots || !hasPurchasedStarterPack);

  const COMBO_PRICE = 10000; // ₦5,000 Initial Slot + ₦5,000 Mushroom Power 100g
  const slotsSubtotal = isStarterPack
    ? starterProduct.price
    : isCombo
    ? COMBO_PRICE + Math.max(0, slotQuantity - 1) * SLOT_UNIT_PRICE
    : slotQuantity * SLOT_UNIT_PRICE;

  // Green Card fee is ₦2,000 for non-cardholders starting out (part of ₦12,000 package)
  const activeGreenCardRate = 2000;
  const needsGreenCard = !hasGreenCard && !isStarterPack && !isStarterCompletion;
  const greenCardFee = needsGreenCard ? activeGreenCardRate : 0;
  const totalPrice = slotsSubtotal + greenCardFee;

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"flutterwave" | "wallet">("flutterwave");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [lockedLedgerBalance, setLockedLedgerBalance] = useState<number>(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    country: "Nigeria",
    state: "",
    lga: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPhoneValid = normalizePhoneNumber(formData.phone).length >= 10;

  // Load Flutterwave script
  useEffect(() => {
    if (document.getElementById("flutterwave-script")) return;
    const script = document.createElement("script");
    script.id = "flutterwave-script";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Auto-prefill logged in member details & subscriptions
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [
          { data: profile },
          { data: subs },
          { count, data: slotsData },
          { data: ledgerEntries },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, phone, email, referral_earnings, wallet_balance, created_at, has_purchased_starter_pack, is_wealth_creation_active, is_green_card_holder, has_greencard, member_id, country, state, lga")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("subscriptions")
            .select("expires_at, status, plan")
            .eq("user_id", user.id)
            .eq("plan", "green_card")
            .eq("status", "active"),
          supabase
            .from("slot_subscriptions")
            .select("id, status, state, lga, slots", { count: "exact" })
            .eq("user_id", user.id)
            .eq("status", "active"),
          supabase
            .from("wallet_ledger")
            .select("amount, entry_type, status")
            .eq("user_id", user.id),
        ]);

        setCurrentUser(user);
        setMemberCreatedAt(profile?.created_at || user.created_at || null);

        let extractedFirstName = "";
        let extractedLastName = "";

        if (profile?.full_name) {
          const parts = profile.full_name.trim().split(/\s+/);
          extractedFirstName = parts[0] || "";
          extractedLastName = parts.slice(1).join(" ") || "";
        }

        if (!extractedFirstName && user.user_metadata?.first_name) {
          extractedFirstName = String(user.user_metadata.first_name).trim();
        }
        if (!extractedLastName && user.user_metadata?.last_name) {
          extractedLastName = String(user.user_metadata.last_name).trim();
        }

        const resolvedEmail = user.email || profile?.email || "";
        if (!extractedFirstName && resolvedEmail) {
          extractedFirstName = resolvedEmail.split("@")[0] || "Member";
        }
        if (!extractedLastName) {
          extractedLastName = "Member";
        }

        const resolvedPhone = profile?.phone || (user.user_metadata?.phone as string) || "";
        const resState = (profile?.state || "").trim();
        const resLga = (profile?.lga || "").trim();
        setProfileResidenceState(resState);
        setProfileResidenceLga(resLga);

        // First Slot Rule: Check if member already has an active slot in their residential jurisdiction
        const activeSlots = (slotsData as any[]) || [];
        const hasHomeSlot = Boolean(
          activeSlots.length > 0 &&
          resState &&
          resLga &&
          activeSlots.some((s: any) =>
            (s.state && s.lga &&
             s.state.toLowerCase() === resState.toLowerCase() &&
             s.lga.toLowerCase() === resLga.toLowerCase()) ||
            (!s.state && !s.lga) // legacy slots assumed at home residence
          )
        );
        setHasResidenceSlot(hasHomeSlot);

        setFormData({
          firstName: extractedFirstName,
          lastName: extractedLastName,
          phone: resolvedPhone,
          email: resolvedEmail,
          country: "Nigeria",
          state: resState,
          lga: resLga,
        });

        // Compute available spendable wallet balance
        const directEarnings = Math.max(0, Number(profile?.referral_earnings) || 0);
        let ledgerAvailNet = 0;
        let ledgerLockedCredits = 0;

        (ledgerEntries || []).forEach((row: any) => {
          const amt = Math.abs(Number(row.amount) || 0);
          if (row.status === "AVAILABLE") {
            if (row.entry_type === "CREDIT") ledgerAvailNet += amt;
            else if (row.entry_type === "DEBIT") ledgerAvailNet -= amt;
          } else if (row.status === "LOCKED" && row.entry_type === "CREDIT") {
            ledgerLockedCredits += amt;
          }
        });

        const computedAvailable = Math.max(0, directEarnings + Math.max(0, ledgerAvailNet));
        setWalletBalance(computedAvailable);
        setLockedLedgerBalance(ledgerLockedCredits);

        const isSubActive = Boolean(
          subs &&
            subs.some(
              (s) => !s.expires_at || new Date(s.expires_at).getTime() > Date.now()
            )
        );
        const userHasGreenCard = Boolean(
          profile?.member_id ||
          profile?.is_green_card_holder ||
          profile?.has_greencard ||
          isSubActive
        );
        setHasGreenCard(userHasGreenCard);

        setHasPriorSlots(Boolean((count && count > 0) || (slotsData && slotsData.length > 0)));
        setHasPurchasedStarterPack(Boolean(profile?.has_purchased_starter_pack || profile?.is_wealth_creation_active));
      } catch (err) {
        console.error("Error loading profile in checkout:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const incrementSlot = () => setSlotQuantity((q) => Math.min(q + 1, 100));
  const decrementSlot = () => setSlotQuantity((q) => Math.max(q - 1, 1));

  const createCheckout = async (method: "flutterwave" | "wallet" = "flutterwave") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to make payment.",
        variant: "destructive",
      });
      return null;
    }

    const cleanFirstName = cleanName(formData.firstName);
    const cleanLastName = cleanName(formData.lastName);
    const normalizedEmail = cleanEmail(formData.email) || currentUser?.email || (user as any)?.email;
    const rawPhone = formData.phone || (user.user_metadata?.phone as string) || "";
    const cleanPhone = normalizePhoneNumber(rawPhone);
    // For logged-in users, phone is optional; fall back to safe default if empty
    const normalizedPhone = cleanPhone || (user ? "08000000000" : "");

    if (!normalizedEmail) {
      toast({
        title: "Email Required",
        description: "Please provide a valid contact email address.",
        variant: "destructive",
      });
      return null;
    }

    // Phone is only compulsory for guest checkout (when not logged in)
    if (!user && (!normalizedPhone || normalizedPhone.length < 10)) {
      setErrors((prev) => ({ ...prev, phone: "Please enter a valid phone number (at least 10 digits)" }));
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to complete guest checkout.",
        variant: "destructive",
      });
      const el = document.getElementById("checkout-phone-input");
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return null;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: user.id,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          email: normalizedEmail,
          phone: normalizedPhone,
          amount: totalPrice,
          payment_method: method,
          status: "pending",
          state: formData.state || null,
          lga: formData.lga || null,
          project_category: isCombo
            ? "Green Card + Starter Combo"
            : isGreenCardOnly
            ? "Green Card"
            : (isStarterPack ? "Mushroom Power 100g" : category),
        },
      ])
      .select()
      .single();

    if (error) {
      Sentry.captureException(error);
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    // Auto-save full_name and phone to profiles (residential location remains unchanged)
    try {
      const combinedName = `${cleanFirstName} ${cleanLastName}`.trim();
      const profileSyncUpdates: Record<string, any> = {
        full_name: combinedName,
        phone: normalizedPhone,
      };

      await supabase
        .from("profiles")
        .update(profileSyncUpdates)
        .eq("id", user.id);
    } catch (profileSyncErr) {
      console.warn("Non-blocking profile sync error:", profileSyncErr);
    }

    return data;
  };

  const handleWalletPayment = async () => {
    if (walletBalance < totalPrice) {
      toast({
        title: "Insufficient Wallet Balance",
        description: `Your available wallet balance is ₦${walletBalance.toLocaleString()}, but this order requires ₦${totalPrice.toLocaleString()}. Please choose Pay Online (Flutterwave).`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const order = await createCheckout("wallet");
      if (!order) {
        setIsProcessing(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User session expired");

      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        "pay_checkout_with_wallet",
        {
          p_user_id: user.id,
          p_checkout_id: String(order.id),
          p_amount: totalPrice,
          p_slots: isStarterPack ? 0 : slotQuantity,
          p_slot_price: SLOT_UNIT_PRICE,
          p_category: category,
        }
      );

      if (rpcErr) {
        throw new Error(rpcErr.message);
      }

      if (!rpcRes?.success) {
        throw new Error(rpcRes?.message || "Wallet deduction failed.");
      }

      let settled = false;
      let walletSettleRes: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          walletSettleRes = await apiClient.checkout.settle({
            userId: user.id,
            transactionId: String(order.id),
            paymentReference: `WALLET_${order.id}_${Date.now()}`,
            paymentMethod: "wallet",
            amount: totalPrice,
            category: isCombo ? "Mushroom Village" : category,
            slots: (isGreenCardOnly || isStarterPack) ? 0 : Math.max(1, slotQuantity),
            isCombo,
            isGreenCardOnly,
            isStarterPack,
            isFirstSlotPurchase,
          });
          settled = true;
          break;
        } catch (settleErr: any) {
          console.warn(`[Checkout] Wallet settlement attempt ${attempt} notice:`, settleErr?.message);
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }
      }

      if (walletSettleRes?.isDebtRecovery) {
        setWalletBalance((prev) => Math.max(0, prev - totalPrice + (Number(walletSettleRes.surplusCredited) || 0)));
        toast({
          title: "Loan Settlement Applied! ⚖️",
          description: `₦${Number(walletSettleRes.debtRecovered || 0).toLocaleString()} was applied towards your advance debt. Remaining debt: ₦${Number(walletSettleRes.remainingDebt || 0).toLocaleString()}.${Number(walletSettleRes.surplusCredited || 0) > 0 ? ` Surplus ₦${Number(walletSettleRes.surplusCredited || 0).toLocaleString()} credited to your wallet.` : ""}`,
        });
        navigate("/dashboard");
        return;
      }

      if (!settled) {
        console.warn("[Checkout] Centralized wallet settlement unavailable after 3 attempts; falling back to direct database state update.");
        if (!isGreenCardOnly && !isStarterPack && (slotQuantity > 0 || isCombo)) {
          await recordSubscriptionWithFarmGroupSplit({
            userId: user.id,
            checkoutId: order.id,
            amount: isCombo ? 5000 : totalPrice,
            slotPrice: SLOT_UNIT_PRICE,
            slots: (isGreenCardOnly || isStarterPack) ? 0 : Math.max(1, slotQuantity),
            category: isCombo ? "Mushroom Village" : category,
            isStarterPack,
            isCombo,
            isGreenCardOnly,
            isFirstSlotPurchase,
          });
        }
      }

      if (!hasGreenCard && !isStarterPack) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
        await supabase.from("subscriptions").upsert(
          [
            {
              user_id: user.id,
              plan: "green_card",
              status: "active",
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            },
          ],
          { onConflict: "user_id" },
        );
        await supabase.from("profiles").update({
          is_green_card_holder: true,
          has_greencard: true,
          greencard_status: "active",
        }).eq("id", user.id);
      }

      setWalletBalance((prev) => Math.max(0, prev - totalPrice));

      if (isGreenCardOnly) {
        if (slotQuantity > 0) {
          toast({
            title: "Milestone 3 Unlocked! 🚀",
            description: `₦${totalPrice.toLocaleString()} paid from wallet. Your Green Card, Farm Slot, and Mushroom Power (100g) are active!`,
          });
          navigate("/dashboard");
        } else {
          toast({
            title: "Green Card Activated! 🌿",
            description: `₦${totalPrice.toLocaleString()} paid from wallet. Your lifetime Green Card Pass is active.`,
          });
          navigate("/dashboard");
        }
      } else if (isStarterPack) {
        toast({
          title: "Mushroom Power 100g Activated!",
          description: "Your ₦5,000 Mushroom Power 100g (SP-MUSH-100G) has been activated via wallet. 5×7 Matrix & withdrawals unlocked!",
        });
        navigate("/dashboard/my-network");
      } else {
        toast({
          title: "Slot Secured Successfully!",
          description: `₦${totalPrice.toLocaleString()} paid from wallet. ${slotQuantity} slot(s) activated!`,
        });
        navigate("/dashboard/farm-operations/my-slots");
      }
    } catch (err: any) {
      console.error("Wallet payment failed:", err);
      Sentry.captureException(err);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to complete wallet payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlutterwave = async () => {
    const resolvedEmail = cleanEmail(formData.email) || currentUser?.email;
    if (!resolvedEmail) {
      toast({
        title: "Session Error",
        description: "User session email not found. Please refresh or sign in again.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window !== "undefined" && !(window as any).FlutterwaveCheckout) {
      setIsProcessing(true);
      const loaded = await ensureFlutterwaveScript();
      if (!loaded || !(window as any).FlutterwaveCheckout) {
        setIsProcessing(false);
        toast({
          title: "Payment Error",
          description: "Flutterwave payment script failed to load. Please check your internet connection and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const flwKey =
      (typeof FLUTTERWAVE_KEYS === "string" ? FLUTTERWAVE_KEYS : (FLUTTERWAVE_KEYS as any)?.publicKey) ||
      import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      "FLWPUBK-21808627a82aaa069c67aaedb5f7b37f-X";

    setIsProcessing(true);

    const order = await createCheckout("flutterwave");
    if (!order) {
      setIsProcessing(false);
      return;
    }

    try {
      const txPrefix = isCombo
        ? "COMBO"
        : isGreenCardOnly
        ? "GC"
        : isStarterPack
        ? "SP"
        : "SLOT";
      const txRef = `${txPrefix}_${order.id}_${Date.now()}`;

      window.FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: txRef,
        amount: totalPrice,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: order.email,
          phone_number: order.phone,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
        },
        meta: {
          user_id: order.user_id,
          state: formData.state,
          lga: formData.lga,
          country: "Nigeria",
          plan: isCombo
            ? "green_card_combo"
            : isGreenCardOnly
            ? "green_card"
            : isStarterPack
            ? "starter_pack"
            : "slot",
          project_category: isCombo
            ? "Green Card + Starter Combo"
            : isGreenCardOnly
            ? "Green Card"
            : isStarterPack
            ? "Mushroom Power 100g"
            : category,
          has_combo: isCombo,
          isCombo: isCombo,
        },
        customizations: {
          title: isStarterPack
            ? "Mushroom Power 100g (SP-MUSH-100G)"
            : isStarterCompletion
            ? "AgroHeal Package (₦10,000 Combo)"
            : isCombo
            ? "AgroHeal Package (₦12,000)"
            : "Agroheal Farm Slot",
          description: isStarterPack
            ? "Mushroom Power 100g (Product ID: SP-MUSH-100G)"
            : isStarterCompletion
            ? "1 Farm Slot + Mushroom Power 100g (SP-MUSH-100G)"
            : isCombo
            ? "Green Card Pass + 1 Farm Slot + Mushroom Power 100g (SP-MUSH-100G)"
            : `${slotQuantity} slot${slotQuantity > 1 ? "s" : ""} — ₦${totalPrice.toLocaleString()}`,
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => {
          toast({
            title: "Payment Cancelled",
            description: "You closed the payment window.",
          });
          setIsProcessing(false);
        },
        callback: function (response) {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            Sentry.metrics.count("payment_success", 1);
            const flwTransactionId =
              response.transaction_id || response.id || response.flw_ref;

            const activateSlot = async () => {
              try {
                let settled = false;
                let flwSettleRes: any = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                  try {
                    flwSettleRes = await apiClient.checkout.settle({
                      userId: order.user_id,
                      transactionId: order.id,
                      paymentReference: String(flwTransactionId),
                      paymentMethod: "flutterwave",
                      amount: totalPrice,
                      category: isCombo ? "Mushroom Village" : category,
                      slots: (isGreenCardOnly || isStarterPack) ? 0 : Math.max(1, slotQuantity),
                      isCombo,
                      isGreenCardOnly,
                      isStarterPack,
                      isFirstSlotPurchase,
                    });
                    settled = true;
                    break;
                  } catch (settleErr: any) {
                    console.warn(`[Checkout] Settlement attempt ${attempt} notice:`, settleErr?.message);
                    if (attempt < 3) {
                      await new Promise((r) => setTimeout(r, attempt * 1200));
                    }
                  }
                }

                if (flwSettleRes?.isDebtRecovery) {
                  toast({
                    title: "Loan Settlement Applied! ⚖️",
                    description: `₦${Number(flwSettleRes.debtRecovered || 0).toLocaleString()} was applied towards your advance debt. Remaining debt: ₦${Number(flwSettleRes.remainingDebt || 0).toLocaleString()}.${Number(flwSettleRes.surplusCredited || 0) > 0 ? ` Surplus ₦${Number(flwSettleRes.surplusCredited || 0).toLocaleString()} credited to your wallet.` : ""}`,
                  });
                  navigate("/dashboard");
                  return;
                }

                if (!settled) {
                  console.warn("[Checkout] Centralized settlement unavailable after 3 attempts; falling back to direct database state update.");
                  await supabase
                    .from("transactions")
                    .update({
                      status: "paid",
                      transaction_ref: String(flwTransactionId),
                    })
                    .eq("id", order.id);

                  if (!isGreenCardOnly && !isStarterPack && (slotQuantity > 0 || isCombo)) {
                    await recordSubscriptionWithFarmGroupSplit({
                      userId: order.user_id,
                      checkoutId: order.id,
                      amount: isCombo ? 5000 : totalPrice,
                      slotPrice: SLOT_UNIT_PRICE,
                      slots: (isGreenCardOnly || isStarterPack) ? 0 : Math.max(1, slotQuantity),
                      category: isCombo ? "Mushroom Village" : category,
                      isStarterPack,
                      isCombo,
                      isGreenCardOnly,
                      isFirstSlotPurchase,
                    });
                  }
                }

                if (!hasGreenCard && !isStarterPack) {
                  const expiresAt = new Date();
                  expiresAt.setFullYear(expiresAt.getFullYear() + 100);
                  await supabase.from("subscriptions").upsert(
                    [
                      {
                        user_id: order.user_id,
                        plan: "green_card",
                        status: "active",
                        started_at: new Date().toISOString(),
                        expires_at: expiresAt.toISOString(),
                      },
                    ],
                    { onConflict: "user_id" },
                  );
                  await supabase.from("profiles").update({
                    is_green_card_holder: true,
                    has_greencard: true,
                    greencard_status: "active",
                  }).eq("id", order.user_id);
                }

                if (isGreenCardOnly) {
                  if (slotQuantity > 0) {
                    toast({
                      title: "Milestone 3 Unlocked! 🚀",
                      description: "Your Green Card + Starter Combo are active! You have jumped straight to Milestone 3.",
                    });
                    navigate("/dashboard");
                  } else {
                    toast({
                      title: "Green Card Activated! 🌿",
                      description: "Welcome! Your lifetime Green Card Pass is active.",
                    });
                    navigate("/dashboard");
                  }
                } else if (isStarterPack) {
                  toast({
                    title: "Starter Pack Activated!",
                    description: "Your ₦5,000 Mushroom Starter Pack has been activated.",
                  });
                  navigate("/dashboard/my-network");
                } else {
                  toast({
                    title: "Payment Successful!",
                    description: "Your slot has been secured!",
                  });
                  navigate("/dashboard/farm-operations/my-slots");
                }
              } catch (err) {
                console.error("Direct activation failed:", err);
                toast({
                  title: "Activation Error",
                  description: "Payment received but failed to update record. Please contact support.",
                  variant: "destructive",
                });
              } finally {
                setIsProcessing(false);
              }
            };

            activateSlot();
          } else {
            setIsProcessing(false);
          }
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handlePayClick = () => {
    // Only enforce phone number for guests without an authenticated session
    if (!currentUser) {
      const cleanPhone = normalizePhoneNumber(formData.phone);
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrors({ phone: "Please enter a valid phone number (at least 10 digits)" });
        toast({
          title: "Contact Phone Required",
          description: "Please enter your contact phone number to complete guest checkout.",
          variant: "destructive",
        });
        const el = document.getElementById("checkout-phone-input");
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }

    // Validate State and LGA for community farm anchoring
    if (!formData.state || !formData.lga) {
      toast({
        title: "Jurisdiction Required",
        description: "Please select the State and Local Government Area (LGA) for this community farm subscription.",
        variant: "destructive",
      });
      const locEl = document.getElementById("checkout-state-select");
      if (locEl) {
        locEl.focus();
        locEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!category) {
      setCategory(DEFAULT_CATEGORY);
    }

    setErrors({});

    if (paymentMethod === "wallet") {
      handleWalletPayment();
    } else {
      handleFlutterwave();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <main className="pt-6">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header & Breadcrumb */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>256-Bit SSL Encrypted & Verified Checkout</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {isStarterPack
                ? "Activate Your Mushroom Starter Pack (100g)"
                : isStarterCompletion
                ? "Secure Your Starter Package (₦10,000 Combo)"
                : isGreenCardOnly || isCombo
                ? "Complete Your AgroHeal Membership Activation"
                : "Secure Commercial Farm Slots"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select your payment method and review your order summary below.
            </p>
          </motion.div>

          {/* 2-Column Responsive Layout (Side-by-Side from md: upward) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ── LEFT COLUMN: PAYMENT METHOD (6-7 Cols) ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-6 lg:col-span-7 space-y-6"
            >
              {/* Community Farm Jurisdiction (State & LGA) */}
              <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-foreground">
                        Community Farm Jurisdiction
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Select the State &amp; LGA where your farm operations will be anchored.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                    Nigeria
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                      Target State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="checkout-state-select"
                      value={formData.state}
                      disabled={!hasResidenceSlot && Boolean(profileResidenceState && profileResidenceLga)}
                      onChange={(e) => {
                        const newState = e.target.value;
                        const validLgas = getLgasForState(newState);
                        setFormData((prev) => ({
                          ...prev,
                          state: newState,
                          lga: validLgas.includes(prev.lga) ? prev.lga : "",
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-foreground disabled:opacity-75 disabled:bg-muted"
                      required
                    >
                      <option value="" disabled>Select State</option>
                      {NIGERIA_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                      Local Government (LGA) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.lga}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lga: e.target.value }))}
                      disabled={(!formData.state) || (!hasResidenceSlot && Boolean(profileResidenceState && profileResidenceLga))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-foreground disabled:opacity-75 disabled:bg-muted"
                      required
                    >
                      <option value="" disabled>
                        {formData.state ? "Select LGA" : "Select State First"}
                      </option>
                      {getLgasForState(formData.state).map((lg) => (
                        <option key={lg} value={lg}>
                          {lg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {!hasResidenceSlot && profileResidenceState && profileResidenceLga ? (
                    <span className="text-emerald-800 font-medium">
                      First slot anchored to your residential jurisdiction: <strong>{profileResidenceLga}, {profileResidenceState}</strong>. Subsequent slots can be sponsored in any LGA nationwide.
                    </span>
                  ) : formData.state && formData.lga ? (
                    <span className="text-emerald-800 font-medium">
                      Anchoring to <strong>{formData.lga}, {formData.state}</strong>. Remote sponsorship allows participating in any LGA nationwide.
                    </span>
                  ) : (
                    <span>
                      Prefilled from your member profile. You may select any Nigerian LGA to sponsor grassroots community farming there.
                    </span>
                  )}
                </p>
              </div>

              {/* Payment Method Card */}
              <div className="bg-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-foreground">
                        Payment Method
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Select how you want to pay for this transaction.
                      </p>
                    </div>
                  </div>
                  {currentUser && (
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg hidden sm:inline-block truncate max-w-[220px]">
                      {formData.email || currentUser.email}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Flutterwave Option */}
                  <div
                    onClick={() => setPaymentMethod("flutterwave")}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex items-center justify-between gap-3 select-none ${
                      paymentMethod === "flutterwave"
                        ? "border-emerald-700 bg-emerald-50/50 shadow-xs"
                        : "border-border hover:border-gray-300 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
                          paymentMethod === "flutterwave"
                            ? "bg-emerald-800 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <CreditCard className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground">
                          Pay Online with Flutterwave
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Instant Card, Bank Transfer, or USSD
                        </p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "flutterwave"}
                      onChange={() => setPaymentMethod("flutterwave")}
                      className="w-4 h-4 text-emerald-800 focus:ring-emerald-800 accent-emerald-800 cursor-pointer"
                    />
                  </div>

                  {/* Pay from Wallet Balance (Temporarily disabled/commented out as requested) */}
                  {/*
                  {walletBalance > 0 && (
                    <div
                      onClick={() => {
                        if (walletBalance >= totalPrice) {
                          setPaymentMethod("wallet");
                        } else {
                          toast({
                            title: "Insufficient Balance",
                            description: `You have ₦${walletBalance.toLocaleString()}, but this order is ₦${totalPrice.toLocaleString()}. Please pay via Flutterwave.`,
                            variant: "destructive",
                          });
                        }
                      }}
                      className={`rounded-xl border-2 p-4 transition-all flex items-center justify-between gap-3 select-none ${
                        walletBalance < totalPrice
                          ? "opacity-60 cursor-not-allowed border-border bg-muted/30"
                          : paymentMethod === "wallet"
                          ? "border-emerald-700 bg-emerald-50/50 shadow-xs cursor-pointer"
                          : "border-border hover:border-gray-300 bg-card cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
                            paymentMethod === "wallet"
                              ? "bg-emerald-800 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Wallet className="w-5 h-5 shrink-0" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground flex items-center gap-2">
                            Pay from Wallet Balance
                            <span className="font-mono text-xs font-normal text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              ₦{walletBalance.toLocaleString()} Available
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {walletBalance >= totalPrice
                              ? "Instant deduction from your cleared referral earnings"
                              : `Insufficient (₦${(totalPrice - walletBalance).toLocaleString()} more needed)`}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "wallet"}
                        disabled={walletBalance < totalPrice}
                        onChange={() => {
                          if (walletBalance >= totalPrice) setPaymentMethod("wallet");
                        }}
                        className="w-4 h-4 text-emerald-800 focus:ring-emerald-800 accent-emerald-800 cursor-pointer"
                      />
                    </div>
                  )}
                  */}

                  {lockedLedgerBalance > 0 && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          ₦{lockedLedgerBalance.toLocaleString()} Locked in Ledger
                        </p>
                        <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                          This represents matrix spillover commissions awaiting direct referral qualification. Only cleared available balance can be spent.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── RIGHT COLUMN: WHAT YOU'RE BUYING & INSTANT CTA (5-6 Cols) ─────────── */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="md:col-span-6 lg:col-span-5 space-y-6 md:sticky md:top-6 lg:top-8"
            >
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/80">
                {/* Header */}
                <div className="bg-emerald-900 text-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">
                        Order Summary
                      </span>
                      <h3 className="font-bold text-lg text-white">
                        What You're Buying
                      </h3>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-emerald-300" />
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {/* SCENARIO 1: Full Starter Package for New Members (₦12,000) */}
                  {!hasGreenCard && !isStarterPack && !isStarterCompletion && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border-2 border-emerald-700 bg-emerald-50/90 shadow-sm ring-2 ring-emerald-600/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" /> Required Starting Package
                          </span>
                          <span className="font-mono text-sm font-black text-emerald-950 bg-emerald-200/70 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                            ₦12,000
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-emerald-950">
                            AgroHeal Membership &amp; Starter Package
                          </p>
                          <div className="text-xs text-emerald-900 font-medium space-y-1">
                            <p className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>₦2,000 Digital Green Card Lifetime Pass</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>₦5,000 Initial Farm Slot (2 Bags · Cycle Doubling)</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>₦5,000 Mushroom Power 100g (Product ID: SP-MUSH-100G)</span>
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                            Includes membership activation, 5×7 community matrix placement, and unlocked bank withdrawals.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SCENARIO 2: Mushroom Power (100g) for Legacy Slot Holders */}
                  {isStarterPack && (
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Sprout className="w-5 h-5 text-amber-800 shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm text-foreground">
                              {starterProduct.name}
                            </h4>
                            <p className="text-xs text-amber-900 font-mono">
                              Product ID: {starterProduct.code}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-sm text-foreground bg-amber-100 px-2.5 py-1 rounded-lg">
                          ₦{starterProduct.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                        Required activation for slot holders. Qualifies 30-day PQV, activates your 5×7 Compound Network commissions, and enables bank withdrawals.
                      </p>
                    </div>
                  )}

                  {/* SCENARIO 3: Additional Farm Slots Counter */}
                  {!isGreenCardOnly && !isStarterPack && (
                    <div className="space-y-3 pb-3 border-b border-border/50">
                      <Label className="font-semibold text-xs text-foreground">
                        Number of Commercial Farm Slots
                      </Label>
                      <div className="flex items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/60">
                        <button
                          type="button"
                          onClick={decrementSlot}
                          disabled={slotQuantity <= 1}
                          className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-center">
                          <span className="text-xl font-bold font-mono text-foreground">
                            {slotQuantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1.5">
                            {slotQuantity === 1 ? "Slot" : "Slots"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={incrementSlot}
                          disabled={slotQuantity >= 100}
                          className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabular Price Breakdown */}
                  <div className="space-y-2 pt-2 text-xs border-t border-border/50">
                    {greenCardFee > 0 && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Lifetime Green Card Pass</span>
                        <span className="font-mono font-semibold text-foreground">
                          ₦{greenCardFee.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {isCombo && (
                      <>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Group Farm Slot (Mushroom Village)</span>
                          <span className="font-mono font-semibold text-foreground">
                            ₦5,000
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Mushroom Power 100g (SP-MUSH-100G)</span>
                          <span className="font-mono font-semibold text-foreground">
                            ₦5,000
                          </span>
                        </div>
                        {slotQuantity > 1 && (
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>{slotQuantity - 1} Additional Slot(s) (@ ₦5,000)</span>
                            <span className="font-mono font-semibold text-foreground">
                              ₦{((slotQuantity - 1) * SLOT_UNIT_PRICE).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {!isCombo && slotQuantity > 0 && !isStarterPack && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>{slotQuantity} Farm Slot(s)</span>
                        <span className="font-mono font-semibold text-foreground">
                          ₦{(slotQuantity * SLOT_UNIT_PRICE).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {isStarterPack && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>{starterProduct.name}</span>
                        <span className="font-mono font-semibold text-foreground">
                          ₦{starterProduct.price.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Total Row */}
                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="font-bold text-sm text-foreground">
                        Total Amount to Pay
                      </span>
                      <span className="font-black font-mono text-xl text-emerald-950">
                        ₦{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* PROMINENT PRIMARY ACTION BUTTON */}
                  <div className="pt-2 space-y-2.5">
                    <Button
                      type="button"
                      onClick={handlePayClick}
                      disabled={isProcessing}
                      className="w-full h-13 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Processing Payment...</span>
                        </>
                      ) : paymentMethod === "wallet" ? (
                        <>
                          <Wallet className="w-4 h-4 shrink-0" />
                          <span>Pay ₦{totalPrice.toLocaleString()} from Wallet</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 shrink-0" />
                          <span>Pay ₦{totalPrice.toLocaleString()} with Flutterwave</span>
                        </>
                      )}
                    </Button>

                    {/* Security Badge: Secured Icon + PCI-DSS Certified */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-semibold text-foreground">PCI-DSS Certified</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>256-Bit SSL Secured</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
