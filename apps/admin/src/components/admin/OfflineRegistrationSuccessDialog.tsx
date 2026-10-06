import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface OfflineRegistrationCredentials {
  fullName: string;
  email: string;
  pass: string;
  memberId?: string;
}

interface Props {
  credentials: OfflineRegistrationCredentials | null;
  onOpenChange: (open: boolean) => void;
  onCopied: () => void;
}

function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export function OfflineRegistrationSuccessDialog({ credentials, onOpenChange, onCopied }: Props) {
  if (!credentials) return null;
  const { fullName, email, pass, memberId } = credentials;
  const message = `Welcome to Agroheal LEAP!\n\nYour Green Card has been confirmed.\nMember ID: ${memberId}\nEmail: ${email}\nTemporary Password: ${pass}\n\nLogin at: https://www.agroheal.solutions/login`;

  return (
    <Dialog open={Boolean(credentials)} onOpenChange={onOpenChange}>
      <DialogContent className="text-center w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" /> Member Registration Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left text-sm">
          <div>
            <strong>Member Name:</strong> {fullName}
          </div>
          <div>
            <strong>Member ID:</strong> <span className="font-mono font-bold text-primary">{memberId}</span>
          </div>
          <div className="break-all">
            <strong>Email:</strong> {email}
          </div>
          <div className="break-all">
            <strong>Password:</strong> <span className="font-mono font-semibold">{pass}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Copy these details or forward them directly to the member via WhatsApp — this password won't be shown again.
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
            <Copy className="h-4 w-4" /> Copy Details
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
