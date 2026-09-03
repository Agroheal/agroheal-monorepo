import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LoaderCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabaseANON, supabaseURL } from "@/config/Index";

const MIN_WITHDRAWAL = 500;

function formatNaira(value: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG")}`;
}

async function callWithdrawals<T>(payload: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const res = await fetch(`${supabaseURL}/functions/v1/withdrawals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseANON,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse errorsss
  }

  if (!res.ok) {
    const msg =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      `Withdrawals function error (${res.status})`;
    if (/ip\s*whitelist/i.test(String(msg))) {
      throw new Error(
        "Withdrawal provider requires IP whitelisting. Please contact support to whitelist the backend service IP.",
      );
    }
    throw new Error(msg);
  }
  return data as T;
}

export default function Withdrawals() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!user) {
          setLoading(false);
          return;
        }
        // Load balance
        const data = await callWithdrawals<{ balance: number }>({
          action: "list",
          userId: user.id,
        });
        setBalance(Number(data?.balance ?? 0));
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Failed to load balance");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center bg-gray-50">
        <Toaster />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-800/10 flex items-center justify-center">
            <LoaderCircle className="animate-spin text-green-800" size={32} />
          </div>
          <p className="text-gray-500 text-sm font-medium">
            Loading withdrawals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      <div className="px-4 md:px-8 py-12 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Current Balance</p>
            <p className="text-xl font-bold text-gray-900 mb-6">
              {formatNaira(balance)}
            </p>

            <div className="grid gap-3 text-sm text-gray-700 mb-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-gray-500">Processing Time</span>
                <span className="text-gray-900">Within 24 hours</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-gray-500">Minimum Amount</span>
                <span className="text-gray-900">
                  {formatNaira(MIN_WITHDRAWAL)}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-gray-500">Supported Banks</span>
                <span className="text-gray-900">All Nigerian Banks</span>
              </div>
            </div>

            <button className="w-full h-11 rounded-xl bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
              Proceed to withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
