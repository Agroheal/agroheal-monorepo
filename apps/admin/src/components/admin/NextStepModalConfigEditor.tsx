import { useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  IdCard,
  Sprout,
  Users,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { updateConfig } from "@/lib/adminActions";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export interface NextStepConfig {
  enabled: boolean;
  broadcastNotice?: string;
  steps: {
    step1: {
      title: string;
      subtitle: string;
      priceText: string;
      badgeText: string;
      benefits: string[];
      buttonText: string;
      targetRoute: string;
    };
    step2: {
      title: string;
      subtitle: string;
      priceText: string;
      badgeText: string;
      benefits: string[];
      buttonText: string;
      targetRoute: string;
    };
    step3: {
      title: string;
      subtitle: string;
      targetCount: number;
      badgeText: string;
      benefits: string[];
      buttonText: string;
      targetRoute: string;
    };
  };
}

const DEFAULT_CONFIG: NextStepConfig = {
  enabled: true,
  broadcastNotice: "",
  steps: {
    step1: {
      title: "Activate Your AgroHeal Green Card",
      subtitle:
        "Your official key to organic farming education, verified digital membership, and community dividends.",
      priceText: "₦2,000 One-Time Lifetime Membership",
      badgeText: "Milestone 1 of 3 · Foundation",
      benefits: [
        "Lifetime access to Organic Farming Academy & practical masterclasses",
        "Official AgroHeal Digital Green Card ID with instant QR verification",
        "Earn ₦1,000 instant direct sponsor bounty on every referred member",
        "Unlocks eligibility to purchase commercial mushroom farm slots",
      ],
      buttonText: "Activate Green Card Now (₦2,000)",
      targetRoute: "/subscribe",
    },
    step2: {
      title: "Secure Your First Mushroom Farm Slot",
      subtitle:
        "Activate biological production in our climate-controlled grow-houses with automated commercial management.",
      priceText: "₦5,000 Per Slot · Mushroom Village Flagship",
      badgeText: "Milestone 2 of 3 · Production",
      benefits: [
        "2 physical fruiting bags allocated directly to your member account",
        "Cycle 1 biological doubling (2 bags produce 4 bags retained in farm)",
        "Up to 40% projected quarterly cooperative harvest dividends from Cycle 2 onward",
        "Secures your locked placement in the 5×7 Cooperative Matrix",
      ],
      buttonText: "Secure Farm Slot (₦5,000)",
      targetRoute: "/dashboard/slots",
    },
    step3: {
      title: "Unlock 7-Level Matrix Harvest Dividends",
      subtitle:
        "Sponsor 5 direct partners to expand your payout depth and maximize cooperative spillover.",
      targetCount: 5,
      badgeText: "Milestone 3 of 3 · Expansion",
      benefits: [
        "1 Direct Partner unlocks Level 1 matrix dividends",
        "5 Direct Partners unlocks all 7 matrix levels (up to 97,655 network positions)",
        "Earn ₦1,000 Green Card bounty + 10% (₦500) per slot leased by direct partners",
        "Qualify for AgroHeal Cooperative Community Leadership & bonus pools",
      ],
      buttonText: "Copy Referral Link & Share",
      targetRoute: "/dashboard/compound-referrals",
    },
  },
};

interface Props {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function NextStepModalConfigEditor({ onSuccess, onError }: Props) {
  const { isReadOnly } = useAdminAuth();
  const [config, setConfig] = useState<NextStepConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<"step1" | "step2" | "step3">("step1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "next_step_modal_config")
          .maybeSingle();

        if (data?.value) {
          setConfig({
            ...DEFAULT_CONFIG,
            ...data.value,
            steps: {
              step1: { ...DEFAULT_CONFIG.steps.step1, ...(data.value.steps?.step1 || {}) },
              step2: { ...DEFAULT_CONFIG.steps.step2, ...(data.value.steps?.step2 || {}) },
              step3: { ...DEFAULT_CONFIG.steps.step3, ...(data.value.steps?.step3 || {}) },
            },
          });
        }
      } catch (err) {
        console.error("Failed to load next_step_modal_config:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (isReadOnly) {
      onError(
        "System is in Read-Only Audit Mode. Configuration changes are restricted to Super Developer."
      );
      return;
    }

    setSaving(true);
    try {
      await updateConfig({
        key: "next_step_modal_config",
        value: {
          ...config,
          updated_at: new Date().toISOString(),
        },
      });
      onSuccess("Next-Step Progression Modal successfully published system-wide!");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update modal configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    onSuccess("Reverted in-memory settings to cooperative factory defaults. Click Save to publish.");
  };

  const updateCurrentStepField = (field: string, val: any) => {
    setConfig((prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [activeTab]: {
          ...prev.steps[activeTab],
          [field]: val,
        },
      },
    }));
  };

  const handleBenefitChange = (index: number, val: string) => {
    setConfig((prev) => {
      const curBenefits = [...prev.steps[activeTab].benefits];
      curBenefits[index] = val;
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [activeTab]: {
            ...prev.steps[activeTab],
            benefits: curBenefits,
          },
        },
      };
    });
  };

  const handleAddBenefit = () => {
    setConfig((prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [activeTab]: {
          ...prev.steps[activeTab],
          benefits: [...prev.steps[activeTab].benefits, "New benefit bullet point"],
        },
      },
    }));
  };

  const handleRemoveBenefit = (index: number) => {
    setConfig((prev) => {
      const curBenefits = prev.steps[activeTab].benefits.filter((_, i) => i !== index);
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [activeTab]: {
            ...prev.steps[activeTab],
            benefits: curBenefits,
          },
        },
      };
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentStepData = config.steps[activeTab];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500" /> Progression 'Stubborn' Modal Configurator
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Control the persistent onboarding &amp; next-step prompts that guide users through Green Card, Farm Slots, and Referral milestones.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Label htmlFor="modal-toggle" className="text-xs font-semibold cursor-pointer">
              Modal Active
            </Label>
            <Switch
              id="modal-toggle"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 flex-1 flex flex-col">
        {/* Broadcast Announcement */}
        <div className="rounded-xl border bg-background/50 p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-amber-500" />
            <Label htmlFor="broadcast-notice" className="text-xs font-bold">
              Broadcast Announcement Banner (Optional)
            </Label>
          </div>
          <Input
            id="broadcast-notice"
            placeholder="e.g. Special Cooperative Promotion: Activate your Green Card this week for bonus resources!"
            value={config.broadcastNotice || ""}
            onChange={(e) => setConfig((prev) => ({ ...prev, broadcastNotice: e.target.value }))}
            className="text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Appears at the top of the modal for all members regardless of current milestone.
          </p>
        </div>

        {/* Milestone Tabs */}
        <div className="flex items-center gap-1.5 border-b pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("step1")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "step1"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <IdCard className="w-3.5 h-3.5" />
            <span>Step 1: Green Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("step2")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "step2"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Step 2: Farm Slot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("step3")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "step3"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Step 3: 5 Directs</span>
          </button>
        </div>

        {/* Active Step Fields */}
        <div className="space-y-3.5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Step Title</Label>
              <Input
                value={currentStepData.title}
                onChange={(e) => updateCurrentStepField("title", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Badge Subtitle</Label>
              <Input
                value={currentStepData.badgeText}
                onChange={(e) => updateCurrentStepField("badgeText", e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Description / Subtitle</Label>
            <Textarea
              value={currentStepData.subtitle}
              onChange={(e) => updateCurrentStepField("subtitle", e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeTab !== "step3" ? (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Price / Term Display</Label>
                <Input
                  value={"priceText" in currentStepData ? currentStepData.priceText : ""}
                  onChange={(e) => updateCurrentStepField("priceText", e.target.value)}
                  className="text-xs"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Required Direct Referrals</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={config.steps.step3.targetCount || 5}
                  onChange={(e) => updateCurrentStepField("targetCount", Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Action Button Text</Label>
              <Input
                value={currentStepData.buttonText}
                onChange={(e) => updateCurrentStepField("buttonText", e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Target Route</Label>
              <Input
                value={currentStepData.targetRoute}
                onChange={(e) => updateCurrentStepField("targetRoute", e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Verified Value Proposition Bullets ({currentStepData.benefits.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBenefit}
                className="h-7 text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Bullet
              </Button>
            </div>

            <div className="space-y-2">
              {currentStepData.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => handleBenefitChange(idx, e.target.value)}
                    className="text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBenefit(idx)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                    title="Remove benefit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            disabled={saving}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || isReadOnly}
            className="text-xs font-semibold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save &amp; Publish Modal</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NextStepModalConfigEditor;
