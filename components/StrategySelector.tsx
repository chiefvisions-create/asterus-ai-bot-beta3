import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bot } from "@shared/schema";
import { motion } from "framer-motion";
import { 
  Settings2, 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Gauge,
  Save,
  RotateCcw,
  Brain,
  Target,
  BarChart3,
  Zap,
  Clock,
  Activity,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  Cpu,
  Lightbulb,
  Eye,
  GitBranch,
  Network,
  Radar,
  Layers,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Waves,
  Flame,
  Snowflake
} from "lucide-react";

interface StrategySelectorProps {
  bot: Bot;
  botId: number;
}

interface MarketRegime {
  regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'quiet';
  confidence: number;
}

const regimeColors = {
  trending_up: { bg: 'bg-green-500/20', text: 'text-green-400', icon: TrendingUp },
  trending_down: { bg: 'bg-red-500/20', text: 'text-red-400', icon: TrendingDown },
  ranging: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Activity },
  volatile: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: Flame },
  quiet: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Snowflake },
};

const regimeLabels = {
  trending_up: 'Bullish',
  trending_down: 'Bearish',
  ranging: 'Ranging',
  volatile: 'Volatile',
  quiet: 'Quiet',
};

const aiModeDescriptions = {
  autonomous: { title: 'Autonomous', description: 'AI decides independently', icon: Cpu, color: 'text-purple-400', features: ['Auto-adjust', 'Self-optimize'] },
  assisted: { title: 'Assisted', description: 'AI recommends, you confirm', icon: Lightbulb, color: 'text-blue-400', features: ['Suggestions', 'Risk alerts'] },
  supervised: { title: 'Supervised', description: 'AI learns from you', icon: Eye, color: 'text-green-400', features: ['Pattern recog', 'Learn style'] },
  hybrid: { title: 'Hybrid', description: 'AI + human combo', icon: GitBranch, color: 'text-cyan-400', features: ['Auto small', 'Confirm large'] }
};

const learningRateOptions = [
  { value: 'conservative', label: 'Slow', multiplier: 0.5 },
  { value: 'moderate', label: 'Med', multiplier: 1.0 },
  { value: 'aggressive', label: 'Fast', multiplier: 2.0 },
  { value: 'turbo', label: 'Turbo', multiplier: 3.0 },
];

const strategyPresets = [
  { 
    id: "adaptive", 
    name: "Adaptive AI", 
    icon: Brain,
    description: "AI-driven decisions adapting to market conditions",
    color: "text-purple-400",
    settings: {
      strategyType: "adaptive",
      riskProfile: "moderate",
      rsiThreshold: 45, rsiOversold: 30, rsiOverbought: 70,
      emaFast: 9, emaSlow: 21,
      macdFast: 12, macdSlow: 26, macdSignal: 9,
      bollingerPeriod: 20, bollingerStdDev: 2,
      atrPeriod: 14, atrMultiplier: 1.5,
      minEntryScore: 4, minAiConfidence: 0.6,
      requireVolumeConfirm: true, requireTrendAlign: true,
      profitTargetPercent: 3, stopLossPercent: 2,
      useAiExitSignals: true, trailingStop: true,
      minVolatility: 0.5, maxVolatility: 10,
      tradingHoursOnly: false, avoidWeekends: false,
      aiAggressiveness: "balanced",
      useInstitutionalSignals: true, useSentimentAnalysis: true
    }
  },
  { 
    id: "scalping", 
    name: "Scalping", 
    icon: Zap,
    description: "Quick entries/exits for small frequent gains",
    color: "text-yellow-400",
    settings: {
      strategyType: "scalping",
      riskProfile: "aggressive",
      rsiThreshold: 50, rsiOversold: 35, rsiOverbought: 65,
      emaFast: 5, emaSlow: 13,
      macdFast: 8, macdSlow: 17, macdSignal: 6,
      bollingerPeriod: 10, bollingerStdDev: 1.5,
      atrPeriod: 7, atrMultiplier: 1.0,
      minEntryScore: 3, minAiConfidence: 0.5,
      requireVolumeConfirm: true, requireTrendAlign: false,
      profitTargetPercent: 1, stopLossPercent: 0.5,
      useAiExitSignals: true, trailingStop: false,
      minVolatility: 0.3, maxVolatility: 5,
      tradingHoursOnly: true, avoidWeekends: true,
      aiAggressiveness: "aggressive",
      useInstitutionalSignals: true, useSentimentAnalysis: true
    }
  },
  { 
    id: "swing", 
    name: "Swing Trading", 
    icon: TrendingUp,
    description: "Capture medium-term price swings",
    color: "text-blue-400",
    settings: {
      strategyType: "swing",
      riskProfile: "moderate",
      rsiThreshold: 40, rsiOversold: 25, rsiOverbought: 75,
      emaFast: 12, emaSlow: 26,
      macdFast: 12, macdSlow: 26, macdSignal: 9,
      bollingerPeriod: 20, bollingerStdDev: 2,
      atrPeriod: 14, atrMultiplier: 2.0,
      minEntryScore: 5, minAiConfidence: 0.7,
      requireVolumeConfirm: true, requireTrendAlign: true,
      profitTargetPercent: 5, stopLossPercent: 2.5,
      useAiExitSignals: true, trailingStop: true,
      minVolatility: 0.5, maxVolatility: 15,
      tradingHoursOnly: false, avoidWeekends: false,
      aiAggressiveness: "balanced",
      useInstitutionalSignals: true, useSentimentAnalysis: true
    }
  },
  { 
    id: "mean_reversion", 
    name: "Mean Reversion", 
    icon: ArrowUpDown,
    description: "Buy oversold, sell overbought conditions",
    color: "text-green-400",
    settings: {
      strategyType: "mean_reversion",
      riskProfile: "conservative",
      rsiThreshold: 35, rsiOversold: 25, rsiOverbought: 75,
      emaFast: 9, emaSlow: 21,
      macdFast: 12, macdSlow: 26, macdSignal: 9,
      bollingerPeriod: 20, bollingerStdDev: 2.5,
      atrPeriod: 14, atrMultiplier: 1.5,
      minEntryScore: 4, minAiConfidence: 0.65,
      requireVolumeConfirm: false, requireTrendAlign: false,
      profitTargetPercent: 2.5, stopLossPercent: 1.5,
      useAiExitSignals: true, trailingStop: false,
      minVolatility: 0.8, maxVolatility: 8,
      tradingHoursOnly: false, avoidWeekends: false,
      aiAggressiveness: "conservative",
      useInstitutionalSignals: true, useSentimentAnalysis: true
    }
  },
  { 
    id: "trend_following", 
    name: "Trend Following", 
    icon: Activity,
    description: "Ride strong trends with momentum",
    color: "text-cyan-400",
    settings: {
      strategyType: "trend_following",
      riskProfile: "moderate",
      rsiThreshold: 50, rsiOversold: 40, rsiOverbought: 60,
      emaFast: 12, emaSlow: 34,
      macdFast: 12, macdSlow: 26, macdSignal: 9,
      bollingerPeriod: 20, bollingerStdDev: 2,
      atrPeriod: 14, atrMultiplier: 2.5,
      minEntryScore: 5, minAiConfidence: 0.7,
      requireVolumeConfirm: true, requireTrendAlign: true,
      profitTargetPercent: 8, stopLossPercent: 3,
      useAiExitSignals: true, trailingStop: true,
      minVolatility: 1.0, maxVolatility: 20,
      tradingHoursOnly: false, avoidWeekends: false,
      aiAggressiveness: "balanced",
      useInstitutionalSignals: true, useSentimentAnalysis: true
    }
  },
];

