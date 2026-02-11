import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@shared/schema";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from "recharts";

interface LiveChartProps {
  botId: number;
  symbol: string;
}

interface PricePoint {
  time: string;
  price: number;
  timestamp: number;
}

interface MarketTicker {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export function LiveChart({ botId, symbol }: LiveChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: ticker, isFetching: tickerFetching } = useQuery<MarketTicker>({
    queryKey: [`/api/market/${encodeURIComponent(symbol)}/ticker?botId=${botId}`],
    refetchInterval: 2000,
  });

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: [`/api/bot/${botId}/trades`],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (ticker?.price) {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setPriceHistory(prev => {
        const newPoint: PricePoint = { time: timeStr, price: ticker.price, timestamp: now };
        const updated = [...prev, newPoint];
        
        const timeframeMs = {
          '1m': 60 * 1000,
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '1h': 60 * 60 * 1000
        }[timeframe];
        
        return updated.filter(p => now - p.timestamp < timeframeMs);
      });
    }
  }, [ticker?.price, timeframe]);

  const recentTrades = trades.slice(0, 10);
  const buyTrades = recentTrades.filter(t => t.side === 'buy');
  const sellTrades = recentTrades.filter(t => t.side === 'sell');

  // Calculate domain with proper padding for small prices
  const prices = priceHistory.map(p => p.price);
  const rawMin = prices.length > 0 ? Math.min(...prices) : 0;
  const rawMax = prices.length > 0 ? Math.max(...prices) : 0;
  // Add 0.5% padding, but ensure there's always a visible range
  const padding = rawMax > 0 ? rawMax * 0.005 : 0.00000001;
  const minPrice = rawMin - padding;
  const maxPrice = rawMax + padding;

  const priceChange = priceHistory.length >= 2 
    ? priceHistory[priceHistory.length - 1].price - priceHistory[0].price 
    : 0;
  const priceChangePercent = priceHistory.length >= 2 && priceHistory[0].price > 0
    ? (priceChange / priceHistory[0].price) * 100
    : 0;

  const isPositive = priceChange >= 0;

  return (
    <Card className={`bg-slate-800/50 border-slate-700/50 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`} data-testid="live-chart">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <LineChart className="h-4 w-4 text-cyan-400" />
            Live Price Chart
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 ml-2">
              {symbol}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {tickerFetching && (
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
            <div className="flex gap-1">
              {(['1m', '5m', '15m', '1h'] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="h-6 text-[10px] px-2"
                  data-testid={`timeframe-${tf}`}
                >
                  {tf}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 p-0"
              data-testid="button-fullscreen-chart"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-base font-bold text-white whitespace-nowrap">
                ${ticker?.price !== undefined 
                  ? ticker.price < 0.0001 
                    ? ticker.price.toFixed(8)
                    : ticker.price < 1 
                      ? ticker.price.toFixed(6)
                      : ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '---'}
              </span>
              <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{isPositive ? '+' : ''}{priceChange < 0.0001 ? priceChange.toFixed(10) : priceChange.toFixed(6)} ({priceChangePercent.toFixed(3)}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-slate-400">24h High</p>
              <p className="text-green-400 font-medium">
                ${ticker?.high24h !== undefined 
                  ? ticker.high24h < 0.0001 ? ticker.high24h.toFixed(8) : ticker.high24h < 1 ? ticker.high24h.toFixed(6) : ticker.high24h.toFixed(2)
                  : '---'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">24h Low</p>
              <p className="text-red-400 font-medium">
                ${ticker?.low24h !== undefined 
                  ? ticker.low24h < 0.0001 ? ticker.low24h.toFixed(8) : ticker.low24h < 1 ? ticker.low24h.toFixed(6) : ticker.low24h.toFixed(2)
                  : '---'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">24h Change</p>
              <p className={`font-medium ${(ticker?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(ticker?.change24h || 0) >= 0 ? '+' : ''}{ticker?.change24h?.toFixed(2) || '0.00'}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className={`${isFullscreen ? 'h-[calc(100vh-250px)]' : 'h-[300px]'}`}>
          {priceHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-slate-600 mx-auto mb-2 animate-spin" />
                <p className="text-sm text-slate-400">Loading price data...</p>
                <p className="text-xs text-slate-500 mt-1">Collecting live prices</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[minPrice, maxPrice]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => {
                    if (value < 0.0001) return `$${value.toFixed(8)}`;
                    if (value < 1) return `$${value.toFixed(4)}`;
                    if (value < 100) return `$${value.toFixed(2)}`;
                    return `$${value.toFixed(0)}`;
                  }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px', 
                    fontSize: '12px' 
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: isPositive ? '#22c55e' : '#ef4444' }}
                  formatter={(value: any) => {
                    const v = Number(value);
                    if (v < 0.0001) return [`$${v.toFixed(8)}`, 'Price'];
                    if (v < 1) return [`$${v.toFixed(6)}`, 'Price'];
                    return [`$${v.toFixed(2)}`, 'Price'];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="transparent"
                  fill="url(#priceGradient)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#22c55e" : "#ef4444"} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: isPositive ? "#22c55e" : "#ef4444" }}
                />
                {buyTrades.map((trade, i) => (
                  <ReferenceLine
                    key={`buy-${i}`}
                    y={trade.price}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                ))}
                {sellTrades.map((trade, i) => (
                  <ReferenceLine
                    key={`sell-${i}`}
                    y={trade.price}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-slate-400">Buy entries ({buyTrades.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-slate-400">Sell exits ({sellTrades.length})</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="h-3 w-3" />
            <span>{priceHistory.length} data points</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
