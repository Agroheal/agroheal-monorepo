import { useEffect, useState } from "react";
import { LoaderCircle, Users } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { cleanName, normalizePhoneNumber } from "@shared/dataSanitizers";

type KinModalProps = {
  userId: string;
  initialData?: {
    kin_name?: string;
    kin_address?: string;
    kin_number?: string;
  };
  onComplete: (updatedData: {
    kin_name: string;
    kin_address: string;
    kin_number: string;
  }) => void;
  onClose: () => void;
};

const KinModal = ({
  userId,
  initialData,
  onComplete,
  onClose,
}: KinModalProps) => {
  const [kinName, setKinName] = useState(initialData?.kin_name ?? "");
  const [kinAddress, setKinAddress] = useState(initialData?.kin_address ?? "");
  const [kinNumber, setKinNumber] = useState(initialData?.kin_number ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setKinName(initialData?.kin_name ?? "");
    setKinAddress(initialData?.kin_address ?? "");
    setKinNumber(initialData?.kin_number ?? "");
  }, [initialData]);

  const handleSubmit = async () => {
    const cleanedKinName = cleanName(kinName);
    const cleanedKinAddress = kinAddress.trim().replace(/\s+/g, " ");
    const normalizedKinNumber = normalizePhoneNumber(kinNumber);

    if (!cleanedKinName) {
      toast.error("Enter a name for Next of Kin");
      return;
    }

    if (!cleanedKinAddress) {
      toast.error("Enter the address for Next of Kin");
      return;
    }

    if (!/^[0-9]+$/.test(normalizedKinNumber) || normalizedKinNumber.length < 10) {
      toast.error("Enter a valid phone number for Next of Kin (at least 10 digits)");
      return;
    }

    setLoading(true);

    const now = new Date().toISOString();
    const { data: existing, error: fetchError } = await supabase
      .from("kin_details")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      setLoading(false);
      toast.error("Failed to check existing Next of Kin details");
      return;
    }

    let error = null;

    if (existing?.id) {
      const result = await supabase
        .from("kin_details")
        .update({
          kin_name: cleanedKinName,
          kin_address: cleanedKinAddress,
          kin_number: normalizedKinNumber,
          date_updated: now,
        })
        .eq("user_id", userId);
      error = result.error;
    } else {
      const result = await supabase.from("kin_details").insert({
        user_id: userId,
        kin_name: cleanedKinName,
        kin_address: cleanedKinAddress,
        kin_number: normalizedKinNumber,
        date_created: now,
        date_updated: now,
      });
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast.error("Failed to save Next of Kin details");
      return;
    }

    toast.success("Next of Kin details saved!");
    onComplete({
      kin_name: cleanedKinName,
      kin_address: cleanedKinAddress,
      kin_number: normalizedKinNumber,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
          type="button"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-green-800" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            NEXT OF KIN DETAILS
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Please provide a Next of Kin contact.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              Name of Next of Kin
            </label>
            <input
              type="text"
              value={kinName}
              onChange={(e) => setKinName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              Address
            </label>
            <textarea
              value={kinAddress}
              onChange={(e) => setKinAddress(e.target.value)}
              placeholder="Address of Next of Kin"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              Phone Number
            </label>
            <input
              type="tel"
              value={kinNumber}
              onChange={(e) =>
                setKinNumber(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="08012345678"
              maxLength={15}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            type="button"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Next of Kin"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KinModal;
