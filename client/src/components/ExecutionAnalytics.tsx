import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gauge,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Trade, Bot } from "@shared/schema";

interface ExecutionAnalyticsProps {
  botId: number;
}

export function ExecutionAnalytics({ botId }: ExecutionAnalyticsProps) {
  const { data: bot } = useQuery<Bot>({
    queryKey: [`/api/bot/${botId}`],
  });

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: [`/api/bot/${botId}/trades`],
    refetchInterval: 5000,
  });

  if (!bot?.isLiveMode) {
    return null;
  }

  const liveTrades = trades.filter(t => !t.isPaperTrade && t.status === 'completed');
  const last20Trades = liveTrades.slice(-20);

  const totalSlippage = last20Trades.reduce((sum, t) => sum + (t.slippage || 0), 0);
  const avgSlippage = last20Trades.length > 0 ? totalSlippage / last20Trades.length : 0;
  const avgSlippagePercent = last20Trades.length > 0 
    ? last20Trades.reduce((sum, t) => {
        const expectedPrice = t.price;
        const executedPrice = t.executedPrice || t.price;
        return sum + Math.abs((executedPrice - expectedPrice) / expectedPrice) * 100;
      }, 0) / last20Trades.length
    : 0;

  const totalFees = last20Trades.reduce((sum, t) => sum + (t.fees || 0), 0);
  const avgFees = last20Trades.length > 0 ? totalFees / last20Trades.length : 0;

  const fillRate = last20Trades.length > 0 
    ? (last20Trades.filter(t => t.executedPrice).length / last20Trades.length) * 100
    : 100;

  const avgLatency = bot.latency || 0;
  
  const executionScore = Math.max(0, 100 - (avgSlippagePercent * 20) - (avgLatency > 1000 ? 10 : 0));

  const getSlippageRating = () => {
    if (avgSlippagePercent < 0.05) return { label: 'Excellent', color: 'text-green-400' };
    if (avgSlippagePercent < 0.1) return { label: 'Good', color: 'text-green-400' };
    if (avgSlippagePercent < 0.2) return { label: 'Fair', color: 'text-amber-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const slippageRating = getSlippageRating();

  return (
    <Card className="bg-slate-800/50 border-slate-700/50" data-testid="execution-analytics">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4 text-cyan-400" />
            Execution Quality
            <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400">
              LIVE
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Score:</span>
            <span className={`text-sm font-bold ${
              executionScore >= 90 ? 'text-green-400' : 
              executionScore >= 70 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {executionScore.toFixed(0)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase">Avg Slippage</span>
              <Badge variant="outline" className={`text-[8px] ${slippageRating.color} border-current`}>
                {slippageRating.label}
              </Badge>
            </div>
            <p className="text-lg font-bold text-white">{avgSlippagePercent.toFixed(3)}%</p>
            <p className="text-[10px] text-slate-400">${avgSlippage.toFixed(4)} per trade</p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase mb-2">
              <Clock className="h-3 w-3" />
              Latency
            </div>
            <p className={`text-lg font-bold ${avgLatency < 500 ? 'text-green-400' : avgLatency < 1000 ? 'text-amber-400' : 'text-red-400'}`}>
              {avgLatency}ms
            </p>
            <p className="text-[10px] text-slate-400">
              {avgLatency < 500 ? 'Fast' : avgLatency < 1000 ? 'Moderate' : 'Slow'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase mb-2">
              <CheckCircle2 className="h-3 w-3" />
              Fill Rate
            </div>
            <p className={`text-lg font-bold ${fillRate >= 95 ? 'text-green-400' : 'text-amber-400'}`}>
              {fillRate.toFixed(1)}%
            </p>
            <Progress value={fillRate} className="h-1.5 mt-2" />
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase mb-2">
              <Zap className="h-3 w-3" />
              Avg Fees
            </div>
            <p className="text-lg font-bold text-white">${avgFees.toFixed(4)}</p>
            <p className="text-[10px] text-slate-400">${totalFees.toFixed(2)} total</p>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 uppercase">Execution Breakdown</span>
            <span className="text-[10px] text-slate-400">Last {last20Trades.length} trades</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Price Improvement</span>
              <span className="text-green-400">
                {last20Trades.filter(t => 
                  t.executedPrice && t.side === 'buy' && t.executedPrice < t.price
                ).length} trades
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">At Expected Price</span>
              <span className="text-slate-300">
                {last20Trades.filter(t => 
                  t.executedPrice && Math.abs(t.executedPrice - t.price) / t.price < 0.0001
                ).length} trades
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Negative Slippage</span>
              <span className="text-red-400">
                {last20Trades.filter(t => 
                  t.executedPrice && t.side === 'buy' && t.executedPrice > t.price
                ).length} trades
              </span>
            </div>
          </div>
        </div>

        {bot.useSmartOrders && (
          <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] text-purple-400">Smart Orders Active - Using limit orders for better fills</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
