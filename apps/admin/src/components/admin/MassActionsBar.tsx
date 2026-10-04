import { CheckSquare, Square, X, MapPin, IdCard, UserCheck, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selectedCount: number;
  totalFiltered: number;
  onSelectAllFiltered: () => void;
  onDeselectAll: () => void;
  onOpenAssignLocation: () => void;
  onOpenIssueGreenCards: () => void;
  onOpenAssignRole: () => void;
  onExportSelected: () => void;
}

export function MassActionsBar({
  selectedCount,
  totalFiltered,
  onSelectAllFiltered,
  onDeselectAll,
  onOpenAssignLocation,
  onOpenIssueGreenCards,
  onOpenAssignRole,
  onExportSelected,
}: Props) {
  if (selectedCount === 0) return null;

  const allFilteredSelected = selectedCount >= totalFiltered && totalFiltered > 0;

  return (
    <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-card/95 p-3.5 shadow-lg backdrop-blur-md transition-all">
      {/* Selection Stats & Select All / Deselect Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-white shadow-xs">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold text-foreground">
            Selected
          </span>
        </div>

        <div className="h-4 w-[1px] bg-border" />

        {!allFilteredSelected ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSelectAllFiltered}
            className="h-8 gap-1.5 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Select All Filtered ({totalFiltered})
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground font-medium">
            All {totalFiltered} filtered selected
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Square className="h-3.5 w-3.5" />
          Deselect All
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenAssignLocation}
          className="h-8 gap-1.5 text-xs border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 font-medium"
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          Assign Location
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenIssueGreenCards}
          className="h-8 gap-1.5 text-xs border-amber-600/30 text-amber-600 hover:bg-amber-500/10 font-medium"
        >
          <IdCard className="h-3.5 w-3.5 text-amber-600" />
          Issue Green Cards
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenAssignRole}
          className="h-8 gap-1.5 text-xs border-purple-600/30 text-purple-600 hover:bg-purple-500/10 font-medium"
        >
          <UserCheck className="h-3.5 w-3.5 text-purple-600" />
          Assign Role
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onExportSelected}
          className="h-8 gap-1.5 text-xs border-border text-foreground hover:bg-muted font-medium"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          Export ({selectedCount})
        </Button>

        <button
          type="button"
          onClick={onDeselectAll}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
