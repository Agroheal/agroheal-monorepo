import { Edit3, IdCard, KeyRound, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GreenCardBadge, ProgramPills, RoleBadge, TotalSlotsBadge } from "@/components/admin/MemberBadges";
import type { Member } from "@/types/admin";

interface Props {
  members: Member[];
  activatingMemberId: string | null;
  recoveryLoading: boolean;
  onIssueGreenCard: (m: Member) => void;
  onEdit: (m: Member) => void;
  onResetPassword: (m: Member) => void;
}

export function MemberTable({ members, activatingMemberId, recoveryLoading, onIssueGreenCard, onEdit, onResetPassword }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member Details</TableHead>
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
          {members.map((m) => (
            <TableRow key={m.id}>
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
                  {!m.has_green_card && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 border-emerald-500/40 bg-emerald-500/10 px-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                      disabled={activatingMemberId === m.id}
                      onClick={() => onIssueGreenCard(m)}
                      title="Confirm offline payment (₦2,000) and issue Green Card"
                    >
                      <IdCard className="h-3 w-3" /> {activatingMemberId === m.id ? "Issuing..." : "Issue"}
                    </Button>
                  )}
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
          ))}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No members found matching the current search / filter criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
