import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Clock,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Flame
} from "lucide-react";

interface Suggestion {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "timing" | "risk" | "entry" | "exit" | "strategy";
  action: string;
  confidence: number;
}

interface StrategySuggestionsResponse {
  suggestions: Suggestion[];
  marketOutlook: string;
  riskAssessment: string;
  metrics: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    currentRsi: number;
    maxWinStreak: number;
    maxLossStreak: number;
    currentStreak: number;
    bestHours: number[];
    worstHours: number[];
  };
  modeInfo?: {
    isLiveMode: boolean;
    isLiveAnalysis: boolean;
    liveTradeCount: number;
    liveWinRate: number;
    livePnL: number;
    paperTradeCount: number;
    paperWinRate: number;
    paperPnL: number;
  };
  generatedAt: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "timing": return Clock;
    case "risk": return Shield;
    case "entry": return ArrowUpRight;
    case "exit": return ArrowDownRight;
    case "strategy": return Target;
    default: return Lightbulb;
  }
};

const categoryColors: Record<string, string> = {
  timing: "text-blue-400 bg-blue-400/10",
  risk: "text-amber-400 bg-amber-400/10",
  entry: "text-green-400 bg-green-400/10",
  exit: "text-red-400 bg-red-400/10",
  strategy: "text-purple-400 bg-purple-400/10"
};

const impactColors: Record<string, string> = {
  high: "border-red-500 text-red-400 bg-red-500/10",
  medium: "border-amber-500 text-amber-400 bg-amber-500/10",
  low: "border-green-500 text-green-400 bg-green-500/10"
};

