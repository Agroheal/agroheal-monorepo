import { useState } from "react";
import { Mail, KeyRound, Copy, Check, MessageCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/types/admin";
import { resetPassword, sendPasswordResetEmail } from "@/lib/adminActions";

interface Props {
  member: Member | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function PasswordResetModal({ member, onOpenChange, onSuccess, onError }: Props) {
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingTemp, setLoadingTemp] = useState(false);
  const [generatedTemp, setGeneratedTemp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const handleSendEmail = async () => {
    setLoadingEmail(true);
    try {
      await sendPasswordResetEmail({ user_id: member.id, email: member.email });
      onSuccess(`Password reset email successfully dispatched to ${member.email}!`);
      onOpenChange(false);
    } catch (err: any) {
      onError(err.message || "Failed to send password reset email.");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGenerateTempPassword = async () => {
    setLoadingTemp(true);
    try {
      const result = await resetPassword({ user_id: member.id, email: member.email });
      setGeneratedTemp(result.temp_password);
      onSuccess(`Temporary password generated for ${member.full_name}!`);
    } catch (err: any) {
      onError(err.message || "Failed to generate temporary password.");
    } finally {
      setLoadingTemp(false);
    }
  };

  const handleCopy = () => {
    if (generatedTemp && navigator.clipboard) {
      navigator.clipboard.writeText(generatedTemp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (!generatedTemp) return;
    const msg = `Hello ${member.full_name}, your AgroHeal account password has been reset by the Administrator.\n\nYour temporary password is: *${generatedTemp}*\n\nPlease log in at https://agroheal.solutions/signin and change your password in account settings immediately.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-bold text-foreground">
              Reset Member Password
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Choose how you would like to reset login credentials for{" "}
            <strong className="text-foreground">{member.full_name}</strong> ({member.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          {/* Option 1: Send Reset Link via Email */}
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    1. Send Password Reset Link
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Sends an official secure reset link to {member.email}.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">
                Recommended
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              disabled={loadingEmail || loadingTemp || !member.email || member.email === "No Email"}
              className="w-full text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              {loadingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Send Reset Link Email
            </Button>
          </div>

          {/* Option 2: Generate Temporary Password */}
          <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  2. Generate Temporary Password
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Creates an immediate temporary password to send via SMS or WhatsApp.
                </p>
              </div>
            </div>

            {!generatedTemp ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateTempPassword}
                disabled={loadingEmail || loadingTemp}
                className="w-full text-xs h-8 gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                {loadingTemp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Generate Temporary Password
              </Button>
            ) : (
              <div className="mt-1 space-y-2 p-2.5 rounded-lg bg-card border border-border">
                <div className="text-[11px] text-muted-foreground font-medium">Temporary Password:</div>
                <div className="flex items-center justify-between gap-2 p-2 bg-background rounded border border-border font-mono text-xs font-bold text-foreground">
                  <span>{generatedTemp}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleShareWhatsApp}
                    className="w-full text-xs h-7 gap-1 bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/30"
                  >
                    <MessageCircle className="w-3 h-3" /> Share via WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
