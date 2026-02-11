import { useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Zap,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Coins,
  Terminal,
  Info,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bot as BotType, Trade, Log } from "@shared/schema";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { useBot } from "@/hooks/use-bot";
import { StrategySelector } from "@/components/StrategySelector";
import { ActivityLog } from "@/components/ActivityLog";
import { RecentTrades } from "@/components/RecentTrades";
import { TradingModeToggle } from "@/components/TradingModeToggle";
import { ExchangeStatus } from "@/components/ExchangeStatus";
import { LiveChart } from "@/components/LiveChart";
import { StrategySuggestions } from "@/components/StrategySuggestions";
import { LivePositionTracker } from "@/components/LivePositionTracker";
import { OrderBookDepth } from "@/components/OrderBookDepth";
import { ExecutionAnalytics } from "@/components/ExecutionAnalytics";

interface MarketTicker {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

interface AccountBalance {
  isLive: boolean;
  balance: number;
  startingCapital: number;
  currency: string;
  holdings: { currency: string; amount: number; usdValue: number }[];
  totalEquity: number;
  source: string;
  equityHistory?: { timestamp: string; balance: number }[];
  unrealizedPnL?: number;
  todayRealizedPnL?: number;
  todayTotalPnL?: number;
  openPositions?: { symbol: string; entryPrice: number; quantity: number; currentPrice: number; unrealizedPnl: number }[];
}

export default function Overview() {
  const { toast } = useToast();
  const { bot, botId, refetch: refetchBot, isLoading: botLoading } = useBot();
  
  const { data: trades = [] } = useQuery<Trade[]>({ 
    queryKey: [`/api/bot/${botId}/trades`],
    enabled: !!botId,
    refetchInterval: 5000  // Refresh trades every 5 seconds
  });

  const { data: ticker } = useQuery<MarketTicker>({
    queryKey: [`/api/market/${encodeURIComponent(bot?.symbol || 'BTC/USDT')}/ticker?botId=${botId}`],
    enabled: !!bot?.symbol && !!botId,
    refetchInterval: 5000,  // Refresh ticker every 5 seconds for live prices
  });

  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: [`/api/bot/${botId}/logs`],
    enabled: !!botId,
    refetchInterval: 3000,  // Refresh logs every 3 seconds
  });

  // Fetch live account balance from exchange
  const { data: accountBalance, isError: balanceError, refetch: refetchBalance } = useQuery<AccountBalance>({
    queryKey: [`/api/bot/${botId}/account/balance`],
    enabled: !!botId,
    refetchInterval: bot?.isLiveMode ? 5000 : 10000,  // Faster refresh in live mode
    retry: 1,
    staleTime: 0, // Always refetch
    // Refetch when live mode changes
    refetchOnMount: 'always',
  });

  // Auto-refresh all data on app start
  useEffect(() => {
    if (botId) {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/trades`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/logs`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/account/balance`] });
    }
  }, [botId]);

  const watchlist = bot?.watchlist || ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

  const updateBotMutation = useMutation({
    mutationFn: async (update: Partial<BotType>) => {
      return apiRequest("PATCH", `/api/bot/${botId}`, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bot/${botId}/paper/reset`, { startingCapital: 10000 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      toast({ title: "Paper Trading Reset", description: "Account reset to $10,000" });
    },
  });

  const killMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bot/${botId}/kill`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      toast({ title: "Emergency Stop", description: "Bot has been stopped", variant: "destructive" });
    },
  });

  if (!bot || !botId) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Bot className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    </div>
  );

  // After the guard, botId is guaranteed to be defined
  const safeBotId = botId as number;

  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winCount = trades.filter(t => (t.pnl || 0) > 0).length;
  const lossCount = trades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
  
  const todayTrades = trades.filter(t => {
    const tradeDate = new Date(t.timestamp);
    const today = new Date();
    return tradeDate.toDateString() === today.toDateString();
  });
  const localTodayPnL = todayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  
  // Use live balance when in live mode, otherwise paper balance
  const balance = accountBalance?.balance ?? (bot.paperBalance || 10000);
  const startingCapital = accountBalance?.startingCapital ?? (bot.paperStartingCapital || 10000);
  const totalReturn = ((balance - startingCapital) / startingCapital) * 100;
  const isLiveBalance = accountBalance?.isLive ?? false;
  const balanceSource = accountBalance?.source ?? 'paper';
  const holdings = accountBalance?.holdings ?? [];
  
  // Use live P&L data from API when available, otherwise use local calculation
  const unrealizedPnL = accountBalance?.unrealizedPnL ?? 0;
  const todayRealizedPnL = accountBalance?.todayRealizedPnL ?? localTodayPnL;
  const todayPnL = isLiveBalance ? (accountBalance?.todayTotalPnL ?? (todayRealizedPnL + unrealizedPnL)) : localTodayPnL;
  const openPositions = accountBalance?.openPositions ?? [];
  
  // Use appropriate equity history based on mode
  const equityHistory = isLiveBalance 
    ? (accountBalance?.equityHistory || bot.liveEquityHistory || [])
    : (bot.equityHistory || []);

  return (
    <div className="space-y-4 md:space-y-6" data-testid="dashboard-overview">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-400">Real-time trading overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            className={`text-[10px] md:text-xs ${bot.isLiveMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}
          >
            {bot.isLiveMode ? 'LIVE' : 'PAPER'}
          </Badge>
          <Badge 
            className={`text-[10px] md:text-xs ${bot.isRunning ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
          >
            {bot.isRunning ? 'ACTIVE' : 'STOPPED'}
          </Badge>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4" data-testid="stats-grid">
        <Card className={`border-slate-700/50 ${isLiveBalance ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50'}`}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-[10px] md:text-xs text-slate-400">Balance</span>
                <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full animate-pulse ${isLiveBalance ? 'bg-green-400' : 'bg-blue-400'}`} title="Live" />
              </div>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            </div>
            <div className="text-base md:text-xl font-bold text-white truncate">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className={`text-[10px] md:text-xs mt-1 ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-[10px] md:text-xs text-slate-400">P&L</span>
              {totalPnL >= 0 ? <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-400" /> : <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-400" />}
            </div>
            <div className={`text-base md:text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
            </div>
            <div className={`text-[10px] md:text-xs mt-1 ${todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {todayPnL >= 0 ? '+' : ''}${todayPnL.toFixed(0)} today
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-[10px] md:text-xs text-slate-400">Win Rate</span>
              <Target className="h-3 w-3 md:h-4 md:w-4 text-amber-400" />
            </div>
            <div className="text-base md:text-xl font-bold text-white">{winRate.toFixed(0)}%</div>
            <div className="text-[10px] md:text-xs mt-1 text-slate-400">{winCount}W/{lossCount}L</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-[10px] md:text-xs text-slate-400">Signal</span>
              <Zap className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
            </div>
            <Badge className={`text-[10px] md:text-xs ${
              bot.lastSignal === 'long' ? 'bg-green-500/20 text-green-400' : 
              bot.lastSignal === 'short' ? 'bg-red-500/20 text-red-400' : 
              'bg-slate-500/20 text-slate-400'
            } border-0`}>
              {(bot.lastSignal || 'neutral').toUpperCase()}
            </Badge>
            <div className="text-[10px] md:text-xs mt-1 text-slate-400">
              {((bot.aiConfidence || 0) * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <select
                value={bot.symbol}
                onChange={(e) => updateBotMutation.mutate({ symbol: e.target.value })}
                className="text-[10px] md:text-xs text-cyan-400 bg-transparent border-none cursor-pointer hover:text-cyan-300 focus:outline-none font-medium max-w-[80px] md:max-w-none"
                data-testid="select-trading-pair"
              >
                <optgroup label="Major">
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                  <option value="XRP/USDT">XRP/USDT</option>
                  <option value="BNB/USDT">BNB/USDT</option>
                  <option value="ADA/USDT">ADA/USDT</option>
                  <option value="AVAX/USDT">AVAX/USDT</option>
                  <option value="DOGE/USDT">DOGE/USDT</option>
                </optgroup>
                <optgroup label="DeFi">
                  <option value="LINK/USDT">LINK/USDT</option>
                  <option value="UNI/USDT">UNI/USDT</option>
                  <option value="AAVE/USDT">AAVE/USDT</option>
                  <option value="MKR/USDT">MKR/USDT</option>
                </optgroup>
                <optgroup label="Layer 2">
                  <option value="MATIC/USDT">MATIC/USDT</option>
                  <option value="ARB/USDT">ARB/USDT</option>
                  <option value="OP/USDT">OP/USDT</option>
                </optgroup>
                <optgroup label="Meme">
                  <option value="SHIB/USDT">SHIB/USDT</option>
                  <option value="PEPE/USDT">PEPE/USDT</option>
                </optgroup>
              </select>
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-cyan-400" />
            </div>
            <div className="text-base md:text-xl font-bold text-white truncate">
              ${ticker?.price?.toLocaleString() || '---'}
            </div>
            <div className={`text-[10px] md:text-xs mt-1 ${(ticker?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(ticker?.change24h || 0) >= 0 ? '+' : ''}{(ticker?.change24h || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-[10px] md:text-xs text-slate-400">Trades</span>
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            </div>
            <div className="text-base md:text-xl font-bold text-white">{trades.length}</div>
            <div className="text-[10px] md:text-xs mt-1 text-slate-400">{todayTrades.length} today</div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Mode Toggle and Exchange Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <TradingModeToggle botId={safeBotId} />
        <ExchangeStatus botId={safeBotId} />
      </div>

      {/* Live Trading Advanced Features - Only visible in live mode */}
      {bot.isLiveMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <LivePositionTracker botId={safeBotId} />
          <OrderBookDepth botId={safeBotId} />
          <ExecutionAnalytics botId={safeBotId} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Equity Chart - Compact */}
        <Card className={`lg:col-span-2 border-slate-700/50 ${isLiveBalance ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/50'}`} data-testid="portfolio-value-card">
          <CardHeader className="pb-1 p-3 md:p-4 md:pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm flex items-center gap-1 md:gap-2">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                <span>Portfolio</span>
                <Badge variant="outline" className={`text-[7px] md:text-[8px] py-0 h-4 ${isLiveBalance ? 'border-green-500/50 text-green-400' : 'border-amber-500/50 text-amber-400'}`}>
                  {balanceSource.toUpperCase()}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => refetchBalance()}
                  className="h-5 w-5 p-0 hover:bg-slate-700"
                  data-testid="button-refresh-balance"
                >
                  <RefreshCw className="h-2.5 w-2.5 text-slate-400" />
                </Button>
                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isLiveBalance ? 'bg-green-400' : 'bg-blue-400'}`} />
                <span className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            {/* Compact stats row */}
            <div className="flex items-center justify-between mb-2 text-[10px] md:text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className={todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                  Today: {todayPnL >= 0 ? '+' : ''}${todayPnL.toFixed(0)}
                </span>
                {isLiveBalance && openPositions.length > 0 && (
                  <span className="text-slate-500">{openPositions.length} pos</span>
                )}
              </div>
              <span className={totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}% all time
              </span>
            </div>
            
            <div className="h-[100px] md:h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityHistory}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isLiveBalance ? "#22c55e" : "#8b5cf6"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isLiveBalance ? "#22c55e" : "#8b5cf6"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: isLiveBalance ? '#22c55e' : '#8b5cf6' }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0 })}`, 'Bal']}
                  />
                  <Area type="monotone" dataKey="balance" stroke={isLiveBalance ? "#22c55e" : "#8b5cf6"} fillOpacity={1} fill="url(#colorEquity)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2">
              <Zap className="h-3 w-3 md:h-4 md:w-4 text-amber-400" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3 p-4 md:p-6 pt-0 md:pt-0">
            {!bot.isRunning ? (
              <Button
                onClick={() => updateBotMutation.mutate({ isRunning: true })}
                disabled={updateBotMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 h-9 md:h-10 text-xs md:text-sm"
                data-testid="button-start-bot"
              >
                <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Start Bot
              </Button>
            ) : (
              <Button
                onClick={() => updateBotMutation.mutate({ isRunning: false })}
                disabled={updateBotMutation.isPending}
                variant="secondary"
                className="w-full h-9 md:h-10 text-xs md:text-sm"
                data-testid="button-stop-bot"
              >
                <Square className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Stop Bot
              </Button>
            )}

            {!bot.isLiveMode && (
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                variant="outline"
                className="w-full border-slate-600 h-9 md:h-10 text-xs md:text-sm"
                data-testid="button-reset-paper"
              >
                <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Reset Paper
              </Button>
            )}

            <Button
              onClick={() => killMutation.mutate()}
              disabled={killMutation.isPending}
              variant="destructive"
              className="w-full h-9 md:h-10 text-xs md:text-sm"
              data-testid="button-emergency-stop"
            >
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Emergency
            </Button>

            {/* Bot Status - Compact on mobile */}
            <div className="pt-3 md:pt-4 border-t border-slate-700/50 space-y-2 md:space-y-3">
              <div className="flex items-center justify-between text-[10px] md:text-sm">
                <span className="text-slate-400">Exchange</span>
                <span className="text-white font-medium">{bot.exchange}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-sm">
                <span className="text-slate-400">Symbol</span>
                <span className="text-white font-medium">{bot.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-sm">
                <span className="text-slate-400">Risk</span>
                <Badge variant="outline" className="capitalize text-[9px] md:text-xs">{bot.riskProfile}</Badge>
              </div>
              <div className="flex items-center justify-between text-[10px] md:text-sm hidden sm:flex">
                <span className="text-slate-400">RSI</span>
                <span className="text-white font-medium">{bot.currentRsi?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy & AI Configuration */}
        <StrategySelector bot={bot} botId={safeBotId} />
      </div>

      {/* Market Overview */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
          <CardTitle className="text-xs md:text-sm flex items-center gap-2">
            <Coins className="h-3 w-3 md:h-4 md:w-4 text-cyan-400" />
            Market
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            {watchlist.slice(0, 6).map((symbol) => (
              <MarketCard key={symbol} symbol={symbol} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Price Chart */}
      <LiveChart botId={safeBotId} symbol={bot?.symbol || 'BTC/USDT'} />

      {/* AI Strategy Suggestions */}
      <StrategySuggestions botId={safeBotId} />

      {/* Enhanced Recent Trades */}
      <RecentTrades botId={safeBotId} />
      {/* Enhanced Activity Log */}
      <ActivityLog botId={safeBotId} />
    </div>
  );
}

function MarketCard({ symbol }: { symbol: string }) {
  const { data: ticker, isFetching } = useQuery<MarketTicker>({
    queryKey: [`/api/market/${encodeURIComponent(symbol)}/ticker`],
    refetchInterval: 5000,
  });

  const isPositive = (ticker?.change24h || 0) >= 0;
  const displaySymbol = symbol.split('/')[0];

  return (
    <div className="p-2 md:p-3 bg-slate-900/50 rounded-lg relative">
      {isFetching && (
        <div className="absolute top-1 right-1 md:top-2 md:right-2">
          <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-blue-400 animate-pulse" />
        </div>
      )}
      <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
        <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
          <span className="text-[8px] md:text-[10px] font-bold text-slate-300">{displaySymbol.slice(0, 2)}</span>
        </div>
        <span className="text-[10px] md:text-xs font-medium text-white truncate">{displaySymbol}</span>
      </div>
      <div className="text-[10px] md:text-sm font-bold text-white truncate">
        ${ticker?.price?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '---'}
      </div>
      <div className={`text-[9px] md:text-xs flex items-center gap-0.5 md:gap-1 mt-0.5 md:mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="h-2 w-2 md:h-3 md:w-3" /> : <TrendingDown className="h-2 w-2 md:h-3 md:w-3" />}
        {isPositive ? '+' : ''}{(ticker?.change24h || 0).toFixed(1)}%
      </div>
    </div>
  );
}
