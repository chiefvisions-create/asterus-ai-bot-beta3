import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingUp, TrendingDown, Activity, BarChart3, Zap, Info, ChevronRight, Target, Shield, AlertTriangle } from 'lucide-react';
import { Trade } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

interface TradeExplanation {
  tradeId: number;
  summary: string;
  technicalFactors: {
    name: string;
    value: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
  sentimentFactors: {
    name: string;
    value: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  aiReasoning: string;
  confidence: number;
  riskAssessment: string;
  expectedOutcome: string;
}

interface TradeExplainerProps {
  trades: Trade[];
  botId: number;
}

export default function TradeExplainer({ trades, botId }: TradeExplainerProps) {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [explanation, setExplanation] = useState<TradeExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  const explainTrade = async (trade: Trade) => {
    setSelectedTrade(trade);
    setLoading(true);
    try {
      const res = await fetch(`/api/bot/${botId}/explain-trade/${trade.id}`);
      const data = await res.json();
      setExplanation(data);
    } catch (e) {
      setExplanation(null);
    }
    setLoading(false);
  };

  const recentTrades = trades.slice(0, 10);

  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'text-emerald-400';
      case 'negative': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-3 w-3" />;
      case 'negative': return <TrendingDown className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          AI Trade Explainer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No trades to explain yet</p>
                <p className="text-sm">Start the bot to see AI-powered trade explanations</p>
              </div>
            ) : (
              recentTrades.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => explainTrade(trade)}
                  data-testid={`trade-explainer-item-${trade.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        trade.side === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                      }`}>
                        {trade.side === 'buy' ? (
                          <TrendingUp className={`h-5 w-5 ${trade.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`} />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{trade.symbol}</span>
                          <Badge variant="outline" className={
                            trade.side === 'buy' ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'
                          }>
                            {trade.side.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} • {trade.amount.toFixed(6)} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trade.pnl !== null && trade.pnl !== 0 && (
                        <Badge className={trade.pnl > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                          {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  {(trade.entryReason || trade.exitReason) && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400">
                        <span className="text-purple-400">AI:</span> {trade.entryReason || trade.exitReason}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>

        <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Brain className="h-5 w-5 text-purple-400" />
                Trade Explanation
              </DialogTitle>
            </DialogHeader>
            
            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400">AI is analyzing this trade...</p>
              </div>
            ) : explanation ? (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-400 mb-2">Summary</h4>
                  <p className="text-white">{explanation.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Technical Factors
                    </h4>
                    <div className="space-y-2">
                      {(explanation.technicalFactors || []).length > 0 ? (
                        (explanation.technicalFactors || []).map((factor, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={getImpactColor(factor.impact)}>
                                {getImpactIcon(factor.impact)}
                              </span>
                              <span className="text-sm text-slate-300">{factor.name}</span>
                            </div>
                            <span className={`text-sm font-mono ${getImpactColor(factor.impact)}`}>
                              {factor.value}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No technical factors available</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Sentiment Factors
                    </h4>
                    <div className="space-y-2">
                      {(explanation.sentimentFactors || []).length > 0 ? (
                        (explanation.sentimentFactors || []).map((factor, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={getImpactColor(factor.impact)}>
                                {getImpactIcon(factor.impact)}
                              </span>
                              <span className="text-sm text-slate-300">{factor.name}</span>
                            </div>
                            <span className={`text-sm ${getImpactColor(factor.impact)}`}>
                              {factor.value}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No sentiment factors available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Reasoning
                  </h4>
                  <p className="text-sm text-slate-300">{explanation.aiReasoning}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-xs text-slate-400">Confidence</p>
                    <p className="text-lg font-bold text-white">{(explanation.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Shield className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                    <p className="text-xs text-slate-400">Risk Level</p>
                    <p className="text-lg font-bold text-white">{explanation.riskAssessment}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-amber-400" />
                    <p className="text-xs text-slate-400">Expected</p>
                    <p className="text-lg font-bold text-white">{explanation.expectedOutcome}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                <p>Could not generate explanation for this trade</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
