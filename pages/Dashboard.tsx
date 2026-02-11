import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Activity, 
  Wallet, 
  Terminal as TerminalIcon,
  AlertTriangle,
  Lock,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Zap,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Globe,
  Brain,
  LineChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Bot, Trade, Log } from "@shared/schema";
import PriceChart from "@/components/charts/PriceChart";
import RSIChart from "@/components/charts/RSIChart";
import EquityCurve from "@/components/charts/EquityCurve";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import AssetSwitcher from "@/components/AssetSwitcher";
import TradeExplainer from "@/components/TradeExplainer";
import WalletConnect from "@/components/WalletConnect";
import { PaperTradingStats } from "@/components/PaperTradingStats";
import { AIChat } from "@/components/AIChat";
import { StatsHeader } from "@/components/StatsHeader";
import { MarketOverview } from "@/components/MarketOverview";
import { QuickActions } from "@/components/QuickActions";
import { StrategySuggestions } from "@/components/StrategySuggestions";

export default function Dashboard() {
  const botId = 1;

  const { data: bot } = useQuery<Bot>({ 
    queryKey: [`/api/bot/${botId}`] 
  });

  const { data: trades = [] } = useQuery<Trade[]>({ 
    queryKey: [`/api/bot/${botId}/trades`],
    refetchInterval: 5000 
  });

  const { data: logs = [] } = useQuery<Log[]>({ 
    queryKey: [`/api/bot/${botId}/logs`],
    refetchInterval: 2000 
  });

  const { data: ticker } = useQuery<{ price: number; change24h: number; high24h: number; low24h: number; volume24h: number }>({ 
    queryKey: [`/api/market/${encodeURIComponent(bot?.symbol || 'BTC/USDT')}/ticker?botId=${botId}`],
    refetchInterval: 10000,
    enabled: !!bot
  });

  const updateBotMutation = useMutation({
    mutationFn: async (update: Partial<Bot>) => {
      const res = await fetch(`/api/bot/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
    }
  });

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [confirmLiveOpen, setConfirmLiveOpen] = useState(false);
  const [liveConfirmText, setLiveConfirmText] = useState('');

  const handleToggleRunning = () => {
    const isRunning = !bot?.isRunning;
    updateBotMutation.mutate({ isRunning });
    toast(isRunning ? "Bot Started" : "Bot Stopped");
  };

  const handleLiveToggle = (checked: boolean) => {
    if (checked) {
      setConfirmLiveOpen(true);
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

  const saveKeys = () => {
    if (!bot) return;
    const update: any = {};
    if (bot.exchange === 'coinbase') {
      update.coinbaseApiKey = apiKey;
      update.coinbaseApiSecret = apiSecret;
    } else {
      update.krakenApiKey = apiKey;
      update.krakenApiSecret = apiSecret;
    }
    updateBotMutation.mutate(update);
    toast.success("API Keys Saved");
  };

  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winRate = trades.length > 0 ? (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100 : 0;

  if (!bot) return <div className="p-8 font-mono text-primary animate-pulse text-center mt-20">SYNCHRONIZING WITH EXCHANGE...</div>;

  return (
    <div className="min-h-screen p-4 lg:p-12 space-y-12 max-w-[1600px] mx-auto text-white">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 border-b border-white/5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-display font-black tracking-tighter text-gradient leading-none">ASTRAEUS</h1>
            <Badge variant="outline" className="h-6 font-mono text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20">V3.0</Badge>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-white/40 font-mono text-[10px] tracking-[0.4em] uppercase flex items-center gap-2">
              <Globe className="h-3 w-3" /> {bot.exchange.toUpperCase()}
            </p>
            <AssetSwitcher 
              bot={bot} 
              onSymbolChange={(symbol) => updateBotMutation.mutate({ symbol })}
              onWatchlistUpdate={(watchlist) => updateBotMutation.mutate({ watchlist })}
            />
          </div>
        </motion.div>
        
        <div className="flex items-center gap-8">
          <div className="hidden sm:flex flex-col items-end">
             <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em] mb-1">Total PnL</span>
             <span className={`text-2xl font-display font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
               {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
             </span>
          </div>
          <Button 
            onClick={handleToggleRunning}
            size="lg"
            className={`font-display h-14 px-10 tracking-[0.3em] transition-all duration-500 rounded-none border-x-4 ${bot.isRunning ? 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive hover:text-white' : 'bg-primary/10 text-primary border-primary hover:bg-primary hover:text-white glow-primary'}`}
          >
            {bot.isRunning ? <Square className="mr-3 h-4 w-4" /> : <Play className="mr-3 h-4 w-4" />}
            {bot.isRunning ? 'STOP BOT' : 'START BOT'}
          </Button>
        </div>
      </header>

      <StatsHeader bot={bot} trades={trades} ticker={ticker} />
      
      <MarketOverview watchlist={bot?.watchlist || ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <Card className="glass-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <LineChart className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-display uppercase tracking-widest text-white/60">{bot.symbol} Price Chart</span>
              </div>
              {ticker && (
                <div className="flex items-center gap-4">
                  <span className="text-xl font-display font-bold text-white">${ticker.price?.toLocaleString()}</span>
                  <span className={`text-[10px] font-mono ${(ticker.change24h || 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                    {(ticker.change24h || 0) >= 0 ? '+' : ''}{(ticker.change24h || 0).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <PriceChart symbol={bot.symbol} emaFast={bot.emaFast || 9} emaSlow={bot.emaSlow || 21} />
            <div className="mt-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-3 w-3 text-primary" />
                <span className="text-[9px] font-display uppercase tracking-widest text-white/40">RSI Momentum</span>
              </div>
              <RSIChart symbol={bot.symbol} threshold={bot.rsiThreshold || 45} />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-modern p-6">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Live Metrics</p>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-[8px] text-white/20 uppercase">Win Rate</p>
                  <p className="text-sm font-display text-primary">{winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[8px] text-white/20 uppercase">PF</p>
                  <p className="text-sm font-display text-primary">{(winRate / 100 * 2).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[8px] text-white/20 uppercase">Drawdown</p>
                  <p className="text-sm font-display text-destructive">{(bot.drawdown || 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[8px] text-white/20 uppercase">Slippage</p>
                  <p className="text-sm font-display text-white/40">{(bot.slippage || 0.15).toFixed(2)}%</p>
                </div>
              </div>
            </Card>

            <Card className="glass-modern p-6">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">AI Sentiment</p>
              <div className="flex items-center gap-4 mb-4">
                <Brain className={`h-6 w-6 ${(bot.sentimentScore || 0) > 0.3 ? 'text-primary' : (bot.sentimentScore || 0) < -0.3 ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className={`text-2xl font-display font-bold ${(bot.sentimentScore || 0) > 0.3 ? 'text-primary' : (bot.sentimentScore || 0) < -0.3 ? 'text-red-500' : 'text-yellow-500'}`}>
                  {((bot.sentimentScore || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[8px] font-mono text-white/20 uppercase">
                {(bot.sentimentScore || 0) > 0.5 ? 'STRONGLY BULLISH' : (bot.sentimentScore || 0) > 0.2 ? 'BULLISH' : (bot.sentimentScore || 0) < -0.5 ? 'STRONGLY BEARISH' : (bot.sentimentScore || 0) < -0.2 ? 'BEARISH' : 'NEUTRAL'}
              </p>
            </Card>

            <Card className="glass-modern p-6">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Strategy</p>
              <h3 className="text-lg font-display font-bold text-primary">QUANT AI</h3>
              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4 shadow-[0_0_10px_cyan]" />
              </div>
              <p className="text-[8px] font-mono text-white/20 mt-2 uppercase">Risk: {bot.riskProfile}</p>
            </Card>

            <Card className={`glass-modern p-6 border-l-4 ${bot.isLiveMode ? 'border-l-orange-500' : 'border-l-primary'}`}>
              <div className="flex justify-between items-center mb-4">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Mode</p>
                <div className={`h-2 w-2 rounded-full animate-pulse ${bot.isLiveMode ? 'bg-orange-500' : 'bg-primary'}`} />
              </div>
              <div className="flex items-end justify-between">
                <h3 className={`text-2xl font-display font-black ${bot.isLiveMode ? 'text-orange-500' : 'text-primary'}`}>{bot.isLiveMode ? 'LIVE' : 'PAPER'}</h3>
                <div className="flex items-center gap-2" onClick={() => handleLiveToggle(!bot.isLiveMode)}>
                  <Switch checked={bot.isLiveMode} className="scale-75 cursor-pointer" />
                  <span className="text-[8px] font-mono text-white/30 uppercase cursor-pointer">Live</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass-modern p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-display uppercase tracking-widest text-white/60">Equity Curve</span>
            </div>
            <EquityCurve data={bot.equityHistory && bot.equityHistory.length > 1 ? bot.equityHistory : [
              { timestamp: new Date(Date.now() - 7200000).toISOString(), balance: 10000 },
              { timestamp: new Date(Date.now() - 5400000).toISOString(), balance: 10050 },
              { timestamp: new Date(Date.now() - 3600000).toISOString(), balance: 10020 },
              { timestamp: new Date(Date.now() - 1800000).toISOString(), balance: 10085 },
              { timestamp: new Date().toISOString(), balance: 10000 + totalPnL }
            ]} />
          </Card>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="bg-transparent border-b border-white/5 w-full justify-start gap-8 rounded-none h-12 p-0">
              <TabsTrigger value="history" className="text-[10px] uppercase font-display tracking-[0.2em] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Trade Journal</TabsTrigger>
              <TabsTrigger value="api" className="text-[10px] uppercase font-display tracking-[0.2em] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">API Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="mt-8">
              <div className="rounded border border-white/5 overflow-hidden">
                <table className="w-full text-[11px] font-mono">
                  <thead className="bg-white/5 text-white/30 uppercase">
                    <tr>
                      <th className="p-4 text-left">Time / Reasoning</th>
                      <th className="p-4 text-left">Type</th>
                      <th className="p-4 text-left">Price</th>
                      <th className="p-4 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trades.map(t => (
                      <tr key={t.id} className="hover:bg-white/[0.01]">
                        <td className="p-4">
                          <div className="text-white/40">{new Date(t.timestamp).toLocaleTimeString()}</div>
                          <div className="text-[9px] text-white/10 mt-1 italic max-w-xs">{t.side === 'buy' ? t.entryReason : t.exitReason}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-[2px] font-bold text-[9px] ${t.side === 'buy' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>{t.side.toUpperCase()}</span>
                        </td>
                        <td className="p-4">${t.price.toLocaleString()}</td>
                        <td className={`p-4 text-right font-bold ${t.pnl && t.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-mono text-white/30">API Key</Label>
                  <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-white/5 border-white/10 rounded-none h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-mono text-white/30">API Secret</Label>
                  <Input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} className="bg-white/5 border-white/10 rounded-none h-12" />
                </div>
              </div>
              <Button onClick={saveKeys} className="w-full h-12 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black rounded-none uppercase text-[10px] tracking-widest font-display">Save Credentials</Button>
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <QuickActions bot={bot} botId={botId} />
          
          <StrategySuggestions botId={botId} />
          
          <AIInsightsPanel bot={bot} />
          
          {!bot?.isLiveMode && <PaperTradingStats botId={botId} />}
          
          <AIChat botId={botId} />
          
          <TradeExplainer trades={trades} botId={botId} />
          
          <WalletConnect />

          <Card className="glass-modern flex flex-col h-[350px]">
            <CardHeader className="border-b border-white/5 py-4">
              <CardTitle className="text-[10px] font-display uppercase tracking-widest flex items-center justify-between">
                <span>Activity Feed</span>
                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-ping" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4 font-mono text-[10px] space-y-4">
                {logs.slice(0, 15).map(log => (
                  <div key={log.id} className="border-l border-white/5 pl-3 pb-3">
                    <div className="flex justify-between mb-1">
                      <span className={`uppercase font-bold text-[8px] ${log.level === 'error' ? 'text-red-500' : log.level === 'success' ? 'text-primary' : log.level === 'warn' ? 'text-yellow-500' : 'text-white/20'}`}>{log.level}</span>
                      <span className="text-[7px] text-white/10">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-white/40 leading-relaxed text-[9px]">{log.message}</div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmLiveOpen} onOpenChange={setConfirmLiveOpen}>
        <DialogContent className="bg-background border-destructive/20 p-12 max-w-xl rounded-none">
          <DialogHeader className="text-center space-y-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <DialogTitle className="text-destructive font-display text-2xl uppercase tracking-widest">Enter Live Trading?</DialogTitle>
            <DialogDescription className="text-white/30 text-xs font-mono uppercase tracking-widest leading-relaxed">
              Real funds will be managed by the AI strategy. Capital risk acknowledged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-8">
            <Input value={liveConfirmText} onChange={(e) => setLiveConfirmText(e.target.value)} placeholder="Type 'confirm live'" className="bg-white/5 border-destructive/20 h-14 text-center rounded-none font-mono" />
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setConfirmLiveOpen(false)} className="flex-1 rounded-none border border-white/5 uppercase text-[10px] font-display">Abort</Button>
              <Button variant="destructive" onClick={confirmLive} disabled={liveConfirmText.toLowerCase() !== 'confirm live'} className="flex-[2] rounded-none uppercase text-[10px] font-display">Confirm Live Bridge</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
