import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { useFarmAssignmentGaps, type FarmAssignmentGap } from "@/hooks/useFarmAssignmentGaps";
import { fetchFarmGroups, assignSlotsToFarmGroup, type FarmGroup } from "@/lib/farmAssignment";
import { useAdminAuth } from "@/hooks/useAdminAuth";

function gapKey(gap: FarmAssignmentGap) {
  return `${gap.memberId}::${gap.category}`;
}

export default function FarmAssignmentsPage() {
  const { isReadOnly } = useAdminAuth();
  const { gaps, loading, error, refetch } = useFarmAssignmentGaps();
  const [farmGroups, setFarmGroups] = useState<FarmGroup[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Record<string, string>>({});
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchFarmGroups()
      .then(setFarmGroups)
      .catch((err) => console.error("Failed to load farm groups:", err));
  }, []);

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4000);
  };

  const handleAssign = async (gap: FarmAssignmentGap) => {
    if (isReadOnly) {
      flash(setErrorMessage, "System is in Read-Only Audit Mode. Farm assignments are restricted to Super Developer (developerelijah360@gmail.com).");
      return;
    }

    const key = gapKey(gap);
    const farmGroupId = selectedFarm[key];
    if (!farmGroupId) {
      flash(setErrorMessage, "Pick a farm group first.");
      return;
    }

    setAssigningKey(key);
    setErrorMessage("");
    try {
      await assignSlotsToFarmGroup({
        farmGroupId,
        category: gap.category,
        name: gap.fullName,
        email: gap.email,
        phone: gap.phone,
        slots: gap.shortfall,
      });
      flash(setSuccessMessage, `Assigned ${gap.shortfall} ${gap.category} slot(s) for ${gap.fullName}.`);
      await refetch();
    } catch (err) {
      flash(setErrorMessage, err instanceof Error ? err.message : "Failed to assign farm slots.");
    } finally {
      setAssigningKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      <div>
        <h2 className="text-sm font-semibold text-foreground">Farm Assignment Gaps</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Members whose purchased slots (slot_subscriptions) exceed what's actually recorded on a coordinator's farm
          (farm_records), per category. Nothing links the two automatically — this is what catches the gap instead of
          a customer complaint.
        </p>
      </div>

      {loading && gaps.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking farm assignments...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center text-sm text-destructive">
          {error}
        </div>
      ) : gaps.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          Every purchased slot is accounted for on a farm record.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Purchased</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium">Shortfall</th>
                <th className="px-4 py-3 font-medium">Assign to farm</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap) => {
                const key = gapKey(gap);
                const farmOptions = farmGroups.filter((g) => g.project_category === gap.category);
                return (
                  <tr key={key} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{gap.fullName}</div>
                      <div className="text-xs text-muted-foreground">{gap.email}</div>
                    </td>
                    <td className="px-4 py-3">{gap.category}</td>
                    <td className="px-4 py-3">{gap.slotsPurchased}</td>
                    <td className="px-4 py-3">{gap.slotsAssigned}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5" /> {gap.shortfall}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={selectedFarm[key] || ""}
                        onValueChange={(value) => setSelectedFarm((prev) => ({ ...prev, [key]: value }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select farm..." />
                        </SelectTrigger>
                        <SelectContent>
                          {farmOptions.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        disabled={isReadOnly || assigningKey === key || !selectedFarm[key]}
                        onClick={() => handleAssign(gap)}
                        title={isReadOnly ? "Assignments locked during financial audit" : undefined}
                      >
                        {assigningKey === key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isReadOnly ? (
                          <Lock className="h-3.5 w-3.5 mr-1" />
                        ) : null}
                        {isReadOnly ? "Locked" : "Assign"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
