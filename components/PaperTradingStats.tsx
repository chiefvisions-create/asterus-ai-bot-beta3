import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Settings, 
  Trophy, 
  Target,
  Percent,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PaperStats {
  startingCapital: number;
  currentBalance: number;
  totalPnL: number;
  totalReturn: number;
  totalFees: number;
  totalSlippage: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  totalTrades: number;
  simulatedFeeRate: number;
  simulatedSlippageRate: number;
  startedAt: string | null;
}

export function PaperTradingStats({ botId }: { botId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [newCapital, setNewCapital] = useState("10000");
  const [feeRate, setFeeRate] = useState<number | null>(null);
  const [slippageRate, setSlippageRate] = useState<number | null>(null);

  const { data: stats, isLoading } = useQuery<PaperStats>({
    queryKey: ["/api/bot", botId, "paper", "stats"],
    queryFn: () => fetch(`/api/bot/${botId}/paper/stats`).then(r => r.json()),
    refetchInterval: 5000,
  });

  // Initialize settings from server when stats load
  const currentFeeRate = feeRate ?? (stats?.simulatedFeeRate ?? 0.001) * 100;
  const currentSlippageRate = slippageRate ?? (stats?.simulatedSlippageRate ?? 0.0005) * 100;
  const currentCapital = stats?.startingCapital?.toString() || "10000";

  const resetMutation = useMutation({
    mutationFn: async (startingCapital: number) => {
      return apiRequest("POST", `/api/bot/${botId}/paper/reset`, { startingCapital });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot"] });
      toast({ title: "Paper Trading Reset", description: "Your paper trading account has been reset." });
      setResetDialogOpen(false);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async ({ feeRate, slippageRate }: { feeRate: number; slippageRate: number }) => {
      return apiRequest("PATCH", `/api/bot/${botId}/paper/settings`, {
        simulatedFeeRate: feeRate / 100,
        simulatedSlippageRate: slippageRate / 100,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot"] });
      toast({ title: "Settings Updated", description: "Fee and slippage rates have been updated." });
      setSettingsDialogOpen(false);
    },
  });

  if (isLoading || !stats) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-700 rounded w-1/2" />
            <div className="h-8 bg-slate-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProfit = stats.totalPnL >= 0;

  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="paper-trading-stats">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Activity className="h-5 w-5" />
            Paper Trading Stats
          </div>
          <div className="flex gap-1">
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  data-testid="button-paper-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Paper Trading Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Simulated Trading Fee: {currentFeeRate.toFixed(2)}%</Label>
                    <Slider
                      value={[currentFeeRate]}
                      onValueChange={([v]) => setFeeRate(v)}
                      min={0}
                      max={1}
                      step={0.01}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500">Fee charged on each trade (maker/taker fee)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Simulated Slippage: {currentSlippageRate.toFixed(2)}%</Label>
                    <Slider
                      value={[currentSlippageRate]}
                      onValueChange={([v]) => setSlippageRate(v)}
                      min={0}
                      max={0.5}
                      step={0.01}
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-500">Maximum price slippage on order execution</p>
                  </div>
                  <Button 
                    onClick={() => settingsMutation.mutate({ feeRate: currentFeeRate, slippageRate: currentSlippageRate })}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={settingsMutation.isPending}
                    data-testid="button-save-paper-settings"
                  >
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                  data-testid="button-paper-reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Reset Paper Trading</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-slate-400 text-sm">
                    This will reset your paper trading account and clear all trade history. This action cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Starting Capital ($)</Label>
                    <Input
                      type="number"
                      value={newCapital || currentCapital}
                      onChange={(e) => setNewCapital(e.target.value)}
                      placeholder={currentCapital}
                      className="bg-slate-800 border-slate-600"
                      data-testid="input-starting-capital"
                    />
                    <p className="text-xs text-slate-500">Current: ${stats?.startingCapital?.toLocaleString()}</p>
                  </div>
                  <Button 
                    onClick={() => resetMutation.mutate(parseFloat(newCapital || currentCapital) || 10000)}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={resetMutation.isPending}
                    data-testid="button-confirm-reset"
                  >
                    Reset Paper Trading
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Balance
            </div>
            <div className="text-lg font-bold text-white">
              ${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500">
              Start: ${stats.startingCapital.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              P&L
            </div>
            <div className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}${stats.totalPnL.toFixed(2)}
            </div>
            <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{stats.totalReturn.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-900/50 rounded p-2">
            <div className="text-xs text-slate-400">Trades</div>
            <div className="text-sm font-semibold text-white">{stats.totalTrades}</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Target className="h-3 w-3" />
              Win Rate
            </div>
            <div className="text-sm font-semibold text-green-400">{stats.winRate.toFixed(1)}%</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div className="text-xs text-slate-400">Profit Factor</div>
            <div className="text-sm font-semibold text-blue-400">
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-green-400" />
              Best Trade
            </span>
            <span className="text-green-400">+${stats.bestTrade.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Worst Trade</span>
            <span className="text-red-400">${stats.worstTrade.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Total Fees
            </span>
            <span className="text-amber-400">${stats.totalFees.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Total Slippage</span>
            <span className="text-amber-400">${stats.totalSlippage.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
          <div className="flex justify-between">
            <span>Fee Rate: {(stats.simulatedFeeRate * 100).toFixed(2)}%</span>
            <span>Slippage: {(stats.simulatedSlippageRate * 100).toFixed(2)}%</span>
          </div>
          {stats.startedAt && (
            <div className="mt-1 text-center">
              Started: {new Date(stats.startedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
