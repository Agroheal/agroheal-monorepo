import { useEffect, useState } from "react";
import { FileText, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { updateConfig } from "@/lib/adminActions";

const DEFAULT_AGREEMENT =
  "# Agroheal LEAP — Terms of Service & Membership Agreement\n\n" +
  "### 1. Platform Membership\nBy subscribing to the Agroheal LEAP Green Card program, members gain access to organic farming education, training modules, and the right to lease community farm slots.\n\n" +
  "### 2. Farm Slots & Management\nFarm slots (Mushroom Village, Gingertown, Organic FoodNation) are leased under community group farm agreements. All slot contributions fund farm setup, substrate bags, and quarterly organic harvest distribution.\n\n" +
  "### 3. Acceptance of Terms\nRegistration on the platform constitutes legal acceptance of these terms, organic farming guidelines, and platform referral rules.";

interface Props {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function LegalDocEditor({ onSuccess, onError }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "legal_agreement")
          .maybeSingle();
        setText(data?.value?.content || DEFAULT_AGREEMENT);
      } catch {
        setText(DEFAULT_AGREEMENT);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({
        key: "legal_agreement",
        value: {
          title: "Agroheal Membership & Farm Terms of Service",
          content: text,
          require_on_signup: true,
          updated_at: new Date().toISOString(),
        },
      });
      onSuccess("Legal Agreement successfully updated and published system-wide!");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update policy document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4.5 w-4.5 text-primary" /> Legal Agreement &amp; Terms of Service
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Update the dynamic agreement document displayed on the user dashboard and required during member
          registration.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading current agreement...
          </div>
        ) : (
          <Textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter Legal Agreement Terms in Markdown..."
            className="font-mono text-xs leading-relaxed"
          />
        )}
        <Button type="button" onClick={handleSave} disabled={saving || loading} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {saving ? "Saving..." : "Publish Updated Legal Agreement"}
        </Button>
      </CardContent>
    </Card>
  );
}
