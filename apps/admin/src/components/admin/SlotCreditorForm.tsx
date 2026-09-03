import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberCombobox } from "@/components/admin/MemberCombobox";
import { ProgramPills } from "@/components/admin/MemberBadges";
import { creditSlots } from "@/lib/adminActions";
import { computeSlotCreditBreakdown } from "@/lib/pricing";
import { assignSlotsToFarmGroup, fetchFarmGroups, type FarmGroup } from "@/lib/farmAssignment";
import type { Member } from "@/types/admin";

const PROGRAM_CATEGORIES = [
  "Gingertown",
  "Mushroom Village",
  "Organic FoodNation (1 Million Hectares against Hunger)",
];

const NO_FARM_GROUP = "__none__";

interface Props {
  members: Member[];
  onCredited: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Crediting slots and assigning the member to a coordinator's farm used to be
 * two disconnected manual steps — crediting here, then a separate insert in
 * the Group Farm admin UI. That gap is exactly how members ended up with
 * slots but no farm_records row at all. Picking a farm group here folds both
 * into one action, so a credited member and their farm assignment can't
 * drift apart or get forgotten.
 */
export function SlotCreditorForm({ members, onCredited, onSuccess, onError }: Props) {
  const [memberId, setMemberId] = useState("");
  const [category, setCategory] = useState(PROGRAM_CATEGORIES[0]);
  const [slots, setSlots] = useState(1);
  const [farmGroups, setFarmGroups] = useState<FarmGroup[]>([]);
  const [farmGroupId, setFarmGroupId] = useState(NO_FARM_GROUP);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFarmGroups()
      .then(setFarmGroups)
      .catch((err) => console.error("Failed to load farm groups:", err));
  }, []);

  useEffect(() => {
    setFarmGroupId(NO_FARM_GROUP);
  }, [category]);

  const selectedMember = members.find((m) => m.id === memberId);
  const breakdown = computeSlotCreditBreakdown(slots);
  const farmGroupsForCategory = farmGroups.filter((g) => g.project_category === category);

  const assignFarmRecord = async () => {
    if (farmGroupId === NO_FARM_GROUP || !selectedMember) return;
    try {
      await assignSlotsToFarmGroup({
        farmGroupId,
        category,
        name: selectedMember.full_name,
        email: selectedMember.email,
        phone: selectedMember.phone,
        slots,
      });
    } catch (err) {
      throw new Error(`Slots were credited, but the farm assignment failed: ${err instanceof Error ? err.message : String(err)}`, {
        cause: err,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      onError("Please select a member to credit.");
      return;
    }
    if (slots < 1) {
      onError("Slots count must be at least 1.");
      return;
    }

    setLoading(true);
    try {
      await creditSlots({ user_id: memberId, slots, project_category: category });
      await assignFarmRecord();
      onSuccess(
        `Successfully credited ${slots} ${category} slots!` +
          (farmGroupId !== NO_FARM_GROUP
            ? ` Assigned to ${farmGroupsForCategory.find((g) => g.id === farmGroupId)?.name ?? "the selected farm"}.`
            : ""),
      );
      setSlots(1);
      setMemberId("");
      setFarmGroupId(NO_FARM_GROUP);
      onCredited();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to credit farm slots.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual Farm Slot Creditor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Select Member (Search by Name, Email, or Phone)
            </label>
            <MemberCombobox
              members={members}
              value={memberId}
              onChange={setMemberId}
              placeholder="Type name, email, or phone..."
              renderBadge={(m) =>
                m.total_slots > 0 ? <span className="text-[10px] font-semibold text-emerald-400">🌱 {m.total_slots}</span> : null
              }
            />
            {selectedMember && selectedMember.total_slots > 0 && (
              <ProgramPills programs={selectedMember.slots_by_program} size="xs" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Project Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Number of Slots</label>
              <Input type="number" min={1} value={slots} onChange={(e) => setSlots(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Assign to Farm Group (optional)
            </label>
            <Select value={farmGroupId} onValueChange={setFarmGroupId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FARM_GROUP}>Don't assign — just credit slots</SelectItem>
                {farmGroupsForCategory.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Picking a farm here creates (or tops up) the member's record on that coordinator's dashboard in the
              same step — no separate manual entry needed.
            </p>
          </div>

          <div className="space-y-1 rounded-lg bg-background/60 p-3 text-xs">
            <span className="font-semibold text-muted-foreground">Computed Rates Breakdown (NGN)</span>
            <div>
              Slot Subscription: <strong>₦{breakdown.slotFee.toLocaleString()}</strong>
            </div>
            <div>
              Farm Setup: <strong>₦{breakdown.setupFee.toLocaleString()}</strong>
            </div>
            <div>
              Farm Support: <strong>₦{breakdown.supportFee.toLocaleString()}</strong>
            </div>
            <div className="mt-1 border-t border-border pt-1 text-sm font-bold text-primary">
              Total Value: ₦{breakdown.total.toLocaleString()}
            </div>
          </div>

          <Button type="submit" disabled={loading || !memberId} className="w-full gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
            {loading ? "Crediting Slots..." : "Credit Slots to Dashboard"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