const riskProfiles = [
  { value: "conservative", label: "Conservative", description: "Lower risk, smaller positions" },
  { value: "moderate", label: "Moderate", description: "Balanced risk/reward" },
  { value: "aggressive", label: "Aggressive", description: "Higher risk, larger positions" },
];

const riskProfileSettings = {
  conservative: {
    rsiOversold: 25, rsiOverbought: 75, rsiThreshold: 35,
    minEntryScore: 6, minAiConfidence: 0.75,
    profitTargetPercent: 2, stopLossPercent: 1,
    minVolatility: 0.3, maxVolatility: 5,
    aiAggressiveness: "conservative",
  },
  moderate: {
    rsiOversold: 30, rsiOverbought: 70, rsiThreshold: 45,
    minEntryScore: 4, minAiConfidence: 0.6,
    profitTargetPercent: 3, stopLossPercent: 2,
    minVolatility: 0.5, maxVolatility: 10,
    aiAggressiveness: "balanced",
  },
  aggressive: {
    rsiOversold: 35, rsiOverbought: 65, rsiThreshold: 50,
    minEntryScore: 3, minAiConfidence: 0.5,
    profitTargetPercent: 5, stopLossPercent: 3,
    minVolatility: 0.8, maxVolatility: 15,
    aiAggressiveness: "aggressive",
  },
};

const aiAggressivenessOptions = [
  { value: "conservative", label: "Conservative", description: "Fewer trades, higher confidence required" },
  { value: "balanced", label: "Balanced", description: "Standard AI decision making" },
  { value: "aggressive", label: "Aggressive", description: "More trades, lower thresholds" },
];

