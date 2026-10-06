import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  filterMemberPredicate,
  type GreenCardFilter,
  type DebtorFilter,
  type LocationStatusFilter,
} from "@/lib/memberFilters";
import { activateGreenCard, updateMember, recordAuditEvent, toggleSuspendMember } from "@/lib/adminActions";
import { MembersKpiCards } from "@/components/admin/MembersKpiCards";
import { MembersToolbar, type MemberViewMode } from "@/components/admin/MembersToolbar";
import { MemberTable } from "@/components/admin/MemberTable";
import { MemberCard } from "@/components/admin/MemberCard";
import { EditMemberDialog, type EditMemberValues } from "@/components/admin/EditMemberDialog";
import { IssueGreenCardDialog } from "@/components/admin/IssueGreenCardDialog";
import { IssuedGreenCardSuccessDialog } from "@/components/admin/IssuedGreenCardSuccessDialog";
import { PasswordResetModal } from "@/components/admin/PasswordResetModal";
import { CreateMemberDialog } from "@/components/admin/CreateMemberDialog";
import { MassActionsBar } from "@/components/admin/MassActionsBar";
import { MassAssignLocationDialog } from "@/components/admin/MassAssignLocationDialog";
import { MassAssignRoleDialog } from "@/components/admin/MassAssignRoleDialog";
import { MassIssueGreenCardDialog } from "@/components/admin/MassIssueGreenCardDialog";
import { StatusBanner } from "@/components/admin/StatusBanner";
import type { Member } from "@/types/admin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { exportToExcel } from "@shared/excelExport";
import { formatWATDateTime, formatWATDate } from "@/lib/dateTimeFormat";
import { supabase } from "@/lib/supabaseClient";

