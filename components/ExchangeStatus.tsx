import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Zap,
  Activity,
  Shield,
  TrendingUp,
  AlertTriangle,
  Heart
} from "lucide-react";
import { Link } from "wouter";

interface ExchangeHealth {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'recovering' | 'error';
  configured: boolean;
  consecutiveFailures: number;
  lastConnected?: string;
  lastError?: string | null;
  recommendation: string;
  latencyMs?: number;
  latencyRating?: 'fast' | 'moderate' | 'slow';
  errorType?: string;
}

interface BalanceInfo {
  USD: number;
  hasBalance: boolean;
}

interface ExchangeStatusData {
  exchange: string;
  connected: boolean;
  status: 'connected' | 'not_configured' | 'error';
  message: string;
  latency?: number;
  isLiveMode: boolean;
  lastChecked?: string;
  health?: ExchangeHealth;
  balanceAvailable?: BalanceInfo;
}

interface ExchangeStatusProps {
  botId: number;
}

export function ExchangeStatus({ botId }: ExchangeStatusProps) {
  const { data: status, isLoading, refetch, isFetching } = useQuery<ExchangeStatusData>({
    queryKey: [`/api/bot/${botId}/exchange/status`],
    refetchInterval: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-700 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (!status) return 'bg-slate-500';
    if (status.connected) return 'bg-green-500';
    if (status.status === 'not_configured') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (!status) return <WifiOff className="h-5 w-5 text-slate-400" />;
    if (status.connected) return <Wifi className="h-5 w-5 text-green-400" />;
    if (status.status === 'not_configured') return <AlertCircle className="h-5 w-5 text-amber-400" />;
    return <WifiOff className="h-5 w-5 text-red-400" />;
  };

  const getHealthColor = (healthStatus: string) => {
    switch (healthStatus) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-amber-400';
      case 'poor': return 'text-red-400';
      case 'recovering': return 'text-blue-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getHealthIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'excellent': return <Heart className="h-3 w-3 text-green-400" />;
      case 'good': return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case 'fair': return <Activity className="h-3 w-3 text-amber-400" />;
      case 'poor': return <AlertTriangle className="h-3 w-3 text-red-400" />;
      case 'recovering': return <RefreshCw className="h-3 w-3 text-blue-400" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-400" />;
      default: return <Activity className="h-3 w-3 text-slate-400" />;
    }
  };

  const getLatencyScore = (latency: number) => {
    if (latency < 500) return 100;
    if (latency < 1000) return 80;
    if (latency < 2000) return 60;
    if (latency < 3000) return 40;
    if (latency < 5000) return 20;
    return 10;
  };

  return (
    <Card className={`border-slate-700/50 ${status?.connected ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/50'}`} data-testid="exchange-status">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getStatusIcon()}
            Exchange Connection
            {status?.isLiveMode && (
              <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 ml-1">
                LIVE
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 w-7 p-0"
            data-testid="button-refresh-status"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()} ${status?.connected ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-sm font-medium text-white capitalize">
                {status?.exchange || 'Unknown'}
              </p>
              <p className="text-xs text-slate-400">
                {status?.message || 'Checking connection...'}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`text-[9px] ${
              status?.connected 
                ? 'border-green-500/50 text-green-400' 
                : status?.status === 'not_configured'
                ? 'border-amber-500/50 text-amber-400'
                : 'border-red-500/50 text-red-400'
            }`}
          >
            {status?.connected ? 'CONNECTED' : status?.status === 'not_configured' ? 'NOT CONFIGURED' : 'DISCONNECTED'}
          </Badge>
        </div>

        {status?.connected && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <Clock className="h-3 w-3" />
                  Latency
                </div>
                <p className={`text-sm font-medium ${
                  (status.latency || 0) < 1000 ? 'text-green-400' : 
                  (status.latency || 0) < 3000 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {status.latency || 0}ms
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                  <Zap className="h-3 w-3" />
                  Mode
                </div>
                <p className={`text-sm font-medium ${status.isLiveMode ? 'text-green-400' : 'text-amber-400'}`}>
                  {status.isLiveMode ? 'Live' : 'Paper'}
                </p>
              </div>
              {status.balanceAvailable && (
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    Balance
                  </div>
                  <p className={`text-sm font-medium ${status.balanceAvailable.hasBalance ? 'text-green-400' : 'text-amber-400'}`}>
                    ${status.balanceAvailable.USD.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Health Status */}
            {status.health && (
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(status.health.status)}
                    <span className={`text-xs font-medium capitalize ${getHealthColor(status.health.status)}`}>
                      {status.health.status} Health
                    </span>
                  </div>
                  {status.health.consecutiveFailures > 0 && (
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400">
                      {status.health.consecutiveFailures} failures
                    </Badge>
                  )}
                </div>
                
                {/* Latency Progress Bar */}
                {status.latency !== undefined && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Connection Quality</span>
                      <span>{status.health.latencyRating || 'Unknown'}</span>
                    </div>
                    <Progress value={getLatencyScore(status.latency)} className="h-1.5" />
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  {status.health.recommendation}
                </p>
              </div>
            )}
          </>
        )}

        {/* Error State with Health Info */}
        {status?.status === 'error' && status.health && (
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs font-medium text-red-400">Connection Error</span>
            </div>
            {status.health.lastError && (
              <p className="text-[10px] text-red-300 mb-2">{status.health.lastError}</p>
            )}
            <p className="text-[10px] text-slate-400">{status.health.recommendation}</p>
          </div>
        )}

        {status?.status === 'not_configured' && (
          <Link href="/settings">
            <Button variant="outline" size="sm" className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              <Settings className="h-3 w-3 mr-2" />
              Configure API Keys
            </Button>
          </Link>
        )}

        {status?.connected && status?.isLiveMode && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-700/50">
            <Shield className="h-3 w-3 text-green-400" />
            <span className="text-[10px] text-green-400 font-medium">
              Live trading active - Connection reinforced
            </span>
          </div>
        )}

        {status?.connected && !status?.isLiveMode && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-700/50">
            <CheckCircle2 className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] text-slate-400">
              Paper mode - Switch to live for real trading
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
