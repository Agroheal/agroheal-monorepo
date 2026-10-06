import { useState, useEffect } from "react";
import { Loader2, MapPin, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { NIGERIA_STATES, getLgasForState } from "@shared/nigeriaLocations";
import { assignSlotsToFarmGroup, type FarmGroup } from "@/lib/farmAssignment";
import { supabase } from "@/lib/supabaseClient";
import type { FarmAssignmentGap } from "@/hooks/useFarmAssignmentGaps";

interface Props {
  gap: FarmAssignmentGap | null;
  farmGroups: FarmGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function AssignSlotModal({
  gap,
  farmGroups,
  open,
  onOpenChange,
  onAssigned,
  onSuccess,
  onError,
}: Props) {
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [slotsToAssign, setSlotsToAssign] = useState(1);
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (gap && open) {
      setSlotsToAssign(gap.shortfall > 0 ? gap.shortfall : 1);

      // Match category farm groups
      const matchingFarms = farmGroups.filter(
        (g) => g.project_category?.toLowerCase().trim() === gap.category?.toLowerCase().trim(),
      );
      if (matchingFarms.length > 0) {
        setSelectedFarmId(matchingFarms[0].id);
      } else if (farmGroups.length > 0) {
        setSelectedFarmId(farmGroups[0].id);
      }

      // Fetch member state and LGA from profiles
      setProfileLoading(true);
      void (async () => {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("state, lga")
            .eq("id", gap.memberId)
            .maybeSingle();
          if (data) {
            setState(data.state || "");
            setLga(data.lga || "");
          }
        } finally {
          setProfileLoading(false);
        }
      })();
    }
  }, [gap, open, farmGroups]);

  if (!gap) return null;

  const availableLgas = state ? getLgasForState(state) : [];

  const handleStateChange = (newState: string) => {
    setState(newState);
    setLga("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) {
      onError("Please select a target commercial farm cluster.");
      return;
    }
    if (slotsToAssign <= 0) {
      onError("Slots to assign must be at least 1.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update state & lga if set
      if (state || lga) {
        await supabase
          .from("profiles")
          .update({
            state: state || null,
            lga: lga || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", gap.memberId);
      }

      // 2. Assign slots to farm record
      await assignSlotsToFarmGroup({
        farmGroupId: selectedFarmId,
        category: gap.category,
        name: gap.fullName,
        email: gap.email,
        phone: gap.phone,
        slots: slotsToAssign,
      });

      const selectedFarmName = farmGroups.find((f) => f.id === selectedFarmId)?.name || selectedFarmId;
      onSuccess(
        `Successfully assigned ${slotsToAssign} ${gap.category} slot(s) (${slotsToAssign * 2} bags) to ${selectedFarmName} for ${gap.fullName}!`,
      );
      onAssigned();
      onOpenChange(false);
    } catch (err: any) {
      onError(err.message || "Failed to assign farm slots.");
    } finally {
      setLoading(false);
    }
  };

  const matchingFarms = farmGroups.filter(
    (g) => g.project_category?.toLowerCase().trim() === gap.category?.toLowerCase().trim(),
  );
  const optionsToRender = matchingFarms.length > 0 ? matchingFarms : farmGroups;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-bold text-foreground">
              Assign Farm Slots
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Allocate unassigned slots to a physical commercial farm cluster for{" "}
            <strong className="text-foreground">{gap.fullName}</strong> ({gap.category}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Purchased</span>
              <span className="font-mono font-bold text-foreground">{gap.slotsPurchased} slots</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Assigned</span>
              <span className="font-mono font-bold text-emerald-400">{gap.slotsAssigned} slots</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Shortfall</span>
              <span className="font-mono font-bold text-amber-400">{gap.shortfall} slots</span>
            </div>
          </div>

          {/* Target Farm Group */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Commercial Farm Cluster *</Label>
            <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Select farm cluster..." />
              </SelectTrigger>
              <SelectContent>
                {optionsToRender.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id} className="text-xs">
                    {farm.name} ({farm.project_category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Units */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Number of Slots to Allocate *</Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                = {slotsToAssign * 2} biological bags
              </span>
            </div>
            <Input
              type="number"
              min={1}
              max={gap.shortfall > 0 ? gap.shortfall : 100}
              value={slotsToAssign}
              onChange={(e) => setSlotsToAssign(Number(e.target.value))}
              className="text-xs h-9 font-mono"
              required
            />
          </div>

          {/* State & LGA Prefill Section */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Location Preference
              </span>
              {profileLoading && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Loading location...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">State</Label>
                <Select value={state} onValueChange={handleStateChange}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {NIGERIA_STATES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">LGA</Label>
                <Select value={lga} onValueChange={setLga} disabled={!state || availableLgas.length === 0}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder={!state ? "Select state first" : "Select LGA"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableLgas.map((l) => (
                      <SelectItem key={l} value={l} className="text-xs">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !selectedFarmId || slotsToAssign <= 0}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Slot Allocation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
