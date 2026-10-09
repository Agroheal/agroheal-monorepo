import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CreditCard, Lock, Save, Shield, ShieldCheck, UserCog, Building2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { getProgramEmoji, getProgramPillClass } from "@/lib/memberFilters";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";
import { cleanName, cleanEmail, normalizePhoneNumber, cleanMemberId, cleanReferralCode } from "@shared/dataSanitizers";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminApiClient } from "@/lib/apiClient";
import { useState } from "react";

const editMemberSchema = z.object({
  full_name: z.string().trim().min(1, "Full Name cannot be empty."),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]),
  phone: z.string().trim(),
  member_id: z.string().trim(),
  referral_code: z.string().trim(),
  role: z.string(),
  can_manage_system_configs: z.boolean().default(false),
  access_treasury: z.boolean().default(false),
  process_withdrawals: z.boolean().default(false),
  manage_members: z.boolean().default(false),
  manage_farms: z.boolean().default(false),
  mutate_financials: z.boolean().default(false),
  export_data: z.boolean().default(false),
});

export type EditMemberValues = z.infer<typeof editMemberSchema>;

interface Props {
  member: Member | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: EditMemberValues) => Promise<void> | void;
  saving: boolean;
  onRequestIssueGreenCard?: (member: Member) => void;
}

