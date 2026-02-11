import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { Bot, Trade } from "@shared/schema";

interface StatsHeaderProps {
  bot: Bot;
  trades: Trade[];
  ticker?: { price: number; change24h: number; high24h: number; low24h: number; volume24h: number };
}

export function StatsHeader({ bot, trades, ticker }: StatsHeaderProps) {
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winCount = trades.filter(t => (t.pnl || 0) > 0).length;
  const lossCount = trades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
  
  const todayTrades = trades.filter(t => {
    const tradeDate = new Date(t.timestamp);
    const today = new Date();
    return tradeDate.toDateString() === today.toDateString();
  });
  const todayPnL = todayTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  
  const balance = bot.paperBalance || 10000;
  const startingCapital = bot.paperStartingCapital || 10000;
  const totalReturn = ((balance - startingCapital) / startingCapital) * 100;

  const getSignalColor = (signal: string | null) => {
    if (signal === 'long') return 'text-green-400 bg-green-400/10';
    if (signal === 'short') return 'text-red-400 bg-red-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  const getSignalIcon = (signal: string | null) => {
    if (signal === 'long') return <TrendingUp className="h-4 w-4" />;
    if (signal === 'short') return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="stats-header">
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Balance</span>
          <DollarSign className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-xl font-bold text-white">
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-xs mt-1 ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% all time
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Total P&L</span>
          {totalPnL >= 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
        </div>
        <div className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
        </div>
        <div className={`text-xs mt-1 ${todayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {todayPnL >= 0 ? '+' : ''}${todayPnL.toFixed(2)} today
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Win Rate</span>
          <Target className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-xl font-bold text-white">
          {winRate.toFixed(1)}%
        </div>
        <div className="text-xs mt-1 text-slate-400">
          {winCount}W / {lossCount}L
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">AI Signal</span>
          <Zap className="h-4 w-4 text-purple-400" />
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getSignalColor(bot.lastSignal)} border-0 font-semibold`}>
            {getSignalIcon(bot.lastSignal)}
            <span className="ml-1">{(bot.lastSignal || 'neutral').toUpperCase()}</span>
          </Badge>
        </div>
        <div className="text-xs mt-1 text-slate-400">
          {((bot.aiConfidence || 0) * 100).toFixed(0)}% confidence
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Bot Status</span>
          {bot.isRunning ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${bot.isRunning ? 'bg-green-400/10 text-green-400' : 'bg-amber-400/10 text-amber-400'} border-0`}>
            {bot.isRunning ? 'ACTIVE' : 'STOPPED'}
          </Badge>
        </div>
        <div className="text-xs mt-1 text-slate-400">
          {bot.isLiveMode ? 'Live Trading' : 'Paper Mode'}
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">{bot.symbol}</span>
          <Activity className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="text-xl font-bold text-white">
          ${ticker?.price?.toLocaleString() || '---'}
        </div>
        <div className={`text-xs mt-1 ${(ticker?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {(ticker?.change24h || 0) >= 0 ? '+' : ''}{(ticker?.change24h || 0).toFixed(2)}% 24h
        </div>
      </Card>
    </div>
  );
}
