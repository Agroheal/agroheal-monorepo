import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sprout, Minus, Plus, ShoppingCart, Leaf, Wheat, PackageCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { AgrohealImages } from '@/constant/Image';

const BuySlots: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mushroomQty, setMushroomQty] = useState(1);
  const [hasPriorSlots, setHasPriorSlots] = useState(false);

  const isLegacy = Boolean(profile?.is_legacy);
  const hasPurchasedStarterPack = Boolean(profile?.has_purchased_starter_pack);
  const isLegacyNeedsStarterPack = isLegacy && !hasPurchasedStarterPack;

  useEffect(() => {
    if (!user) return;
    const checkPriorSlots = async () => {
      const { count } = await supabase
        .from('slot_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      setHasPriorSlots(Boolean(count && count > 0));
    };
    checkPriorSlots();
  }, [user]);

  // Calculate price dynamically based on prior slots
  const calculatePrice = (qty: number) => {
    if (qty === 0) return 0;
    if (hasPriorSlots) {
      return qty * 5000;
    } else {
      // First slot is 10000, additional slots are 5000
      return 10000 + (qty - 1) * 5000;
    }
  };

  const handleCheckout = (category: string, qty: number) => {
    navigate(`/dashboard/checkout?category=${encodeURIComponent(category)}&slots=${qty}`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-950">
          Browse &amp; Buy Farm Slots
        </h1>
        <p className="text-gray-600 mt-1.5 text-sm sm:text-base leading-relaxed">
          Acquire tangible biological production units in community cluster farms. Zero monthly maintenance fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Legacy Member Starter Pack (Visible only to legacy members who have not yet purchased) */}
        {isLegacyNeedsStarterPack && (
          <Card className="border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 shadow-lg relative overflow-hidden flex flex-col md:col-span-2 lg:col-span-3 border-2 rounded-3xl">
            <div className="p-5 pb-0 flex items-center justify-between">
              <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 shadow-xs">
                ⭐ Mandatory Legacy Member Activation
              </Badge>
              <span className="text-[11px] font-mono text-amber-800 font-bold uppercase">
                One-Time Upgrade
              </span>
            </div>
            <CardHeader className="pt-3">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-2 text-amber-800">
                <Leaf className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl text-amber-950 font-black">
                Mushroom Starter Pack (100g)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-amber-900 font-semibold">
                Mushroom Power 100g — One-Time Legacy Member Activation Package
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Your Account Status
                  </span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-bold px-2.5 py-0.5 text-xs">
                    Pre-Launch Farm Slots Secured
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  As a verified Founding Member, your pre-launch farm slots are already secured and productive in the physical farms! 
                  To activate your <strong>5×7 Compound Network Organogram</strong>, unlock <strong>Level 1–7 compound referral commissions</strong>, and enable <strong>external bank withdrawals</strong>, please complete your one-time <strong>₦5,000 Mushroom Starter Pack (100g)</strong> purchase.
                </p>
                <div className="border-t border-amber-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Package Fee</span>
                    <div className="text-2xl font-black text-amber-900 font-mono">
                      ₦5,000 <span className="text-xs font-normal text-gray-500">one-time</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 rounded-xl shadow-md cursor-pointer"
                    onClick={() => navigate('/dashboard/checkout?item=starter_pack')}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Purchase Starter Pack (₦5,000)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── CLUSTER 1: MUSHROOM VILLAGE (ACTIVE NOW) ── */}
        <Card className="border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col rounded-3xl bg-white group">
          {/* Real Agricultural Image Banner */}
          <div className="relative h-44 w-full overflow-hidden bg-emerald-950">
            <img
              src={AgrohealImages.MushroomCropFarm}
              alt="Mushroom Village Organic Production"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3.5 right-3.5">
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-md px-2.5 py-0.5">
                Active Cluster
              </Badge>
            </div>
            <div className="absolute bottom-3 left-4 text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block font-mono">
                Cluster 01 • Production Hub
              </span>
              <h3 className="text-lg font-black text-white leading-tight drop-shadow-xs">
                Mushroom Village
              </h3>
            </div>
          </div>

          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-950 font-bold">
                  Organic Oyster Mushrooms
                </CardTitle>
                <CardDescription className="text-xs text-emerald-700 font-semibold">
                  2 Fruiting Bags Per Biological Slot
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 pt-0">
            {/* Pricing Card */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Unit Capacity
                </span>
                <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-900 font-bold px-2 py-0.5 text-[11px] shadow-2xs">
                  2 Bags / Slot
                </Badge>
              </div>

              <div className="border-t border-emerald-100/80 pt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  Pricing
                </span>
                <div className="text-right">
                  {hasPriorSlots ? (
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-base font-black text-emerald-950 font-mono">₦5,000</span>
                      <span className="text-xs text-gray-500 font-normal">/ slot</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-base font-black text-emerald-950 font-mono">₦10,000</span>
                        <span className="text-[9.5px] font-bold uppercase bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded-md">
                          Starter Slot
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Subsequent slots scale at ₦5,000 each
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ₦10,000 Wealth Creation Activation Breakdown (Mushroom Power 100g + 1 Farm Slot) */}
            {!hasPriorSlots && (
              <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2 text-xs text-emerald-950 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-extrabold text-emerald-950 text-[11px] uppercase tracking-wide">
                    ₦10,000 Starter Activation Breakdown
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">• Mushroom Power (100g Welcome Pack):</span>
                    <strong className="text-emerald-950 font-mono font-bold">₦5,000</strong>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">• 1 Farm Slot (2 Biological Bags):</span>
                    <strong className="text-emerald-950 font-mono font-bold">₦5,000</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-medium pt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Enters you into the 5×7 Organogram matrix &amp; unlocks retail commissions</span>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-gray-700 block">Select Slot Quantity</label>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setMushroomQty(Math.max(1, mushroomQty - 1))}
                  disabled={mushroomQty <= 1}
                  className="rounded-xl h-9 w-9 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input 
                    type="number" 
                    value={mushroomQty}
                    onChange={(e) => setMushroomQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center font-mono font-black text-sm h-9 rounded-xl border-gray-200"
                    min={1}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setMushroomQty(mushroomQty + 1)}
                  className="rounded-xl h-9 w-9 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-gray-500 text-xs font-medium">Subtotal Due:</span>
                <span className="text-lg font-black text-emerald-900 font-mono">
                  ₦{calculatePrice(mushroomQty).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button 
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-10 rounded-xl shadow-xs transition-all cursor-pointer"
              onClick={() => handleCheckout('Mushroom Village', mushroomQty)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>

        {/* ── CLUSTER 2: GINGER TOWN (FUNDED VIA PROCEEDS · OPENS Q2) ── */}
        <Card className="border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col rounded-3xl bg-amber-50/15 group">
          {/* Real Agricultural Image Banner */}
          <div className="relative h-44 w-full overflow-hidden bg-amber-950">
            <img
              src={AgrohealImages.GingerCropFarm}
              alt="Gingertown Organic Ginger Cluster"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3.5 right-3.5">
              <Badge className="bg-amber-600/90 text-white font-bold text-[11px] border border-amber-400/40 shadow-md px-2.5 py-0.5">
                Opens Q2
              </Badge>
            </div>
            <div className="absolute bottom-3 left-4 text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block font-mono">
                Cluster 02 • Expansion Hub
              </span>
              <h3 className="text-lg font-black text-white leading-tight drop-shadow-xs">
                Gingertown
              </h3>
            </div>
          </div>

          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800">
                <Leaf className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-950 font-bold">Gingertown</CardTitle>
                <CardDescription className="font-semibold text-amber-800 text-xs">
                  Export Grade Organic Ginger
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 pt-0">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Contribution Per Slot
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base font-black text-amber-950 font-mono">₦33,000</span>
                  <span className="text-xs text-gray-500 font-normal">/ slot</span>
                </div>
              </div>

              <div className="border-t border-amber-200/70 pt-2 space-y-1">
                <p className="text-xs font-bold text-amber-900">
                  To be funded from Mushroom Village proceeds
                </p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  From the second quarter, expansion farms open and expenditure records will be transparently audited on member farm group ledgers.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-100 text-xs text-gray-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Allocation Model:</span>
                <span className="font-semibold text-amber-900">Mushroom Cycle 2 Proceeds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Opening Schedule:</span>
                <span className="font-semibold text-gray-800">Second Quarter (Q2)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Expense Records:</span>
                <span className="font-semibold text-gray-800">Group Farm Accounts</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button 
              variant="outline" 
              className="w-full border-amber-300 bg-amber-50/80 text-amber-900 cursor-default font-bold text-xs py-2.5 h-auto whitespace-normal leading-tight text-center rounded-xl"
              disabled
            >
              To Be Funded From Mushroom Village Proceeds
            </Button>
          </CardFooter>
        </Card>

        {/* ── CLUSTER 3: ORGANIC FOODNATION (FUNDED VIA PROCEEDS · OPENS Q2) ── */}
        <Card className="border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col rounded-3xl bg-emerald-50/15 group">
          {/* Real Agricultural Image Banner */}
          <div className="relative h-44 w-full overflow-hidden bg-emerald-950">
            <img
              src={AgrohealImages.heroFarm}
              alt="Organic FoodNation Cluster"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3.5 right-3.5">
              <Badge className="bg-emerald-600/90 text-white font-bold text-[11px] border border-emerald-400/40 shadow-md px-2.5 py-0.5">
                Opens Q2
              </Badge>
            </div>
            <div className="absolute bottom-3 left-4 text-white">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 block font-mono">
                Cluster 03 • National Hub
              </span>
              <h3 className="text-lg font-black text-white leading-tight drop-shadow-xs">
                Organic FoodNation
              </h3>
            </div>
          </div>

          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800">
                <Wheat className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-950 font-bold">Organic FoodNation</CardTitle>
                <CardDescription className="font-semibold text-emerald-800 text-xs">
                  Organic Staple Crops &amp; Livestock
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 pt-0">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Contribution Per Slot
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-base font-black text-emerald-950 font-mono">₦15,000</span>
                  <span className="text-xs text-gray-500 font-normal">/ slot</span>
                </div>
              </div>

              <div className="border-t border-emerald-200/70 pt-2 space-y-1">
                <p className="text-xs font-bold text-emerald-900">
                  To be funded from Mushroom Village proceeds
                </p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Subsequent cycles finance grain and staple production cluster batches with community profit sharing.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 text-xs text-gray-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Allocation Model:</span>
                <span className="font-semibold text-emerald-900">Mushroom Cycle 2 Proceeds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Opening Schedule:</span>
                <span className="font-semibold text-gray-800">Second Quarter (Q2)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Expense Records:</span>
                <span className="font-semibold text-gray-800">Group Farm Accounts</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button 
              variant="outline" 
              className="w-full border-emerald-300 bg-emerald-50/80 text-emerald-900 cursor-default font-bold text-xs py-2.5 h-auto whitespace-normal leading-tight text-center rounded-xl"
              disabled
            >
              To Be Funded From Mushroom Village Proceeds
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BuySlots;
