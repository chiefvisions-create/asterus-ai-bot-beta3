import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useBot } from "@/hooks/use-bot";
import { apiRequest } from "@/lib/queryClient";
import { PendingOrder, GridConfig, PortfolioAllocation } from "@shared/schema";
import {
  Layers,
  Target,
  Grid3X3,
  PieChart,
  Plus,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  X
} from "lucide-react";

export default function AdvancedOrders() {
  const { toast } = useToast();
  const { botId, bot } = useBot();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: pendingOrders = [], isLoading: ordersLoading } = useQuery<PendingOrder[]>({
    queryKey: [`/api/bot/${botId}/orders/pending`],
    enabled: !!botId,
    refetchInterval: 5000
  });

  const { data: grids = [], isLoading: gridsLoading } = useQuery<GridConfig[]>({
    queryKey: [`/api/bot/${botId}/grids`],
    enabled: !!botId,
    refetchInterval: 10000
  });

  const { data: allocations = [] } = useQuery<PortfolioAllocation[]>({
    queryKey: [`/api/bot/${botId}/portfolio/allocations`],
    enabled: !!botId
  });

  const activeOrders = pendingOrders.filter(o => o.status === 'pending');
  const ocoOrders = activeOrders.filter(o => o.orderType === 'oco');
  const limitOrders = activeOrders.filter(o => o.orderType === 'limit');
  const gridOrders = activeOrders.filter(o => o.orderType === 'grid');

  return (
    <div className="space-y-4 md:space-y-6" data-testid="advanced-orders-page">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
            Advanced Orders
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            OCO orders, grid trading, and portfolio rebalancing
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-[10px] md:text-xs">
            {activeOrders.length} Active
          </Badge>
          <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-[10px] md:text-xs">
            {grids.filter(g => g.status === 'running').length} Grids
          </Badge>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 bg-slate-800/50 h-auto p-1">
          <TabsTrigger value="pending" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 text-[10px] md:text-sm">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="oco" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 text-[10px] md:text-sm">
            <Target className="h-3 w-3 md:h-4 md:w-4" />
            <span>OCO</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 text-[10px] md:text-sm">
            <Grid3X3 className="h-3 w-3 md:h-4 md:w-4" />
            <span>Grid</span>
          </TabsTrigger>
          <TabsTrigger value="rebalance" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-3 py-2 text-[10px] md:text-sm">
            <PieChart className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Rebalance</span>
            <span className="sm:hidden">Bal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <PendingOrdersTab 
            botId={botId!} 
            orders={pendingOrders} 
            symbol={bot?.symbol || 'BTC/USDT'} 
          />
        </TabsContent>

        <TabsContent value="oco" className="space-y-4">
          <OCOOrdersTab 
            botId={botId!} 
            ocoOrders={ocoOrders} 
            symbol={bot?.symbol || 'BTC/USDT'} 
          />
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <GridTradingTab 
            botId={botId!} 
            grids={grids} 
            gridOrders={gridOrders}
            symbol={bot?.symbol || 'BTC/USDT'} 
          />
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-4">
          <RebalancingTab 
            botId={botId!} 
            allocations={allocations} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingOrdersTab({ botId, orders, symbol }: { botId: number; orders: PendingOrder[]; symbol: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/bot/${botId}/orders/pending`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/orders/pending`] });
      toast({ title: "Order created successfully" });
      setShowForm(false);
      setAmount('');
      setTriggerPrice('');
    },
    onError: (err: any) => {
      toast({ title: "Failed to create order", description: err.message, variant: "destructive" });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest('DELETE', `/api/bot/${botId}/orders/pending/${orderId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/orders/pending`] });
      toast({ title: "Order cancelled" });
    }
  });

  const handleCreateOrder = () => {
    if (!amount || !triggerPrice) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({
      orderType,
      symbol,
      side,
      amount: parseFloat(amount),
      triggerPrice: parseFloat(triggerPrice)
    });
  };

  const activeOrders = orders.filter(o => o.status === 'pending' && o.orderType !== 'oco' && o.orderType !== 'grid');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
              <span className="hidden sm:inline">Active Limit & Stop Orders</span>
              <span className="sm:hidden">Limit/Stop Orders</span>
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm px-2 md:px-3"
              data-testid="button-new-order"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">New Order</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {showForm && (
            <div className="mb-4 p-3 md:p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Type</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                      <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Side</Label>
                  <div className="flex gap-1 mt-1">
                    <Button 
                      size="sm" 
                      variant={side === 'buy' ? 'default' : 'ghost'}
                      onClick={() => setSide('buy')}
                      className={side === 'buy' ? 'bg-green-600 hover:bg-green-700 flex-1' : 'flex-1'}
                    >
                      Buy
                    </Button>
                    <Button 
                      size="sm" 
                      variant={side === 'sell' ? 'default' : 'ghost'}
                      onClick={() => setSide('sell')}
                      className={side === 'sell' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Amount</Label>
                  <Input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.001"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Trigger Price ($)</Label>
                  <Input 
                    type="number" 
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(e.target.value)}
                    placeholder="50000"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreateOrder}
                  disabled={createOrderMutation.isPending}
                  data-testid="button-submit-order"
                >
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] md:h-[400px]">
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Clock className="h-10 w-10 md:h-12 md:w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No pending orders</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1">Create limit or stop orders to queue them</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-2 md:p-3 bg-slate-900/50 rounded-lg border border-slate-700/30"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className={`p-1.5 md:p-2 rounded shrink-0 ${order.side === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {order.side === 'buy' ? (
                          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                          <span className="text-xs md:text-sm font-medium text-white">{order.symbol}</span>
                          <Badge variant="outline" className="text-[8px] md:text-[9px] py-0">
                            {order.orderType.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 truncate">
                          {order.side.toUpperCase()} {order.amount} @ ${order.triggerPrice?.toFixed(2) || order.limitPrice?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => cancelOrderMutation.mutate(order.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 md:h-8 md:w-8 p-0"
                    >
                      <X className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 hidden lg:block">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm flex items-center gap-2">
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <p className="text-[10px] md:text-xs text-slate-500 uppercase mb-1">Total Active</p>
            <p className="text-xl md:text-2xl font-bold text-white">{activeOrders.length}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-[10px] md:text-xs text-green-400 uppercase mb-1">Buy</p>
              <p className="text-base md:text-lg font-bold text-green-400">
                {activeOrders.filter(o => o.side === 'buy').length}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-[10px] md:text-xs text-red-400 uppercase mb-1">Sell</p>
              <p className="text-base md:text-lg font-bold text-red-400">
                {activeOrders.filter(o => o.side === 'sell').length}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Limit Orders</span>
              <span className="text-white">{activeOrders.filter(o => o.orderType === 'limit').length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Stop Orders</span>
              <span className="text-white">{activeOrders.filter(o => o.orderType === 'stop').length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Trailing Stops</span>
              <span className="text-white">{activeOrders.filter(o => o.orderType === 'trailing_stop').length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OCOOrdersTab({ botId, ocoOrders, symbol }: { botId: number; ocoOrders: PendingOrder[]; symbol: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');

  const createOCOMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/bot/${botId}/orders/pending`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/orders/pending`] });
      toast({ title: "OCO order pair created" });
      setShowForm(false);
      setAmount('');
      setTakeProfitPrice('');
      setStopPrice('');
    },
    onError: (err: any) => {
      toast({ title: "Failed to create OCO", description: err.message, variant: "destructive" });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest('DELETE', `/api/bot/${botId}/orders/pending/${orderId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/orders/pending`] });
      toast({ title: "OCO orders cancelled" });
    }
  });

  const handleCreateOCO = () => {
    if (!amount || !takeProfitPrice || !stopPrice) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    createOCOMutation.mutate({
      orderType: 'oco',
      symbol,
      side: 'sell',
      amount: parseFloat(amount),
      takeProfitPrice: parseFloat(takeProfitPrice),
      stopPrice: parseFloat(stopPrice)
    });
  };

  const ocoGroups = ocoOrders.reduce((acc, order) => {
    if (order.linkedOrderId && order.linkedOrderId < order.id) {
      return acc;
    }
    acc.push(order);
    return acc;
  }, [] as PendingOrder[]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xs md:text-sm flex items-center gap-2">
                <Target className="h-3 w-3 md:h-4 md:w-4 text-amber-400" />
                <span className="hidden sm:inline">OCO Orders (One-Cancels-Other)</span>
                <span className="sm:hidden">OCO Orders</span>
              </CardTitle>
              <CardDescription className="text-[10px] md:text-xs mt-1">
                Set take profit and stop loss together
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowForm(!showForm)}
              className="bg-amber-600 hover:bg-amber-700 text-xs md:text-sm w-full sm:w-auto"
              data-testid="button-new-oco"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              New OCO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {showForm && (
            <div className="mb-4 p-3 md:p-4 bg-slate-900/50 rounded-lg border border-amber-500/20 space-y-3 md:space-y-4">
              <div className="text-center mb-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  {symbol}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Amount to Sell</Label>
                  <Input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.001"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-green-400">Take Profit ($)</Label>
                  <Input 
                    type="number" 
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="55000"
                    className="bg-slate-800 border-green-600/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-red-400">Stop Loss ($)</Label>
                  <Input 
                    type="number" 
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    placeholder="48000"
                    className="bg-slate-800 border-red-600/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreateOCO}
                  disabled={createOCOMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                  data-testid="button-submit-oco"
                >
                  {createOCOMutation.isPending ? 'Creating...' : 'Create OCO Pair'}
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[280px] md:h-[350px]">
            {ocoGroups.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Target className="h-10 w-10 md:h-12 md:w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No OCO orders</p>
                <p className="text-xs text-slate-500 mt-1">Create an OCO to protect your positions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ocoGroups.map(order => (
                  <div 
                    key={order.id} 
                    className="p-4 bg-slate-900/50 rounded-lg border border-amber-500/20"
                    data-testid={`oco-${order.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                          OCO
                        </Badge>
                        <span className="text-sm text-white">{order.symbol}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => cancelOrderMutation.mutate(order.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                        <p className="text-[10px] text-green-400 uppercase">Take Profit</p>
                        <p className="text-sm font-bold text-green-400">
                          ${order.takeProfitPrice?.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                        <p className="text-[10px] text-red-400 uppercase">Stop Loss</p>
                        <p className="text-sm font-bold text-red-400">
                          ${order.stopPrice?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Amount: {order.amount} {order.symbol.split('/')[0]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 hidden lg:block">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm flex items-center gap-2">
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            How OCO Orders Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
          <div className="p-3 md:p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h4 className="text-xs md:text-sm font-medium text-blue-400 mb-2">One-Cancels-Other</h4>
            <p className="text-[10px] md:text-xs text-slate-400">
              OCO orders let you set both a take profit and stop loss simultaneously. 
              When the price hits either level, that order executes and the other is 
              automatically cancelled.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="p-2 bg-green-500/20 rounded">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white">Take Profit</p>
                <p className="text-xs text-slate-400">Sell when price rises to lock in gains</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-red-500/20 rounded">
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white">Stop Loss</p>
                <p className="text-xs text-slate-400">Sell when price drops to limit losses</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-purple-500/20 rounded">
                <ArrowUpDown className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white">Auto-Cancel</p>
                <p className="text-xs text-slate-400">Other order cancels automatically</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GridTradingTab({ botId, grids, gridOrders, symbol }: { botId: number; grids: GridConfig[]; gridOrders: PendingOrder[]; symbol: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [upperPrice, setUpperPrice] = useState('');
  const [lowerPrice, setLowerPrice] = useState('');
  const [gridLevels, setGridLevels] = useState('10');
  const [totalInvestment, setTotalInvestment] = useState('1000');

  const createGridMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/bot/${botId}/grids`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/grids`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/orders/pending`] });
      toast({ title: "Grid created successfully" });
      setShowForm(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create grid", description: err.message, variant: "destructive" });
    }
  });

  const toggleGridMutation = useMutation({
    mutationFn: async ({ gridId, status }: { gridId: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/bot/${botId}/grids/${gridId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/grids`] });
      toast({ title: "Grid updated" });
    }
  });

  const deleteGridMutation = useMutation({
    mutationFn: async (gridId: number) => {
      const res = await apiRequest('DELETE', `/api/bot/${botId}/grids/${gridId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/grids`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/orders/pending`] });
      toast({ title: "Grid deleted" });
    }
  });

  const handleCreateGrid = () => {
    if (!upperPrice || !lowerPrice || !gridLevels || !totalInvestment) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    createGridMutation.mutate({
      symbol,
      gridType: 'arithmetic',
      upperPrice: parseFloat(upperPrice),
      lowerPrice: parseFloat(lowerPrice),
      gridLevels: parseInt(gridLevels),
      totalInvestment: parseFloat(totalInvestment)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xs md:text-sm flex items-center gap-2">
                <Grid3X3 className="h-3 w-3 md:h-4 md:w-4 text-cyan-400" />
                Grid Trading
              </CardTitle>
              <CardDescription className="text-[10px] md:text-xs mt-1">
                Auto buy/sell at price intervals
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowForm(!showForm)}
              className="bg-cyan-600 hover:bg-cyan-700 text-xs md:text-sm w-full sm:w-auto"
              data-testid="button-new-grid"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              New Grid
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {showForm && (
            <div className="mb-4 p-3 md:p-4 bg-slate-900/50 rounded-lg border border-cyan-500/20 space-y-3 md:space-y-4">
              <div className="text-center mb-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                  {symbol}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Upper Price ($)</Label>
                  <Input 
                    type="number" 
                    value={upperPrice}
                    onChange={(e) => setUpperPrice(e.target.value)}
                    placeholder="60000"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Lower Price ($)</Label>
                  <Input 
                    type="number" 
                    value={lowerPrice}
                    onChange={(e) => setLowerPrice(e.target.value)}
                    placeholder="40000"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Grid Levels</Label>
                  <Input 
                    type="number" 
                    value={gridLevels}
                    onChange={(e) => setGridLevels(e.target.value)}
                    placeholder="10"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Investment ($)</Label>
                  <Input 
                    type="number" 
                    value={totalInvestment}
                    onChange={(e) => setTotalInvestment(e.target.value)}
                    placeholder="1000"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded border border-cyan-500/20">
                <p className="text-xs text-cyan-400">
                  Grid spacing: ${upperPrice && lowerPrice && gridLevels ? 
                    ((parseFloat(upperPrice) - parseFloat(lowerPrice)) / (parseInt(gridLevels) - 1)).toFixed(2) 
                    : '—'} per level
                </p>
                <p className="text-xs text-slate-500">
                  Amount per grid: ${upperPrice && totalInvestment && gridLevels ? 
                    (parseFloat(totalInvestment) / parseInt(gridLevels)).toFixed(2) 
                    : '—'}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreateGrid}
                  disabled={createGridMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  data-testid="button-submit-grid"
                >
                  {createGridMutation.isPending ? 'Creating...' : 'Create Grid'}
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[280px] md:h-[350px]">
            {grids.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Grid3X3 className="h-10 w-10 md:h-12 md:w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No grid bots</p>
                <p className="text-xs text-slate-500 mt-1">Create a grid to automate range trading</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grids.map(grid => {
                  const gridOrderCount = gridOrders.filter(o => o.gridId === grid.id).length;
                  return (
                    <div 
                      key={grid.id} 
                      className="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/20"
                      data-testid={`grid-${grid.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={grid.status === 'running' 
                              ? 'border-green-500/50 text-green-400' 
                              : 'border-slate-500/50 text-slate-400'
                            }
                          >
                            {grid.status.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-white">{grid.symbol}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => toggleGridMutation.mutate({ 
                              gridId: grid.id, 
                              status: grid.status === 'running' ? 'paused' : 'running' 
                            })}
                            className="h-7 w-7 p-0"
                          >
                            {grid.status === 'running' ? (
                              <Pause className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Play className="h-4 w-4 text-green-400" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteGridMutation.mutate(grid.id)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Range</p>
                          <p className="text-white">${grid.lowerPrice.toFixed(0)} - ${grid.upperPrice.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Levels</p>
                          <p className="text-white">{grid.gridLevels}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Investment</p>
                          <p className="text-white">${grid.totalInvestment.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">P&L</p>
                          <p className={grid.currentPnL && grid.currentPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${(grid.currentPnL || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500">
                        {gridOrderCount} active grid orders • {grid.totalFilled || 0} filled
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 hidden lg:block">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm flex items-center gap-2">
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            Grid Trading Explained
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
          <div className="p-3 md:p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <h4 className="text-xs md:text-sm font-medium text-cyan-400 mb-2">Range Trading Strategy</h4>
            <p className="text-[10px] md:text-xs text-slate-400">
              Grid trading places buy orders at lower prices and sell orders at higher prices 
              within a range. It profits from price oscillations in sideways markets.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="p-2 bg-green-500/20 rounded">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white">Auto Buy Low</p>
                <p className="text-xs text-slate-400">Places buy orders at grid levels below current price</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-red-500/20 rounded">
                <DollarSign className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white">Auto Sell High</p>
                <p className="text-xs text-slate-400">Sells when price moves up to next grid level</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-purple-500/20 rounded">
                <RefreshCw className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white">Continuous</p>
                <p className="text-xs text-slate-400">Keeps trading while price stays in range</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RebalancingTab({ botId, allocations }: { botId: number; allocations: PortfolioAllocation[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [targetPercent, setTargetPercent] = useState('');

  const createAllocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/bot/${botId}/portfolio/allocations`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/portfolio/allocations`] });
      toast({ title: "Allocation added" });
      setShowForm(false);
      setTargetPercent('');
    },
    onError: (err: any) => {
      toast({ title: "Failed to add allocation", description: err.message, variant: "destructive" });
    }
  });

  const deleteAllocationMutation = useMutation({
    mutationFn: async (allocId: number) => {
      const res = await apiRequest('DELETE', `/api/bot/${botId}/portfolio/allocations/${allocId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/portfolio/allocations`] });
      toast({ title: "Allocation removed" });
    }
  });

  const rebalanceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/bot/${botId}/portfolio/rebalance`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Rebalance initiated", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Rebalance failed", description: err.message, variant: "destructive" });
    }
  });

  const totalAllocation = allocations.reduce((sum, a) => sum + (a.targetPercent || 0), 0);

  const handleAddAllocation = () => {
    if (!symbol || !targetPercent) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (totalAllocation + parseFloat(targetPercent) > 100) {
      toast({ title: "Total allocation cannot exceed 100%", variant: "destructive" });
      return;
    }
    createAllocationMutation.mutate({
      symbol,
      targetPercent: parseFloat(targetPercent),
      rebalanceThreshold: 5
    });
  };

  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-xs md:text-sm flex items-center gap-2">
                <PieChart className="h-3 w-3 md:h-4 md:w-4 text-pink-400" />
                Portfolio Allocations
              </CardTitle>
              <CardDescription className="text-[10px] md:text-xs mt-1">
                Set target % for auto rebalancing
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                size="sm" 
                onClick={() => setShowForm(!showForm)}
                variant="outline"
                className="text-xs md:text-sm flex-1 sm:flex-none"
                data-testid="button-add-allocation"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Add Asset
              </Button>
              <Button 
                size="sm" 
                onClick={() => rebalanceMutation.mutate()}
                disabled={rebalanceMutation.isPending || allocations.length === 0}
                className="bg-pink-600 hover:bg-pink-700 text-xs md:text-sm flex-1 sm:flex-none"
                data-testid="button-rebalance"
              >
                <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 ${rebalanceMutation.isPending ? 'animate-spin' : ''}`} />
                Rebalance
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {showForm && (
            <div className="mb-4 p-3 md:p-4 bg-slate-900/50 rounded-lg border border-pink-500/20 space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Asset</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {symbols.filter(s => !allocations.find(a => a.symbol === s)).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Target %</Label>
                  <Input 
                    type="number" 
                    value={targetPercent}
                    onChange={(e) => setTargetPercent(e.target.value)}
                    placeholder="25"
                    max={100 - totalAllocation}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    size="sm" 
                    onClick={handleAddAllocation}
                    disabled={createAllocationMutation.isPending}
                    className="w-full"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {allocations.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <PieChart className="h-10 w-10 md:h-12 md:w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No allocations set</p>
              <p className="text-xs text-slate-500 mt-1">Add assets and set target percentages</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map(alloc => {
                const deviation = Math.abs((alloc.currentPercent || 0) - alloc.targetPercent);
                const needsRebalance = deviation > (alloc.rebalanceThreshold || 5);
                return (
                  <div 
                    key={alloc.id} 
                    className={`p-4 bg-slate-900/50 rounded-lg border ${needsRebalance ? 'border-amber-500/30' : 'border-slate-700/30'}`}
                    data-testid={`allocation-${alloc.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{alloc.symbol}</span>
                        {needsRebalance && (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[9px]">
                            NEEDS REBALANCE
                          </Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteAllocationMutation.mutate(alloc.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-slate-500">Target</p>
                        <p className="text-white font-bold">{alloc.targetPercent}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Current</p>
                        <p className="text-slate-300">{(alloc.currentPercent || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Deviation</p>
                        <p className={deviation > 5 ? 'text-amber-400' : 'text-slate-300'}>
                          {deviation.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-500 rounded-full" 
                        style={{ width: `${Math.min(alloc.currentPercent || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Allocated</span>
                  <span className={totalAllocation === 100 ? 'text-green-400' : 'text-amber-400'}>
                    {totalAllocation}%
                  </span>
                </div>
                {totalAllocation < 100 && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {100 - totalAllocation}% unallocated (will remain in USD)
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 hidden lg:block">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm flex items-center gap-2">
            <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            Portfolio Rebalancing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
          <div className="p-3 md:p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
            <h4 className="text-xs md:text-sm font-medium text-pink-400 mb-2">Automatic Rebalancing</h4>
            <p className="text-[10px] md:text-xs text-slate-400">
              Rebalancing maintains your target allocation by selling assets that have grown 
              above target and buying those below. This helps manage risk and lock in gains.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="p-2 bg-green-500/20 rounded">
                <Target className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-white">Set Targets</p>
                <p className="text-xs text-slate-400">Define target % for each asset</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-amber-500/20 rounded">
                <BarChart3 className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white">Monitor Deviation</p>
                <p className="text-xs text-slate-400">Track when assets drift from targets</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-purple-500/20 rounded">
                <RefreshCw className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white">Rebalance</p>
                <p className="text-xs text-slate-400">Execute trades to restore targets</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
