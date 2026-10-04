import { useState } from "react";
import { MapPin, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NIGERIA_STATES, getLgasForState } from "@shared/nigeriaLocations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (state: string, lga: string) => Promise<void>;
  loading: boolean;
}

export function MassAssignLocationDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  loading,
}: Props) {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedLga, setSelectedLga] = useState<string>("");

  const availableLgas = selectedState ? getLgasForState(selectedState) : [];

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setSelectedLga("");
  };

  const handleApply = async () => {
    if (!selectedState || !selectedLga) return;
    await onConfirm(selectedState, selectedLga);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Mass Assign Location &amp; LGA</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apply State and LGA to {selectedCount} selected member{selectedCount !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Country
            </label>
            <div className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs font-medium text-foreground">
              Nigeria
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Target State <span className="text-rose-500">*</span>
            </label>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select Nigerian State" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {NIGERIA_STATES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Local Government Area (LGA) <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedLga}
              onValueChange={setSelectedLga}
              disabled={!selectedState}
            >
              <SelectTrigger className="w-full text-xs disabled:opacity-50">
                <SelectValue placeholder={selectedState ? "Select LGA" : "Select State First"} />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {availableLgas.map((lg) => (
                  <SelectItem key={lg} value={lg}>
                    {lg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={loading || !selectedState || !selectedLga}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Assign Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
