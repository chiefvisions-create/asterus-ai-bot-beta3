import React, { useState, useEffect } from 'react';
import { 
  Key,
  Save,
  BellRing,
  Globe,
  Shield,
  AlertTriangle,
  Zap,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Target,
  Power,
  Coins,
  Loader2,
  Check,
  Settings2,
  Brain,
  BarChart3,
  ArrowUpDown,
  Clock,
  Activity,
  Sliders
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Bot } from "@shared/schema";
import { toast } from "sonner";
import { useBot } from "@/hooks/use-bot";

export default function Settings() {
  const { bot, botId } = useBot();

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [telegramWebhook, setTelegramWebhook] = useState('');
  const [maxOrderSize, setMaxOrderSize] = useState(500);
  const [dailyLossLimit, setDailyLossLimit] = useState(100);
  const [maxDailyTrades, setMaxDailyTrades] = useState(20);
  
  // Trading Pair Selection
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  
  // Enhanced Live Trading Features
  const [useSmartOrders, setUseSmartOrders] = useState(false);
  const [smartOrderSpread, setSmartOrderSpread] = useState(0.1);
  const [dcaEnabled, setDcaEnabled] = useState(false);
  const [dcaAmount, setDcaAmount] = useState(10);
  const [dcaInterval, setDcaInterval] = useState(3600);
  const [multiAssetEnabled, setMultiAssetEnabled] = useState(false);
  const [volatilityScaling, setVolatilityScaling] = useState(true);
  const [trailingStopPercent, setTrailingStopPercent] = useState(2);
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(10);
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(false);
  
  // Visual feedback for saved settings
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null);
  
  // Strategy Configuration
  const [strategyType, setStrategyType] = useState('adaptive');
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);
  const [bollingerPeriod, setBollingerPeriod] = useState(20);
  const [bollingerStdDev, setBollingerStdDev] = useState(2);
  const [atrPeriod, setAtrPeriod] = useState(14);
  const [atrMultiplier, setAtrMultiplier] = useState(1.5);
  const [minEntryScore, setMinEntryScore] = useState(4);
  const [minAiConfidence, setMinAiConfidence] = useState(0.6);
  const [requireVolumeConfirm, setRequireVolumeConfirm] = useState(true);
  const [requireTrendAlign, setRequireTrendAlign] = useState(true);
  const [profitTargetPercent, setProfitTargetPercent] = useState(3);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [useAiExitSignals, setUseAiExitSignals] = useState(true);
  const [minVolatility, setMinVolatility] = useState(0.5);
  const [maxVolatility, setMaxVolatility] = useState(10);
  const [tradingHoursOnly, setTradingHoursOnly] = useState(false);
  const [avoidWeekends, setAvoidWeekends] = useState(false);
  const [aiAggressiveness, setAiAggressiveness] = useState('balanced');
  const [useInstitutionalSignals, setUseInstitutionalSignals] = useState(true);
  const [useSentimentAnalysis, setUseSentimentAnalysis] = useState(true);

  // Available trading pairs - expanded for live mode (45+ pairs)
  const tradingPairs = [
    // Major pairs (Top Market Cap)
    { symbol: 'BTC/USDT', name: 'Bitcoin', category: 'major' },
    { symbol: 'ETH/USDT', name: 'Ethereum', category: 'major' },
    { symbol: 'BNB/USDT', name: 'BNB', category: 'major' },
    { symbol: 'XRP/USDT', name: 'Ripple', category: 'major' },
    { symbol: 'SOL/USDT', name: 'Solana', category: 'major' },
    { symbol: 'ADA/USDT', name: 'Cardano', category: 'major' },
    { symbol: 'DOGE/USDT', name: 'Dogecoin', category: 'major' },
    { symbol: 'TRX/USDT', name: 'Tron', category: 'major' },
    { symbol: 'AVAX/USDT', name: 'Avalanche', category: 'major' },
    { symbol: 'LTC/USDT', name: 'Litecoin', category: 'major' },
    { symbol: 'BCH/USDT', name: 'Bitcoin Cash', category: 'major' },
    { symbol: 'ETC/USDT', name: 'Ethereum Classic', category: 'major' },
    { symbol: 'XLM/USDT', name: 'Stellar', category: 'major' },
    { symbol: 'XMR/USDT', name: 'Monero', category: 'major' },
    // DeFi pairs
    { symbol: 'LINK/USDT', name: 'Chainlink', category: 'defi' },
    { symbol: 'UNI/USDT', name: 'Uniswap', category: 'defi' },
    { symbol: 'AAVE/USDT', name: 'Aave', category: 'defi' },
    { symbol: 'MKR/USDT', name: 'Maker', category: 'defi' },
    { symbol: 'LDO/USDT', name: 'Lido DAO', category: 'defi' },
    { symbol: 'INJ/USDT', name: 'Injective', category: 'defi' },
    { symbol: 'CRV/USDT', name: 'Curve', category: 'defi' },
    { symbol: 'COMP/USDT', name: 'Compound', category: 'defi' },
    { symbol: 'SNX/USDT', name: 'Synthetix', category: 'defi' },
    // Layer 2 & Infrastructure
    { symbol: 'MATIC/USDT', name: 'Polygon', category: 'layer2' },
    { symbol: 'ARB/USDT', name: 'Arbitrum', category: 'layer2' },
    { symbol: 'OP/USDT', name: 'Optimism', category: 'layer2' },
    { symbol: 'APT/USDT', name: 'Aptos', category: 'layer2' },
    { symbol: 'NEAR/USDT', name: 'NEAR Protocol', category: 'layer2' },
    { symbol: 'ATOM/USDT', name: 'Cosmos', category: 'layer2' },
    { symbol: 'FTM/USDT', name: 'Fantom', category: 'layer2' },
    { symbol: 'DOT/USDT', name: 'Polkadot', category: 'layer2' },
    { symbol: 'ALGO/USDT', name: 'Algorand', category: 'layer2' },
    { symbol: 'VET/USDT', name: 'VeChain', category: 'layer2' },
    { symbol: 'HBAR/USDT', name: 'Hedera', category: 'layer2' },
    { symbol: 'ICP/USDT', name: 'Internet Computer', category: 'layer2' },
    { symbol: 'FIL/USDT', name: 'Filecoin', category: 'layer2' },
    // Meme coins
    { symbol: 'SHIB/USDT', name: 'Shiba Inu', category: 'meme' },
    { symbol: 'PEPE/USDT', name: 'Pepe', category: 'meme' },
    { symbol: 'WIF/USDT', name: 'dogwifhat', category: 'meme' },
    { symbol: 'BONK/USDT', name: 'Bonk', category: 'meme' },
    { symbol: 'FLOKI/USDT', name: 'Floki', category: 'meme' },
    // AI & Gaming
    { symbol: 'FET/USDT', name: 'Fetch.ai', category: 'ai' },
    { symbol: 'RNDR/USDT', name: 'Render', category: 'ai' },
    { symbol: 'GRT/USDT', name: 'The Graph', category: 'ai' },
    { symbol: 'IMX/USDT', name: 'Immutable', category: 'ai' },
    { symbol: 'GALA/USDT', name: 'Gala', category: 'ai' },
    { symbol: 'SAND/USDT', name: 'The Sandbox', category: 'ai' },
    { symbol: 'MANA/USDT', name: 'Decentraland', category: 'ai' },
  ];

  // Sync state when bot data loads
  useEffect(() => {
    if (bot) {
      setDiscordWebhook(bot.discordWebhook || '');
      setTelegramWebhook(bot.telegramWebhook || '');
      setMaxOrderSize(bot.maxOrderSize || 500);
      setDailyLossLimit(bot.dailyLossLimit || 100);
      setMaxDailyTrades(bot.maxDailyTrades || 20);
      setSelectedPair(bot.symbol || 'BTC/USDT');
      // Enhanced features
      setUseSmartOrders(bot.useSmartOrders || false);
      setSmartOrderSpread((bot.smartOrderSpread || 0.001) * 100);
      setDcaEnabled(bot.dcaEnabled || false);
      setDcaAmount(bot.dcaAmount || 10);
      setDcaInterval(bot.dcaInterval || 3600);
      setMultiAssetEnabled(bot.multiAssetEnabled || false);
      setVolatilityScaling(bot.volatilityScaling !== false);
      setTrailingStopPercent(bot.trailingStopPercent || 2);
      setMaxDrawdownPercent(bot.maxDrawdownPercent || 10);
      setKillSwitchEnabled(bot.killSwitchEnabled || false);
      // Strategy Configuration
      setStrategyType(bot.strategyType || 'adaptive');
      setRsiOversold(bot.rsiOversold || 30);
      setRsiOverbought(bot.rsiOverbought || 70);
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
      setMinVolatility(bot.minVolatility || 0.5);
      setMaxVolatility(bot.maxVolatility || 10);
      setTradingHoursOnly(bot.tradingHoursOnly || false);
      setAvoidWeekends(bot.avoidWeekends || false);
      setAiAggressiveness(bot.aiAggressiveness || 'balanced');
      setUseInstitutionalSignals(bot.useInstitutionalSignals !== false);
      setUseSentimentAnalysis(bot.useSentimentAnalysis !== false);
    }
  }, [bot]);

  const handlePairChange = (symbol: string) => {
    setSelectedPair(symbol);
    updateBotMutation.mutate({ symbol });
  };

  const updateBotMutation = useMutation({
    mutationFn: async (update: Partial<Bot>) => {
      const res = await fetch(`/api/bot/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["my-bot"], data);
      queryClient.invalidateQueries({ queryKey: ["my-bot"] });
      // Show which setting was saved
      const settingName = Object.keys(variables)[0];
      setRecentlySaved(settingName);
      toast.success("✓ Setting Saved!", { 
        description: `${settingName} updated successfully`,
        duration: 2000 
      });
      // Clear the saved indicator after 2 seconds
      setTimeout(() => setRecentlySaved(null), 2000);
    },
    onError: (error) => {
      toast.error("Failed to save settings");
      console.error('Settings update error:', error);
    }
  });

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
    setApiKey('');
    setApiSecret('');
  };

  if (!bot) return null;

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 sm:pb-12 border-b border-white/5 gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tighter text-gradient mb-2 uppercase">Settings</h2>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em]">Account Configuration</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        {/* Exchange Selection */}
        <Card className="glass-modern p-6 sm:p-10 space-y-8 sm:space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/60">Exchange Selection</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-mono text-white/30 tracking-widest">Active Exchange</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                {['coinbase', 'kraken'].map((exchange) => (
                  <button
                    key={exchange}
                    onClick={() => updateBotMutation.mutate({ exchange })}
                    className={`flex-1 text-[10px] font-display py-4 uppercase border transition-all ${
                      bot.exchange === exchange 
                      ? 'bg-primary border-primary text-black font-black' 
                      : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                    }`}
                    data-testid={`button-exchange-${exchange}`}
                  >
                    {exchange}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[9px] font-mono text-white/20 italic text-center">
              Select which exchange to use for trading
            </p>
          </div>
        </Card>

        {/* Trading Pair Selection */}
        <Card className="glass-modern p-6 sm:p-10 space-y-8 sm:space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Coins className="h-6 w-6 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/60">Trading Pair</h3>
            {bot.isLiveMode && (
              <span className="ml-auto text-[9px] font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">LIVE MODE</span>
            )}
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-mono text-white/30 tracking-widest">Current Pair: {selectedPair}</Label>
              
              {/* Major Pairs */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Major Coins</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tradingPairs.filter(p => p.category === 'major').map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`text-[10px] font-display py-3 uppercase border transition-all ${
                        selectedPair === pair.symbol 
                        ? 'bg-primary border-primary text-black font-black' 
                        : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`button-pair-${pair.symbol.replace('/', '-')}`}
                    >
                      <span className="block font-bold">{pair.symbol.split('/')[0]}</span>
                      <span className="text-[8px] opacity-60">{pair.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DeFi Pairs */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">DeFi Tokens</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tradingPairs.filter(p => p.category === 'defi').map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`text-[10px] font-display py-3 uppercase border transition-all ${
                        selectedPair === pair.symbol 
                        ? 'bg-primary border-primary text-black font-black' 
                        : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`button-pair-${pair.symbol.replace('/', '-')}`}
                    >
                      <span className="block font-bold">{pair.symbol.split('/')[0]}</span>
                      <span className="text-[8px] opacity-60">{pair.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer 2 Pairs */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Layer 2</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tradingPairs.filter(p => p.category === 'layer2').map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`text-[10px] font-display py-3 uppercase border transition-all ${
                        selectedPair === pair.symbol 
                        ? 'bg-primary border-primary text-black font-black' 
                        : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`button-pair-${pair.symbol.replace('/', '-')}`}
                    >
                      <span className="block font-bold">{pair.symbol.split('/')[0]}</span>
                      <span className="text-[8px] opacity-60">{pair.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meme Coins */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Meme Coins</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tradingPairs.filter(p => p.category === 'meme').map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`text-[10px] font-display py-3 uppercase border transition-all ${
                        selectedPair === pair.symbol 
                        ? 'bg-primary border-primary text-black font-black' 
                        : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`button-pair-${pair.symbol.replace('/', '-')}`}
                    >
                      <span className="block font-bold">{pair.symbol.split('/')[0]}</span>
                      <span className="text-[8px] opacity-60">{pair.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI & Gaming */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">AI & Gaming</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tradingPairs.filter(p => p.category === 'ai').map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handlePairChange(pair.symbol)}
                      className={`text-[10px] font-display py-3 uppercase border transition-all ${
                        selectedPair === pair.symbol 
                        ? 'bg-primary border-primary text-black font-black' 
                        : 'border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`button-pair-${pair.symbol.replace('/', '-')}`}
                    >
                      <span className="block font-bold">{pair.symbol.split('/')[0]}</span>
                      <span className="text-[8px] opacity-60">{pair.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded">
              <p className="text-[9px] font-mono text-blue-400/80">
                {bot.isLiveMode 
                  ? 'Live mode active - changing pairs will affect your real trading. Make sure the selected pair is available on your exchange.'
                  : 'Paper mode - you can safely test different trading pairs without risk.'}
              </p>
            </div>
          </div>
        </Card>

        {/* API Keys */}
        <Card className="glass-modern p-6 sm:p-10 space-y-8 sm:space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Key className="h-6 w-6 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/60">Exchange API Keys</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">
                {bot.exchange === 'coinbase' ? 'Coinbase' : 'Kraken'} API Key
              </Label>
              <Input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm focus:border-primary/50" 
                placeholder="••••••••••••••••" 
                data-testid="input-api-key"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">API Secret</Label>
              <Input 
                type="password" 
                value={apiSecret} 
                onChange={(e) => setApiSecret(e.target.value)} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm focus:border-primary/50" 
                placeholder="••••••••••••••••" 
                data-testid="input-api-secret"
              />
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded">
            <p className="text-[9px] font-mono text-amber-400/80">
              Your API keys are stored securely and only used for trading operations. Make sure to enable trading permissions on your exchange.
            </p>
          </div>
          <Button 
            onClick={saveKeys} 
            disabled={!apiKey || !apiSecret}
            className="w-full h-12 sm:h-14 font-display text-[10px] tracking-[0.5em] bg-primary/5 hover:bg-primary text-primary hover:text-black border border-primary/20 transition-all uppercase rounded-none"
            data-testid="button-save-api-keys"
          >
            <Save className="mr-3 h-4 w-4" /> Save API Configuration
          </Button>
        </Card>

        {/* Notification Channels */}
        <Card className="glass-modern p-6 sm:p-10 space-y-8 sm:space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <BellRing className="h-6 w-6 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/60">Notification Channels</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">Discord Webhook URL</Label>
              <Input 
                value={discordWebhook} 
                onChange={(e) => setDiscordWebhook(e.target.value)} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm" 
                placeholder="https://discord.com/api/webhooks/..." 
                data-testid="input-discord-webhook"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">Telegram Bot Token</Label>
              <Input 
                value={telegramWebhook} 
                onChange={(e) => setTelegramWebhook(e.target.value)} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm" 
                placeholder="bot123456:ABC-DEF..." 
                data-testid="input-telegram-webhook"
              />
            </div>
          </div>
          <p className="text-[9px] font-mono text-white/20 italic text-center">
            Receive trade alerts and bot status notifications
          </p>
          <Button 
            onClick={() => updateBotMutation.mutate({ discordWebhook, telegramWebhook })} 
            className="w-full h-12 sm:h-14 font-display text-[10px] tracking-[0.5em] bg-primary/5 hover:bg-primary text-primary hover:text-black border border-primary/20 transition-all uppercase rounded-none"
            data-testid="button-save-webhooks"
          >
            Update Notifications
          </Button>
        </Card>

        {/* Live Trading Safety Settings */}
        <Card className="glass-modern p-6 sm:p-10 space-y-8 sm:space-y-10 border-amber-500/20">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Shield className="h-6 w-6 text-amber-400" />
            <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/60">Live Trading Safety Limits</h3>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-amber-200/80">
              These limits protect your account when trading with real money. The bot will automatically stop trading if any limit is reached.
            </p>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">Maximum Order Size (USD)</Label>
              <Input 
                type="number"
                value={maxOrderSize} 
                onChange={(e) => setMaxOrderSize(Number(e.target.value))} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm" 
                placeholder="500"
                min={1}
                data-testid="input-max-order-size"
              />
              <p className="text-[9px] font-mono text-white/20">Maximum value for any single trade order</p>
            </div>
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">Daily Loss Limit (USD)</Label>
              <Input 
                type="number"
                value={dailyLossLimit} 
                onChange={(e) => setDailyLossLimit(Number(e.target.value))} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm" 
                placeholder="100"
                min={1}
                data-testid="input-daily-loss-limit"
              />
              <p className="text-[9px] font-mono text-white/20">Stop trading if daily losses exceed this amount</p>
            </div>
            <div className="space-y-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest">Maximum Daily Trades</Label>
              <Input 
                type="number"
                value={maxDailyTrades} 
                onChange={(e) => setMaxDailyTrades(Number(e.target.value))} 
                className="bg-white/[0.03] border-white/10 h-12 sm:h-14 rounded-none font-mono text-sm" 
                placeholder="20"
                min={1}
                data-testid="input-max-daily-trades"
              />
              <p className="text-[9px] font-mono text-white/20">Maximum number of trades allowed per day</p>
            </div>
          </div>
          <Button 
            onClick={() => updateBotMutation.mutate({ maxOrderSize, dailyLossLimit, maxDailyTrades })} 
            className="w-full h-12 sm:h-14 font-display text-[10px] tracking-[0.5em] bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 transition-all uppercase rounded-none"
            data-testid="button-save-safety-limits"
          >
            Update Safety Limits
          </Button>
        </Card>

        {/* Enhanced Live Trading Features */}
        <Card className="glass-modern p-6 sm:p-10 space-y-8 sm:space-y-10 border-primary/20">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/60">Advanced Live Trading</h3>
          </div>
          
          {/* Kill Switch */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Power className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-sm font-display text-white">Kill Switch</p>
                  <p className="text-[9px] font-mono text-white/40">Emergency halt all trading</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newValue = !killSwitchEnabled;
                  setKillSwitchEnabled(newValue);
                  updateBotMutation.mutate({ killSwitchEnabled: newValue });
                }}
                className={`px-4 py-2 text-[10px] font-display uppercase transition-all ${
                  killSwitchEnabled 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/5 text-white/50 border border-white/10'
                }`}
                data-testid="button-kill-switch"
              >
                {killSwitchEnabled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Label className="text-[9px] uppercase font-mono text-white/30 tracking-widest whitespace-nowrap">Max Drawdown %</Label>
              <Input 
                type="number"
                value={maxDrawdownPercent} 
                onChange={(e) => setMaxDrawdownPercent(Number(e.target.value))} 
                className="bg-white/[0.03] border-white/10 h-10 rounded-none font-mono text-sm w-24" 
                min={1}
                max={50}
                data-testid="input-max-drawdown"
              />
              <p className="text-[9px] font-mono text-white/20">Auto-halts at this drawdown</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Smart Orders */}
            <div className="space-y-4 p-4 border border-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-display text-white">Smart Limit Orders</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !useSmartOrders;
                    setUseSmartOrders(newValue);
                    updateBotMutation.mutate({ useSmartOrders: newValue });
                  }}
                  disabled={updateBotMutation.isPending}
                  className={`px-3 py-1.5 text-[9px] font-display uppercase transition-all flex items-center gap-1 ${
                    useSmartOrders 
                      ? 'bg-primary text-black' 
                      : 'bg-white/5 text-white/50'
                  } ${recentlySaved === 'useSmartOrders' ? 'ring-2 ring-green-500' : ''}`}
                  data-testid="button-smart-orders"
                >
                  {updateBotMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {recentlySaved === 'useSmartOrders' && <Check className="h-3 w-3 text-green-500" />}
                  {useSmartOrders ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[9px] font-mono text-white/30">Use order book for better fills</p>
              <div className="flex items-center gap-2">
                <Label className="text-[9px] uppercase font-mono text-white/30 whitespace-nowrap">Spread %</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={smartOrderSpread} 
                  onChange={(e) => setSmartOrderSpread(Number(e.target.value))} 
                  className="bg-white/[0.03] border-white/10 h-8 rounded-none font-mono text-xs w-20" 
                  data-testid="input-smart-spread"
                />
              </div>
            </div>

            {/* Volatility Scaling */}
            <div className="space-y-4 p-4 border border-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-display text-white">Volatility Scaling</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !volatilityScaling;
                    setVolatilityScaling(newValue);
                    updateBotMutation.mutate({ volatilityScaling: newValue });
                  }}
                  disabled={updateBotMutation.isPending}
                  className={`px-3 py-1.5 text-[9px] font-display uppercase transition-all flex items-center gap-1 ${
                    volatilityScaling 
                      ? 'bg-primary text-black' 
                      : 'bg-white/5 text-white/50'
                  } ${recentlySaved === 'volatilityScaling' ? 'ring-2 ring-green-500' : ''}`}
                  data-testid="button-volatility-scaling"
                >
                  {updateBotMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {recentlySaved === 'volatilityScaling' && <Check className="h-3 w-3 text-green-500" />}
                  {volatilityScaling ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[9px] font-mono text-white/30">ATR-based position sizing</p>
            </div>

            {/* DCA Mode */}
            <div className="space-y-4 p-4 border border-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-display text-white">DCA Mode</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !dcaEnabled;
                    setDcaEnabled(newValue);
                    updateBotMutation.mutate({ dcaEnabled: newValue });
                  }}
                  disabled={updateBotMutation.isPending}
                  className={`px-3 py-1.5 text-[9px] font-display uppercase transition-all flex items-center gap-1 ${
                    dcaEnabled 
                      ? 'bg-green-500 text-black' 
                      : 'bg-white/5 text-white/50'
                  } ${recentlySaved === 'dcaEnabled' ? 'ring-2 ring-green-500' : ''}`}
                  data-testid="button-dca-mode"
                >
                  {updateBotMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {recentlySaved === 'dcaEnabled' && <Check className="h-3 w-3 text-green-500" />}
                  {dcaEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[9px] font-mono text-white/30">Dollar-cost averaging buys</p>
              <div className="flex items-center gap-2">
                <Label className="text-[9px] uppercase font-mono text-white/30 whitespace-nowrap">Amount $</Label>
                <Input 
                  type="number"
                  value={dcaAmount} 
                  onChange={(e) => setDcaAmount(Number(e.target.value))} 
                  className="bg-white/[0.03] border-white/10 h-8 rounded-none font-mono text-xs w-20" 
                  data-testid="input-dca-amount"
                />
                <Label className="text-[9px] uppercase font-mono text-white/30 whitespace-nowrap">Every</Label>
                <select
                  value={dcaInterval}
                  onChange={(e) => setDcaInterval(Number(e.target.value))}
                  className="bg-white/[0.03] border border-white/10 h-8 rounded-none font-mono text-xs px-2 text-white"
                  data-testid="select-dca-interval"
                >
                  <option value={3600}>1hr</option>
                  <option value={14400}>4hr</option>
                  <option value={86400}>1d</option>
                  <option value={604800}>1w</option>
                </select>
              </div>
            </div>

            {/* Trailing Stop */}
            <div className="space-y-4 p-4 border border-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-display text-white">Trailing Stop</span>
                </div>
                <button
                  onClick={() => updateBotMutation.mutate({ trailingStopActive: !bot?.trailingStopActive })}
                  className={`px-3 py-1.5 text-[9px] font-display uppercase transition-all ${
                    bot?.trailingStopActive 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-white/5 text-white/50'
                  }`}
                  data-testid="button-trailing-stop"
                >
                  {bot?.trailingStopActive ? 'ARMED' : 'OFF'}
                </button>
              </div>
              <p className="text-[9px] font-mono text-white/30">Lock in profits dynamically</p>
              <div className="flex items-center gap-2">
                <Label className="text-[9px] uppercase font-mono text-white/30 whitespace-nowrap">Trail %</Label>
                <Input 
                  type="number"
                  step="0.5"
                  value={trailingStopPercent} 
                  onChange={(e) => setTrailingStopPercent(Number(e.target.value))} 
                  className="bg-white/[0.03] border-white/10 h-8 rounded-none font-mono text-xs w-20" 
                  data-testid="input-trailing-percent"
                />
              </div>
            </div>

            {/* Multi-Asset Rotation */}
            <div className="space-y-4 p-4 border border-white/5 rounded-lg md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-display text-white">Multi-Asset Rotation</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !multiAssetEnabled;
                    setMultiAssetEnabled(newValue);
                    updateBotMutation.mutate({ multiAssetEnabled: newValue });
                  }}
                  disabled={updateBotMutation.isPending}
                  className={`px-3 py-1.5 text-[9px] font-display uppercase transition-all flex items-center gap-1 ${
                    multiAssetEnabled 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/5 text-white/50'
                  } ${recentlySaved === 'multiAssetEnabled' ? 'ring-2 ring-green-500' : ''}`}
                  data-testid="button-multi-asset"
                >
                  {updateBotMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {recentlySaved === 'multiAssetEnabled' && <Check className="h-3 w-3 text-green-500" />}
                  {multiAssetEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-[9px] font-mono text-white/30">
                Automatically trade the strongest performing asset from your watchlist: {bot?.watchlist?.join(', ') || 'BTC, ETH, SOL'}
              </p>
            </div>
          </div>

          <Button 
            onClick={() => updateBotMutation.mutate({ 
              useSmartOrders,
              smartOrderSpread: smartOrderSpread / 100,
              dcaEnabled,
              dcaAmount,
              dcaInterval,
              multiAssetEnabled,
              volatilityScaling,
              trailingStopPercent,
              maxDrawdownPercent
            })} 
            className="w-full h-12 sm:h-14 font-display text-[10px] tracking-[0.5em] bg-primary/5 hover:bg-primary text-primary hover:text-black border border-primary/20 transition-all uppercase rounded-none"
            data-testid="button-save-advanced"
          >
            Save Advanced Settings
          </Button>
        </Card>

      </div>
    </div>
  );
}