export default function MembersPage() {
  const { isReadOnly } = useAdminAuth();
  const { members, loading, refetch } = useAdminMembers();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [greenCardFilter, setGreenCardFilter] = useState<GreenCardFilter>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [debtorFilter, setDebtorFilter] = useState<DebtorFilter>("all");
  const [locationStatusFilter, setLocationStatusFilter] = useState<LocationStatusFilter>("all");
  const [viewMode, setViewMode] = useState<MemberViewMode>("auto");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Mass Actions Modals & Progress
  const [isAssignLocationOpen, setIsAssignLocationOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [isMassGreenCardOpen, setIsMassGreenCardOpen] = useState(false);
  const [massLoading, setMassLoading] = useState(false);
  const [massProgress, setMassProgress] = useState<{ current: number; total: number; currentName?: string } | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [activatingMemberId, setActivatingMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuedGreenCardDetails, setIssuedGreenCardDetails] = useState<{ member: Member; memberId: string } | null>(
    null,
  );
  const [passwordResetMember, setPasswordResetMember] = useState<Member | null>(null);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    programFilter !== "all" ||
    greenCardFilter !== "all" ||
    stateFilter !== "all" ||
    lgaFilter !== "all" ||
    debtorFilter !== "all" ||
    locationStatusFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setProgramFilter("all");
    setGreenCardFilter("all");
    setStateFilter("all");
    setLgaFilter("all");
    setDebtorFilter("all");
    setLocationStatusFilter("all");
  };

  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        filterMemberPredicate(m, searchQuery, greenCardFilter, programFilter, {
          stateFilter,
          lgaFilter,
          debtorFilter,
          locationStatusFilter,
        }),
      ),
    [
      members,
      searchQuery,
      greenCardFilter,
      programFilter,
      stateFilter,
      lgaFilter,
      debtorFilter,
      locationStatusFilter,
    ],
  );

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.has(m.id)),
    [members, selectedIds],
  );

  const showTable = viewMode === "table" || (viewMode === "auto" && isDesktop);
  const showCards = viewMode === "cards" || (viewMode === "auto" && !isDesktop);

  const flash = (fn: (v: string) => void, text: string, ms = 4000) => {
    fn(text);
    setTimeout(() => fn(""), ms);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allFilteredSelected = filteredMembers.length > 0 && filteredMembers.every((m) => prev.has(m.id));
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredMembers.forEach((m) => next.delete(m.id));
      } else {
        filteredMembers.forEach((m) => next.add(m.id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Mass action handlers
  const handleMassAssignLocation = async (state: string, lga: string) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Mass actions require Administrator privileges.");
      return;
    }
    if (selectedMembers.length === 0) return;

    setMassLoading(true);
    setErrorMessage("");
    try {
      const ids = selectedMembers.map((m) => m.id);
      const { error } = await supabase
        .from("profiles")
        .update({
          country: "Nigeria",
          state,
          lga,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);

      if (error) throw error;

      await recordAuditEvent({
        action: "MASS_ASSIGN_LOCATION",
        entity_type: "profiles",
        entity_id: null,
        payload: {
          member_count: ids.length,
          state,
          lga,
          member_ids: ids,
        },
      });

      flash(setSuccessMessage, `Assigned ${state} / ${lga} to ${ids.length} members successfully!`);
      await refetch();
      setSelectedIds(new Set());
      setIsAssignLocationOpen(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to mass assign location.");
    } finally {
      setMassLoading(false);
    }
  };

  const handleMassAssignRole = async (role: string) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Mass actions require Administrator privileges.");
      return;
    }
    if (selectedMembers.length === 0) return;

    setMassLoading(true);
    setErrorMessage("");
    try {
      const ids = selectedMembers.map((m) => m.id);
      const { error } = await supabase
        .from("profiles")
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);

      if (error) throw error;

      await recordAuditEvent({
        action: "MASS_ASSIGN_ROLE",
        entity_type: "profiles",
        entity_id: null,
        payload: {
          member_count: ids.length,
          role,
          member_ids: ids,
        },
      });

      flash(setSuccessMessage, `Updated role to ${role} for ${ids.length} members successfully!`);
      await refetch();
      setSelectedIds(new Set());
      setIsAssignRoleOpen(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to mass assign role.");
    } finally {
      setMassLoading(false);
    }
  };

  const handleMassIssueGreenCards = async (unpaidMembers: Member[]) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Mass actions require Administrator privileges.");
      return;
    }
    if (unpaidMembers.length === 0) return;

    setMassLoading(true);
    setErrorMessage("");
    let successCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < unpaidMembers.length; i++) {
      const m = unpaidMembers[i];
      setMassProgress({ current: i + 1, total: unpaidMembers.length, currentName: m.full_name });
      try {
        await activateGreenCard({
          user_id: m.id,
          existing_member_id: m.member_id !== "No ID Assigned" ? m.member_id : undefined,
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to activate Green Card for ${m.full_name}:`, err);
        failures.push(`${m.full_name} (${err instanceof Error ? err.message : "error"})`);
      }
    }

    setMassProgress(null);
    setMassLoading(false);
    setIsMassGreenCardOpen(false);

    if (successCount > 0) {
      flash(
        setSuccessMessage,
        `Activated Green Cards for ${successCount} member${successCount !== 1 ? "s" : ""}.${
          failures.length > 0 ? ` ${failures.length} failed.` : ""
        }`,
      );
    }
    if (failures.length > 0 && successCount === 0) {
      setErrorMessage(`Failed to activate Green Cards: ${failures.slice(0, 3).join(", ")}`);
    }

    await refetch();
    setSelectedIds(new Set());
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
        "Country": m.country || "Nigeria",
        "State": m.state || "-",
        "LGA": m.lga || "-",
        "Green Card Status": m.has_green_card ? "ACTIVE" : "INACTIVE",
        "Green Card Expiry": m.green_card_expires_at ? formatWATDate(m.green_card_expires_at) : "-",
        "Total Slots": m.total_slots || 0,
        "Mushroom Village Slots": mushroomSlots,
        "Gingertown Slots": gingerSlots,
        "Organic FoodNation Slots": foodNationSlots,
        "Advance Debt Balance (NGN)": Number(m.advance_debt_balance || 0),
        "Referral Code": m.referral_code || "-",
        "Referred By": m.referred_by || "-",
        "Joined Date": m.created_at ? formatWATDateTime(m.created_at) : "",
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

  const handleExportSelectedExcel = () => {
    const targetMembers = selectedMembers.length > 0 ? selectedMembers : filteredMembers;
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Selected_Members_${dateStamp}.xlsx`;

    const memberRows = targetMembers.map((m, idx) => {
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
        "Country": m.country || "Nigeria",
        "State": m.state || "-",
        "LGA": m.lga || "-",
        "Green Card Status": m.has_green_card ? "ACTIVE" : "INACTIVE",
        "Green Card Expiry": m.green_card_expires_at ? formatWATDate(m.green_card_expires_at) : "-",
        "Total Slots": m.total_slots || 0,
        "Mushroom Village Slots": mushroomSlots,
        "Gingertown Slots": gingerSlots,
        "Organic FoodNation Slots": foodNationSlots,
        "Advance Debt Balance (NGN)": Number(m.advance_debt_balance || 0),
        "Referral Code": m.referral_code || "-",
        "Referred By": m.referred_by || "-",
        "Joined Date": m.created_at ? formatWATDateTime(m.created_at) : "",
      };
    });

    const summaryRows = [
      { "Metric": "Exported Count", "Value": targetMembers.length },
      { "Metric": "Total System Members", "Value": members.length },
      { "Metric": "Total Slots Held (Exported)", "Value": targetMembers.reduce((sum, m) => sum + m.total_slots, 0) },
      { "Metric": "Active Green Card Holders (Exported)", "Value": targetMembers.filter((m) => m.has_green_card).length },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Selected Members", data: memberRows },
        { sheetName: "Export Summary", data: summaryRows },
      ],
    });

    flash(setSuccessMessage, `Exported ${targetMembers.length} selected member records to ${filename}`);
  };

  const handleActivateGreenCard = async (
    member: Member,
    offlineDetails?: {
      transactionRef?: string;
      paymentDate?: string;
      receiptUrl?: string;
      notes?: string;
      amount?: number;
      isLegacy?: boolean;
    },
  ) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Green Card activations require Administrator privileges.");
      return;
    }

    setActivatingMemberId(member.id);
    setErrorMessage("");
    try {
      const result = await activateGreenCard({
        user_id: member.id,
        existing_member_id: member.member_id !== "No ID Assigned" ? member.member_id : undefined,
        transaction_ref: offlineDetails?.transactionRef,
        payment_date: offlineDetails?.paymentDate,
        receipt_url: offlineDetails?.receiptUrl,
        notes: offlineDetails?.notes,
        amount: offlineDetails?.amount,
        is_legacy: offlineDetails?.isLegacy,
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
      flash(setErrorMessage, "Support role is Read-Only. Member profile edits require Administrator privileges.");
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

  const handlePasswordReset = (member: Member) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Password resets require Administrator privileges.");
      return;
    }
    setPasswordResetMember(member);
  };

  const handleToggleSuspend = async (member: Member) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Account status modifications require Administrator privileges.");
      return;
    }
    const newStatus = !member.is_suspended;
    try {
      await toggleSuspendMember({
        user_id: member.id,
        is_suspended: newStatus,
        reason: newStatus ? "Suspended by Administrator" : "Reactivated by Administrator",
      });
      flash(
        setSuccessMessage,
        `Account for ${member.full_name} has been ${newStatus ? "suspended" : "reactivated"} successfully!`,
      );
      await refetch();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update member status.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      <MembersKpiCards members={members} value={greenCardFilter} onChange={setGreenCardFilter} loading={loading} />

      <MassActionsBar
        selectedCount={selectedIds.size}
        totalFiltered={filteredMembers.length}
        onSelectAllFiltered={handleSelectAllFiltered}
        onDeselectAll={handleDeselectAll}
        onOpenAssignLocation={() => setIsAssignLocationOpen(true)}
        onOpenIssueGreenCards={() => setIsMassGreenCardOpen(true)}
        onOpenAssignRole={() => setIsAssignRoleOpen(true)}
        onExportSelected={handleExportSelectedExcel}
      />

      <MembersToolbar
        members={members}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        programFilter={programFilter}
        onProgramFilterChange={setProgramFilter}
        greenCardFilter={greenCardFilter}
        onGreenCardFilterChange={setGreenCardFilter}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
        lgaFilter={lgaFilter}
        onLgaFilterChange={setLgaFilter}
        debtorFilter={debtorFilter}
        onDebtorFilterChange={setDebtorFilter}
        locationStatusFilter={locationStatusFilter}
        onLocationStatusFilterChange={setLocationStatusFilter}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onIssueGreenCard={() => setIsIssueModalOpen(true)}
        onCreateMember={() => setIsCreateMemberOpen(true)}
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
              Directory Records ({filteredMembers.length}) &middot; Active Community Farm Slots:{" "}
              <strong className="text-foreground">{members.reduce((sum, m) => sum + m.total_slots, 0)}</strong>
            </span>
          </div>

          {showTable && (
            <MemberTable
              members={filteredMembers}
              recoveryLoading={false}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onEdit={setEditingMember}
              onResetPassword={handlePasswordReset}
              onToggleSuspend={handleToggleSuspend}
            />
          )}

          {showCards && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMembers.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  recoveryLoading={false}
                  selected={selectedIds.has(m.id)}
                  onToggleSelect={() => handleToggleSelect(m.id)}
                  onEdit={setEditingMember}
                  onResetPassword={handlePasswordReset}
                  onToggleSuspend={handleToggleSuspend}
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

      <EditMemberDialog
        member={editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        onSave={handleSaveMemberProfile}
        saving={editSaving}
        onRequestIssueGreenCard={() => {
          setEditingMember(null);
          setIsIssueModalOpen(true);
        }}
      />

      <IssueGreenCardDialog
        open={isIssueModalOpen}
        onOpenChange={setIsIssueModalOpen}
        members={members}
        activatingMemberId={activatingMemberId}
        onConfirm={(m, details) => handleActivateGreenCard(m, details)}
      />

      <IssuedGreenCardSuccessDialog
        details={issuedGreenCardDetails}
        onOpenChange={(open) => !open && setIssuedGreenCardDetails(null)}
        onCopied={() => flash(setSuccessMessage, "Confirmation message copied to clipboard!", 3000)}
      />

      <MassAssignLocationDialog
        open={isAssignLocationOpen}
        onOpenChange={setIsAssignLocationOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleMassAssignLocation}
        loading={massLoading}
      />

      <MassAssignRoleDialog
        open={isAssignRoleOpen}
        onOpenChange={setIsAssignRoleOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleMassAssignRole}
        loading={massLoading}
      />

      <MassIssueGreenCardDialog
        open={isMassGreenCardOpen}
        onOpenChange={setIsMassGreenCardOpen}
        selectedMembers={selectedMembers}
        onConfirm={handleMassIssueGreenCards}
        loading={massLoading}
        progress={massProgress}
      />

      <PasswordResetModal
        member={passwordResetMember}
        onOpenChange={(open) => !open && setPasswordResetMember(null)}
        onSuccess={(msg) => flash(setSuccessMessage, msg)}
        onError={(msg) => setErrorMessage(msg)}
      />

      <CreateMemberDialog
        open={isCreateMemberOpen}
        onOpenChange={setIsCreateMemberOpen}
        onRegistered={refetch}
        onSuccess={(msg) => flash(setSuccessMessage, msg)}
        onError={(msg) => setErrorMessage(msg)}
      />
    </div>
  );
}
