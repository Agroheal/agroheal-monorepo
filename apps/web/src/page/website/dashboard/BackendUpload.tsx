import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/ToastComponent";
import { supabaseANON, supabaseURL } from "@/config/Index";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { cleanEmail } from "@shared/dataSanitizers";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : undefined;

const projectCategories = [
  "Mushroom Village",
  "Gingertown",
  "Organic FoodNation (1 Million Hectares against Hunger)",
];

const slotInitialState = {
  email: "",
  amount: "",
  nextPaymentDate: "",
  lastPaymentDate: "",
  slots: "1",
  slotprice: "",
  projectCategory: projectCategories[1],
};

const otherPaymentInitialState = {
  email: "",
  paymentType: "farm_setup",
  months: "1",
  slots: "1",
  amount: "",
  status: "success",
  projectCategory: projectCategories[1],
};

const subscriptionInitialState = {
  email: "",
  startedAt: "",
  expiresAt: "",
};

const uidFinderInitialState = {
  email: "",
};

const resolveUserId = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const rpcAttempts = [
    { p_email: normalizedEmail },
    { email_input: normalizedEmail },
  ];

  for (const params of rpcAttempts) {
    try {
      const { data, error } = await supabase.rpc(
        "get_user_id_by_email",
        params,
      );

      if (!error && data) {
        return data as string;
      }
    } catch (rpcError) {
      console.warn("RPC lookup failed with params", params, rpcError);
    }
  }

  const response = await fetch(
    `${supabaseURL}/functions/v1/get-user-id-by-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseANON,
        Authorization: `Bearer ${supabaseANON}`,
      },
      body: JSON.stringify({ email: normalizedEmail }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || "Unable to resolve the user from the supplied email.",
    );
  }

  const resolvedUserId = data?.user_id ?? data?.uid ?? data?.id;

  if (!data?.success || !resolvedUserId) {
    throw new Error(
      data?.message ||
        "No registered user was found for that email. Make sure the account exists in Supabase Auth and that the SQL function has been created.",
    );
  }

  return resolvedUserId as string;
};

const formatDateForPayload = (value: string) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

const saveRecordByUserId = async (
  tableName: "slot_subscriptions" | "other_payments" | "subscriptions",
  payload: Record<string, unknown>,
) => {
  const userId = payload.user_id;

  if (typeof userId !== "string" || !userId) {
    throw new Error("A valid user_id is required.");
  }

  return supabase.from(tableName).insert([payload]);
};

type FormStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

const BackendUpload = () => {
  const { session } = useAuth();
  const isSuperDeveloper = session?.user?.email?.toLowerCase() === "developerelijah360@gmail.com";

  const [slotForm, setSlotForm] = useState(slotInitialState);
  const [otherPaymentForm, setOtherPaymentForm] = useState(
    otherPaymentInitialState,
  );
  const [subscriptionForm, setSubscriptionForm] = useState(
    subscriptionInitialState,
  );
  const [uidFinderForm, setUidFinderForm] = useState(uidFinderInitialState);
  const [uidFinderResult, setUidFinderResult] = useState<string>("");
  const [uidFinderStatus, setUidFinderStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });
  const [isUidFinderOpen, setIsUidFinderOpen] = useState(false);
  const [loading, setLoading] = useState<
    "slot" | "other" | "subscription" | null
  >(null);
  const [slotStatus, setSlotStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });
  const [otherPaymentStatus, setOtherPaymentStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });

  const handleSlotSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading("slot");

    try {
      const userId = await resolveUserId(cleanEmail(slotForm.email));
      const slots = Math.max(1, Math.floor(Number(slotForm.slots) || 1));
      const unitPrice = Math.max(0, Number(slotForm.slotprice) || 0);
      const computedAmount = slots * unitPrice;

      const payload = {
        user_id: userId,
        amount: computedAmount,
        next_payment_date: formatDateForPayload(slotForm.nextPaymentDate),
        last_payment_date: formatDateForPayload(slotForm.lastPaymentDate),
        created_at: new Date().toISOString(),
        slots: slots,
        slotprice: unitPrice,
        project_category: slotForm.projectCategory,
        status: "active",
      };

      const { error } = await saveRecordByUserId("slot_subscriptions", payload);

      if (error) {
        throw error;
      }

      setSlotForm(slotInitialState);
      setSlotStatus({
        type: "success",
        message: "Slot subscription saved successfully.",
      });
      showToast({
        title: "Slot subscription saved",
        description: "The record was inserted into slot_subscriptions.",
        variant: "success",
      });
    } catch (error) {
      console.error("Slot subscription save failed:", error);
      setSlotStatus({
        type: "error",
        message: getErrorMessage(error) || "Unable to save slot subscription.",
      });
      showToast({
        title: "Save failed",
        description: getErrorMessage(error) || "Unable to save slot subscription.",
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleOtherPaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading("other");

    try {
      const userId = await resolveUserId(otherPaymentForm.email);

      const payload = {
        user_id: userId,
        payment_type: otherPaymentForm.paymentType,
        months: Number(otherPaymentForm.months),
        slots: Number(otherPaymentForm.slots),
        amount: Number(otherPaymentForm.amount),
        status: otherPaymentForm.status,
        created_at: new Date().toISOString(),
        project_category: otherPaymentForm.projectCategory,
      };

      const { error } = await saveRecordByUserId("other_payments", payload);

      if (error) {
        throw error;
      }

      setOtherPaymentForm(otherPaymentInitialState);
      setOtherPaymentStatus({
        type: "success",
        message: "Other payment saved successfully.",
      });
      showToast({
        title: "Other payment saved",
        description: "The record was inserted into other_payments.",
        variant: "success",
      });
    } catch (error) {
      console.error("Other payment save failed:", error);
      setOtherPaymentStatus({
        type: "error",
        message: getErrorMessage(error) || "Unable to save other payment.",
      });
      showToast({
        title: "Save failed",
        description: getErrorMessage(error) || "Unable to save other payment.",
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSubscriptionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading("subscription");

    try {
      const userId = await resolveUserId(subscriptionForm.email);

      const payload = {
        user_id: userId,
        started_at: formatDateForPayload(subscriptionForm.startedAt),
        expires_at: formatDateForPayload(subscriptionForm.expiresAt),
      };

      const { error } = await saveRecordByUserId("subscriptions", payload);

      if (error) {
        throw error;
      }

      setSubscriptionForm(subscriptionInitialState);
      setSubscriptionStatus({
        type: "success",
        message: "Subscription saved successfully.",
      });
      showToast({
        title: "Subscription saved",
        description: "The record was inserted into subscriptions.",
        variant: "success",
      });
    } catch (error) {
      console.error("Subscription save failed:", error);
      setSubscriptionStatus({
        type: "error",
        message: getErrorMessage(error) || "Unable to save subscription.",
      });
      showToast({
        title: "Save failed",
        description: getErrorMessage(error) || "Unable to save subscription.",
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleUidFinderSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setUidFinderStatus({ type: "idle", message: "" });
    setUidFinderResult("");

    try {
      const resolvedUid = await resolveUserId(uidFinderForm.email);
      setUidFinderResult(resolvedUid);
      setUidFinderStatus({
        type: "success",
        message: "UID found successfully.",
      });
      showToast({
        title: "UID found",
        description: "The user UID was resolved successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("UID lookup failed:", error);
      setUidFinderStatus({
        type: "error",
        message: getErrorMessage(error) || "Unable to resolve the UID.",
      });
      showToast({
        title: "UID lookup failed",
        description: getErrorMessage(error) || "Unable to resolve the UID.",
        variant: "error",
      });
    }
  };

  const renderField = (
    label: string,
    id: string,
    value: string,
    onChange: (value: string) => void,
    type: React.HTMLInputTypeAttribute = "text",
    placeholder?: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
      />
    </div>
  );

  const renderStatusMessage = (status: FormStatus) => {
    if (!status.message) {
      return null;
    }

    const baseClass =
      status.type === "success"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-red-200 bg-red-50 text-red-700";

    return (
      <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${baseClass}`}>
        {status.message}
      </div>
    );
  };

  if (!isSuperDeveloper) {
    return (
      <div className="p-8 max-w-md mx-auto text-center mt-12 bg-white rounded-xl border border-red-200 shadow-sm">
        <h2 className="text-xl font-bold text-red-700">Access Restricted</h2>
        <p className="text-sm text-gray-600 mt-2">
          Direct backend record insertion is restricted to Super Developer (developerelijah360@gmail.com) to maintain database integrity.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">
            Backend upload
          </h1>
          <p className="text-sm text-gray-600">
            Add membership, payment, and subscription records for registered
            users by email.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setIsUidFinderOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Open UID Finder
          </Button>
        </div>

        {isUidFinderOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsUidFinderOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 space-y-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  UID Finder
                </h2>
                <p className="text-sm text-gray-500">
                  Resolve a Supabase auth UID from an email address.
                </p>
              </div>

              <form onSubmit={handleUidFinderSubmit} className="space-y-4">
                {renderField(
                  "Email",
                  "uid-email",
                  uidFinderForm.email,
                  (value) =>
                    setUidFinderForm({ ...uidFinderForm, email: value }),
                  "email",
                  "user@example.com",
                )}

                <Button type="submit" className="w-full">
                  Find UID
                </Button>

                {uidFinderStatus.message ? (
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      uidFinderStatus.type === "success"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {uidFinderStatus.message}
                  </div>
                ) : null}

                {uidFinderResult ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-700">Resolved UID</p>
                    <p className="mt-1 break-all font-mono text-xs text-gray-600">
                      {uidFinderResult}
                    </p>
                  </div>
                ) : null}
              </form>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsUidFinderOpen(false);
                    setUidFinderForm(uidFinderInitialState);
                    setUidFinderStatus({ type: "idle", message: "" });
                    setUidFinderResult("");
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <form
            onSubmit={handleSlotSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Slot subscription
              </h2>
              <p className="text-sm text-gray-500">
                Insert into slot_subscriptions
              </p>
            </div>

            <div className="space-y-4">
              {renderField(
                "Email",
                "slot-email",
                slotForm.email,
                (value) => setSlotForm({ ...slotForm, email: value }),
                "email",
                "user@example.com",
              )}
              {renderField(
                "Amount",
                "slot-amount",
                slotForm.amount,
                (value) => setSlotForm({ ...slotForm, amount: value }),
                "number",
                "0",
              )}
              {renderField(
                "Slot price",
                "slot-price",
                slotForm.slotprice,
                (value) => setSlotForm({ ...slotForm, slotprice: value }),
                "number",
                "0",
              )}
              {renderField(
                "Slots",
                "slot-slots",
                slotForm.slots,
                (value) => setSlotForm({ ...slotForm, slots: value }),
                "number",
                "1",
              )}
              {renderField(
                "Last payment date",
                "slot-last-payment",
                slotForm.lastPaymentDate,
                (value) => setSlotForm({ ...slotForm, lastPaymentDate: value }),
                "datetime-local",
              )}
              {renderField(
                "Next payment date",
                "slot-next-payment",
                slotForm.nextPaymentDate,
                (value) => setSlotForm({ ...slotForm, nextPaymentDate: value }),
                "datetime-local",
              )}

              <div className="space-y-2">
                <Label htmlFor="slot-project-category">Project category</Label>
                <select
                  id="slot-project-category"
                  value={slotForm.projectCategory}
                  onChange={(event) =>
                    setSlotForm({
                      ...slotForm,
                      projectCategory: event.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {projectCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={loading === "slot"}
            >
              {loading === "slot" ? "Saving..." : "Submit slot subscription"}
            </Button>
            {renderStatusMessage(slotStatus)}
          </form>

          <form
            onSubmit={handleOtherPaymentSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Other payment
              </h2>
              <p className="text-sm text-gray-500">
                Insert into other_payments
              </p>
            </div>

            <div className="space-y-4">
              {renderField(
                "Email",
                "other-email",
                otherPaymentForm.email,
                (value) =>
                  setOtherPaymentForm({ ...otherPaymentForm, email: value }),
                "email",
                "user@example.com",
              )}
              {renderField(
                "Amount",
                "other-amount",
                otherPaymentForm.amount,
                (value) =>
                  setOtherPaymentForm({ ...otherPaymentForm, amount: value }),
                "number",
                "0",
              )}
              {renderField(
                "Months",
                "other-months",
                otherPaymentForm.months,
                (value) =>
                  setOtherPaymentForm({ ...otherPaymentForm, months: value }),
                "number",
                "1",
              )}
              {renderField(
                "Slots",
                "other-slots",
                otherPaymentForm.slots,
                (value) =>
                  setOtherPaymentForm({ ...otherPaymentForm, slots: value }),
                "number",
                "1",
              )}

              <div className="space-y-2">
                <Label htmlFor="other-payment-type">Payment type</Label>
                <select
                  id="other-payment-type"
                  value={otherPaymentForm.paymentType}
                  onChange={(event) =>
                    setOtherPaymentForm({
                      ...otherPaymentForm,
                      paymentType: event.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="farm_setup">farm_setup</option>
                  <option value="farm_support">farm_support</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="other-status">Status</Label>
                <select
                  id="other-status"
                  value={otherPaymentForm.status}
                  onChange={(event) =>
                    setOtherPaymentForm({
                      ...otherPaymentForm,
                      status: event.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="pending">pending</option>
                  <option value="success">success</option>
                  <option value="failed">failed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="other-project-category">Project category</Label>
                <select
                  id="other-project-category"
                  value={otherPaymentForm.projectCategory}
                  onChange={(event) =>
                    setOtherPaymentForm({
                      ...otherPaymentForm,
                      projectCategory: event.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {projectCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={loading === "other"}
            >
              {loading === "other" ? "Saving..." : "Submit other payment"}
            </Button>
            {renderStatusMessage(otherPaymentStatus)}
          </form>

          <form
            onSubmit={handleSubscriptionSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-5 space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Subscription
              </h2>
              <p className="text-sm text-gray-500">Insert into subscriptions</p>
            </div>

            <div className="space-y-4">
              {renderField(
                "Email",
                "subscription-email",
                subscriptionForm.email,
                (value) =>
                  setSubscriptionForm({ ...subscriptionForm, email: value }),
                "email",
                "user@example.com",
              )}
              {renderField(
                "Started at",
                "subscription-started",
                subscriptionForm.startedAt,
                (value) =>
                  setSubscriptionForm({
                    ...subscriptionForm,
                    startedAt: value,
                  }),
                "datetime-local",
              )}
              {renderField(
                "Expires at",
                "subscription-expires",
                subscriptionForm.expiresAt,
                (value) =>
                  setSubscriptionForm({
                    ...subscriptionForm,
                    expiresAt: value,
                  }),
                "datetime-local",
              )}
            </div>

            <Button
              type="submit"
              className="mt-6 w-full"
              disabled={loading === "subscription"}
            >
              {loading === "subscription" ? "Saving..." : "Submit subscription"}
            </Button>
            {renderStatusMessage(subscriptionStatus)}
          </form>
        </div>
      </div>
  );
};

export default BackendUpload;
