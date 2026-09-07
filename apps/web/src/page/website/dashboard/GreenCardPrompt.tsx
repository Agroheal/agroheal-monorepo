import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { IdCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import * as Sentry from "@sentry/react";

export default function GreenCardPrompt({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkGreenCard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sub, error } = await supabase
        .from("subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("plan", "green_card")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        Sentry.captureException(error);
        return;
      }

      const hasActiveGreenCard = !!sub && new Date(sub.expires_at) > new Date();
      setOpen(!hasActiveGreenCard);
    };

    checkGreenCard();
  }, []);

  return (
    <>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Dialog.Close
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <IdCard className="h-6 w-6 text-green-700" />
            </div>

            <Dialog.Title className="mb-2 text-center text-lg font-semibold text-gray-900">
              Get your Agroheal Green Card
            </Dialog.Title>
            <Dialog.Description className="mb-6 text-center text-sm text-gray-500">
              Unlock your Green Card Community and Free Ginger Seedlings
              progress for just N1000, one-time.
            </Dialog.Description>

            <Button
              onClick={() => {
                setOpen(false);
                navigate("/subscribe");
              }}
              className="h-11 w-full rounded-xl bg-green-800 font-semibold text-white hover:bg-green-700"
            >
              Get your Green Card — ₦2,000
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Maybe later
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