export function StrategySuggestions({ botId }: { botId: number }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch, isError } = useQuery<StrategySuggestionsResponse>({
    queryKey: [`/api/bot/${botId}/strategy-suggestions`],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  const getOverallScore = () => {
    if (!data?.metrics) return 50;
    const { winRate, profitFactor, totalPnL } = data.metrics;
    let score = 50;
    if (winRate >= 60) score += 20;
    else if (winRate >= 50) score += 10;
    else if (winRate < 40) score -= 10;
    
    if (profitFactor >= 2) score += 20;
    else if (profitFactor >= 1.5) score += 10;
    else if (profitFactor < 1) score -= 10;
    
    if (totalPnL > 0) score += 10;
    else if (totalPnL < 0) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  const overallScore = getOverallScore();

  return (
    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50" data-testid="strategy-suggestions">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-purple-400">AI Strategy Suggestions</span>
            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 ml-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Personalized
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isFetching && (
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-7 px-2"
              data-testid="button-refresh-suggestions"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2"
              data-testid="button-toggle-suggestions"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
                <span className="text-sm text-slate-400">Analyzing your trading patterns...</span>
              </div>
              <Skeleton className="h-4 w-full bg-slate-700" />
              <Skeleton className="h-4 w-3/4 bg-slate-700" />
              <Skeleton className="h-20 w-full bg-slate-700" />
            </div>
          ) : isError ? (
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Unable to load suggestions</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
                data-testid="button-retry-suggestions"
              >
                Try Again
              </Button>
            </div>
          ) : data ? (
            <>
              {/* Mode Indicator */}
              {data.modeInfo && (
                <div className={`rounded-lg p-3 border ${data.modeInfo.isLiveMode ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${data.modeInfo.isLiveMode ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span className={`text-sm font-medium ${data.modeInfo.isLiveMode ? 'text-green-400' : 'text-amber-400'}`}>
                        {data.modeInfo.isLiveMode ? 'LIVE MODE' : 'PAPER MODE'}
                      </span>
                      <Badge variant="outline" className={`text-[9px] ${data.modeInfo.isLiveAnalysis ? 'border-green-500/30 text-green-400' : 'border-slate-500/30 text-slate-400'}`}>
                        {data.modeInfo.isLiveAnalysis ? 'Analyzing Live Trades' : 'Analyzing All Trades'}
                      </Badge>
                    </div>
                    {data.modeInfo.isLiveMode && (
                      <span className="text-[10px] text-green-400">Real money at risk</span>
                    )}
                  </div>
                  
                  {/* Live vs Paper Comparison */}
                  {(data.modeInfo.liveTradeCount > 0 || data.modeInfo.paperTradeCount > 0) && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="bg-slate-900/50 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          <span className="text-[10px] text-slate-400">Live Trades</span>
                        </div>
                        <p className="text-xs font-medium text-white">{data.modeInfo.liveTradeCount} trades</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">WR: {data.modeInfo.liveWinRate.toFixed(1)}%</span>
                          <span className={`text-[10px] ${data.modeInfo.livePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {data.modeInfo.livePnL >= 0 ? '+' : ''}${data.modeInfo.livePnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span className="text-[10px] text-slate-400">Paper Trades</span>
                        </div>
                        <p className="text-xs font-medium text-white">{data.modeInfo.paperTradeCount} trades</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">WR: {data.modeInfo.paperWinRate.toFixed(1)}%</span>
                          <span className={`text-[10px] ${data.modeInfo.paperPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {data.modeInfo.paperPnL >= 0 ? '+' : ''}${data.modeInfo.paperPnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Strategy Score */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Strategy Effectiveness</span>
                  <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}/100
                  </span>
                </div>
                <Progress 
                  value={overallScore} 
                  className="h-2 bg-slate-700"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${getScoreColor(overallScore)}`}>
                    {getScoreLabel(overallScore)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(data.generatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Market Outlook & Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-400">Market Outlook</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{data.marketOutlook}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Risk Assessment</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{data.riskAssessment}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              {data.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{data.metrics.winRate.toFixed(1)}%</p>
                    <p className="text-[9px] text-slate-500">Win Rate</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${data.metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data.metrics.totalPnL >= 0 ? '+' : ''}${data.metrics.totalPnL.toFixed(2)}
                    </p>
                    <p className="text-[9px] text-slate-500">Total P&L</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">
                      {data.metrics.profitFactor >= 999 ? '∞' : data.metrics.profitFactor.toFixed(2)}
                    </p>
                    <p className="text-[9px] text-slate-500">Profit Factor</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${data.metrics.currentStreak > 0 ? 'text-green-400' : data.metrics.currentStreak < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {data.metrics.currentStreak > 0 ? `+${data.metrics.currentStreak}` : data.metrics.currentStreak}
                    </p>
                    <p className="text-[9px] text-slate-500">Streak</p>
                  </div>
                </div>
              )}

              {/* Best/Worst Hours & Streaks */}
              {data.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {data.metrics.bestHours.length > 0 && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                        <span className="text-[10px] text-green-400">Best Hours</span>
                      </div>
                      <p className="text-xs font-medium text-green-400">
                        {data.metrics.bestHours.map(formatHour).join(', ')}
                      </p>
                    </div>
                  )}
                  {data.metrics.worstHours.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="text-[10px] text-red-400">Avoid Hours</span>
                      </div>
                      <p className="text-xs font-medium text-red-400">
                        {data.metrics.worstHours.map(formatHour).join(', ')}
                      </p>
                    </div>
                  )}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Trophy className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] text-slate-400">Max Win Streak</span>
                    </div>
                    <p className="text-xs font-medium text-green-400">{data.metrics.maxWinStreak}</p>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Flame className="h-3 w-3 text-red-400" />
                      <span className="text-[10px] text-slate-400">Max Loss Streak</span>
                    </div>
                    <p className="text-xs font-medium text-red-400">{data.metrics.maxLossStreak}</p>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-3 w-3 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">
                    Recommendations ({data.suggestions.length})
                  </span>
                </div>
                
                {data.suggestions.map((suggestion, index) => {
                  const CategoryIcon = getCategoryIcon(suggestion.category);
                  const isExpanded = expandedSuggestion === index;
                  const catColor = categoryColors[suggestion.category] || "text-slate-400 bg-slate-400/10";
                  const impColor = impactColors[suggestion.impact] || "border-slate-500 text-slate-400";
                  
                  return (
                    <div 
                      key={index}
                      className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
                      data-testid={`suggestion-card-${index}`}
                    >
                      <button
                        onClick={() => setExpandedSuggestion(isExpanded ? null : index)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                        data-testid={`button-expand-suggestion-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${catColor}`}>
                            <CategoryIcon className="h-3 w-3" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-medium text-white">
                              {suggestion.title}
                            </span>
                            {!isExpanded && (
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {suggestion.description.slice(0, 60)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] ${impColor}`}
                          >
                            {suggestion.impact}
                          </Badge>
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] text-slate-500">Confidence</p>
                            <p className="text-xs font-medium text-white">{(suggestion.confidence * 100).toFixed(0)}%</p>
                          </div>
                          <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {suggestion.description}
                          </p>
                          <div className="bg-slate-900/50 rounded p-2.5 border border-cyan-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                              <span className="text-[10px] text-cyan-400 font-medium uppercase">Recommended Action</span>
                            </div>
                            <p className="text-xs text-cyan-300">
                              {suggestion.action}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 mb-1">Confidence Level</p>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={suggestion.confidence * 100} 
                                className="h-1.5 flex-1"
                              />
                              <span className="text-xs text-slate-400">{(suggestion.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-700/50">
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI-generated based on {data.metrics?.totalTrades || 0} trades
                </span>
                <span>
                  Updated: {new Date(data.generatedAt).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <BarChart3 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No suggestions available</p>
              <p className="text-xs text-slate-500 mt-1">Start trading to receive personalized recommendations</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
