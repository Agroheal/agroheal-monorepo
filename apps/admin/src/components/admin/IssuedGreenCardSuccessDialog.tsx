import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Member } from "@/types/admin";

interface Props {
  details: { member: Member; memberId: string } | null;
  onOpenChange: (open: boolean) => void;
  onCopied: () => void;
}

function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export function IssuedGreenCardSuccessDialog({ details, onOpenChange, onCopied }: Props) {
  if (!details) return null;
  const { member, memberId } = details;
  const message = `Hello ${member.full_name}!\n\nYour Agroheal LEAP Green Card registration and payment have been confirmed.\n\nMember ID: ${memberId}\nEmail: ${member.email}\nStatus: Active (Lifetime Permanent)\n\nYou can access your dashboard, training, and community slots at: https://www.agroheal.solutions/dashboard`;

  return (
    <Dialog open={Boolean(details)} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" /> Green Card Successfully Issued!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left text-sm">
          <div>
            <strong>Member Name:</strong> {member.full_name}
          </div>
          <div>
            <strong>Email:</strong> {member.email}
          </div>
          <div>
            <strong>Official Member ID:</strong>{" "}
            <span className="font-mono font-bold text-primary">{memberId}</span>
          </div>
          <div>
            <strong>Membership Status:</strong> <span className="font-semibold text-emerald-400">Active (Lifetime Permanent)</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          You can copy the confirmation details or forward them directly to the member via WhatsApp.
        </p>

        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              navigator.clipboard.writeText(message);
              onCopied();
            }}
          >
            <Copy className="h-4 w-4" /> Copy Message
          </Button>
          <Button
            type="button"
            className="flex-1 gap-2 bg-[#25D366] text-white hover:bg-[#1ebe57]"
            onClick={() => openWhatsApp(message)}
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
