import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { Toaster } from "react-hot-toast";
import { PROJECT_CATEGORIES, DEFAULT_CATEGORY } from "@/constant/projectCategories";

const CreateFarmGroup = () => {
  const navigate = useNavigate();
  const [farmName, setFarmName] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(false);

  // Removed on-mount redirect as coordinators can have multiple groups now

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast({
        variant: "error",
        title: "Authentication required",
        description: "Please login to create a farm group",
      });
      setLoading(false);
      return;
    }

    if (user.email?.toLowerCase() !== "developerelijah360@gmail.com") {
      showToast({
        variant: "error",
        title: "Read-Only Audit Mode",
        description: "Farm group creation is temporarily restricted during system reconciliation.",
      });
      setLoading(false);
      return;
    }

    const slug = farmName.trim().toLowerCase().replace(/\s+/g, "-");

    // Check if coordinator already has a farm in this category
    const { data: existingInCategory } = await supabase
      .from("farm_groups")
      .select("id")
      .eq("coordinator_id", user.id)
      .eq("project_category", category)
      .maybeSingle();

    if (existingInCategory) {
      showToast({
        variant: "error",
        title: "Category already exists",
        description: `You already have a farm group in the ${category} category.`,
      });
      setLoading(false);
      return;
    }

    // Check if slug already exists globally
    const { data: slugExists } = await supabase
      .from("farm_groups")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugExists) {
      showToast({
        variant: "error",
        title: "Farm name already taken",
        description: "Please choose a different name",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("farm_groups").insert({
      name: farmName.trim(),
      slug,
      coordinator_id: user.id,
      project_category: category,
    });

    setLoading(false);

    if (error) {
      showToast({
        variant: "error",
        title: "Failed to create farm group",
        description: error.message,
      });
      return;
    }

    showToast({ variant: "success", title: "Farm group created!" });
    navigate("/dashboard/group-farm-accounts", { replace: true });
  };

  const fadeUp = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <Toaster />
      <motion.div {...fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Farm Group
        </h1>
        <p className="text-gray-600">
          Create a farm group to start bookkeeping and tracking member finances.
        </p>
      </motion.div>

      <motion.form {...fadeUp} onSubmit={handleCreate} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="category"
            className="text-sm font-semibold text-gray-700"
          >
            Project Category
          </Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="farmName"
            className="text-sm font-semibold text-gray-700"
          >
            Farm Group Name
          </Label>
          <Input
            id="farmName"
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            placeholder="e.g. Star Farm"
            className="h-11"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !farmName.trim()}
          className="w-full h-11 bg-green-800 hover:bg-green-700"
        >
          {loading ? "Creating..." : "Create Farm Group"}
        </Button>
      </motion.form>
    </div>
  );
};

export default CreateFarmGroup;
