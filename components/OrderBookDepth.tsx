import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { Bot } from "@shared/schema";

interface OrderBookDepthProps {
  botId: number;
}

interface OrderBookData {
  bids: [number, number][];
  asks: [number, number][];
  spread: number;
  spreadPercent: number;
  imbalance: number;
  bidVolume: number;
  askVolume: number;
  midPrice: number;
}

export function OrderBookDepth({ botId }: OrderBookDepthProps) {
  const { data: bot } = useQuery<Bot>({
    queryKey: [`/api/bot/${botId}`],
  });

  const { data: orderBook, isLoading } = useQuery<OrderBookData>({
    queryKey: [`/api/bot/${botId}/orderbook`],
    refetchInterval: 3000,
    enabled: !!bot?.isLiveMode,
  });

  if (!bot?.isLiveMode) {
    return null;
  }

  if (isLoading || !orderBook || !orderBook.bids) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 bg-slate-700 rounded" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 bg-slate-700 rounded" style={{ width: `${80 - i * 10}%` }} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxVolume = Math.max(
    ...orderBook.bids.map(b => b[1]),
    ...orderBook.asks.map(a => a[1])
  );

  const imbalancePercent = orderBook.imbalance * 100;
  const isBullish = imbalancePercent > 10;
  const isBearish = imbalancePercent < -10;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50" data-testid="order-book-depth">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Order Book Depth
            <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">
              LIVE
            </Badge>
          </CardTitle>
          <Badge 
            className={`text-[9px] border-0 ${
              isBullish ? 'bg-green-500/20 text-green-400' : 
              isBearish ? 'bg-red-500/20 text-red-400' : 
              'bg-slate-500/20 text-slate-400'
            }`}
          >
            {isBullish ? 'BUY PRESSURE' : isBearish ? 'SELL PRESSURE' : 'NEUTRAL'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-[9px] text-slate-500 uppercase">Spread</p>
            <p className="text-sm font-bold text-white">${orderBook.spread.toFixed(2)}</p>
            <p className="text-[9px] text-slate-400">{orderBook.spreadPercent.toFixed(3)}%</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-[9px] text-slate-500 uppercase">Mid Price</p>
            <p className="text-sm font-bold text-white">${orderBook.midPrice.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-[9px] text-slate-500 uppercase">Imbalance</p>
            <p className={`text-sm font-bold ${imbalancePercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {imbalancePercent > 0 ? '+' : ''}{imbalancePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-red-400 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Asks (Sell)
              </span>
              <span className="text-slate-400">{orderBook.askVolume.toFixed(4)}</span>
            </div>
            {orderBook.asks.slice(0, 5).reverse().map((ask, i) => (
              <div key={`ask-${i}`} className="relative h-5">
                <div 
                  className="absolute right-0 h-full bg-red-500/20 rounded-l"
                  style={{ width: `${(ask[1] / maxVolume) * 100}%` }}
                />
                <div className="relative flex items-center justify-between px-2 h-full text-[10px]">
                  <span className="text-red-400 font-mono">${ask[0].toFixed(2)}</span>
                  <span className="text-slate-400 font-mono">{ask[1].toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-b border-slate-700/50 py-2 text-center">
            <span className="text-xs font-bold text-white">
              ${orderBook.midPrice.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-green-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Bids (Buy)
              </span>
              <span className="text-slate-400">{orderBook.bidVolume.toFixed(4)}</span>
            </div>
            {orderBook.bids.slice(0, 5).map((bid, i) => (
              <div key={`bid-${i}`} className="relative h-5">
                <div 
                  className="absolute left-0 h-full bg-green-500/20 rounded-r"
                  style={{ width: `${(bid[1] / maxVolume) * 100}%` }}
                />
                <div className="relative flex items-center justify-between px-2 h-full text-[10px]">
                  <span className="text-green-400 font-mono">${bid[0].toFixed(2)}</span>
                  <span className="text-slate-400 font-mono">{bid[1].toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-green-400">Buy Volume</span>
            <span className="text-red-400">Sell Volume</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-900">
            <div 
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${(orderBook.bidVolume / (orderBook.bidVolume + orderBook.askVolume)) * 100}%` }}
            />
            <div 
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(orderBook.askVolume / (orderBook.bidVolume + orderBook.askVolume)) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
