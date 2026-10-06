import { useEffect, useState } from "react";
import {
  Sprout,
  ShieldCheck,
  RefreshCw,
  Coins,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { adminApiClient } from "@/lib/apiClient";

interface SystemConfigs {
  green_card_fee: number;
  welcome_product_price: number;
  welcome_product_pool_ceiling: number;
  farm_slot_price: number;
  direct_retail_rate: number;
  network_rates: number[];
  leadership_pool_rate: number;
  sustainability_reserve_rate: number;
  monthly_pqv_threshold: number;
  min_withdrawal_amount: number;
  solvency_shield_lcr: number;
}

export function ProgrammeArchitectureViewer() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<SystemConfigs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const data = await adminApiClient.configs.getConfigs();
      setConfigs(data);
    } catch (err) {
      console.warn("Failed to load configs for programme architecture:", err);
    } finally {
      setLoading(false);
    }
  }

  const greenCardFee = configs?.green_card_fee ?? 2000;
  const slotPrice = configs?.farm_slot_price ?? 5000;
  const welcomePrice = configs?.welcome_product_price ?? 5000;
  const ceilingPct = ((configs?.welcome_product_pool_ceiling ?? 0.40) * 100).toFixed(0);
  const lcrPct = ((configs?.solvency_shield_lcr ?? 1.20) * 100).toFixed(0);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">LEAP Programme Architecture &amp; Financial Linkage</CardTitle>
              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                <ShieldCheck className="w-3 h-3 mr-1" /> Dynamic DB Synced
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Authoritative structure of the Learn to Earn Agribusiness Platform (LEAP) mapped live to system economic constants.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadConfigs}
              disabled={loading}
              className="text-xs h-8"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/settings")}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Coins className="w-3.5 h-3.5" /> Configure Parameters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live Synchronized Economic Chips */}
        <div className="p-3.5 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Live Bound Platform Economic Tokens
            </span>
            <span className="text-[11px] text-muted-foreground">
              Guarantees zero copy drift between CMS explanations and financial ledger rules
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Green Card Entry</span>
              <span className="text-sm font-bold text-foreground">₦{greenCardFee.toLocaleString()}</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">₦1,000 Ref + ₦1,000 Co</span>
            </div>

            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Farm Slot Unit</span>
              <span className="text-sm font-bold text-foreground">₦{slotPrice.toLocaleString()}</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">Mushroom Village slot</span>
            </div>

            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Welcome Starter</span>
              <span className="text-sm font-bold text-foreground">₦{welcomePrice.toLocaleString()}</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">Mushroom Power 100g</span>
            </div>

            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Commission Ceiling</span>
              <span className="text-sm font-bold text-foreground">{ceilingPct}% Max</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">5×7 Matrix Waterfall</span>
            </div>

            <div className="p-2 rounded bg-card border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Solvency LCR</span>
              <span className="text-sm font-bold text-foreground">{lcrPct}%</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">Reserve Protection</span>
            </div>
          </div>
        </div>

        {/* 3-Level Progressive Programme Model */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            The Three-Tier LEAP Model &amp; Production Scale-Up
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Level 1: Home & Community */}
            <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  Foundation Tier
                </Badge>
                <span className="text-xs font-bold text-foreground">₦{greenCardFee.toLocaleString()}</span>
              </div>
              <h5 className="text-xs font-bold text-foreground">1. Green Card Community</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Entry into LEAP. Unlocks practical organic farming masterclasses, digital verified ID, ₦1,000 instant direct referral bonus, and Home/Community garden mobilizations.
              </p>
            </div>

            {/* Level 2: Flagship Mushroom Village */}
            <div className="p-3.5 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                  Flagship Group Farm
                </Badge>
                <span className="text-xs font-bold text-foreground">₦{slotPrice.toLocaleString()} / slot</span>
              </div>
              <h5 className="text-xs font-bold text-foreground">2. Mushroom Village</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Initial commercial Group Farm. Cycle 1 builds substrate capacity; Cycle 2 onwards distributes verified commodity surplus yields from realized off-taker contracts.
              </p>
            </div>

            {/* Level 3: Scale-Up */}
            <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                  Integrated Scale-Up
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">Diversification</span>
              </div>
              <h5 className="text-xs font-bold text-foreground">3. Gingertown &amp; FoodNation</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Reinvestment and retained surplus expand operations into Ginger processing, export corridors, and nationwide commercial organic FoodHubs.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgrammeArchitectureViewer;
