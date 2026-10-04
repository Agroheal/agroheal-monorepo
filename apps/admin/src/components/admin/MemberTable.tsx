import { Edit3, KeyRound, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GreenCardBadge, ProgramPills, RoleBadge, TotalSlotsBadge } from "@/components/admin/MemberBadges";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";

interface Props {
  members: Member[];
  recoveryLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (m: Member) => void;
  onResetPassword: (m: Member) => void;
}

export function MemberTable({
  members,
  recoveryLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onResetPassword,
}: Props) {
  const allSelected = members.length > 0 && members.every((m) => selectedIds.has(m.id));
  const someSelected = members.some((m) => selectedIds.has(m.id)) && !allSelected;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center px-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                title={allSelected ? "Unselect all" : "Select all"}
              />
            </TableHead>
            <TableHead>Member Details</TableHead>
            <TableHead>Location &amp; Standing</TableHead>
            <TableHead>Green Card Status &amp; ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Subscribed Programs &amp; Slots</TableHead>
            <TableHead>Referral Code</TableHead>
            <TableHead>Referred By</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const isSelected = selectedIds.has(m.id);
            return (
              <TableRow key={m.id} className={cn(isSelected && "bg-emerald-500/10")}>
                <TableCell className="w-10 text-center px-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(m.id)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </TableCell>
                <TableCell>
                  <div className="text-sm font-semibold text-foreground">{m.full_name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                  {m.phone && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <Phone className="h-3 w-3" /> {m.phone}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {m.state && m.lga ? (
                    <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{m.lga}, {m.state}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-500 font-medium">
                      Pending Location
                    </div>
                  )}
                  {Number(m.advance_debt_balance || 0) > 0 && (
                    <div className="mt-1 inline-block text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                      Advance Debt: ₦{Number(m.advance_debt_balance).toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <GreenCardBadge active={m.has_green_card} />
                  {m.has_green_card ? (
                    <div className="mt-1 font-mono text-xs font-semibold text-foreground">{m.member_id}</div>
                  ) : (
                    <div className="mt-1 text-xs text-muted-foreground">Unpaid / Not Issued</div>
                  )}
                </TableCell>
                <TableCell>
                  <RoleBadge role={m.role} />
                </TableCell>
                <TableCell>
                  {m.total_slots > 0 ? (
                    <div>
                      <TotalSlotsBadge total={m.total_slots} />
                      <ProgramPills programs={m.slots_by_program} />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">0 Slots</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{m.referral_code || "N/A"}</TableCell>
                <TableCell className="text-xs">{m.referred_by || "Direct"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.created_at}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => onEdit(m)}>
                      <Edit3 className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={recoveryLoading}
                      onClick={() => onResetPassword(m)}
                    >
                      <KeyRound className="h-3 w-3" /> Reset
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                No members found matching the current search / filter criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
