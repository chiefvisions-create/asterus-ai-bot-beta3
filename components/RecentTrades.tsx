import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trade } from "@shared/schema";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BarChart3,
  Zap,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  Timer
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface RecentTradesProps {
  botId: number;
}

export function RecentTrades({ botId }: RecentTradesProps) {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'profit' | 'loss'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: trades = [], isFetching, refetch } = useQuery<Trade[]>({
    queryKey: [`/api/bot/${botId}/trades`],
    refetchInterval: 5000,
  });

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true;
    if (filter === 'buy') return trade.side === 'buy';
    if (filter === 'sell') return trade.side === 'sell';
    if (filter === 'profit') return (trade.pnl || 0) > 0;
    if (filter === 'loss') return (trade.pnl || 0) < 0;
    return true;
  });

  const displayTrades = showAll ? filteredTrades : filteredTrades.slice(0, 10);

  // Calculate stats
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winCount = trades.filter(t => (t.pnl || 0) > 0).length;
  const lossCount = trades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
  const avgTrade = trades.length > 0 ? totalPnL / trades.length : 0;
  const totalVolume = trades.reduce((acc, t) => acc + (t.price * t.amount), 0);
  const totalFees = trades.reduce((acc, t) => acc + (t.fees || 0), 0);
  const bestTrade = trades.reduce((best, t) => (t.pnl || 0) > (best?.pnl || 0) ? t : best, trades[0]);
  const worstTrade = trades.reduce((worst, t) => (t.pnl || 0) < (worst?.pnl || 0) ? t : worst, trades[0]);

  // Calculate P&L over time for mini chart
  const pnlHistory = useMemo(() => {
    let cumulative = 0;
    return trades.slice().reverse().map((t, i) => {
      cumulative += (t.pnl || 0);
      return {
        trade: i + 1,
        pnl: t.pnl || 0,
        cumulative,
        time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });
  }, [trades]);

  // Trade distribution by hour
  const hourlyDistribution = useMemo(() => {
    const hours: { [key: number]: { count: number; pnl: number } } = {};
    trades.forEach(t => {
      const hour = new Date(t.timestamp).getHours();
      if (!hours[hour]) hours[hour] = { count: 0, pnl: 0 };
      hours[hour].count++;
      hours[hour].pnl += (t.pnl || 0);
    });
    return Object.entries(hours).map(([hour, data]) => ({
      hour: `${hour}:00`,
      count: data.count,
      pnl: data.pnl
    })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [trades]);

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden" data-testid="recent-trades">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            Recent Trades
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 ml-2">
              {trades.length} trades
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isFetching && (
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-7 w-7 p-0"
              data-testid="button-refresh-trades"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Section */}
        {trades.length > 0 && (
          <div className="mt-3 space-y-3">
            {/* Primary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-slate-900/50 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {totalPnL >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-green-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500">Total P&L</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-500/10">
                    <Target className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{winRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-500">Win Rate</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-green-500/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-400">{winCount}</p>
                    <p className="text-[10px] text-slate-500">Wins</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-red-500/10">
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-400">{lossCount}</p>
                    <p className="text-[10px] text-slate-500">Losses</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className="text-xs font-medium text-white">${totalVolume.toFixed(2)}</p>
                <p className="text-[9px] text-slate-500">Total Volume</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className={`text-xs font-medium ${avgTrade >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {avgTrade >= 0 ? '+' : ''}${avgTrade.toFixed(2)}
                </p>
                <p className="text-[9px] text-slate-500">Avg Trade</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className="text-xs font-medium text-amber-400">${totalFees.toFixed(4)}</p>
                <p className="text-[9px] text-slate-500">Total Fees</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className="text-xs font-medium text-white">{trades.length}</p>
                <p className="text-[9px] text-slate-500">Total Trades</p>
              </div>
            </div>

            {/* Mini P&L Chart */}
            {pnlHistory.length > 1 && (
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> Cumulative P&L
                  </span>
                  <Badge variant="outline" className="text-[9px] h-4 border-slate-600">
                    {pnlHistory.length} trades
                  </Badge>
                </div>
                <div className="h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pnlHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={totalPnL >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={totalPnL >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="trade" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', fontSize: '10px' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cumulative']}
                      />
                      <Area type="monotone" dataKey="cumulative" stroke={totalPnL >= 0 ? "#22c55e" : "#ef4444"} fill="url(#pnlGradient)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Best/Worst Trade */}
            {bestTrade && worstTrade && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] text-green-400 font-medium">Best Trade</span>
                  </div>
                  <p className="text-sm font-bold text-green-400">+${(bestTrade.pnl || 0).toFixed(2)}</p>
                  <p className="text-[9px] text-slate-500">{bestTrade.symbol} • {formatTime(bestTrade.timestamp)}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] text-red-400 font-medium">Worst Trade</span>
                  </div>
                  <p className="text-sm font-bold text-red-400">${(worstTrade.pnl || 0).toFixed(2)}</p>
                  <p className="text-[9px] text-slate-500">{worstTrade.symbol} • {formatTime(worstTrade.timestamp)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Button
            variant={filter === 'all' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
            data-testid="filter-all-trades"
          >
            All
          </Button>
          <Button
            variant={filter === 'buy' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter('buy')}
            className={`h-7 text-xs ${filter === 'buy' ? 'bg-green-500/20' : ''}`}
            data-testid="filter-buy"
          >
            <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
            Buy
          </Button>
          <Button
            variant={filter === 'sell' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter('sell')}
            className={`h-7 text-xs ${filter === 'sell' ? 'bg-red-500/20' : ''}`}
            data-testid="filter-sell"
          >
            <ArrowDownRight className="h-3 w-3 mr-1 text-red-400" />
            Sell
          </Button>
          <Button
            variant={filter === 'profit' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter('profit')}
            className={`h-7 text-xs ${filter === 'profit' ? 'bg-green-500/20' : ''}`}
            data-testid="filter-profit"
          >
            <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
            Profit
          </Button>
          <Button
            variant={filter === 'loss' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter('loss')}
            className={`h-7 text-xs ${filter === 'loss' ? 'bg-red-500/20' : ''}`}
            data-testid="filter-loss"
          >
            <TrendingDown className="h-3 w-3 mr-1 text-red-400" />
            Loss
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No trades yet</p>
            <p className="text-xs text-slate-500 mt-1">Start the bot to begin trading</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4 overflow-x-hidden">
              <div className="space-y-2 max-w-full overflow-hidden">
                {displayTrades.map((trade) => {
                  const isProfit = (trade.pnl || 0) >= 0;
                  const isBuy = trade.side === 'buy';
                  const isExpanded = expandedId === trade.id;

                  return (
                    <div 
                      key={trade.id}
                      className={`rounded-lg border transition-all cursor-pointer hover:bg-slate-800/80 ${
                        isBuy ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                      data-testid={`trade-entry-${trade.id}`}
                    >
                      <div className="flex items-center gap-2 p-2">
                        <div className={`p-1.5 rounded ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'} shrink-0`}>
                          {isBuy ? 
                            <TrendingUp className="h-3 w-3 text-green-400" /> : 
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          }
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-white">{trade.symbol.split('/')[0]}</span>
                            <span className={`text-[9px] ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.side.toUpperCase()}
                            </span>
                            {trade.isPaperTrade && (
                              <span className="text-[8px] text-amber-400">P</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ${trade.price.toFixed(2)} × {trade.amount.toFixed(4)}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                          </p>
                          <p className="text-[9px] text-slate-500">{formatTime(trade.timestamp)}</p>
                        </div>

                        <ChevronDown className={`h-3 w-3 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-slate-700/30 overflow-hidden">
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="bg-slate-900/50 rounded p-2">
                              <p className="text-[10px] text-slate-500">Entry Price</p>
                              <p className="text-sm font-medium text-white">${trade.price.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded p-2">
                              <p className="text-[10px] text-slate-500">Amount</p>
                              <p className="text-sm font-medium text-white">{trade.amount.toFixed(6)}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded p-2">
                              <p className="text-[10px] text-slate-500">Volume</p>
                              <p className="text-sm font-medium text-white">${(trade.price * trade.amount).toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded p-2">
                              <p className="text-[10px] text-slate-500">P&L</p>
                              <p className={`text-sm font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                {isProfit ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                              </p>
                            </div>
                            {trade.fees !== undefined && trade.fees !== null && (
                              <div className="bg-slate-900/50 rounded p-2">
                                <p className="text-[10px] text-slate-500">Fees</p>
                                <p className="text-sm font-medium text-amber-400">${trade.fees.toFixed(4)}</p>
                              </div>
                            )}
                            {trade.slippage !== undefined && trade.slippage !== null && (
                              <div className="bg-slate-900/50 rounded p-2">
                                <p className="text-[10px] text-slate-500">Slippage</p>
                                <p className="text-sm font-medium text-amber-400">${trade.slippage.toFixed(4)}</p>
                              </div>
                            )}
                            {trade.executedPrice !== undefined && trade.executedPrice !== null && (
                              <div className="bg-slate-900/50 rounded p-2">
                                <p className="text-[10px] text-slate-500">Executed Price</p>
                                <p className="text-sm font-medium text-white">${trade.executedPrice.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                            <span>Trade ID: {trade.id}</span>
                            <span>{new Date(trade.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {filteredTrades.length > 10 && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-xs text-slate-400"
                  data-testid="button-show-more-trades"
                >
                  {showAll ? 'Show Less' : `Show All (${filteredTrades.length - 10} more)`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
