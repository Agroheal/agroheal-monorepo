import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import KinModal from "./KinModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const KinDetails = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<{
    kin_name?: string;
    kin_address?: string;
    kin_number?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDetails = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Check if phone exists; if not, redirect back to dashboard
      const { data: profileData } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData?.phone) {
        toast("Please add your phone number first.");
        navigate("/dashboard", { replace: true });
        return;
      }

      setUserId(user.id);
      const { data, error } = await supabase
        .from("kin_details")
        .select("kin_name, kin_address, kin_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load Kin or POD details", error);
      }

      setInitialData(
        data || {
          kin_name: "",
          kin_address: "",
          kin_number: "",
        },
      );
      setLoading(false);
    };

    loadDetails();
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading Kin or POD details..." />;
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <Toaster />
      <KinModal
        userId={userId}
        initialData={initialData ?? undefined}
        onComplete={() => navigate("/dashboard", { replace: true })}
        onClose={() => navigate("/dashboard", { replace: true })}
      />
    </>
  );
};

export default KinDetails;
