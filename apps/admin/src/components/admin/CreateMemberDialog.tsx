import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createMember } from "@/lib/adminActions";
import {
  OfflineRegistrationSuccessDialog,
  type OfflineRegistrationCredentials,
} from "@/components/admin/OfflineRegistrationSuccessDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CreateMemberDialog({ open, onOpenChange, onRegistered, onSuccess, onError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referrer, setReferrer] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<OfflineRegistrationCredentials | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onError("Full Name and Email are required.");
      return;
    }

    setLoading(true);
    try {
      const result = await createMember({
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        referral_code: referrer.trim() || undefined,
      });
      setTempCredentials({
        fullName: name.trim(),
        email: result.email,
        pass: result.temp_password,
        memberId: result.member_id,
      });
      onSuccess(`Member ${name} registered successfully! (Member ID: ${result.member_id || "Assigned"})`);
      setName("");
      setEmail("");
      setPhone("");
      setReferrer("");
      onRegistered();
      onOpenChange(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to register new member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserPlus className="w-4 h-4 text-primary" /> Register New Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually register a member profile. An AGC Member ID and temporary password will be assigned automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone Number (Optional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sponsor Referral Code (Optional)</Label>
              <Input
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                placeholder="e.g. 356FV1"
                className="text-xs h-9 font-mono uppercase"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-medium"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Register Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <OfflineRegistrationSuccessDialog
        credentials={tempCredentials}
        onOpenChange={(isOpen) => !isOpen && setTempCredentials(null)}
        onCopied={() => onSuccess("Credentials copied to clipboard")}
      />
    </>
  );
}
