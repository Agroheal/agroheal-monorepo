import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sprout, Minus, Plus, ShoppingCart, Leaf, Wheat } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

const BuySlots: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mushroomQty, setMushroomQty] = useState(1);
  const [hasPriorSlots, setHasPriorSlots] = useState(false);

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
    navigate(`/dashboard/checkout?category=${category}&slots=${qty}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Browse & Buy Farm Slots</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Acquire tangible agricultural production units. Zero monthly maintenance fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active: Mushroom */}
        <Card className="border-emerald-200 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4">
            <Badge className="bg-emerald-500 hover:bg-emerald-600">Active Now</Badge>
          </div>
          <CardHeader>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <Sprout className="w-6 h-6 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Mushroom Village</CardTitle>
            <CardDescription className="font-semibold text-emerald-700">
              Organic Mushrooms
            </CardDescription>
            <p className="text-xs text-slate-500">
              Climate-controlled house allocation. 60–90 day harvest cycle.
            </p>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Unit Capacity
                </span>
                <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-900 font-semibold px-2.5 py-0.5 text-xs shadow-xs">
                  2 Fruiting Bags / Slot
                </Badge>
              </div>

              <div className="border-t border-emerald-100/70 pt-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Pricing Structure
                </span>
                <div className="text-right">
                  {hasPriorSlots ? (
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-sm font-bold text-emerald-900">₦5,000</span>
                      <span className="text-xs text-slate-500 font-normal">/ slot</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-bold text-emerald-900">₦10,000</span>
                        <span className="text-[10px] font-bold uppercase bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded">
                          Starter Slot
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Subsequent slots scale at ₦5,000 each
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <label className="text-sm font-medium text-slate-700">Select Quantity</label>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setMushroomQty(Math.max(1, mushroomQty - 1))}
                  disabled={mushroomQty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input 
                    type="number" 
                    value={mushroomQty}
                    onChange={(e) => setMushroomQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center font-bold"
                    min={1}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setMushroomQty(mushroomQty + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 text-sm">Subtotal:</span>
                <span className="text-xl font-bold text-emerald-700">
                  ₦{calculatePrice(mushroomQty).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleCheckout('Mushroom Village', mushroomQty)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>

        {/* Gingertown */}
        <Card className="border-amber-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col bg-amber-50/15">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-200">
              Funded via Proceeds · Opens Q2
            </Badge>
          </div>
          <CardHeader>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl text-slate-800">Gingertown</CardTitle>
            <CardDescription className="font-semibold text-amber-800">
              Organic Ginger (& Stevia)
            </CardDescription>
            <p className="text-xs text-slate-500">
              Commercial rhizome & medicinal herb cluster.
            </p>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contribution Per Slot
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-lg font-bold text-amber-950">₦33,000</span>
                  <span className="text-xs text-slate-500 font-normal">/ slot</span>
                </div>
              </div>

              <div className="border-t border-amber-200/70 pt-2.5 space-y-1.5">
                <p className="text-xs font-bold text-amber-900">
                  To be funded from Mushroom Village proceeds
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  So from the second quarter, the farms will be opened and other details of expenses will appear on their group farm accounts.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Allocation Model:</span>
                <span className="font-semibold text-amber-900">Mushroom Cycle 2 Proceeds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Opening Schedule:</span>
                <span className="font-semibold text-slate-800">Second Quarter (Q2)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Expense Records:</span>
                <span className="font-semibold text-slate-800">Group Farm Accounts</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-amber-200 bg-amber-50/60 text-amber-900 cursor-default font-medium" disabled>
              To Be Funded From Mushroom Village Proceeds
            </Button>
          </CardFooter>
        </Card>

        {/* Organic FoodNation */}
        <Card className="border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col bg-emerald-50/15">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border border-emerald-200">
              Funded via Proceeds · Opens Q2
            </Badge>
          </div>
          <CardHeader>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <Wheat className="w-6 h-6 text-emerald-700" />
            </div>
            <CardTitle className="text-xl text-slate-800">Organic FoodNation</CardTitle>
            <CardDescription className="font-semibold text-emerald-800">
              Organic Food Crops & Livestock
            </CardDescription>
            <p className="text-xs text-slate-500">
              Integrated staple crops, vegetables, and livestock cluster.
            </p>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contribution Per Slot
                </span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-lg font-bold text-emerald-950">₦15,000</span>
                  <span className="text-xs text-slate-500 font-normal">/ slot</span>
                </div>
              </div>

              <div className="border-t border-emerald-200/70 pt-2.5 space-y-1.5">
                <p className="text-xs font-bold text-emerald-900">
                  To be funded from Mushroom Village proceeds
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  So from the second quarter, the farms will be opened and other details of expenses will appear on their group farm accounts.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 border border-emerald-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Allocation Model:</span>
                <span className="font-semibold text-emerald-900">Mushroom Cycle 2 Proceeds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Opening Schedule:</span>
                <span className="font-semibold text-slate-800">Second Quarter (Q2)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Expense Records:</span>
                <span className="font-semibold text-slate-800">Group Farm Accounts</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-emerald-200 bg-emerald-50/60 text-emerald-900 cursor-default font-medium" disabled>
              To Be Funded From Mushroom Village Proceeds
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BuySlots;