export function StrategySelector({ bot, botId }: StrategySelectorProps) {
  const { toast } = useToast();
  
  // Core Strategy
  const [strategyType, setStrategyType] = useState(bot.strategyType || "adaptive");
  const [riskProfile, setRiskProfile] = useState(bot.riskProfile || "moderate");
  
  // Technical Indicators
  const [rsiThreshold, setRsiThreshold] = useState(bot.rsiThreshold || 45);
  const [rsiOversold, setRsiOversold] = useState(bot.rsiOversold || 30);
  const [rsiOverbought, setRsiOverbought] = useState(bot.rsiOverbought || 70);
  const [emaFast, setEmaFast] = useState(bot.emaFast || 9);
  const [emaSlow, setEmaSlow] = useState(bot.emaSlow || 21);
  const [macdFast, setMacdFast] = useState(bot.macdFast || 12);
  const [macdSlow, setMacdSlow] = useState(bot.macdSlow || 26);
  const [macdSignal, setMacdSignal] = useState(bot.macdSignal || 9);
  const [bollingerPeriod, setBollingerPeriod] = useState(bot.bollingerPeriod || 20);
  const [bollingerStdDev, setBollingerStdDev] = useState(bot.bollingerStdDev || 2);
  const [atrPeriod, setAtrPeriod] = useState(bot.atrPeriod || 14);
  const [atrMultiplier, setAtrMultiplier] = useState(bot.atrMultiplier || 1.5);
  
  // Entry Rules
  const [minEntryScore, setMinEntryScore] = useState(bot.minEntryScore || 4);
  const [minAiConfidence, setMinAiConfidence] = useState(bot.minAiConfidence || 0.6);
  const [requireVolumeConfirm, setRequireVolumeConfirm] = useState(bot.requireVolumeConfirm !== false);
  const [requireTrendAlign, setRequireTrendAlign] = useState(bot.requireTrendAlign !== false);
  
  // Exit Rules
  const [profitTargetPercent, setProfitTargetPercent] = useState(bot.profitTargetPercent || 3);
  const [stopLossPercent, setStopLossPercent] = useState(bot.stopLossPercent || 2);
  const [useAiExitSignals, setUseAiExitSignals] = useState(bot.useAiExitSignals !== false);
  const [trailingStop, setTrailingStop] = useState(bot.trailingStop || false);
  
  // Market Filters
  const [minVolatility, setMinVolatility] = useState(bot.minVolatility || 0.5);
  const [maxVolatility, setMaxVolatility] = useState(bot.maxVolatility || 10);
  const [tradingHoursOnly, setTradingHoursOnly] = useState(bot.tradingHoursOnly || false);
  const [avoidWeekends, setAvoidWeekends] = useState(bot.avoidWeekends || false);
  
  // AI Settings
  const [aiAggressiveness, setAiAggressiveness] = useState(bot.aiAggressiveness || "balanced");
  const [useInstitutionalSignals, setUseInstitutionalSignals] = useState(bot.useInstitutionalSignals !== false);
  const [useSentimentAnalysis, setUseSentimentAnalysis] = useState(bot.useSentimentAnalysis !== false);
  
  // Adaptive AI Brain Settings
  const [aiMode, setAiMode] = useState<'autonomous' | 'assisted' | 'supervised' | 'hybrid'>('autonomous');
  const [learningRate, setLearningRate] = useState('moderate');
  const [technicalWeight, setTechnicalWeight] = useState(40);
  const [sentimentWeight, setSentimentWeight] = useState(30);
  const [institutionalWeight, setInstitutionalWeight] = useState(30);
  const [patternRecognition, setPatternRecognition] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [marketRegimeAdaptation, setMarketRegimeAdaptation] = useState(true);
  
  // Simulated real-time data
  const [marketRegime, setMarketRegime] = useState<MarketRegime>({ regime: 'ranging', confidence: 72 });
  const [aiConfidence, setAiConfidence] = useState(78);
  const [predictions, setPredictions] = useState([
    { symbol: 'BTC/USDT', direction: 'long' as const, confidence: 82, timeframe: '4h' },
    { symbol: 'ETH/USDT', direction: 'neutral' as const, confidence: 45, timeframe: '1h' },
    { symbol: 'SOL/USDT', direction: 'short' as const, confidence: 68, timeframe: '15m' },
  ]);
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAiConfidence(70 + Math.random() * 25);
      const regimes: MarketRegime['regime'][] = ['trending_up', 'trending_down', 'ranging', 'volatile', 'quiet'];
      if (Math.random() > 0.85) {
        setMarketRegime({ regime: regimes[Math.floor(Math.random() * regimes.length)], confidence: 60 + Math.random() * 35 });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync with bot data
  useEffect(() => {
    if (bot) {
      setStrategyType(bot.strategyType || "adaptive");
      setRiskProfile(bot.riskProfile || "moderate");
      setRsiThreshold(bot.rsiThreshold || 45);
      setRsiOversold(bot.rsiOversold || 30);
      setRsiOverbought(bot.rsiOverbought || 70);
      setEmaFast(bot.emaFast || 9);
      setEmaSlow(bot.emaSlow || 21);
      setMacdFast(bot.macdFast || 12);
      setMacdSlow(bot.macdSlow || 26);
      setMacdSignal(bot.macdSignal || 9);
      setBollingerPeriod(bot.bollingerPeriod || 20);
      setBollingerStdDev(bot.bollingerStdDev || 2);
      setAtrPeriod(bot.atrPeriod || 14);
      setAtrMultiplier(bot.atrMultiplier || 1.5);
      setMinEntryScore(bot.minEntryScore || 4);
      setMinAiConfidence(bot.minAiConfidence || 0.6);
      setRequireVolumeConfirm(bot.requireVolumeConfirm !== false);
      setRequireTrendAlign(bot.requireTrendAlign !== false);
      setProfitTargetPercent(bot.profitTargetPercent || 3);
      setStopLossPercent(bot.stopLossPercent || 2);
      setUseAiExitSignals(bot.useAiExitSignals !== false);
      setTrailingStop(bot.trailingStop || false);
      setMinVolatility(bot.minVolatility || 0.5);
      setMaxVolatility(bot.maxVolatility || 10);
      setTradingHoursOnly(bot.tradingHoursOnly || false);
      setAvoidWeekends(bot.avoidWeekends || false);
      setAiAggressiveness(bot.aiAggressiveness || "balanced");
      setUseInstitutionalSignals(bot.useInstitutionalSignals !== false);
      setUseSentimentAnalysis(bot.useSentimentAnalysis !== false);
    }
  }, [bot]);

  const updateMutation = useMutation({
    mutationFn: async (update: Partial<Bot>) => {
      return apiRequest("PATCH", `/api/bot/${botId}`, update);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      queryClient.invalidateQueries({ queryKey: ["my-bot"] });
      toast({ title: "Strategy Updated", description: "Your trading strategy has been saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update strategy", variant: "destructive" });
    },
  });

  const applyPreset = (preset: typeof strategyPresets[0]) => {
    const s = preset.settings;
    // Core Strategy
    setStrategyType(s.strategyType);
    setRiskProfile(s.riskProfile);
    // RSI Settings
    setRsiThreshold(s.rsiThreshold);
    setRsiOversold(s.rsiOversold);
    setRsiOverbought(s.rsiOverbought);
    // EMA Settings
    setEmaFast(s.emaFast);
    setEmaSlow(s.emaSlow);
    // MACD Settings
    setMacdFast(s.macdFast);
    setMacdSlow(s.macdSlow);
    setMacdSignal(s.macdSignal);
    // Bollinger Settings
    setBollingerPeriod(s.bollingerPeriod);
    setBollingerStdDev(s.bollingerStdDev);
    // ATR Settings
    setAtrPeriod(s.atrPeriod);
    setAtrMultiplier(s.atrMultiplier);
    // Entry/Exit Settings
    setMinEntryScore(s.minEntryScore);
    setMinAiConfidence(s.minAiConfidence);
    setRequireVolumeConfirm(s.requireVolumeConfirm);
    setRequireTrendAlign(s.requireTrendAlign);
    setProfitTargetPercent(s.profitTargetPercent);
    setStopLossPercent(s.stopLossPercent);
    setUseAiExitSignals(s.useAiExitSignals);
    setTrailingStop(s.trailingStop);
    // Volatility/Time Settings
    setMinVolatility(s.minVolatility);
    setMaxVolatility(s.maxVolatility);
    setTradingHoursOnly(s.tradingHoursOnly);
    setAvoidWeekends(s.avoidWeekends);
    // AI Settings
    setAiAggressiveness(s.aiAggressiveness);
    setUseInstitutionalSignals(s.useInstitutionalSignals);
    setUseSentimentAnalysis(s.useSentimentAnalysis);
    
    // Auto-save the preset settings to the backend
    updateMutation.mutate({
      strategyType: s.strategyType,
      riskProfile: s.riskProfile,
      rsiThreshold: s.rsiThreshold,
      rsiOversold: s.rsiOversold,
      rsiOverbought: s.rsiOverbought,
      emaFast: s.emaFast,
      emaSlow: s.emaSlow,
      macdFast: s.macdFast,
      macdSlow: s.macdSlow,
      macdSignal: s.macdSignal,
      bollingerPeriod: s.bollingerPeriod,
      bollingerStdDev: s.bollingerStdDev,
      atrPeriod: s.atrPeriod,
      atrMultiplier: s.atrMultiplier,
      minEntryScore: s.minEntryScore,
      minAiConfidence: s.minAiConfidence,
      requireVolumeConfirm: s.requireVolumeConfirm,
      requireTrendAlign: s.requireTrendAlign,
      profitTargetPercent: s.profitTargetPercent,
      stopLossPercent: s.stopLossPercent,
      useAiExitSignals: s.useAiExitSignals,
      trailingStop: s.trailingStop,
      minVolatility: s.minVolatility,
      maxVolatility: s.maxVolatility,
      tradingHoursOnly: s.tradingHoursOnly,
      avoidWeekends: s.avoidWeekends,
      aiAggressiveness: s.aiAggressiveness,
      useInstitutionalSignals: s.useInstitutionalSignals,
      useSentimentAnalysis: s.useSentimentAnalysis,
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      strategyType,
      riskProfile,
      rsiThreshold,
      rsiOversold,
      rsiOverbought,
      emaFast,
      emaSlow,
      macdFast,
      macdSlow,
      macdSignal,
      bollingerPeriod,
      bollingerStdDev,
      atrPeriod,
      atrMultiplier,
      minEntryScore,
      minAiConfidence,
      requireVolumeConfirm,
      requireTrendAlign,
      profitTargetPercent,
      stopLossPercent,
      useAiExitSignals,
      trailingStop,
      minVolatility,
      maxVolatility,
      tradingHoursOnly,
      avoidWeekends,
      aiAggressiveness,
      useInstitutionalSignals,
      useSentimentAnalysis,
    });
  };

  const handleReset = () => {
    setStrategyType("adaptive");
    setRiskProfile("moderate");
    setRsiThreshold(45);
    setRsiOversold(30);
    setRsiOverbought(70);
    setEmaFast(9);
    setEmaSlow(21);
    setMacdFast(12);
    setMacdSlow(26);
    setMacdSignal(9);
    setBollingerPeriod(20);
    setBollingerStdDev(2);
    setAtrPeriod(14);
    setAtrMultiplier(1.5);
    setMinEntryScore(4);
    setMinAiConfidence(0.6);
    setRequireVolumeConfirm(true);
    setRequireTrendAlign(true);
    setProfitTargetPercent(3);
    setStopLossPercent(2);
    setUseAiExitSignals(true);
    setTrailingStop(false);
    setMinVolatility(0.5);
    setMaxVolatility(10);
    setTradingHoursOnly(false);
    setAvoidWeekends(false);
    setAiAggressiveness("balanced");
    setUseInstitutionalSignals(true);
    setUseSentimentAnalysis(true);
  };

  const handleRiskProfileChange = (profile: string) => {
    setRiskProfile(profile);
    const settings = riskProfileSettings[profile as keyof typeof riskProfileSettings];
    if (settings) {
      setRsiOversold(settings.rsiOversold);
      setRsiOverbought(settings.rsiOverbought);
      setRsiThreshold(settings.rsiThreshold);
      setMinEntryScore(settings.minEntryScore);
      setMinAiConfidence(settings.minAiConfidence);
      setProfitTargetPercent(settings.profitTargetPercent);
      setStopLossPercent(settings.stopLossPercent);
      setMinVolatility(settings.minVolatility);
      setMaxVolatility(settings.maxVolatility);
      setAiAggressiveness(settings.aiAggressiveness);
      
      // Auto-save the risk profile settings
      updateMutation.mutate({
        riskProfile: profile,
        rsiOversold: settings.rsiOversold,
        rsiOverbought: settings.rsiOverbought,
        rsiThreshold: settings.rsiThreshold,
        minEntryScore: settings.minEntryScore,
        minAiConfidence: settings.minAiConfidence,
        profitTargetPercent: settings.profitTargetPercent,
        stopLossPercent: settings.stopLossPercent,
        minVolatility: settings.minVolatility,
        maxVolatility: settings.maxVolatility,
        aiAggressiveness: settings.aiAggressiveness,
      });
    }
  };

  const RegimeIcon = regimeColors[marketRegime.regime].icon;
  
  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-purple-500/30" data-testid="strategy-selector">
      <CardHeader className="pb-2 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="relative">
              <Brain className="h-4 w-4 text-purple-400" />
              <motion.div
                className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">
              Strategy & AI Brain
            </span>
            <Badge variant="outline" className="ml-1 text-[8px] border-purple-500/50 text-purple-400">ADAPTIVE</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Market Regime Badge */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${regimeColors[marketRegime.regime].bg}`}>
              <RegimeIcon className={`h-3 w-3 ${regimeColors[marketRegime.regime].text}`} />
              <span className={`text-[9px] font-medium ${regimeColors[marketRegime.regime].text}`}>{regimeLabels[marketRegime.regime]}</span>
            </div>
            {/* AI Confidence */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20">
              <Gauge className="h-3 w-3 text-purple-400" />
              <span className="text-[9px] font-medium text-purple-400">{aiConfidence.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {/* Strategy Presets */}
        <div className="space-y-1">
          <Label className="text-[10px] text-slate-400 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Presets
          </Label>
          <div className="grid grid-cols-5 gap-1">
            {strategyPresets.map((preset) => {
              const Icon = preset.icon;
              const isActive = strategyType === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`relative p-1.5 rounded border transition-all text-center ${
                    isActive 
                      ? 'bg-purple-600/20 border-purple-500' 
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                  data-testid={`preset-${preset.id}`}
                >
                  {isActive && (
                    <CheckCircle2 className="absolute top-0.5 right-0.5 h-2 w-2 text-purple-400" />
                  )}
                  <Icon className={`h-3 w-3 mx-auto mb-0.5 ${preset.color}`} />
                  <span className="text-[8px] text-white block">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue="ai-mode" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-slate-900/50 h-7">
            <TabsTrigger value="ai-mode" className="text-[9px]">AI Mode</TabsTrigger>
            <TabsTrigger value="signals" className="text-[9px]">Signals</TabsTrigger>
            <TabsTrigger value="indicators" className="text-[9px]">Tech</TabsTrigger>
            <TabsTrigger value="entry" className="text-[9px]">Entry</TabsTrigger>
            <TabsTrigger value="exit" className="text-[9px]">Exit</TabsTrigger>
            <TabsTrigger value="predict" className="text-[9px]">Pred</TabsTrigger>
          </TabsList>
          
          {/* AI Mode Tab */}
          <TabsContent value="ai-mode" className="space-y-3 mt-3">
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(aiModeDescriptions) as Array<keyof typeof aiModeDescriptions>).map((mode) => {
                const modeInfo = aiModeDescriptions[mode];
                const Icon = modeInfo.icon;
                const isActive = aiMode === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => setAiMode(mode)}
                    className={`relative p-2 rounded-lg border text-left transition-all ${
                      isActive 
                        ? 'bg-purple-600/20 border-purple-500' 
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    data-testid={`ai-mode-${mode}`}
                  >
                    {isActive && <CheckCircle2 className="absolute top-1 right-1 h-2.5 w-2.5 text-purple-400" />}
                    <Icon className={`h-3.5 w-3.5 mb-1 ${modeInfo.color}`} />
                    <div className="text-[9px] font-semibold text-white">{modeInfo.title}</div>
                    <div className="text-[7px] text-slate-400 leading-tight">{modeInfo.description}</div>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Learning Rate */}
            <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <Label className="text-[9px] text-slate-300 flex items-center gap-1 mb-2">
                <Zap className="h-2.5 w-2.5 text-yellow-400" /> Learning Speed
              </Label>
              <div className="grid grid-cols-4 gap-1">
                {learningRateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLearningRate(option.value)}
                    className={`p-1 rounded border text-center transition-all ${
                      learningRate === option.value
                        ? 'bg-yellow-600/20 border-yellow-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    data-testid={`learning-rate-${option.value}`}
                  >
                    <div className={`text-[9px] font-medium ${learningRate === option.value ? 'text-yellow-400' : 'text-white'}`}>
                      {option.label}
                    </div>
                    <div className="text-[7px] text-slate-500">{option.multiplier}x</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Feature Toggles */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-1.5 rounded bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Eye className="h-2.5 w-2.5 text-blue-400" />
                  <span className="text-[8px] text-white">Pattern</span>
                </div>
                <Switch checked={patternRecognition} onCheckedChange={setPatternRecognition} />
              </div>
              <div className="p-1.5 rounded bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5 text-yellow-400" />
                  <span className="text-[8px] text-white">Anomaly</span>
                </div>
                <Switch checked={anomalyDetection} onCheckedChange={setAnomalyDetection} />
              </div>
              <div className="p-1.5 rounded bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Waves className="h-2.5 w-2.5 text-cyan-400" />
                  <span className="text-[8px] text-white">Regime</span>
                </div>
                <Switch checked={marketRegimeAdaptation} onCheckedChange={setMarketRegimeAdaptation} />
              </div>
            </div>
          </TabsContent>
          
          {/* Signal Weights Tab */}
          <TabsContent value="signals" className="space-y-3 mt-3">
            <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <Label className="text-[9px] text-slate-300 flex items-center gap-1 mb-2">
                <Layers className="h-2.5 w-2.5 text-purple-400" /> Signal Weights
              </Label>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400">Technical</span>
                    <span className="text-[9px] font-medium text-blue-400">{technicalWeight}%</span>
                  </div>
                  <Slider value={[technicalWeight]} onValueChange={([v]) => setTechnicalWeight(v)} min={10} max={70} step={5} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400">Sentiment</span>
                    <span className="text-[9px] font-medium text-green-400">{sentimentWeight}%</span>
                  </div>
                  <Slider value={[sentimentWeight]} onValueChange={([v]) => setSentimentWeight(v)} min={0} max={50} step={5} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-400">Institutional</span>
                    <span className="text-[9px] font-medium text-purple-400">{institutionalWeight}%</span>
                  </div>
                  <Slider value={[institutionalWeight]} onValueChange={([v]) => setInstitutionalWeight(v)} min={0} max={50} step={5} />
                </div>
                <div className="h-2 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500" style={{ width: `${technicalWeight}%` }} />
                  <div className="bg-green-500" style={{ width: `${sentimentWeight}%` }} />
                  <div className="bg-purple-500" style={{ width: `${institutionalWeight}%` }} />
                  <div className="bg-slate-700 flex-1" />
                </div>
              </div>
            </div>
            
            {/* AI Feature Toggles */}
            <div className="space-y-2 p-2 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-[9px] text-slate-300">AI Features</Label>
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-[10px] text-white">Institutional Signals</span>
                  <p className="text-[8px] text-slate-400">VPIN, order flow</p>
                </div>
                <Switch checked={useInstitutionalSignals} onCheckedChange={setUseInstitutionalSignals} data-testid="switch-institutional" />
              </div>
              <div className="flex items-center justify-between py-1 border-t border-slate-700/50">
                <div>
                  <span className="text-[10px] text-white">Sentiment Analysis</span>
                  <p className="text-[8px] text-slate-400">News & social</p>
                </div>
                <Switch checked={useSentimentAnalysis} onCheckedChange={setUseSentimentAnalysis} data-testid="switch-sentiment" />
              </div>
            </div>
          </TabsContent>
          
          {/* Predictions Tab */}
          <TabsContent value="predict" className="space-y-2 mt-3">
            {predictions.map((pred, i) => (
              <motion.div
                key={pred.symbol}
                className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    pred.direction === 'long' ? 'bg-green-500/20' :
                    pred.direction === 'short' ? 'bg-red-500/20' : 'bg-slate-700/50'
                  }`}>
                    {pred.direction === 'long' ? (
                      <TrendingUp className="h-3 w-3 text-green-400" />
                    ) : pred.direction === 'short' ? (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    ) : (
                      <Activity className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-[9px] font-medium text-white">{pred.symbol}</div>
                    <div className="text-[7px] text-slate-400">{pred.timeframe}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[9px] font-bold ${
                    pred.direction === 'long' ? 'text-green-400' :
                    pred.direction === 'short' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {pred.direction.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Progress value={pred.confidence} className="w-10 h-1" />
                    <span className="text-[7px] text-slate-400">{pred.confidence}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Technical Indicators Tab */}
          <TabsContent value="indicators" className="space-y-4 mt-4">
            {/* Risk Profile */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 flex items-center gap-2">
                <Shield className="h-3 w-3" /> Risk Profile
              </Label>
              <Select value={riskProfile} onValueChange={handleRiskProfileChange}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700" data-testid="select-risk-profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {riskProfiles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span className="capitalize">{r.label}</span>
                        <span className="text-xs text-slate-400">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* RSI Settings */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300 flex items-center gap-2">
                <Gauge className="h-3 w-3 text-yellow-400" /> RSI Settings
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Oversold</span>
                    <span className="text-sm font-medium text-green-400">{rsiOversold}</span>
                  </div>
                  <Slider
                    value={[rsiOversold]}
                    onValueChange={([v]) => setRsiOversold(v)}
                    min={15}
                    max={45}
                    step={1}
                    data-testid="slider-rsi-oversold"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Overbought</span>
                    <span className="text-sm font-medium text-red-400">{rsiOverbought}</span>
                  </div>
                  <Slider
                    value={[rsiOverbought]}
                    onValueChange={([v]) => setRsiOverbought(v)}
                    min={55}
                    max={85}
                    step={1}
                    data-testid="slider-rsi-overbought"
                  />
                </div>
              </div>
            </div>

            {/* EMA Settings */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-blue-400" /> EMA Crossover
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Fast Period</span>
                    <span className="text-sm font-medium text-white">{emaFast}</span>
                  </div>
                  <Slider
                    value={[emaFast]}
                    onValueChange={([v]) => setEmaFast(v)}
                    min={3}
                    max={20}
                    step={1}
                    data-testid="slider-ema-fast"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Slow Period</span>
                    <span className="text-sm font-medium text-white">{emaSlow}</span>
                  </div>
                  <Slider
                    value={[emaSlow]}
                    onValueChange={([v]) => setEmaSlow(v)}
                    min={10}
                    max={50}
                    step={1}
                    data-testid="slider-ema-slow"
                  />
                </div>
              </div>
            </div>

            {/* MACD Settings */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300 flex items-center gap-2">
                <BarChart3 className="h-3 w-3 text-purple-400" /> MACD
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Fast</span>
                    <span className="text-xs font-medium text-white">{macdFast}</span>
                  </div>
                  <Slider
                    value={[macdFast]}
                    onValueChange={([v]) => setMacdFast(v)}
                    min={5}
                    max={20}
                    step={1}
                    data-testid="slider-macd-fast"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Slow</span>
                    <span className="text-xs font-medium text-white">{macdSlow}</span>
                  </div>
                  <Slider
                    value={[macdSlow]}
                    onValueChange={([v]) => setMacdSlow(v)}
                    min={15}
                    max={40}
                    step={1}
                    data-testid="slider-macd-slow"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Signal</span>
                    <span className="text-xs font-medium text-white">{macdSignal}</span>
                  </div>
                  <Slider
                    value={[macdSignal]}
                    onValueChange={([v]) => setMacdSignal(v)}
                    min={5}
                    max={15}
                    step={1}
                    data-testid="slider-macd-signal"
                  />
                </div>
              </div>
            </div>

            {/* ATR Settings */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300 flex items-center gap-2">
                <Activity className="h-3 w-3 text-cyan-400" /> ATR (Volatility)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Period</span>
                    <span className="text-sm font-medium text-white">{atrPeriod}</span>
                  </div>
                  <Slider
                    value={[atrPeriod]}
                    onValueChange={([v]) => setAtrPeriod(v)}
                    min={7}
                    max={28}
                    step={1}
                    data-testid="slider-atr-period"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Multiplier</span>
                    <span className="text-sm font-medium text-white">{atrMultiplier.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[atrMultiplier * 10]}
                    onValueChange={([v]) => setAtrMultiplier(v / 10)}
                    min={5}
                    max={30}
                    step={1}
                    data-testid="slider-atr-multiplier"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Entry Rules Tab */}
          <TabsContent value="entry" className="space-y-4 mt-4">
            {/* Minimum Entry Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400 flex items-center gap-2">
                  <Target className="h-3 w-3 text-green-400" /> Min Entry Score
                </Label>
                <span className="text-lg font-bold text-green-400">{minEntryScore}/10</span>
              </div>
              <Slider
                value={[minEntryScore]}
                onValueChange={([v]) => setMinEntryScore(v)}
                min={1}
                max={8}
                step={1}
                data-testid="slider-min-entry-score"
              />
              <p className="text-[10px] text-slate-500">
                Higher = fewer but higher quality trades
              </p>
            </div>

            {/* Min AI Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400 flex items-center gap-2">
                  <Brain className="h-3 w-3 text-purple-400" /> Min AI Confidence
                </Label>
                <span className="text-lg font-bold text-purple-400">{Math.round(minAiConfidence * 100)}%</span>
              </div>
              <Slider
                value={[minAiConfidence * 100]}
                onValueChange={([v]) => setMinAiConfidence(v / 100)}
                min={40}
                max={90}
                step={5}
                data-testid="slider-min-ai-confidence"
              />
              <p className="text-[10px] text-slate-500">
                AI must be this confident before entering
              </p>
            </div>

            {/* Entry Filters */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300">Entry Filters</Label>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm text-white">Volume Confirmation</span>
                  <p className="text-[10px] text-slate-400">Require volume surge for entry</p>
                </div>
                <Switch
                  checked={requireVolumeConfirm}
                  onCheckedChange={setRequireVolumeConfirm}
                  data-testid="switch-volume-confirm"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                <div>
                  <span className="text-sm text-white">Trend Alignment</span>
                  <p className="text-[10px] text-slate-400">Only trade with the trend</p>
                </div>
                <Switch
                  checked={requireTrendAlign}
                  onCheckedChange={setRequireTrendAlign}
                  data-testid="switch-trend-align"
                />
              </div>
            </div>

            {/* Volatility Filter */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Volatility Range
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Min %</span>
                    <span className="text-sm font-medium text-white">{minVolatility}%</span>
                  </div>
                  <Slider
                    value={[minVolatility * 10]}
                    onValueChange={([v]) => setMinVolatility(v / 10)}
                    min={0}
                    max={30}
                    step={1}
                    data-testid="slider-min-volatility"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Max %</span>
                    <span className="text-sm font-medium text-white">{maxVolatility}%</span>
                  </div>
                  <Slider
                    value={[maxVolatility]}
                    onValueChange={([v]) => setMaxVolatility(v)}
                    min={2}
                    max={25}
                    step={1}
                    data-testid="slider-max-volatility"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Exit Rules Tab */}
          <TabsContent value="exit" className="space-y-4 mt-4">
            {/* Profit Target */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-400" /> Profit Target
                </Label>
                <span className="text-lg font-bold text-green-400">+{profitTargetPercent}%</span>
              </div>
              <Slider
                value={[profitTargetPercent * 10]}
                onValueChange={([v]) => setProfitTargetPercent(v / 10)}
                min={5}
                max={100}
                step={5}
                data-testid="slider-profit-target"
              />
            </div>

            {/* Stop Loss */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-400" /> Stop Loss
                </Label>
                <span className="text-lg font-bold text-red-400">-{stopLossPercent}%</span>
              </div>
              <Slider
                value={[stopLossPercent * 10]}
                onValueChange={([v]) => setStopLossPercent(v / 10)}
                min={5}
                max={50}
                step={5}
                data-testid="slider-stop-loss"
              />
            </div>

            {/* Exit Toggles */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300">Exit Options</Label>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm text-white">AI Exit Signals</span>
                  <p className="text-[10px] text-slate-400">Let AI decide optimal exits</p>
                </div>
                <Switch
                  checked={useAiExitSignals}
                  onCheckedChange={setUseAiExitSignals}
                  data-testid="switch-ai-exit"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                <div>
                  <span className="text-sm text-white">Trailing Stop</span>
                  <p className="text-[10px] text-slate-400">Dynamic stop-loss follows price</p>
                </div>
                <Switch
                  checked={trailingStop}
                  onCheckedChange={setTrailingStop}
                  data-testid="switch-trailing-stop"
                />
              </div>
            </div>

            {/* Time Filters */}
            <div className="space-y-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <Label className="text-xs text-slate-300 flex items-center gap-2">
                <Clock className="h-3 w-3" /> Time Filters
              </Label>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm text-white">Peak Hours Only</span>
                  <p className="text-[10px] text-slate-400">Trade during US market hours</p>
                </div>
                <Switch
                  checked={tradingHoursOnly}
                  onCheckedChange={setTradingHoursOnly}
                  data-testid="switch-trading-hours"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-700/50">
                <div>
                  <span className="text-sm text-white">Avoid Weekends</span>
                  <p className="text-[10px] text-slate-400">Skip low-liquidity periods</p>
                </div>
                <Switch
                  checked={avoidWeekends}
                  onCheckedChange={setAvoidWeekends}
                  data-testid="switch-avoid-weekends"
                />
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-700/50">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            data-testid="button-save-strategy"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Strategy"}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-slate-600"
            data-testid="button-reset-strategy"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