export function EditMemberDialog({
  member,
  onOpenChange,
  onSave,
  saving,
  onRequestIssueGreenCard,
}: Props) {
  const { isSuperDeveloper, canAssignRoles, allowedAssignableRoles } = useAdminAuth();
  const [resettingBankLock, setResettingBankLock] = useState(false);
  const [bankLockResetSuccess, setBankLockResetSuccess] = useState(false);

  useEffect(() => {
    setBankLockResetSuccess(false);
  }, [member?.id]);

  const hasBank = Boolean(member?.bank_account_number && member.bank_account_number.trim().length >= 10);
  const isBankLocked = Boolean(
    !bankLockResetSuccess &&
    member?.bank_account_number &&
    member?.bank_updated_at &&
    (Date.now() - new Date(member.bank_updated_at).getTime()) / (1000 * 60 * 60 * 24) < 30
  );
  const daysRemaining = isBankLocked
    ? Math.max(1, Math.ceil(30 - (Date.now() - new Date(member!.bank_updated_at!).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const form = useForm<EditMemberValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      member_id: "",
      referral_code: "",
      role: "user",
      can_manage_system_configs: false,
      access_treasury: false,
      process_withdrawals: false,
      manage_members: false,
      manage_farms: false,
      mutate_financials: false,
      export_data: false,
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        full_name: member.full_name || "",
        email: member.email === "No Email" ? "" : member.email,
        phone: member.phone || "",
        member_id: member.member_id === "No ID Assigned" ? "" : member.member_id,
        referral_code: member.referral_code || "",
        role: member.role || "user",
        can_manage_system_configs: Boolean(member.can_manage_system_configs),
        access_treasury: Boolean(member.custom_permissions?.access_treasury),
        process_withdrawals: Boolean(member.custom_permissions?.process_withdrawals),
        manage_members: Boolean(member.custom_permissions?.manage_members),
        manage_farms: Boolean(member.custom_permissions?.manage_farms),
        mutate_financials: Boolean(member.custom_permissions?.mutate_financials),
        export_data: Boolean(member.custom_permissions?.export_data),
      });
    }
  }, [member, form]);

  if (!member) return null;

  const isTargetSuper = member.role === "super_admin";
  const canModifyRole = canAssignRoles && (!isTargetSuper || isSuperDeveloper);

  const availableRoleOptions = allowedAssignableRoles.map((r) => {
    switch (r) {
      case "super_admin":
        return { value: "super_admin", label: "Super Administrator" };
      case "admin":
        return { value: "admin", label: "Administrator" };
      case "reviewer":
        return { value: "reviewer", label: "Reviewer / Auditor" };
      case "coordinator":
        return { value: "coordinator", label: "Farm Coordinator" };
      case "support":
        return { value: "support", label: "Support Specialist" };
      case "user":
      default:
        return { value: "user", label: "Standard Member" };
    }
  });

  const hasCurrentRoleInOptions = availableRoleOptions.some(
    (opt) => opt.value === (member.role || "user")
  );
  const roleOptionsToRender = hasCurrentRoleInOptions
    ? availableRoleOptions
    : [
        {
          value: member.role || "user",
          label: `Current: ${member.role || "Member"}`,
        },
        ...availableRoleOptions,
      ];

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" /> Edit Member Profile
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              const cleaned: EditMemberValues = {
                full_name: cleanName(values.full_name),
                email: cleanEmail(values.email),
                phone: normalizePhoneNumber(values.phone),
                member_id: cleanMemberId(values.member_id),
                referral_code: cleanReferralCode(values.referral_code),
                role: values.role,
                can_manage_system_configs: values.can_manage_system_configs,
                access_treasury: values.access_treasury,
                process_withdrawals: values.process_withdrawals,
                manage_members: values.manage_members,
                manage_farms: values.manage_farms,
                mutate_financials: values.mutate_financials,
                export_data: values.export_data,
              };
              onSave(cleaned);
            })}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Current Program Enrollments &amp; Slots:
              </span>
              {member.total_slots > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {member.slots_by_program.map((prog, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        getProgramPillClass(prog.category),
                      )}
                    >
                      {getProgramEmoji(prog.category)} {prog.category}: <strong className="ml-0.5">{prog.slots} slots</strong>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No active farm slots on record.</span>
              )}
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5",
                member.has_green_card ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5",
              )}
            >
              <div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    member.has_green_card ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {member.has_green_card ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {member.has_green_card ? "Active Green Card Member" : "Green Card Not Active (Unpaid)"}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {member.has_green_card
                    ? `Member ID: ${member.member_id}`
                    : "User registered but has not completed Green Card subscription payment."}
                </span>
              </div>
              {!member.has_green_card && onRequestIssueGreenCard && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 whitespace-nowrap bg-emerald-500/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                  onClick={() => onRequestIssueGreenCard(member)}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Issue Green Card (With Proof)
                </Button>
              )}
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AGC-000123-2026"
                        className="font-mono bg-muted/60 text-muted-foreground cursor-not-allowed"
                        disabled
                        title="Member ID is automatically generated by the database sequence upon Green Card activation."
                        {...field}
                      />
                    </FormControl>
                    <span className="text-[11px] text-muted-foreground">
                      Auto-generated on Green Card activation. Read-only to preserve sequence integrity.
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referral_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="REF123"
                        className="font-mono bg-muted/60 text-muted-foreground cursor-not-allowed"
                        disabled
                        readOnly
                        title="Referral code is permanently immutable to prevent breaking downstream referral trees."
                        {...field}
                      />
                    </FormControl>
                    <span className="text-[11px] text-muted-foreground">
                      Permanently assigned on registration. Read-only to preserve tree integrity.
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>User Access Role</FormLabel>
                    {!canModifyRole && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Delegation restricted
                      </span>
                    )}
                  </div>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canModifyRole}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptionsToRender.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!canModifyRole && (
                    <span className="text-[11px] text-muted-foreground">
                      Only Super Admin and authorized delegation can modify account roles.
                    </span>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Banking & 30-Day Withdrawal Lock */}
            <div className="rounded-lg border border-border bg-background/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  Banking &amp; 30-Day Withdrawal Lock
                </div>
                {hasBank && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase",
                      member?.bank_verified
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}
                  >
                    {member?.bank_verified ? "NIBSS Verified" : "Verification Pending"}
                  </span>
                )}
              </div>

              {hasBank ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-muted/40">
                      <span className="text-muted-foreground block text-[10px] font-sans">Bank:</span>
                      <span className="font-semibold text-foreground truncate block">{member?.bank_name}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                      <span className="text-muted-foreground block text-[10px] font-sans">Account Number:</span>
                      <span className="font-semibold text-foreground truncate block">{member?.bank_account_number}</span>
                    </div>
                  </div>
                  {member?.bank_account_name && (
                    <div className="p-2 rounded bg-muted/40 text-[11px]">
                      <span className="text-muted-foreground block text-[10px]">Account Name:</span>
                      <span className="font-semibold text-foreground">{member.bank_account_name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {isBankLocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Locked ({daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          {bankLockResetSuccess ? "Lock Reset by Admin" : "Unlocked for Updates"}
                        </span>
                      )}
                    </div>

                    {isBankLocked && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={resettingBankLock}
                        onClick={async () => {
                          if (!member?.id) return;
                          setResettingBankLock(true);
                          try {
                            await adminApiClient.members.resetBankLock(member.id);
                            setBankLockResetSuccess(true);
                          } catch (err: any) {
                            alert(err.message || "Failed to reset bank lock");
                          } finally {
                            setResettingBankLock(false);
                          }
                        }}
                        className="h-7 text-[11px] gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      >
                        <Unlock className="w-3 h-3" />
                        {resettingBankLock ? "Resetting..." : "Reset 30-Day Lock"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Member has not linked a payout bank account.
                </p>
              )}
            </div>

            {/* Granular Permission Overrides */}
            <div className="rounded-lg border border-border bg-background/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  Granular Permission Overrides
                </div>
                <span className="text-[11px] text-muted-foreground">
                  User-specific capability toggles
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Platform Economics / System Configs */}
                <FormField
                  control={form.control}
                  name="can_manage_system_configs"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Platform Parameters & Economics
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          {isSuperDeveloper
                            ? "Authorize platform fee, parameter, and reserve controls"
                            : "Delegation strictly reserved for Super Administrator"}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isSuperDeveloper}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Treasury & Solvency Shield */}
                <FormField
                  control={form.control}
                  name="access_treasury"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Financial Treasury Access
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          View live treasury audits, liquid balances, and reserves
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canAssignRoles}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Disbursement Queue */}
                <FormField
                  control={form.control}
                  name="process_withdrawals"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Disbursement Queue Management
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          Review, approve, and disburse bank withdrawals
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canAssignRoles}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Member Operations */}
                <FormField
                  control={form.control}
                  name="manage_members"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Member Management
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          Manage profile details, activations, and suspensions
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canAssignRoles}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Farm Management */}
                <FormField
                  control={form.control}
                  name="manage_farms"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Farm Management & Operations
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          Supervise farm groups, assign slots, and record expenses
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canAssignRoles}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Financial Mutations */}
                <FormField
                  control={form.control}
                  name="mutate_financials"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Financial Mutations & Green Cards
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          Execute offline activations and manual slot crediting
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canAssignRoles}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Data Export */}
                <FormField
                  control={form.control}
                  name="export_data"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 rounded-md border border-border/40 p-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Data Export to Excel
                        </FormLabel>
                        <p className="text-[10px] text-muted-foreground">
                          Export members, transactions, and audit reports
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canAssignRoles}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving Changes..." : "Save Profile Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
