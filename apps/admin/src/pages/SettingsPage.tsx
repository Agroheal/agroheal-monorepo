import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalDocEditor } from "@/components/admin/LegalDocEditor";
import { NextStepModalConfigEditor } from "@/components/admin/NextStepModalConfigEditor";
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

      <NextStepModalConfigEditor
        onSuccess={(msg) => flash(setSuccessMessage, msg)}
        onError={(msg) => flash(setErrorMessage, msg)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LegalDocEditor
          onSuccess={(msg) => flash(setSuccessMessage, msg)}
          onError={(msg) => flash(setErrorMessage, msg)}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-400" /> System Architecture &amp; Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Supabase Backend Functions:</strong> All privileged actions
              (creating Auth users, resetting passwords, crediting slots) are processed via the{" "}
              <code className="rounded bg-background px-1 py-0.5 text-xs">admin-actions</code> Edge Function.
            </p>
            <div className="rounded-lg bg-background/60 p-3 text-xs">
              <strong className="text-foreground">Edge Function Command:</strong>
              <br />
              <code>supabase functions deploy admin-actions</code>
            </div>
            <p>
              <strong className="text-foreground">SQL Migration:</strong> Ensure the database migration script{" "}
              <code className="rounded bg-background px-1 py-0.5 text-xs">
                supabase/sql/admin_schema_and_policies.sql
              </code>{" "}
              is executed in your Supabase SQL Editor.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
