import { useState } from "react";
import { ShieldAlert, ExternalLink, KeyRound, Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Member } from "@/types/admin";
import adminApiClient from "@/lib/apiClient";

interface Props {
  member: Member | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ImpersonateModal({ member, onOpenChange, onSuccess, onError }: Props) {
  const [reason, setReason] = useState("Investigating member dashboard and First 5 matrix progression");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    actionLink?: string;
    emailOtp?: string;
    redirectTo?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (!member) return null;

  const handleGenerateSession = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await adminApiClient.admin.impersonateMember(member.id, reason);
      setResult({
        actionLink: res.actionLink,
        emailOtp: res.emailOtp,
        redirectTo: res.redirectTo,
      });
      onSuccess(`Impersonation session established for ${member.full_name}!`);
    } catch (err: any) {
      onError(err.message || "Failed to generate impersonation session.");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchDashboard = () => {
    if (result?.actionLink) {
      window.open(result.actionLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyLink = () => {
    if (result?.actionLink && navigator.clipboard) {
      navigator.clipboard.writeText(result.actionLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyOtp = () => {
    if (result?.emailOtp && navigator.clipboard) {
      navigator.clipboard.writeText(result.emailOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(member)} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-lg p-5 sm:p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Super Admin Impersonation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate an authenticated portal session for <strong className="text-foreground">{member.full_name}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Member Card Summary */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-foreground block">{member.full_name}</span>
              <span className="text-muted-foreground text-[11px] block">{member.email}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-emerald-400 font-bold block">{member.member_id || "AGC-MEMBER"}</span>
              <span className="text-muted-foreground text-[10px] block capitalize">{member.role}</span>
            </div>
          </div>

          {!result ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="impersonate-reason" className="text-xs font-medium text-foreground">
                  Reason for Impersonation (Logged to Audit Trail)
                </Label>
                <Input
                  id="impersonate-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Verifying downline matrix alignment"
                  className="text-xs"
                  disabled={loading}
                />
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300/90 leading-relaxed">
                ⚠️ <strong>Audit Notice:</strong> This action creates an immutable log in <code className="font-mono text-amber-200">audit_events</code> recording your administrator ID, client IP address, and stated reason.
              </div>

              <Button
                type="button"
                className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 cursor-pointer"
                disabled={loading || !reason.trim()}
                onClick={handleGenerateSession}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Session Credentials...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    Generate Access Credentials
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {/* Option 1: Direct One-Click Launch */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">Session Ready to Launch</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                    Valid for 1 Hour
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Click below to open the AgroHeal Member Portal in a new tab. You will be signed in directly as{" "}
                  <strong>{member.full_name}</strong>.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleLaunchDashboard}
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 cursor-pointer"
                  >
                    <span>Launch Member Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="gap-1.5 text-xs h-8 border-border hover:bg-white/5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </Button>
                </div>
              </div>

              {/* Option 2: One-Time Passcode (OTP) */}
              {result.emailOtp && (
                <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">One-Time Passcode (OTP)</span>
                    <span className="text-base font-bold font-mono tracking-widest text-emerald-300 block">
                      {result.emailOtp}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyOtp}
                    className="gap-1.5 text-xs h-8 cursor-pointer"
                  >
                    {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOtp ? "Copied OTP" : "Copy OTP"}</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
