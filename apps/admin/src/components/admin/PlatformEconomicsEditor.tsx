import { useEffect, useState } from "react";
import {
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Percent,
  Coins,
  Save,
  RefreshCw,
  Lock,
  Users,
  UserPlus,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminApiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

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
  depth_gating: "directs_plus_one" | "all_or_nothing" | "disabled";
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  can_manage_system_configs?: boolean;
}

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function PlatformEconomicsEditor({ onSuccess, onError }: Props) {
  const [configs, setConfigs] = useState<SystemConfigs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");
  const [canManage, setCanManage] = useState<boolean>(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    fetchConfigs();
    checkCurrentUser();
  }, []);

  async function checkCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, can_manage_system_configs")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.role || "admin";
      const hasPerm = role === "super_admin" || profile?.can_manage_system_configs === true;
      setUserRole(role);
      setCanManage(hasPerm);

      if (role === "super_admin") {
        fetchAdminUsers();
      }
    } catch (err) {
      console.warn("Error fetching current user profile:", err);
    }
  }

  async function fetchConfigs() {
    setLoading(true);
    try {
      const data = await adminApiClient.configs.getConfigs();
      setConfigs(data);
    } catch (err: any) {
      console.error("Failed to load configs:", err);
      onError(err.message || "Failed to load platform parameters");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdminUsers() {
    setLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, can_manage_system_configs")
        .in("role", ["admin", "super_admin", "support", "finance", "coordinator"])
        .order("full_name");

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (err: any) {
      console.warn("Failed to fetch admin users:", err);
    } finally {
      setLoadingAdmins(false);
    }
  }

  async function handleSetAdminPermission(targetId: string, canManage: boolean) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ can_manage_system_configs: canManage })
        .eq("id", targetId);
      if (error) throw error;

      setAdminUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, can_manage_system_configs: canManage } : u))
      );
      onSuccess(`Staff permission updated: ${canManage ? "Parameters Configurable" : "Read-Only"}`);
    } catch (err: any) {
      onError(err.message || "Failed to update staff permission");
    }
  }

  // Appoint Admin candidate state
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [newAdminRole, setNewAdminRole] = useState<string>("admin");
  const [grantConfigAccess, setGrantConfigAccess] = useState(false);
  const [appointing, setAppointing] = useState(false);

  async function handleSearchCandidates(q: string) {
    setCandidateQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setCandidateResults([]);
      return;
    }
    setSearchingCandidates(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, member_id, role, can_manage_system_configs")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,member_id.ilike.%${q}%`)
        .limit(8);

      if (error) throw error;
      setCandidateResults(data || []);
    } catch (err) {
      console.warn("Search candidate error:", err);
    } finally {
      setSearchingCandidates(false);
    }
  }

  async function handleConfirmAppoint() {
    if (!selectedCandidate) return;
    setAppointing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: newAdminRole,
          can_manage_system_configs: newAdminRole === "super_admin" ? true : grantConfigAccess,
        })
        .eq("id", selectedCandidate.id);

      if (error) throw error;

      onSuccess(
        `Successfully appointed ${selectedCandidate.full_name || selectedCandidate.email} as ${newAdminRole.replace("_", " ").toUpperCase()}!`
      );
      setIsAddAdminOpen(false);
      setSelectedCandidate(null);
      setCandidateQuery("");
      setCandidateResults([]);
      fetchAdminUsers();
    } catch (err: any) {
      onError(err.message || "Failed to appoint admin staff");
    } finally {
      setAppointing(false);
    }
  }

  async function handleSave() {
    if (!configs) return;
    setSaving(true);
    try {
      const updated = await adminApiClient.configs.updateConfigs(configs);
      setConfigs(updated);
      onSuccess("Platform parameters and economics saved successfully!");
    } catch (err: any) {
      onError(err.message || "Failed to save parameters");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !configs) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          <span className="ml-3 text-sm text-muted-foreground">Loading platform parameters...</span>
        </CardContent>
      </Card>
    );
  }

  const networkSum = (configs.network_rates || []).reduce((sum, r) => sum + r, 0);
  const totalAllocated =
    configs.direct_retail_rate +
    networkSum +
    configs.leadership_pool_rate +
    configs.sustainability_reserve_rate;
  const isCeilingExceeded = totalAllocated > configs.welcome_product_pool_ceiling + 0.0001;

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg">Platform Parameters &amp; Commission Architecture</CardTitle>
              {canManage ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Configurable
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                  <Lock className="mr-1 h-3 w-3" /> Read-Only (Protected)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Versioned system constants governing the ₦12,000 onboarding, 5×7 MLM commissions, and Solvency Shield.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfigs}
              disabled={loading || saving}
              className="text-xs h-8"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reload
            </Button>
            {canManage && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || isCeilingExceeded}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Parameters"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Ceiling Warning if exceeded */}
          {isCeilingExceeded && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <span>
                <strong>Statutory Ceiling Warning:</strong> Total commission allocation (
                {(totalAllocated * 100).toFixed(1)}%) exceeds the configured ceiling (
                {(configs.welcome_product_pool_ceiling * 100).toFixed(1)}%). Please reduce rates before saving.
              </span>
            </div>
          )}

          {/* Core Entry Fees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" /> Green Card Fee (₦)
              </Label>
              <Input
                type="number"
                disabled={!canManage}
                value={configs.green_card_fee}
                onChange={(e) =>
                  setConfigs({ ...configs, green_card_fee: Number(e.target.value) || 0 })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">₦1,000 Referrer + ₦1,000 Company</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" /> Welcome Product Price (₦)
              </Label>
              <Input
                type="number"
                disabled={!canManage}
                value={configs.welcome_product_price}
                onChange={(e) =>
                  setConfigs({ ...configs, welcome_product_price: Number(e.target.value) || 0 })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Mushroom Power starter pack</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" /> First Farm Slot Price (₦)
              </Label>
              <Input
                type="number"
                disabled={!canManage}
                value={configs.farm_slot_price}
                onChange={(e) =>
                  setConfigs({ ...configs, farm_slot_price: Number(e.target.value) || 0 })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">₦500 Ref + ₦1,000 Admin + ₦3,500 Prod</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-blue-400" /> Commission Ceiling (%)
              </Label>
              <Input
                type="number"
                step="0.01"
                disabled={!canManage}
                value={configs.welcome_product_pool_ceiling * 100}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    welcome_product_pool_ceiling: (Number(e.target.value) || 0) / 100,
                  })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Statutory 40.0% max budget</span>
            </div>
          </div>

          {/* 7-Level Matrix & Auxiliary Pools */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Percent className="h-3.5 w-3.5 text-emerald-400" />
              7-Level Compensation Breakdown (Allocated: {(totalAllocated * 100).toFixed(1)}% of 40%)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {(configs.network_rates || []).map((rate, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-border/40 bg-background/30 text-center space-y-1"
                >
                  <div className="text-[11px] font-medium text-muted-foreground">Level {idx + 1}</div>
                  <Input
                    type="number"
                    step="0.1"
                    disabled={!canManage}
                    value={(rate * 100).toFixed(1)}
                    onChange={(e) => {
                      const newRates = [...configs.network_rates];
                      newRates[idx] = (Number(e.target.value) || 0) / 100;
                      setConfigs({ ...configs, network_rates: newRates });
                    }}
                    className="h-7 text-xs text-center font-mono"
                  />
                  <div className="text-[10px] text-emerald-400 font-mono">
                    ₦{Math.round(configs.welcome_product_price * rate).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded-lg border border-border/40 bg-background/30 space-y-1">
                <Label className="text-xs text-muted-foreground">Direct Retail Reward (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  disabled={!canManage}
                  value={(configs.direct_retail_rate * 100).toFixed(1)}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      direct_retail_rate: (Number(e.target.value) || 0) / 100,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Default 12.0% (₦{Math.round(configs.welcome_product_price * configs.direct_retail_rate)})
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/40 bg-background/30 space-y-1">
                <Label className="text-xs text-muted-foreground">Leadership Pool (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  disabled={!canManage}
                  value={(configs.leadership_pool_rate * 100).toFixed(1)}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      leadership_pool_rate: (Number(e.target.value) || 0) / 100,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Default 4.0% (₦{Math.round(configs.welcome_product_price * configs.leadership_pool_rate)})
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-border/40 bg-background/30 space-y-1">
                <Label className="text-xs text-muted-foreground">Sustainability Reserve (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  disabled={!canManage}
                  value={(configs.sustainability_reserve_rate * 100).toFixed(1)}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      sustainability_reserve_rate: (Number(e.target.value) || 0) / 100,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Default 2.0% (₦{Math.round(configs.welcome_product_price * configs.sustainability_reserve_rate)})
                </span>
              </div>
            </div>
          </div>

          {/* Operational Rules & Governance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground">Monthly PQV Threshold (₦)</Label>
              <Input
                type="number"
                disabled={!canManage}
                value={configs.monthly_pqv_threshold}
                onChange={(e) =>
                  setConfigs({ ...configs, monthly_pqv_threshold: Number(e.target.value) || 0 })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Rolling 30-day active threshold</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground">Minimum Withdrawal (₦)</Label>
              <Input
                type="number"
                disabled={!canManage}
                value={configs.min_withdrawal_amount}
                onChange={(e) =>
                  setConfigs({ ...configs, min_withdrawal_amount: Number(e.target.value) || 0 })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Default withdrawable floor</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border/50 bg-background/40">
              <Label className="text-xs text-muted-foreground">Solvency Shield LCR (%)</Label>
              <Input
                type="number"
                disabled={!canManage}
                value={configs.solvency_shield_lcr * 100}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    solvency_shield_lcr: (Number(e.target.value) || 0) / 100,
                  })
                }
                className="h-8 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Liquidity reserve coverage ratio</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Delegation Section */}
      {userRole === "super_admin" && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base">Admin Permissions &amp; Delegation</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Super Admin control: appoint administrators and delegate system economic parameter controls.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddAdminOpen(true)}
              className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Appoint Admin
            </Button>
          </CardHeader>
          <CardContent>
            {loadingAdmins ? (
              <div className="text-xs text-muted-foreground p-4">Loading admin staff...</div>
            ) : (
              <div className="divide-y divide-border/40">
                {adminUsers.map((admin) => (
                  <div key={admin.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-foreground flex items-center gap-2">
                        {admin.full_name || "Unnamed Admin"}
                        <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
                          {admin.role}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{admin.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {admin.role === "super_admin" ? (
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          Full Unrestricted
                        </Badge>
                      ) : (
                        <select
                          value={admin.can_manage_system_configs ? "configurable" : "readonly"}
                          onChange={(e) =>
                            handleSetAdminPermission(admin.id, e.target.value === "configurable")
                          }
                          className="text-[11px] h-7 px-2 rounded-md border border-border bg-card text-foreground cursor-pointer focus:outline-none"
                        >
                          <option value="readonly">Read-Only (Default)</option>
                          <option value="configurable">Parameters: Configurable</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appoint Staff / Admin Modal Dialog */}
      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <UserPlus className="w-4 h-4 text-primary" /> Appoint Staff / Administrator
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search a registered member by name, email, or AGC ID to elevate to staff administration or specialized operational roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Search Member</Label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Type member name, email or AGC ID..."
                  value={candidateQuery}
                  onChange={(e) => handleSearchCandidates(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
            </div>

            {/* Candidate Search Results */}
            {searchingCandidates && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching members...
              </div>
            )}

            {candidateResults.length > 0 && !selectedCandidate && (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border/60 bg-muted/20">
                {candidateResults.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setCandidateResults([]);
                    }}
                    className="p-2.5 hover:bg-muted/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {candidate.full_name || "Member"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {candidate.email} • {candidate.member_id || "No AGC ID"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {candidate.role || "member"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Candidate Display */}
            {selectedCandidate && (
              <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {selectedCandidate.full_name || "Selected Member"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{selectedCandidate.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCandidate(null)}
                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </Button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <Label className="text-xs font-medium">Assign Role</Label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="support">Support Specialist (Customer Desk &amp; Member Assistance)</option>
                    <option value="coordinator">Farm Coordinator (Cluster &amp; Field Operations)</option>
                    <option value="finance">Finance Officer (Ledger &amp; Treasury Review)</option>
                    <option value="admin">Administrator (System &amp; Member Operations)</option>
                    <option value="super_admin">Super Administrator (Full Unrestricted Access)</option>
                  </select>
                </div>

                {newAdminRole === "admin" && (
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label htmlFor="grant-cfg" className="text-xs font-medium block">
                        Allow Economics Configuration
                      </Label>
                      <span className="text-[10px] text-muted-foreground block">
                        Grant permission to modify platform financial constants (defaults to read-only).
                      </span>
                    </div>
                    <Switch
                      id="grant-cfg"
                      checked={grantConfigAccess}
                      onCheckedChange={setGrantConfigAccess}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddAdminOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAppoint}
              disabled={!selectedCandidate || appointing}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium gap-1.5"
            >
              {appointing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {appointing ? "Appointing..." : "Confirm Staff Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlatformEconomicsEditor;
