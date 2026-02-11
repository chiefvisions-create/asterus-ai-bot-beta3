import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  Activity,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Trade, Bot } from "@shared/schema";

interface LivePositionTrackerProps {
  botId: number;
}

interface MarketTicker {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

export function LivePositionTracker({ botId }: LivePositionTrackerProps) {
  const { data: bot } = useQuery<Bot>({
    queryKey: [`/api/bot/${botId}`],
    refetchInterval: 2000,
  });

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: [`/api/bot/${botId}/trades`],
    refetchInterval: 2000,
  });

  const { data: ticker } = useQuery<MarketTicker>({
    queryKey: [`/api/market/${encodeURIComponent(bot?.symbol || 'BTC/USDT')}/ticker?botId=${bot?.id}`],
    enabled: !!bot?.symbol,
    refetchInterval: 2000,
  });

  const openPosition = trades.find(t => 
    t.symbol === bot?.symbol && 
    t.status === 'completed' && 
    t.side === 'buy' &&
    !trades.some(sell => 
      sell.side === 'sell' && 
      sell.status === 'completed' && 
      new Date(sell.timestamp) > new Date(t.timestamp)
    )
  );

  if (!bot?.isLiveMode) {
    return null;
  }

  const currentPrice = ticker?.price || 0;
  const entryPrice = openPosition?.executedPrice || openPosition?.price || 0;
  const positionSize = openPosition?.amount || 0;
  const positionValue = positionSize * currentPrice;
  const entryValue = positionSize * entryPrice;
  const unrealizedPnL = positionValue - entryValue;
  const unrealizedPnLPercent = entryValue > 0 ? ((positionValue - entryValue) / entryValue) * 100 : 0;
  
  const trailingStopPrice = bot.trailingStopActive && bot.trailingHighWaterMark
    ? bot.trailingHighWaterMark * (1 - (bot.trailingStopPercent || 2) / 100)
    : null;

  const riskRewardRatio = unrealizedPnL > 0 && entryPrice > 0
    ? Math.abs(unrealizedPnL / (entryValue * 0.02))
    : 0;

  const holdingTime = openPosition
    ? Math.floor((Date.now() - new Date(openPosition.timestamp).getTime()) / 60000)
    : 0;

  return (
    <Card className={`border-slate-700/50 ${openPosition ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/50'}`} data-testid="live-position-tracker">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-green-400" />
            Live Position
            <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 animate-pulse">
              REAL-TIME
            </Badge>
          </CardTitle>
          {openPosition && (
            <Badge className="bg-green-500/20 text-green-400 border-0">
              LONG {bot.symbol?.split('/')[0]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {openPosition ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50" data-testid="position-entry-price">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <DollarSign className="h-3 w-3" />
                  Entry Price
                </div>
                <p className="text-lg font-bold text-white" data-testid="text-entry-price">
                  ${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50" data-testid="position-current-price">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <Activity className="h-3 w-3" />
                  Current Price
                </div>
                <p className={`text-lg font-bold ${currentPrice > entryPrice ? 'text-green-400' : 'text-red-400'}`} data-testid="text-current-price">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className={`rounded-lg p-4 border ${unrealizedPnL >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Unrealized P&L</span>
                {unrealizedPnL >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-bold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                  </p>
                  <p className={`text-sm ${unrealizedPnL >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    {unrealizedPnLPercent >= 0 ? '+' : ''}{unrealizedPnLPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Position Value</p>
                  <p className="text-sm font-medium text-white">${positionValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className="text-[9px] text-slate-500 uppercase">Size</p>
                <p className="text-sm font-medium text-white">{positionSize.toFixed(6)}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className="text-[9px] text-slate-500 uppercase">R:R Ratio</p>
                <p className={`text-sm font-medium ${riskRewardRatio >= 1 ? 'text-green-400' : 'text-amber-400'}`}>
                  {riskRewardRatio.toFixed(1)}:1
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                <p className="text-[9px] text-slate-500 uppercase">Holding</p>
                <p className="text-sm font-medium text-white">
                  {holdingTime < 60 ? `${holdingTime}m` : `${Math.floor(holdingTime / 60)}h ${holdingTime % 60}m`}
                </p>
              </div>
            </div>

            {trailingStopPrice && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400 uppercase font-medium">Trailing Stop Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Stop Price:</span>
                  <span className="text-sm font-bold text-amber-400">${trailingStopPrice.toFixed(2)}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                    <span>Distance to Stop</span>
                    <span>{(((currentPrice - trailingStopPrice) / currentPrice) * 100).toFixed(2)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(((currentPrice - trailingStopPrice) / currentPrice) * 100 * 10, 100)} 
                    className="h-1.5"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Target className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No Open Position</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Waiting for entry signal...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
