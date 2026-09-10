import { useMemo, useState } from "react";
import { Copy, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { filterMemberPredicate, type GreenCardFilter } from "@/lib/memberFilters";
import { activateGreenCard, resetPassword, updateMember } from "@/lib/adminActions";
import { MembersKpiCards } from "@/components/admin/MembersKpiCards";
import { MembersToolbar, type MemberViewMode } from "@/components/admin/MembersToolbar";
import { MemberTable } from "@/components/admin/MemberTable";
import { MemberCard } from "@/components/admin/MemberCard";
import { EditMemberDialog, type EditMemberValues } from "@/components/admin/EditMemberDialog";
import { IssueGreenCardDialog } from "@/components/admin/IssueGreenCardDialog";
import { IssuedGreenCardSuccessDialog } from "@/components/admin/IssuedGreenCardSuccessDialog";
import { StatusBanner } from "@/components/admin/StatusBanner";
import type { Member } from "@/types/admin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { exportToExcel } from "@shared/excelExport";

function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export default function MembersPage() {
  const { isReadOnly } = useAdminAuth();
  const { members, loading, refetch } = useAdminMembers();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [greenCardFilter, setGreenCardFilter] = useState<GreenCardFilter>("all");
  const [viewMode, setViewMode] = useState<MemberViewMode>("auto");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [activatingMemberId, setActivatingMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuedGreenCardDetails, setIssuedGreenCardDetails] = useState<{ member: Member; memberId: string } | null>(
    null,
  );
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCredentials, setRecoveryCredentials] = useState<{ email: string; pass: string; name: string } | null>(
    null,
  );

  const filteredMembers = useMemo(
    () => members.filter((m) => filterMemberPredicate(m, searchQuery, greenCardFilter, programFilter)),
    [members, searchQuery, greenCardFilter, programFilter],
  );

  const showTable = viewMode === "table" || (viewMode === "auto" && isDesktop);
  const showCards = viewMode === "cards" || (viewMode === "auto" && !isDesktop);

  const flash = (fn: (v: string) => void, text: string, ms = 4000) => {
    fn(text);
    setTimeout(() => fn(""), ms);
  };

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Members_Master_${dateStamp}.xlsx`;

    const memberRows = filteredMembers.map((m, idx) => {
      const mushroomSlots = m.slots_by_program?.find((p) => p.category?.toLowerCase().includes("mushroom"))?.slots || 0;
      const gingerSlots = m.slots_by_program?.find((p) => p.category?.toLowerCase().includes("ginger"))?.slots || 0;
      const foodNationSlots = m.slots_by_program?.find((p) => p.category?.toLowerCase().includes("foodnation"))?.slots || 0;

      return {
        "S/N": idx + 1,
        "AGC Member ID": m.member_id || "-",
        "Full Name": m.full_name || "",
        "Email": m.email || "",
        "Phone Number": m.phone || "",
        "Role": m.role || "Member",
        "Green Card Status": m.has_green_card ? "ACTIVE" : "INACTIVE",
        "Green Card Expiry": m.green_card_expires_at ? new Date(m.green_card_expires_at).toLocaleDateString() : "-",
        "Total Slots": m.total_slots || 0,
        "Mushroom Village Slots": mushroomSlots,
        "Gingertown Slots": gingerSlots,
        "Organic FoodNation Slots": foodNationSlots,
        "Referral Code": m.referral_code || "-",
        "Referred By": m.referred_by || "-",
        "Joined Date": m.created_at ? new Date(m.created_at).toLocaleDateString() : "",
      };
    });

    const summaryRows = [
      { "Metric": "Total Exported Members", "Value": filteredMembers.length },
      { "Metric": "Total System Members", "Value": members.length },
      { "Metric": "Total Slots Held (Exported)", "Value": filteredMembers.reduce((sum, m) => sum + m.total_slots, 0) },
      { "Metric": "Active Green Card Holders (Exported)", "Value": filteredMembers.filter((m) => m.has_green_card).length },
      { "Metric": "Active Program Filter", "Value": programFilter },
      { "Metric": "Active Green Card Filter", "Value": greenCardFilter },
      { "Metric": "Search Query", "Value": searchQuery || "None" },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Members Directory", data: memberRows },
        { sheetName: "Directory Summary", data: summaryRows },
      ],
    });

    flash(setSuccessMessage, `Exported ${filteredMembers.length} member records to ${filename}`);
  };

  const handleActivateGreenCard = async (member: Member, skipConfirm = false) => {
    if (isReadOnly) {
      flash(setErrorMessage, "System is in Read-Only Audit Mode. Green Card activations are restricted to Super Developer (developerelijah360@gmail.com).");
      return;
    }

    if (!skipConfirm && !confirm(`Confirm offline payment (₦2,000) and issue Green Card status for ${member.full_name}?`)) {
      return;
    }

    setActivatingMemberId(member.id);
    setErrorMessage("");
    try {
      const result = await activateGreenCard({
        user_id: member.id,
        existing_member_id: member.member_id !== "No ID Assigned" ? member.member_id : undefined,
      });
      const resolvedMemberId = result.member_id;
      flash(setSuccessMessage, `Green Card successfully issued to ${member.full_name}! Member ID: ${resolvedMemberId}`);
      setIssuedGreenCardDetails({
        member: { ...member, member_id: resolvedMemberId, has_green_card: true },
        memberId: resolvedMemberId,
      });
      setIsIssueModalOpen(false);
      if (editingMember?.id === member.id) {
        setEditingMember({ ...editingMember, has_green_card: true, member_id: resolvedMemberId });
      }
      await refetch();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to activate Green Card.");
    } finally {
      setActivatingMemberId(null);
    }
  };

  const handleSaveMemberProfile = async (values: EditMemberValues) => {
    if (!editingMember) return;
    if (isReadOnly) {
      flash(setErrorMessage, "System is in Read-Only Audit Mode. Member profile edits are restricted to Super Developer (developerelijah360@gmail.com).");
      return;
    }

    setEditSaving(true);
    setErrorMessage("");
    try {
      await updateMember({
        user_id: editingMember.id,
        full_name: values.full_name,
        email: values.email || undefined,
        phone: values.phone,
        member_id: values.member_id || undefined,
        referral_code: values.referral_code || undefined,
        role: values.role,
      });
      flash(setSuccessMessage, `Profile updated successfully for ${values.full_name}!`);
      setEditingMember(null);
      refetch();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update member profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const handlePasswordReset = async (member: Member) => {
    if (isReadOnly) {
      flash(setErrorMessage, "System is in Read-Only Audit Mode. Password resets are restricted to Super Developer (developerelijah360@gmail.com).");
      return;
    }

    setRecoveryLoading(true);
    setErrorMessage("");
    setRecoveryCredentials(null);
    try {
      const result = await resetPassword({ user_id: member.id, email: member.email });
      setRecoveryCredentials({ email: result.email || member.email, pass: result.temp_password, name: member.full_name });
      flash(setSuccessMessage, `Password reset successfully for ${member.full_name}!`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      <MembersKpiCards members={members} value={greenCardFilter} onChange={setGreenCardFilter} />

      <MembersToolbar
        members={members}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        programFilter={programFilter}
        onProgramFilterChange={setProgramFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onIssueGreenCard={() => setIsIssueModalOpen(true)}
        onExportExcel={handleExportExcel}
      />

      {loading && members.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Directory Records ({filteredMembers.length}) &middot; Total Leased Slots:{" "}
              <strong className="text-foreground">{members.reduce((sum, m) => sum + m.total_slots, 0)}</strong>
            </span>
          </div>

          {showTable && (
            <MemberTable
              members={filteredMembers}
              activatingMemberId={activatingMemberId}
              recoveryLoading={recoveryLoading}
              onIssueGreenCard={(m) => handleActivateGreenCard(m)}
              onEdit={setEditingMember}
              onResetPassword={handlePasswordReset}
            />
          )}

          {showCards && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMembers.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  activatingMemberId={activatingMemberId}
                  recoveryLoading={recoveryLoading}
                  onIssueGreenCard={(mem) => handleActivateGreenCard(mem)}
                  onEdit={setEditingMember}
                  onResetPassword={handlePasswordReset}
                />
              ))}
              {filteredMembers.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
                  No members found matching the current search / filter criteria.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {recoveryCredentials && (
        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-5">
          <span className="mb-1.5 block text-sm font-semibold text-amber-400">
            Password Reset for {recoveryCredentials.name}
          </span>
          <p className="mb-3 text-sm text-muted-foreground">
            The temporary password is active immediately. You can forward it directly to the member or their family.
          </p>
          <div className="inline-block rounded-lg bg-background px-3 py-2.5 font-mono text-sm leading-relaxed">
            Email: <strong>{recoveryCredentials.email}</strong>
            <br />
            Temporary Password: <strong>{recoveryCredentials.pass}</strong>
          </div>
          <div className="mt-3.5 flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(
                  `Hello ${recoveryCredentials.name},\n\nYour Agroheal account password has been reset.\nEmail: ${recoveryCredentials.email}\nTemporary Password: ${recoveryCredentials.pass}\n\nLogin at: https://www.agroheal.solutions/login`,
                );
                flash(setSuccessMessage, "Reset message copied to clipboard!", 3000);
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy Message
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe57]"
              onClick={() =>
                openWhatsApp(
                  `Hello ${recoveryCredentials.name},\n\nYour Agroheal LEAP password has been reset:\nEmail: ${recoveryCredentials.email}\nTemporary Password: ${recoveryCredentials.pass}\n\nSign in at: https://www.agroheal.solutions/login`,
                )
              }
            >
              <MessageCircle className="h-3.5 w-3.5" /> Forward via WhatsApp
            </Button>
          </div>
        </div>
      )}

      <EditMemberDialog
        member={editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        onSave={handleSaveMemberProfile}
        saving={editSaving}
        onActivateGreenCard={(m) => handleActivateGreenCard(m)}
        activatingMemberId={activatingMemberId}
      />

      <IssueGreenCardDialog
        open={isIssueModalOpen}
        onOpenChange={setIsIssueModalOpen}
        members={members}
        activatingMemberId={activatingMemberId}
        onConfirm={(m) => handleActivateGreenCard(m, true)}
      />

      <IssuedGreenCardSuccessDialog
        details={issuedGreenCardDetails}
        onOpenChange={(open) => !open && setIssuedGreenCardDetails(null)}
        onCopied={() => flash(setSuccessMessage, "Confirmation message copied to clipboard!", 3000)}
      />
    </div>
  );
}
