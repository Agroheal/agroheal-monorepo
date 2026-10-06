import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformEconomicsEditor } from "@/components/admin/PlatformEconomicsEditor";
import { StatusBanner } from "@/components/admin/StatusBanner";

export default function SettingsPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      {/* Dynamic Platform Economics & Parameters */}
      <PlatformEconomicsEditor
        onSuccess={(msg) => flash(setSuccessMessage, msg)}
        onError={(msg) => flash(setErrorMessage, msg)}
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Backend Architecture &amp; Execution Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Authoritative Financial Backend:</strong> Privileged transactions, 
            wallet ledger distributions, 5×7 MLM commissions, and member registration are processed 
            server-side via the dedicated Express Node.js backend (<code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-primary">agroheal-server</code>).
          </p>
          <p>
            <strong className="text-foreground">System Configurations:</strong> Economic constants, commission ratios, and Solvency Shield reserves 
            are persisted to PostgreSQL <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-primary">system_configs</code>, 
            with in-memory cache and atomic immutable audit logging.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
