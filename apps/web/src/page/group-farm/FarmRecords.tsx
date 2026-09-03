import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FARM_SETUP_RATE = 5000;
const FARM_SUPPORT_RATE = 500;

interface FarmRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  farm_slots: number;
  months_farm_setup: number;
  months_farm_support: number;
  absentee_fine: number;
}

const calcSetup = (r: FarmRecord) =>
  FARM_SETUP_RATE * r.farm_slots * r.months_farm_setup;
const calcSupport = (r: FarmRecord) =>
  FARM_SUPPORT_RATE * r.farm_slots * r.months_farm_support;
const calcTotal = (r: FarmRecord) =>
  calcSetup(r) + calcSupport(r) + r.absentee_fine;

const FarmRecords = () => {
  const { farmSlug } = useParams<{ farmSlug: string }>();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<{
    id: string;
    name: string;
    coordinator_id: string;
  } | null>(null);
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FarmRecord>>({});

  const fetchFarmAndRecords = async () => {
    if (!farmSlug) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/farm-login?redirect=/${farmSlug}`);
      return;
    }

    const { data: farmData, error: farmError } = await supabase
      .from("farm_groups")
      .select("id, name, coordinator_id")
      .eq("slug", farmSlug)
      .maybeSingle();

    if (farmError || !farmData) {
      showToast({
        variant: "error",
        title: "Farm not found",
        description: "The farm group doesn't exist",
      });
      navigate("/");
      return;
    }
    setFarm(farmData);
    setIsCoordinator(farmData.coordinator_id === user.id);

    const { data: recordsData, error: recordsError } = await supabase
      .from("farm_records")
      .select("*")
      .eq("farm_id", farmData.id)
      .order("name");

    if (recordsError) {
      showToast({
        variant: "error",
        title: "Failed to load records",
        description: recordsError.message,
      });
    } else {
      setRecords(recordsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFarmAndRecords();
  }, [farmSlug]);

  const handleAdd = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      farm_slots: 0,
      months_farm_setup: 0,
      months_farm_support: 0,
      absentee_fine: 0,
    });
    setShowAddForm(true);
  };

  const handleEdit = (record: FarmRecord) => {
    setFormData(record);
    setEditingId(record.id);
  };

  const handleSave = async () => {
    if (!farm || !formData.name?.trim()) return;
    const data = { ...formData, farm_id: farm.id };
    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("farm_records")
        .update(data)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("farm_records").insert(data));
    }
    if (error) {
      showToast({
        variant: "error",
        title: "Failed to save",
        description: error.message,
      });
      return;
    }
    showToast({
      variant: "success",
      title: editingId ? "Record updated" : "Record added",
    });
    setShowAddForm(false);
    setEditingId(null);
    setFormData({});
    fetchFarmAndRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("farm_records").delete().eq("id", id);
    if (error) {
      showToast({
        variant: "error",
        title: "Failed to delete",
        description: error.message,
      });
      return;
    }
    showToast({ variant: "success", title: "Record deleted" });
    fetchFarmAndRecords();
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({});
  };
  const set = (field: keyof FarmRecord, val: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: val }));

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading farm records...</p>
        </div>
      </div>
    );

  if (!farm) return null;

  const slots = formData.farm_slots || 0;
  const mSetup = formData.months_farm_setup || 0;
  const mSupport = formData.months_farm_support || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {farm.name} Records
        </h1>
        <p className="text-gray-600">Farm bookkeeping and finance tracking</p>
      </motion.div>

      {isCoordinator && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Button
            onClick={handleAdd}
            className="bg-green-800 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Member Record
          </Button>
        </motion.div>
      )}

      {(showAddForm || editingId) && isCoordinator && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Record" : "Add New Record"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="farm_slots">No. of Farm Slots</Label>
                  <Input
                    id="farm_slots"
                    type="number"
                    min={0}
                    value={formData.farm_slots || 0}
                    onChange={(e) => set("farm_slots", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="months_farm_setup">
                    No. of Months for Farm Setup
                  </Label>
                  <Input
                    id="months_farm_setup"
                    type="number"
                    min={0}
                    value={formData.months_farm_setup || 0}
                    onChange={(e) =>
                      set("months_farm_setup", Number(e.target.value))
                    }
                  />
                  {slots > 0 && mSetup > 0 && (
                    <p className="text-xs text-green-700 mt-1 font-medium">
                      = ₦{(FARM_SETUP_RATE * slots * mSetup).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="months_farm_support">
                    No. of Months for Farm Support
                  </Label>
                  <Input
                    id="months_farm_support"
                    type="number"
                    min={0}
                    value={formData.months_farm_support || 0}
                    onChange={(e) =>
                      set("months_farm_support", Number(e.target.value))
                    }
                  />
                  {slots > 0 && mSupport > 0 && (
                    <p className="text-xs text-green-700 mt-1 font-medium">
                      = ₦
                      {(FARM_SUPPORT_RATE * slots * mSupport).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="absentee_fine">Absentee Fine (₦)</Label>
                  <Input
                    id="absentee_fine"
                    type="number"
                    min={0}
                    value={formData.absentee_fine || 0}
                    onChange={(e) =>
                      set("absentee_fine", Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-800 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={cancelEdit} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Member Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No records found.
                {isCoordinator && " Add the first member record."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      {isCoordinator && (
                        <th className="text-left p-2">Phone</th>
                      )}
                      <th className="text-left p-2">Farm Slots</th>
                      <th className="text-left p-2">Total Farm Setup</th>
                      <th className="text-left p-2">Total Farm Support</th>
                      <th className="text-left p-2">Absentee Fine</th>
                      <th className="text-left p-2">Total</th>
                      {isCoordinator && (
                        <th className="text-left p-2">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{record.name}</td>
                        <td className="p-2 text-gray-600">{record.email}</td>
                        {isCoordinator && (
                          <td className="p-2 text-gray-600">{record.phone}</td>
                        )}
                        <td className="p-2">{record.farm_slots}</td>
                        <td className="p-2">
                          <div>₦{calcSetup(record).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {record.months_farm_setup} month
                            {record.months_farm_setup !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="p-2">
                          <div>₦{calcSupport(record).toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {record.months_farm_support} month
                            {record.months_farm_support !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="p-2">
                          ₦{record.absentee_fine.toLocaleString()}
                        </td>
                        <td className="p-2 font-semibold text-green-800">
                          ₦{calcTotal(record).toLocaleString()}
                        </td>
                        {isCoordinator && (
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleEdit(record)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(record.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold bg-gray-100">
                      <td className="p-2">Total</td>
                      <td className="p-2" />
                      {isCoordinator && <td className="p-2" />}
                      <td className="p-2">
                        {records.reduce((s, r) => s + r.farm_slots, 0)}
                      </td>
                      <td className="p-2">
                        ₦
                        {records
                          .reduce((s, r) => s + calcSetup(r), 0)
                          .toLocaleString()}
                      </td>
                      <td className="p-2">
                        ₦
                        {records
                          .reduce((s, r) => s + calcSupport(r), 0)
                          .toLocaleString()}
                      </td>
                      <td className="p-2">
                        ₦
                        {records
                          .reduce((s, r) => s + r.absentee_fine, 0)
                          .toLocaleString()}
                      </td>
                      <td className="p-2 font-bold text-green-800">
                        ₦
                        {records
                          .reduce((s, r) => s + calcTotal(r), 0)
                          .toLocaleString()}
                      </td>
                      {isCoordinator && <td className="p-2" />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FarmRecords;
