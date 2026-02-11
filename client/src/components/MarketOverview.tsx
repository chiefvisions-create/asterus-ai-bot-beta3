import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketTicker {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export function MarketOverview({ watchlist }: { watchlist: string[] }) {
  const symbols = watchlist.slice(0, 6);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="market-overview">
      {symbols.map((symbol) => (
        <MarketCard key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}

function MarketCard({ symbol }: { symbol: string }) {
  const { data: ticker } = useQuery<MarketTicker>({
    queryKey: [`/api/market/${encodeURIComponent(symbol)}/ticker`],
    refetchInterval: 15000,
  });

  const isPositive = (ticker?.change24h || 0) >= 0;
  const displaySymbol = symbol.split('/')[0];

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-300">{displaySymbol.slice(0, 2)}</span>
        </div>
        <span className="text-xs font-medium text-white">{displaySymbol}</span>
      </div>
      <div className="text-lg font-bold text-white">
        ${ticker?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}
      </div>
      <div className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? '+' : ''}{(ticker?.change24h || 0).toFixed(2)}%
      </div>
    </Card>
  );
}
