import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight,
  RefreshCw,
  Zap,
  Activity,
  AlertTriangle,
  TrendingUp,
  Percent,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Bot, Trade } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useBot } from "@/hooks/use-bot";

export default function Trading() {
  const { bot, botId } = useBot();
  const { data: trades = [] } = useQuery<Trade[]>({ 
    queryKey: [`/api/bot/${botId}/trades`],
    enabled: !!botId,
    refetchInterval: 5000 
  });

  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return { winRate: 0, profitFactor: 0, maxDrawdown: 0 };
    
    const sellTrades = trades.filter(t => t.side === 'sell');
    if (sellTrades.length === 0) return { winRate: 0, profitFactor: 0, maxDrawdown: 0 };

    const wins = sellTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = (wins / sellTrades.length) * 100;

    const grossProfit = sellTrades.reduce((acc, t) => acc + Math.max(0, t.pnl || 0), 0);
    const grossLoss = Math.abs(sellTrades.reduce((acc, t) => acc + Math.min(0, t.pnl || 0), 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;

    // Calculate Max Drawdown from equity history
    let maxDD = 0;
    if (bot?.equityHistory && bot.equityHistory.length > 0) {
      let peak = -Infinity;
      bot.equityHistory.forEach(h => {
        if (h.balance > peak) peak = h.balance;
        const dd = peak === 0 ? 0 : (peak - h.balance) / peak;
        if (dd > maxDD) maxDD = dd;
      });
    }

    return { winRate, profitFactor, maxDrawdown: maxDD * 100 };
  }, [trades, bot?.equityHistory]);

  const [confirmLiveOpen, setConfirmLiveOpen] = useState(false);
  const [liveConfirmText, setLiveConfirmText] = useState('');

  const updateBotMutation = useMutation({
    mutationFn: async (update: Partial<Bot>) => {
      const res = await fetch(`/api/bot/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] })
  });

  const handleLiveToggle = (checked: boolean) => {
    if (checked) {
      if (confirm("⚠️ WARNING: You are enabling LIVE TRADING. This will use real funds on your exchange account. Proceed with caution?")) {
        setConfirmLiveOpen(true);
      }
    } else {
      updateBotMutation.mutate({ isLiveMode: false });
    }
  };

  const confirmLive = () => {
    if (liveConfirmText.toLowerCase() === 'confirm live') {
      updateBotMutation.mutate({ isLiveMode: true });
      setConfirmLiveOpen(false);
      setLiveConfirmText('');
      toast.error('LIVE TRADING ACTIVE');
    }
  };

  if (!bot) return null;

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 sm:pb-12 border-b border-white/5 gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tighter text-gradient mb-2 uppercase">Live Terminal</h2>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em]">Exchange Execution Stream</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
           <div className="text-right hidden sm:block">
             <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Latency</p>
             <p className="text-xs font-display text-primary">{bot.latency || 42}ms</p>
           </div>
           <Card className={`p-3 sm:p-4 border-l-4 rounded-none h-full flex-1 sm:flex-none ${bot.isLiveMode ? 'border-l-orange-500 bg-orange-500/5' : 'border-l-primary bg-primary/5'}`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <Switch 
                  checked={bot.isLiveMode} 
                  onCheckedChange={handleLiveToggle} 
                  className="data-[state=checked]:bg-orange-500" 
                />
                <div className="flex flex-col">
                  <Label className="text-[9px] uppercase font-mono text-white/40">Mode</Label>
                  <span className={`text-[7px] font-mono uppercase ${bot.isLiveMode ? 'text-orange-500' : 'text-primary'}`}>
                    {bot.isLiveMode ? 'Live' : 'Paper'}
                  </span>
                </div>
              </div>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="lg:col-span-2 glass-modern p-0 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
             <h3 className="text-[10px] font-display uppercase tracking-widest text-white/60">Execution Journal</h3>
             <Badge variant="outline" className="text-[8px] font-mono border-white/10 uppercase tracking-tighter">Symbol: {bot.symbol}</Badge>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] sm:max-h-[600px] custom-scrollbar">
            <table className="w-full text-[10px] sm:text-[11px] font-mono min-w-[500px]">
              <thead className="bg-white/5 text-white/30 uppercase text-[9px] sm:text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="p-3 sm:p-5 text-left font-medium">Timestamp</th>
                  <th className="p-3 sm:p-5 text-left font-medium">Signal</th>
                  <th className="p-3 sm:p-5 text-left font-medium">Price</th>
                  <th className="p-3 sm:p-5 text-right font-medium">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trades.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-3 sm:p-5 text-white/40 whitespace-nowrap">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td className="p-3 sm:p-5">
                      <div className={`px-2 py-0.5 inline-block font-bold text-[9px] ${t.side === 'buy' ? 'text-primary' : 'text-red-500'}`}>
                        {t.side.toUpperCase()}
                      </div>
                      <div className="text-[8px] text-white/10 mt-1 italic max-w-[120px] sm:max-w-[150px] truncate">{t.side === 'buy' ? t.entryReason : t.exitReason}</div>
                    </td>
                    <td className="p-3 sm:p-5 text-white/80 font-bold whitespace-nowrap">${t.price.toLocaleString()}</td>
                    <td className={`p-3 sm:p-5 text-right font-bold whitespace-nowrap ${t.pnl && t.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '--'}
                    </td>
                  </tr>
                ))}
                {trades.length === 0 && (
                  <tr><td colSpan={4} className="p-16 sm:p-24 text-center text-white/10 italic font-mono uppercase tracking-[0.3em] sm:tracking-[0.5em]">Awaiting Signals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

          <div className="space-y-6 sm:space-y-8">
            <Card className="glass-modern p-6 sm:p-8 space-y-4 sm:space-y-6">
              <h3 className="text-[10px] font-display uppercase tracking-widest text-white/60">Performance Metrics</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Win Rate</span>
                  <span className={`text-xs font-mono font-bold ${stats.winRate >= 50 ? 'text-primary' : 'text-red-500'}`}>
                    {stats.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Profit Factor</span>
                  <span className={`text-xs font-mono font-bold ${stats.profitFactor >= 1.5 ? 'text-primary' : 'text-white/60'}`}>
                    {stats.profitFactor.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/30 uppercase">Max Drawdown</span>
                  <span className="text-xs font-mono font-bold text-red-400">
                    -{stats.maxDrawdown.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="glass-modern p-6 sm:p-8 space-y-4 sm:space-y-6">
              <h3 className="text-[10px] font-display uppercase tracking-widest text-white/60">Live Indicators</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-white/40">
                    <span>RSI ({bot.rsiThreshold || 45} Buy Line)</span>
                    <span className={bot.currentRsi && bot.currentRsi < (bot.rsiThreshold || 45) ? "text-primary font-bold" : ""}>
                      {(bot.currentRsi || 0).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 w-full">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${bot.currentRsi || 0}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-white/40">
                    <span>EMA Trend</span>
                    <span className={bot.currentEmaFast && bot.currentEmaSlow && bot.currentEmaFast > bot.currentEmaSlow ? "text-primary font-bold" : "text-red-500"}>
                      {bot.currentEmaFast && bot.currentEmaSlow && bot.currentEmaFast > bot.currentEmaSlow ? "BULLISH" : "BEARISH"}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5 w-full">
                    <div className={`h-full flex-1 ${bot.currentEmaFast && bot.currentEmaSlow && bot.currentEmaFast > bot.currentEmaSlow ? "bg-primary" : "bg-white/5"}`} />
                    <div className={`h-full flex-1 ${bot.currentEmaFast && bot.currentEmaSlow && bot.currentEmaFast < bot.currentEmaSlow ? "bg-red-500" : "bg-white/5"}`} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-modern p-6 sm:p-8 space-y-4 sm:space-y-6">
             <h3 className="text-[10px] font-display uppercase tracking-widest text-white/60">Node Metrics</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] text-white/20 uppercase">Slippage</p>
                  <p className="text-xs font-display text-primary">{(bot.slippage || 0.12).toFixed(2)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] text-white/20 uppercase">Fill Rate</p>
                  <p className="text-xs font-display text-primary">{(bot.fillRate || 99.8).toFixed(1)}%</p>
                </div>
             </div>
          </Card>
        </div>
      </div>

      <Dialog open={confirmLiveOpen} onOpenChange={setConfirmLiveOpen}>
        <DialogContent className="bg-[#08080a] border-destructive/30 w-[95vw] sm:max-w-xl p-6 sm:p-12 rounded-none">
          <DialogHeader className="text-center space-y-4 sm:space-y-6">
            <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive mx-auto" />
            <DialogTitle className="text-destructive font-display text-xl sm:text-2xl tracking-widest uppercase">Live Bridge Authorization</DialogTitle>
            <DialogDescription className="text-white/30 font-mono text-[9px] sm:text-[10px] leading-relaxed uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              Establishing link to live liquidity. Position sizing will follow active risk profiles. Please confirm this action carefully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-12">
            <Input 
              value={liveConfirmText} 
              onChange={(e) => setLiveConfirmText(e.target.value)} 
              placeholder="type 'confirm live'"
              className="bg-white/5 border-destructive/20 h-12 sm:h-16 text-center rounded-none font-mono uppercase text-sm sm:text-lg tracking-[0.3em] sm:tracking-[0.5em]"
            />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button variant="ghost" onClick={() => setConfirmLiveOpen(false)} className="h-12 sm:h-14 rounded-none border border-white/10 uppercase font-display text-[10px] order-2 sm:order-1">Abort</Button>
              <Button variant="destructive" onClick={confirmLive} disabled={liveConfirmText.toLowerCase() !== 'confirm live'} className="h-12 sm:h-14 rounded-none uppercase font-display text-[10px] glow-destructive order-1 sm:order-2">Authorize Link</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
