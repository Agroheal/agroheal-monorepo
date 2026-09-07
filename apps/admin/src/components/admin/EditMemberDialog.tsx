import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CreditCard, Save, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getProgramEmoji, getProgramPillClass } from "@/lib/memberFilters";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";
import { cleanName, cleanEmail, normalizePhoneNumber, cleanMemberId, cleanReferralCode } from "@/lib/dataSanitizers";

const editMemberSchema = z.object({
  full_name: z.string().trim().min(1, "Full Name cannot be empty."),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]),
  phone: z.string().trim(),
  member_id: z.string().trim(),
  referral_code: z.string().trim(),
  role: z.enum(["user", "admin"]),
});

export type EditMemberValues = z.infer<typeof editMemberSchema>;

interface Props {
  member: Member | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: EditMemberValues) => Promise<void> | void;
  saving: boolean;
  onActivateGreenCard: (member: Member) => void;
  activatingMemberId: string | null;
}

export function EditMemberDialog({
  member,
  onOpenChange,
  onSave,
  saving,
  onActivateGreenCard,
  activatingMemberId,
}: Props) {
  const form = useForm<EditMemberValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: { full_name: "", email: "", phone: "", member_id: "", referral_code: "", role: "user" },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        full_name: member.full_name || "",
        email: member.email === "No Email" ? "" : member.email,
        phone: member.phone || "",
        member_id: member.member_id === "No ID Assigned" ? "" : member.member_id,
        referral_code: member.referral_code || "",
        role: member.role === "admin" ? "admin" : "user",
      });
    }
  }, [member, form]);

  if (!member) return null;

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
              {!member.has_green_card && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 whitespace-nowrap bg-emerald-500/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                  disabled={activatingMemberId === member.id}
                  onClick={() => onActivateGreenCard(member)}
                >
                  <CreditCard className="h-3.5 w-3.5" />{" "}
                  {activatingMemberId === member.id ? "Activating..." : "Activate Green Card"}
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
                      <Input placeholder="AGC-000123-2026" className="font-mono" {...field} />
                    </FormControl>
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
                      <Input placeholder="REF123" className="font-mono" {...field} />
                    </FormControl>
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
                  <FormLabel>User Access Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Standard User</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
