import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bot as BotType } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  FileText,
  AlertTriangle,
  Shield,
  DollarSign,
  TrendingUp,
  CheckCircle2
} from "lucide-react";

interface TradingModeToggleProps {
  botId: number;
}

export function TradingModeToggle({ botId }: TradingModeToggleProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const { data: bot } = useQuery<BotType>({
    queryKey: [`/api/bot/${botId}`],
  });

  const updateModeMutation = useMutation({
    mutationFn: async (isLiveMode: boolean) => {
      return apiRequest("PATCH", `/api/bot/${botId}`, { isLiveMode });
    },
    onSuccess: (_, isLiveMode) => {
      // Invalidate bot data and account balance to refetch with new mode
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}/account/balance`] });
      toast({
        title: isLiveMode ? "Live Trading Enabled" : "Paper Trading Enabled",
        description: isLiveMode 
          ? "Fetching your real account balance from exchange..." 
          : "Trading with simulated funds",
        variant: isLiveMode ? "destructive" : "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to change trading mode",
        variant: "destructive",
      });
    },
  });

  const isLiveMode = bot?.isLiveMode || false;

  const handleToggle = () => {
    if (!isLiveMode) {
      // Switching to live mode - show confirmation
      setShowConfirmDialog(true);
    } else {
      // Switching to paper mode - no confirmation needed
      updateModeMutation.mutate(false);
    }
  };

  const confirmLiveMode = () => {
    updateModeMutation.mutate(true);
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card className={`border-2 transition-all ${
        isLiveMode 
          ? 'bg-red-500/10 border-red-500/50' 
          : 'bg-green-500/10 border-green-500/50'
      }`} data-testid="trading-mode-toggle">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLiveMode ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                {isLiveMode ? (
                  <Zap className="h-5 w-5 text-red-400" />
                ) : (
                  <FileText className="h-5 w-5 text-green-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Trading Mode</span>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] ${
                      isLiveMode 
                        ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                        : 'border-green-500/50 text-green-400 bg-green-500/10'
                    }`}
                  >
                    {isLiveMode ? 'LIVE' : 'PAPER'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isLiveMode 
                    ? 'Using real funds on connected exchange' 
                    : 'Simulated trading with virtual funds'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className={`${!isLiveMode ? 'text-green-400 font-medium' : 'text-slate-500'}`}>
                  Paper
                </span>
                <Switch
                  checked={isLiveMode}
                  onCheckedChange={handleToggle}
                  disabled={updateModeMutation.isPending}
                  className="data-[state=checked]:bg-red-500"
                  data-testid="switch-trading-mode"
                />
                <span className={`${isLiveMode ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Mode Details */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className={`p-3 rounded-lg border ${
              !isLiveMode 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-slate-800/50 border-slate-700/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">Paper Trading</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  No real money at risk
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  Simulated fees & slippage
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  Test strategies safely
                </li>
              </ul>
            </div>

            <div className={`p-3 rounded-lg border ${
              isLiveMode 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-slate-800/50 border-slate-700/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-white">Live Trading</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  Real funds at risk
                </li>
                <li className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  Actual exchange orders
                </li>
                <li className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-purple-400" />
                  Requires API keys
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Mode Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-slate-900 border-red-500/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Enable Live Trading?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-slate-300">
                You are about to enable <span className="text-red-400 font-semibold">LIVE TRADING</span> mode. 
                This means the bot will execute real trades using actual funds from your connected exchange account.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
                <p className="text-red-400 font-medium text-sm">Warning:</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Real money will be used for all trades</li>
                  <li>• Losses are permanent and cannot be undone</li>
                  <li>• Ensure your API keys are properly configured</li>
                  <li>• Start with small position sizes</li>
                </ul>
              </div>
              <p className="text-slate-400 text-sm">
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700">
              Stay in Paper Mode
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLiveMode}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-live-mode"
            >
              <Zap className="h-4 w-4 mr-2" />
              Enable Live Trading
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
