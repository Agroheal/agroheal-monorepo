import type { ReactNode } from "react";
import { Search, Filter, IdCard, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";

export type MemberViewMode = "auto" | "table" | "cards";

interface Props {
  members: Member[];
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  programFilter: string;
  onProgramFilterChange: (v: string) => void;
  viewMode: MemberViewMode;
  onViewModeChange: (v: MemberViewMode) => void;
  onIssueGreenCard: () => void;
}

export function MembersToolbar({
  members,
  searchQuery,
  onSearchQueryChange,
  programFilter,
  onProgramFilterChange,
  viewMode,
  onViewModeChange,
  onIssueGreenCard,
}: Props) {
  const hasSlots = members.filter((m) => m.total_slots > 0).length;
  const noSlots = members.length - hasSlots;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search name, email, phone, member ID..."
            className="pl-9"
          />
        </div>
        <Select value={programFilter} onValueChange={onProgramFilterChange}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="has_slots">🌱 Has Active Slots ({hasSlots})</SelectItem>
            <SelectItem value="no_slots">0 Slots ({noSlots})</SelectItem>
            <SelectItem value="Mushroom">🍄 Mushroom Village</SelectItem>
            <SelectItem value="Ginger">🌿 Gingertown</SelectItem>
            <SelectItem value="FoodNation">🌾 Organic FoodNation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          <ToggleBtn active={viewMode === "table"} onClick={() => onViewModeChange("table")} title="Force table view">
            <TableIcon className="h-3.5 w-3.5" />
          </ToggleBtn>
          <ToggleBtn active={viewMode === "cards"} onClick={() => onViewModeChange("cards")} title="Force card view">
            <LayoutGrid className="h-3.5 w-3.5" />
          </ToggleBtn>
          <ToggleBtn
            active={viewMode === "auto"}
            onClick={() => onViewModeChange("auto")}
            title="Auto (table on desktop, cards on mobile)"
          >
            <span className="px-1 text-xs">Auto</span>
          </ToggleBtn>
        </div>
        <Button type="button" onClick={onIssueGreenCard} className="gap-2 whitespace-nowrap">
          <IdCard className="h-4 w-4" /> Issue Green Card
        </Button>
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
