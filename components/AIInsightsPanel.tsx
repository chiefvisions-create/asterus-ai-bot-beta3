import React from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Bot } from "@shared/schema";

interface AIInsightsPanelProps {
  bot: Bot;
}

export default function AIInsightsPanel({ bot }: AIInsightsPanelProps) {
  const confidence = bot.aiConfidence || 0;
  const signal = bot.lastSignal || 'HOLD';
  const sentiment = bot.sentimentScore || 0;
  
  const getSignalColor = () => {
    if (signal === 'BUY') return 'text-primary';
    if (signal === 'SELL') return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSignalIcon = () => {
    if (signal === 'BUY') return <TrendingUp className="h-6 w-6" />;
    if (signal === 'SELL') return <TrendingDown className="h-6 w-6" />;
    return <Minus className="h-6 w-6" />;
  };

  const getConfidenceLevel = () => {
    if (confidence > 0.8) return { label: 'VERY HIGH', color: 'text-primary' };
    if (confidence > 0.6) return { label: 'HIGH', color: 'text-green-400' };
    if (confidence > 0.4) return { label: 'MODERATE', color: 'text-yellow-500' };
    if (confidence > 0.2) return { label: 'LOW', color: 'text-orange-500' };
    return { label: 'UNCERTAIN', color: 'text-red-500' };
  };

  const confidenceLevel = getConfidenceLevel();

  return (
    <Card className="glass-modern p-6 border-l-4 border-l-primary/50">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-5 w-5 text-primary" />
        <span className="text-[10px] font-display uppercase tracking-widest text-white/60">AI Analysis</span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className={`flex justify-center mb-2 ${getSignalColor()}`}>
            {getSignalIcon()}
          </div>
          <p className={`text-lg font-display font-bold ${getSignalColor()}`}>{signal}</p>
          <p className="text-[8px] font-mono text-white/20 uppercase mt-1">Signal</p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="relative h-8 w-8">
              <svg className="h-8 w-8 -rotate-90">
                <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle 
                  cx="16" cy="16" r="12" fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                  strokeDasharray={`${confidence * 75.4} 75.4`}
                  className={confidenceLevel.color}
                />
              </svg>
            </div>
          </div>
          <p className={`text-lg font-display font-bold ${confidenceLevel.color}`}>{(confidence * 100).toFixed(0)}%</p>
          <p className="text-[8px] font-mono text-white/20 uppercase mt-1">Confidence</p>
        </div>

        <div className="text-center">
          <div className={`flex justify-center mb-2 ${sentiment > 0.3 ? 'text-primary' : sentiment < -0.3 ? 'text-red-500' : 'text-yellow-500'}`}>
            {sentiment > 0.3 ? <CheckCircle className="h-6 w-6" /> : sentiment < -0.3 ? <XCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
          </div>
          <p className={`text-lg font-display font-bold ${sentiment > 0.3 ? 'text-primary' : sentiment < -0.3 ? 'text-red-500' : 'text-yellow-500'}`}>
            {sentiment > 0.5 ? 'BULL' : sentiment > 0.2 ? 'MILD+' : sentiment < -0.5 ? 'BEAR' : sentiment < -0.2 ? 'MILD-' : 'FLAT'}
          </p>
          <p className="text-[8px] font-mono text-white/20 uppercase mt-1">Sentiment</p>
        </div>
      </div>

      {bot.aiReasoning && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-[9px] font-mono text-white/30 uppercase mb-2">AI Reasoning</p>
          <p className="text-[11px] text-white/50 leading-relaxed">{bot.aiReasoning}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-4">
        <div>
          <p className="text-[8px] font-mono text-white/20 uppercase mb-1">Sharpe Ratio</p>
          <p className={`text-sm font-display ${(bot.sharpeRatio || 0) >= 1 ? 'text-primary' : (bot.sharpeRatio || 0) >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
            {(bot.sharpeRatio || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-mono text-white/20 uppercase mb-1">Sortino Ratio</p>
          <p className={`text-sm font-display ${(bot.sortinoRatio || 0) >= 1 ? 'text-primary' : (bot.sortinoRatio || 0) >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
            {(bot.sortinoRatio || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-mono text-white/20 uppercase mb-1">Total Return</p>
          <p className={`text-sm font-display ${(bot.totalReturn || 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
            {(bot.totalReturn || 0) >= 0 ? '+' : ''}{(bot.totalReturn || 0).toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-[8px] font-mono text-white/20 uppercase mb-1">Avg Trade</p>
          <p className="text-sm font-display text-white/60">${(bot.avgTradeSize || 0).toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
