import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, DollarSign, TrendingUp, AlertCircle, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFarmStore } from '@/store/useFarmStore';

const MyFarmSlots: React.FC = () => {
  const { session, profile } = useAuth();
  const user = session?.user;
  const navigate = useNavigate();
  const { clusters, loading, fetchFarmData } = useFarmStore();
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchFarmData(user.id, user.email || profile?.email);
    }
  }, [user?.id, user?.email, profile?.email, fetchFarmData]);

  const subscriptions = clusters;

  const toggleCluster = (id: string) => {
    if (expandedCluster === id) {
      setExpandedCluster(null);
    } else {
      setExpandedCluster(id);
    }
  };

  const totalSlots = subscriptions.reduce((sum, s) => sum + (Number(s.slots_held) || 0), 0);
  const totalFruitingBags = subscriptions.reduce((sum, s) => sum + (Number(s.fruiting_bags) || 0), 0);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">My Farm Slots</h1>
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">No Farm Slots Yet</h2>
            <p className="text-slate-500 max-w-md mb-6">
              You haven't subscribed to any farm clusters. Purchase your first farm slot to start your agricultural portfolio.
            </p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/dashboard/farm-operations/buy-slots')}>
              Browse & Buy Farm Slots
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">My Farm Slots</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your agricultural portfolio and track real-time cluster financials.
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 font-medium text-sm uppercase tracking-wider mb-1">Total Slots Owned</p>
                <h3 className="text-4xl font-bold">{totalSlots}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-1">Fruiting Bags in Production</p>
                <h3 className="text-4xl font-bold text-slate-800">{totalFruitingBags}</h3>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Leaf className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-1">Subscribed Clusters</p>
                <h3 className="text-4xl font-bold text-slate-800">{subscriptions.length}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribed Clusters List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">Active Farm Clusters</h2>
        
        {subscriptions.map((sub) => (
          <Card key={sub.id} className="overflow-hidden shadow-sm border-slate-200">
            {/* Cluster Header */}
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Sprout className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  {(() => {
                    const match = sub.farm_name.match(/^(.+?)\s*\[(.+?)\]$/);
                    const displayName = match ? match[1] : sub.farm_name;
                    const displayCategory = match ? match[2] : sub.category;
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs">
                          [{displayCategory}]
                        </Badge>
                      </div>
                    );
                  })()}
                  <p className="text-sm text-slate-500">
                    Your Stake: <span className="font-semibold text-slate-700">{sub.slots_held} Slots</span> ({sub.fruiting_bags} bags)
                  </p>
                </div>
              </div>

              {/* Financial Pill Summary */}
              <div className="flex bg-slate-50 rounded-lg border border-slate-200 p-2 text-sm divide-x divide-slate-200 shadow-inner w-full md:w-auto">
                <div className="px-4 py-1 text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Expenses</p>
                  <p className="font-semibold text-red-600">₦{sub.financials.expenses.toLocaleString()}</p>
                </div>
                <div className="px-4 py-1 text-center">
                  <p className="text-slate-500 text-xs uppercase mb-1">Produce Sales</p>
                  <p className="font-semibold text-emerald-600">₦{sub.financials.sales.toLocaleString()}</p>
                </div>
                <div className="px-4 py-1 text-center bg-slate-100/50">
                  <p className="text-slate-500 text-xs uppercase mb-1">Net Balance</p>
                  <p className="font-bold text-slate-800">₦{sub.financials.net_balance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Expander Toggle */}
            <div 
              className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-center items-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => toggleCluster(sub.id)}
            >
              <div className="flex items-center text-sm font-medium text-slate-600 gap-2">
                {expandedCluster === sub.id ? (
                  <><ChevronUp className="w-4 h-4" /> Hide Financial Ledger</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> View Financial Ledger</>
                )}
              </div>
            </div>

            {/* Expanded Content: Financial Ledger */}
            {expandedCluster === sub.id && (
              <div className="border-t border-slate-200 bg-slate-50/50 p-6">
                
                {profile?.id === sub.coordinator_id ? (
                  <div className="mb-6 flex justify-between items-center bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">Coordinator Access</p>
                        <p className="text-xs opacity-80">You manage this cluster. Add records to update the ledger.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-white">Record Expense</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Record Sale</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center gap-2 text-slate-500 text-sm bg-white p-3 rounded-md border border-slate-200">
                    <Eye className="w-4 h-4" />
                    Read-only view. Ledger is maintained by the cluster coordinator.
                  </div>
                )}

                <Tabs defaultValue="expenses" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="expenses">Operating Expenses</TabsTrigger>
                    <TabsTrigger value="sales">Produce Sales</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="expenses" className="mt-4">
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sub.expenses.map((exp: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600">{exp.date}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{exp.description}</td>
                              <td className="px-6 py-4 text-right text-red-600 font-medium">-₦{exp.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          {sub.expenses.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No expenses recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sales" className="mt-4">
                     <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Produce</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sub.sales.map((sale: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600">{sale.date}</td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-slate-800">{sale.produce}</div>
                                <div className="text-xs text-slate-500">Qty: {sale.quantity}</div>
                              </td>
                              <td className="px-6 py-4 text-right text-emerald-600 font-medium">+₦{sale.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          {sub.sales.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No sales recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// Simple Leaf icon since it's not exported from lucide-react in the snippet above
function Leaf(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export default MyFarmSlots;
