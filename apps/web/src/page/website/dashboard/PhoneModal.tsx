import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Phone, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { normalizePhoneNumber } from "@/lib/dataSanitizers";

const PhoneModal = ({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const normalized = normalizePhoneNumber(phone);
    if (!/^[0-9]+$/.test(normalized) || normalized.length < 10) {
      toast.error("Enter a valid phone number (at least 10 digits)");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: normalized })
      .eq("id", userId);

    setLoading(false);

    if (error) {
      toast.error("Failed to save phone number");
      return;
    }

    toast.success("Phone number saved!");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
            <Phone className="w-6 h-6 text-green-800" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Add Your Phone Number
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            We need your phone number to keep you updated on your farming
            journey.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="08012345678"
              maxLength={11}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || phone.length < 10}
            className="w-full py-3 bg-green-800 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Phone Number"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneModal;
