import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Phone, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { validatePhoneNumber, SUPPORTED_COUNTRY_CODES } from "@shared/dataSanitizers";

const PhoneModal = ({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: () => void;
}) => {
  const [countryCode, setCountryCode] = useState("+234");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const phoneValidation = validatePhoneNumber(phone, countryCode);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: phoneValidation.normalized })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 sm:p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
            <Phone className="w-6 h-6 text-green-800" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Mandatory Contact Phone Number
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
            A referrer must be able to contact his or her referrals. Please provide your active phone number to proceed to your AgroHeal dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-11 px-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition-all"
                aria-label="Country Code"
              >
                {SUPPORTED_COUNTRY_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.code} ({item.country})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={countryCode === "+234" ? "08012345678" : "Phone number"}
                maxLength={countryCode === "+234" ? 11 : 15}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || phone.trim().length < 7}
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
