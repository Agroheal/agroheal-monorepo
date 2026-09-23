import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import ProfileCompletionModal from "@/components/dashboard/ProfileCompletionModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const KinDetails = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();

      setPhone(profileData?.phone || "");
      setUserId(user.id);
      const { data } = await supabase
        .from("kin_details")
        .select("kin_name, kin_address, kin_number")
        .eq("user_id", user.id)
        .maybeSingle();

      setInitialData(data || null);
      setLoading(false);
    };

    loadDetails();
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading Profile & Next of Kin details..." />;
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <Toaster />
      <ProfileCompletionModal
        userId={userId}
        initialPhone={phone}
        initialKin={initialData}
        canDismiss={true}
        onComplete={() => navigate("/dashboard", { replace: true })}
        onClose={() => navigate("/dashboard", { replace: true })}
      />
    </>
  );
};

export default KinDetails;
