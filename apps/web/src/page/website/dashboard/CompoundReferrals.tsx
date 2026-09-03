import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";

type ReferralTreeNode = {
  id: string;
  email: string;
  phone: string | null;
  children: ReferralTreeNode[];
};

type FormStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

type ReferralGroups = {
  directReferrals: ReferralTreeNode[];
  indirectReferrals: ReferralTreeNode[];
};

const resolveUserIdByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const { data, error } = await supabase.rpc("get_user_id_by_email", {
    p_email: normalizedEmail,
  });

  if (error || !data) {
    throw new Error(
      error?.message ||
        "No registered user was found for that email. Make sure the auth account exists.",
    );
  }

  return data as string;
};

const resolveEmailByUserId = async (userId: string) => {
  if (!userId) {
    throw new Error("A valid user id is required.");
  }

  const { data, error } = await supabase.rpc("get_user_email_by_id", {
    user_id: userId,
  });

  if (error || !data) {
    throw new Error(
      error?.message || "No email was found for the supplied user id.",
    );
  }

  return String(data);
};

const buildReferralTree = async (
  rootUserId: string,
): Promise<ReferralTreeNode> => {
  const fetchNode = async (
    userId: string,
  ): Promise<ReferralTreeNode | null> => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, phone")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profileData) {
      return null;
    }

    const email = await resolveEmailByUserId(userId);

    const { data: childrenData } = await supabase
      .from("profiles")
      .select("id")
      .eq("referred_by", userId);

    const childIds = (childrenData || [])
      .map((child) => child.id)
      .filter((childId): childId is string => Boolean(childId));

    const children: ReferralTreeNode[] = [];

    for (const childId of childIds) {
      const childNode = await fetchNode(childId);
      if (childNode) {
        children.push(childNode);
      }
    }

    return {
      id: profileData.id,
      email,
      phone: profileData.phone ?? null,
      children,
    };
  };

  const rootNode = await fetchNode(rootUserId);
  if (!rootNode) {
    throw new Error("Unable to build the referral tree for the supplied user.");
  }
  return rootNode;
};

const getReferralGroups = (node: ReferralTreeNode): ReferralGroups => ({
  directReferrals: node.children,
  indirectReferrals: node.children.flatMap((child) => child.children),
});

const countReferralProfiles = (node: ReferralTreeNode): number => {
  const { directReferrals, indirectReferrals } = getReferralGroups(node);
  return directReferrals.length + indirectReferrals.length;
};

const copyEmailToClipboard = async (email: string) => {
  try {
    await navigator.clipboard.writeText(email);
    showToast({
      title: "Email copied",
      description: `${email} copied to clipboard.`,
      variant: "success",
    });
  } catch (error) {
    console.error("Copy failed", error);
    showToast({
      title: "Copy failed",
      description: "Could not copy the email.",
      variant: "error",
    });
  }
};

const renderReferralItem = (node: ReferralTreeNode, number: number) => (
  <li
    key={node.id}
    className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm"
  >
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-gray-900 sm:text-sm">
          {number}. {node.email}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600 sm:text-sm">
          {node.phone ? <span>{node.phone}</span> : null}
          <button
            type="button"
            onClick={() => copyEmailToClipboard(node.email)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
            aria-label={`Copy email ${node.email}`}
            title="Copy email"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </li>
);

const CompoundReferrals = () => {
  const [email, setEmail] = useState("");
  const [rootNode, setRootNode] = useState<ReferralTreeNode | null>(null);
  const [status, setStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "idle", message: "" });
    setRootNode(null);

    try {
      const resolvedUserId = await resolveUserIdByEmail(email);
      const referralTree = await buildReferralTree(resolvedUserId);

      const total = countReferralProfiles(referralTree);
      setRootNode(referralTree);
      setStatus({
        type: "success",
        message: `Found ${total} referral profile(s).`,
      });
      showToast({
        title: "Referral list loaded",
        description: `Loaded ${total} profile(s) from the referral chain.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Compound referral lookup failed", error);
      const message = error instanceof Error ? error.message : "Unable to build the referral tree.";
      setStatus({
        type: "error",
        message,
      });
      showToast({
        title: "Lookup failed",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Compound Referrals
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-email">
                Search compound referrals by email
              </Label>
              <Input
                id="referral-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search referrals"}
            </Button>
          </form>

          {status.message ? (
            <div
              className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                status.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.message}
            </div>
          ) : null}
        </div>

        {rootNode ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Search result
              </h2>
              <span className="text-sm text-gray-500">
                {countReferralProfiles(rootNode)} profile(s)
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Direct Referrals
                </h3>
                {(() => {
                  const { directReferrals } = getReferralGroups(rootNode);
                  return directReferrals.length ? (
                    <ol className="mt-3 space-y-2">
                      {directReferrals.map((referral, index) =>
                        renderReferralItem(referral, index + 1),
                      )}
                    </ol>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">
                      No direct referrals yet.
                    </p>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Indirect Referrals
                </h3>
                {(() => {
                  const { directReferrals, indirectReferrals } =
                    getReferralGroups(rootNode);
                  return indirectReferrals.length ? (
                    <ol className="mt-3 space-y-2">
                      {indirectReferrals.map((referral, index) =>
                        renderReferralItem(
                          referral,
                          directReferrals.length + index + 1,
                        ),
                      )}
                    </ol>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">
                      No indirect referrals yet.
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CompoundReferrals;
