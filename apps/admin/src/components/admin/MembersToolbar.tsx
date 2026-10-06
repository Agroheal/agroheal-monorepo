import type { ReactNode } from "react";
import { Search, Filter, IdCard, LayoutGrid, Table as TableIcon, FileSpreadsheet, MapPin, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";
import type { DebtorFilter, LocationStatusFilter } from "@/lib/memberFilters";
import { NIGERIA_STATES, getLgasForState } from "@shared/nigeriaLocations";

export type MemberViewMode = "auto" | "table" | "cards";

interface Props {
  members: Member[];
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  programFilter: string;
  onProgramFilterChange: (v: string) => void;
  stateFilter: string;
  onStateFilterChange: (v: string) => void;
  lgaFilter: string;
  onLgaFilterChange: (v: string) => void;
  debtorFilter: DebtorFilter;
  onDebtorFilterChange: (v: DebtorFilter) => void;
  locationStatusFilter: LocationStatusFilter;
  onLocationStatusFilterChange: (v: LocationStatusFilter) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  viewMode: MemberViewMode;
  onViewModeChange: (v: MemberViewMode) => void;
  onIssueGreenCard: () => void;
  onExportExcel?: () => void;
}

export function MembersToolbar({
  members,
  searchQuery,
  onSearchQueryChange,
  programFilter,
  onProgramFilterChange,
  stateFilter,
  onStateFilterChange,
  lgaFilter,
  onLgaFilterChange,
  debtorFilter,
  onDebtorFilterChange,
  locationStatusFilter,
  onLocationStatusFilterChange,
  onResetFilters,
  hasActiveFilters,
  viewMode,
  onViewModeChange,
  onIssueGreenCard,
  onExportExcel,
}: Props) {
  const hasSlots = members.filter((m) => m.total_slots > 0).length;
  const noSlots = members.length - hasSlots;
  const debtorCount = members.filter((m) => Number(m.advance_debt_balance || 0) > 0).length;

  const availableLgas = stateFilter && stateFilter !== "all" ? getLgasForState(stateFilter) : [];

  return (
    <div className="flex flex-col gap-3 bg-card p-3 rounded-xl border border-border">
      {/* Row 1: Search & Action Buttons */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Free Text Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search name, phone, email, LGA..."
            className="pl-9 h-9 text-xs w-full"
          />
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end shrink-0">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
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

          {onExportExcel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className="h-9 gap-1.5 whitespace-nowrap text-xs border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 font-semibold"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export Excel
            </Button>
          )}

          <Button type="button" size="sm" onClick={onIssueGreenCard} className="h-9 gap-1.5 whitespace-nowrap text-xs bg-primary hover:bg-primary/90 text-white">
            <IdCard className="h-3.5 w-3.5" /> Issue Green Card
          </Button>
        </div>
      </div>

      {/* Row 2: Secondary Filters Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
        {/* Program Filter */}
        <Select value={programFilter} onValueChange={onProgramFilterChange}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <Filter className="mr-1 h-3 w-3 text-muted-foreground" />
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="has_slots">🌱 Has Slots ({hasSlots})</SelectItem>
            <SelectItem value="no_slots">0 Slots ({noSlots})</SelectItem>
            <SelectItem value="Mushroom">🍄 Mushroom Village</SelectItem>
            <SelectItem value="Ginger">🌿 Gingertown</SelectItem>
            <SelectItem value="FoodNation">🌾 Organic FoodNation</SelectItem>
          </SelectContent>
        </Select>

        {/* State Filter (with Typeahead textValue) */}
        <Select
          value={stateFilter}
          onValueChange={(val) => {
            onStateFilterChange(val);
            onLgaFilterChange("all");
          }}
        >
          <SelectTrigger className="w-[145px] h-8 text-xs">
            <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all" textValue="All States">All States (Nigeria)</SelectItem>
            {NIGERIA_STATES.map((st) => (
              <SelectItem key={st} value={st} textValue={st}>
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cascading LGA Filter (with Typeahead textValue) */}
        <Select
          value={lgaFilter}
          onValueChange={onLgaFilterChange}
          disabled={!stateFilter || stateFilter === "all"}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs disabled:opacity-50">
            <SelectValue placeholder={stateFilter && stateFilter !== "all" ? "All LGAs" : "Select State First"} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all" textValue="All LGAs">All LGAs ({availableLgas.length})</SelectItem>
            {availableLgas.map((lg) => (
              <SelectItem key={lg} value={lg} textValue={lg}>
                {lg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Debtor Filter */}
        <Select value={debtorFilter} onValueChange={(val) => onDebtorFilterChange(val as DebtorFilter)}>
          <SelectTrigger className="w-[135px] h-8 text-xs">
            <SelectValue placeholder="Debtor Standing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Balances</SelectItem>
            <SelectItem value="debtors">⚠️ Debtors ({debtorCount})</SelectItem>
            <SelectItem value="debt_free">✅ Debt-Free</SelectItem>
          </SelectContent>
        </Select>

        {/* Location Status Filter */}
        <Select
          value={locationStatusFilter}
          onValueChange={(val) => onLocationStatusFilterChange(val as LocationStatusFilter)}
        >
          <SelectTrigger className="w-[135px] h-8 text-xs">
            <SelectValue placeholder="Location Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="configured">📍 Configured LGA</SelectItem>
            <SelectItem value="pending">⚠️ Pending LGA</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Reset all filters"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
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
