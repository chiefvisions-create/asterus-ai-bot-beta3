import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Bot, Backtest } from "@shared/schema";
import { useBot } from "@/hooks/use-bot";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, ColorType, LineSeries, AreaSeries } from "lightweight-charts";
import { 
  Play, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  BarChart3,
  Clock,
  Percent,
  DollarSign,
  Loader2,
  GitCompare,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  Award,
  Settings2
} from "lucide-react";

function BacktestEquityCurve({ data }: { data: {time: number, value: number}[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.3)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 160,
      timeScale: { timeVisible: true, borderColor: 'rgba(255,255,255,0.1)' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#22c55e',
      topColor: 'rgba(34, 197, 94, 0.4)',
      bottomColor: 'rgba(34, 197, 94, 0.0)',
      lineWidth: 2,
    });

    const chartData = data.map(d => ({
      time: Math.floor(d.time / 1000) as any,
      value: d.value
    }));

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full" />;
}

export default function Backtester() {
  const { bot, botId } = useBot();
  const [days, setDays] = useState(7);
  const [rsiThreshold, setRsiThreshold] = useState(45);
  const [emaFast, setEmaFast] = useState(9);
  const [emaSlow, setEmaSlow] = useState(21);
  const [riskProfile, setRiskProfile] = useState("balanced");
  const [trailingStop, setTrailingStop] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const { data: backtests = [], isLoading: isLoadingHistory } = useQuery<Backtest[]>({
    queryKey: ["/api/bot", botId, "backtest"],
    enabled: !!botId,
    queryFn: async () => {
      const res = await fetch(`/api/bot/${botId}/backtest`);
      return res.json();
    }
  });

  const runBacktest = useMutation({
    mutationFn: async () => {
      if (!botId) throw new Error("Bot not loaded");
      await fetch(`/api/bot/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsiThreshold, emaFast, emaSlow, riskProfile, trailingStop })
      });
      const res = await fetch(`/api/bot/${botId}/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot", botId, "backtest"] });
    }
  });

  const latestResult = runBacktest.data || backtests[0];
  const comparedBacktests = backtests.filter(bt => compareIds.includes(bt.id));

  const toggleCompare = (id: number) => {
    setCompareIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev.slice(-1), id]
    );
  };

  // Calculate performance grade
  const getPerformanceGrade = () => {
    if (!latestResult) return { grade: '-', color: 'text-slate-400', desc: '' };
    const score = (latestResult.winRate / 20) + ((latestResult.sharpeRatio || 0) * 2) + ((latestResult.profitFactor || 1) - 1) * 3 - (latestResult.maxDrawdown / 10);
    if (score >= 8) return { grade: 'A+', color: 'text-green-400', desc: 'Excellent' };
    if (score >= 6) return { grade: 'A', color: 'text-green-400', desc: 'Very Good' };
    if (score >= 4) return { grade: 'B', color: 'text-blue-400', desc: 'Good' };
    if (score >= 2) return { grade: 'C', color: 'text-yellow-400', desc: 'Fair' };
    return { grade: 'D', color: 'text-red-400', desc: 'Needs Work' };
  };

  const perfGrade = getPerformanceGrade();

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-black tracking-tight text-white">
            Strategy Backtester
          </h1>
          <p className="text-[10px] md:text-xs lg:text-sm text-white/40 mt-1">
            Test strategies against historical data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px] md:text-xs">
            {bot?.symbol || "BTC/USDT"}
          </Badge>
          {latestResult && (
            <Badge className={`${perfGrade.color} bg-transparent border text-[10px] md:text-xs`}>
              Grade: {perfGrade.grade}
            </Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Strategy Configuration Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium text-white">Configuration</span>
            </div>

            <div className="space-y-4">
              {/* Backtest Period */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] md:text-xs text-slate-400">Period</label>
                  <span className="text-[10px] md:text-xs font-mono text-primary">{days} days</span>
                </div>
                <Slider value={[days]} onValueChange={([v]) => setDays(v)} min={1} max={30} step={1} data-testid="slider-days" />
              </div>

              {/* RSI */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] md:text-xs text-slate-400">RSI Threshold</label>
                  <span className="text-[10px] md:text-xs font-mono text-primary">{rsiThreshold}</span>
                </div>
                <Slider value={[rsiThreshold]} onValueChange={([v]) => setRsiThreshold(v)} min={20} max={50} step={1} data-testid="slider-rsi" />
              </div>

              {/* EMA */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] md:text-xs text-slate-400">EMA Fast/Slow</label>
                  <span className="text-[10px] md:text-xs font-mono text-primary">{emaFast}/{emaSlow}</span>
                </div>
                <div className="flex gap-2">
                  <Slider value={[emaFast]} onValueChange={([v]) => setEmaFast(v)} min={5} max={20} step={1} className="flex-1" data-testid="slider-ema-fast" />
                  <Slider value={[emaSlow]} onValueChange={([v]) => setEmaSlow(v)} min={15} max={50} step={1} className="flex-1" data-testid="slider-ema-slow" />
                </div>
              </div>

              {/* Risk Profile */}
              <div>
                <label className="text-[10px] md:text-xs text-slate-400 block mb-1.5">Risk Profile</label>
                <Select value={riskProfile} onValueChange={setRiskProfile}>
                  <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 h-9 text-xs" data-testid="select-risk-profile">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Safe (2%)</SelectItem>
                    <SelectItem value="balanced">Balanced (5%)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (10%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trailing Stop */}
              <div className="flex items-center justify-between py-1">
                <label className="text-[10px] md:text-xs text-slate-400">Trailing Stop</label>
                <Switch checked={trailingStop} onCheckedChange={setTrailingStop} data-testid="switch-trailing-stop" />
              </div>
            </div>

            <Button 
              onClick={() => runBacktest.mutate()}
              disabled={runBacktest.isPending}
              className="w-full mt-4 bg-primary hover:bg-primary/90 h-9 md:h-10 text-xs md:text-sm"
              data-testid="button-run-backtest"
            >
              {runBacktest.isPending ? (
                <><Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />Running...</>
              ) : (
                <><Play className="mr-2 h-3 w-3 md:h-4 md:w-4" />Run Backtest</>
              )}
            </Button>
          </Card>

          {/* History Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-white">History</span>
              </div>
              <span className="text-[9px] text-slate-500">{backtests.length} runs</span>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-6 text-slate-500 text-xs">Loading...</div>
            ) : backtests.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No backtests yet</div>
            ) : (
              <div className="space-y-1.5 max-h-48 md:max-h-64 overflow-y-auto">
                {backtests.slice(0, 10).map((bt) => (
                  <div 
                    key={bt.id} 
                    onClick={() => toggleCompare(bt.id)}
                    className={`flex items-center justify-between p-2 md:p-2.5 rounded-lg border cursor-pointer transition-all ${
                      compareIds.includes(bt.id) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                    }`}
                    data-testid={`backtest-history-${bt.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {compareIds.includes(bt.id) ? (
                        <GitCompare className="h-3 w-3 text-primary" />
                      ) : (
                        <Calendar className="h-3 w-3 text-slate-500" />
                      )}
                      <span className="text-[10px] md:text-xs text-slate-400">
                        {new Date(bt.timestamp || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500">{bt.days}d</span>
                      <span className={`text-[10px] md:text-xs font-mono font-medium ${bt.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bt.netProfit >= 0 ? '+' : ''}${bt.netProfit.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <AnimatePresence mode="wait">
            {latestResult ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Performance Summary Banner */}
                <Card className={`border p-3 md:p-4 ${
                  latestResult.netProfit >= 0 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-red-500/5 border-red-500/20'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {latestResult.netProfit >= 0 ? (
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] md:text-xs text-slate-400">Net Profit</p>
                        <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${latestResult.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {latestResult.netProfit >= 0 ? '+' : ''}${latestResult.netProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">Return</p>
                        <p className={`text-sm md:text-base font-bold ${latestResult.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {((latestResult.netProfit / 1000) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">Win Rate</p>
                        <p className="text-sm md:text-base font-bold text-white">{latestResult.winRate.toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-500">Trades</p>
                        <p className="text-sm md:text-base font-bold text-white">{latestResult.totalTrades}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-slate-500">Grade</p>
                        <p className={`text-sm md:text-base font-bold ${perfGrade.color}`}>{perfGrade.grade}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  <Card className="bg-slate-800/50 border-slate-700/50 p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
                      <span className="text-[9px] md:text-[10px] text-slate-400 uppercase">Sharpe</span>
                    </div>
                    <p className={`text-lg md:text-xl font-bold ${(latestResult.sharpeRatio || 0) > 1 ? 'text-green-400' : 'text-white'}`}>
                      {(latestResult.sharpeRatio || 0).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-slate-500">{(latestResult.sharpeRatio || 0) > 2 ? 'Excellent' : (latestResult.sharpeRatio || 0) > 1 ? 'Good' : 'Fair'}</p>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700/50 p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
                      <span className="text-[9px] md:text-[10px] text-slate-400 uppercase">Drawdown</span>
                    </div>
                    <p className="text-lg md:text-xl font-bold text-red-400">{latestResult.maxDrawdown.toFixed(1)}%</p>
                    <p className="text-[9px] text-slate-500">{latestResult.maxDrawdown < 10 ? 'Low' : latestResult.maxDrawdown < 20 ? 'Moderate' : 'High'}</p>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700/50 p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                      <span className="text-[9px] md:text-[10px] text-slate-400 uppercase">Profit Factor</span>
                    </div>
                    <p className={`text-lg md:text-xl font-bold ${(latestResult.profitFactor || 0) > 1.5 ? 'text-green-400' : 'text-white'}`}>
                      {(latestResult.profitFactor || 0).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-slate-500">{(latestResult.profitFactor || 0) > 2 ? 'Excellent' : (latestResult.profitFactor || 0) > 1.5 ? 'Good' : 'Fair'}</p>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700/50 p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
                      <span className="text-[9px] md:text-[10px] text-slate-400 uppercase">Avg Trade</span>
                    </div>
                    <p className={`text-lg md:text-xl font-bold ${(latestResult.netProfit / (latestResult.totalTrades || 1)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(latestResult.netProfit / (latestResult.totalTrades || 1)).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-slate-500">{(latestResult.totalTrades / latestResult.days).toFixed(1)} trades/day</p>
                  </Card>
                </div>

                {/* Equity Curve */}
                <Card className="bg-slate-800/50 border-slate-700/50 p-3 md:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                      <span className="text-xs md:text-sm font-medium text-white">Equity Curve</span>
                    </div>
                    <span className="text-[9px] text-slate-500">{latestResult.days} days</span>
                  </div>
                  {latestResult.equityCurve && latestResult.equityCurve.length > 0 ? (
                    <BacktestEquityCurve data={latestResult.equityCurve} />
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-slate-500 text-xs">
                      No equity data available
                    </div>
                  )}
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="analytics" className="w-full">
                  <TabsList className="bg-slate-800/50 border border-slate-700/50 w-full justify-start gap-0 rounded-lg h-9 md:h-10 p-1">
                    <TabsTrigger value="analytics" className="text-[10px] md:text-xs rounded-md flex-1 sm:flex-none px-3 data-[state=active]:bg-slate-700">
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="trades" className="text-[10px] md:text-xs rounded-md flex-1 sm:flex-none px-3 data-[state=active]:bg-slate-700">
                      Trades
                    </TabsTrigger>
                    {comparedBacktests.length > 0 && (
                      <TabsTrigger value="compare" className="text-[10px] md:text-xs rounded-md flex-1 sm:flex-none px-3 data-[state=active]:bg-slate-700">
                        Compare
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="analytics" className="mt-3 md:mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-[9px] md:text-[10px] text-slate-400 uppercase mb-1">Risk/Reward</p>
                        <p className="text-base md:text-lg font-bold text-white">
                          {(latestResult.netProfit / (latestResult.maxDrawdown || 1) / 10).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-[9px] md:text-[10px] text-slate-400 uppercase mb-1">Daily Trades</p>
                        <p className="text-base md:text-lg font-bold text-white">
                          {(latestResult.totalTrades / latestResult.days).toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 col-span-2">
                        <p className="text-[9px] md:text-[10px] text-slate-400 uppercase mb-1">Strategy</p>
                        <p className="text-[10px] md:text-xs font-mono text-slate-300">
                          RSI({latestResult.rsiThreshold || rsiThreshold}) | EMA({latestResult.emaFast || emaFast}/{latestResult.emaSlow || emaSlow}) | {(latestResult.riskProfile || riskProfile).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trades" className="mt-3 md:mt-4">
                    {latestResult.tradeLog && latestResult.tradeLog.length > 0 ? (
                      <div className="rounded-lg border border-slate-700/50 overflow-hidden max-h-48 md:max-h-64 overflow-y-auto">
                        <table className="w-full text-[10px] md:text-[11px]">
                          <thead className="bg-slate-800/50 text-slate-400 uppercase sticky top-0">
                            <tr>
                              <th className="px-2 md:px-4 py-2 text-left">Time</th>
                              <th className="px-2 md:px-4 py-2 text-left">Side</th>
                              <th className="px-2 md:px-4 py-2 text-right hidden sm:table-cell">Price</th>
                              <th className="px-2 md:px-4 py-2 text-right">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {latestResult.tradeLog.map((trade: {time: number, side: string, price: number, pnl: number}, i: number) => (
                              <tr key={i} className="border-t border-slate-700/50">
                                <td className="px-2 md:px-4 py-2 text-slate-400">{new Date(trade.time).toLocaleString()}</td>
                                <td className={`px-2 md:px-4 py-2 ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{trade.side}</td>
                                <td className="px-2 md:px-4 py-2 text-right text-slate-400 hidden sm:table-cell">${trade.price.toFixed(2)}</td>
                                <td className={`px-2 md:px-4 py-2 text-right ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {trade.pnl !== 0 ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(0)}` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No trade data available</div>
                    )}
                  </TabsContent>

                  {comparedBacktests.length > 0 && (
                    <TabsContent value="compare" className="mt-3 md:mt-4">
                      <div className="rounded-lg border border-slate-700/50 overflow-hidden overflow-x-auto">
                        <table className="w-full text-[10px] md:text-[11px] min-w-[500px]">
                          <thead className="bg-slate-800/50 text-slate-400 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">Date</th>
                              <th className="px-3 py-2 text-right">Profit</th>
                              <th className="px-3 py-2 text-right">Win %</th>
                              <th className="px-3 py-2 text-right">Sharpe</th>
                              <th className="px-3 py-2 text-right">DD</th>
                              <th className="px-3 py-2 text-left">Strategy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[latestResult, ...comparedBacktests].map((bt, i) => (
                              <tr key={bt.id || i} className="border-t border-slate-700/50">
                                <td className="px-3 py-2 text-slate-400">{new Date(bt.timestamp || '').toLocaleDateString()}</td>
                                <td className={`px-3 py-2 text-right font-medium ${bt.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {bt.netProfit >= 0 ? '+' : ''}${bt.netProfit.toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-300">{bt.winRate.toFixed(0)}%</td>
                                <td className="px-3 py-2 text-right text-slate-300">{(bt.sharpeRatio || 0).toFixed(2)}</td>
                                <td className="px-3 py-2 text-right text-red-400">{bt.maxDrawdown.toFixed(1)}%</td>
                                <td className="px-3 py-2 text-slate-500 font-mono">RSI({bt.rsiThreshold}) EMA({bt.emaFast}/{bt.emaSlow})</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 md:h-80 lg:h-96 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <BarChart3 className="h-12 w-12 md:h-16 md:w-16 mb-4 text-slate-600" />
                <p className="text-base md:text-lg font-medium text-slate-400">No Backtest Results Yet</p>
                <p className="text-xs md:text-sm mt-2 text-slate-500">Configure your strategy and run a backtest</p>
                <ChevronRight className="h-5 w-5 mt-4 text-slate-600 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
