import { Card } from "@/components/ui/card";
import { 
  Book, 
  PlayCircle, 
  Settings, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Zap, 
  AlertTriangle,
  Bot,
  Wallet,
  LineChart,
  Target,
  Clock,
  MessageSquare,
  Newspaper,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

export default function Manual() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections: Section[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <PlayCircle className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Welcome to Astraeus AI</h3>
          <p className="text-white/70 leading-relaxed">
            Astraeus AI is an AI-powered cryptocurrency trading bot that helps you make smarter trading decisions. 
            The platform supports both paper trading (simulated) and live trading with real funds.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-500">Important Safety Notice</h4>
                <p className="text-sm text-white/60 mt-1">
                  Always start with paper trading to understand the system. Never invest more than you can afford to lose. 
                  Cryptocurrency trading carries significant risk.
                </p>
              </div>
            </div>
          </div>
          <h4 className="text-lg font-semibold text-white mt-6">Quick Start Steps:</h4>
          <ol className="list-decimal list-inside space-y-2 text-white/70">
            <li>Review the Dashboard to see current bot status and performance</li>
            <li>Configure your trading pair and strategy in Settings</li>
            <li>Start with Paper Trading mode to test strategies</li>
            <li>Use the Backtester to validate your approach</li>
            <li>When confident, switch to Live Trading (requires API keys)</li>
          </ol>
        </div>
      )
    },
    {
      id: "dashboard",
      title: "Dashboard Overview",
      icon: <Bot className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Understanding the Dashboard</h3>
          <p className="text-white/70 leading-relaxed">
            The dashboard is your central command center for monitoring trading activity.
          </p>
          <div className="space-y-4 mt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Bot Status Panel</h4>
              <p className="text-sm text-white/60">Shows if the bot is running, current mode (paper/live), and the active trading pair.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Performance Metrics</h4>
              <p className="text-sm text-white/60">Displays win rate, total P&L, profit factor, and trade statistics.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Live Price Chart</h4>
              <p className="text-sm text-white/60">Real-time price data for your selected trading pair with technical indicators.</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Recent Trades</h4>
              <p className="text-sm text-white/60">List of recent buy/sell orders with entry price, exit price, and P&L.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "trading-modes",
      title: "Trading Modes",
      icon: <TrendingUp className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Paper vs Live Trading</h3>
          
          <div className="grid gap-4 mt-4">
            <Card className="glass-modern p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <LineChart className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Paper Trading (Simulation)</h4>
                  <p className="text-sm text-white/60">
                    Practice trading with virtual money. All trades are simulated using real market prices but no actual funds are used. 
                    Perfect for testing strategies and learning the platform.
                  </p>
                  <ul className="text-xs text-white/50 mt-2 space-y-1">
                    <li>- No real money at risk</li>
                    <li>- Simulates fees and slippage</li>
                    <li>- Reset balance anytime</li>
                  </ul>
                </div>
              </div>
            </Card>
            
            <Card className="glass-modern p-5 border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Live Trading (Real Money)</h4>
                  <p className="text-sm text-white/60">
                    Trade with real funds on connected exchanges. Requires API keys from Coinbase or Kraken. 
                    All trades are executed on the actual market.
                  </p>
                  <ul className="text-xs text-white/50 mt-2 space-y-1">
                    <li>- Real money transactions</li>
                    <li>- Requires exchange API keys</li>
                    <li>- Start small and scale gradually</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: "settings",
      title: "Bot Configuration",
      icon: <Settings className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Configuring Your Bot</h3>
          <p className="text-white/70 leading-relaxed">
            Access Settings to customize how the bot trades.
          </p>
          
          <div className="space-y-3 mt-4">
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">Trading Pair</h4>
              <p className="text-sm text-white/60">Select which cryptocurrency to trade (e.g., BTC/USDT, ETH/USDT)</p>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">Exchange</h4>
              <p className="text-sm text-white/60">Choose between Coinbase or Kraken for market data and live trading</p>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">Risk Profile</h4>
              <p className="text-sm text-white/60">Conservative, Moderate, or Aggressive - affects position sizing and entry thresholds</p>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">RSI Thresholds</h4>
              <p className="text-sm text-white/60">Set overbought/oversold levels that trigger buy/sell signals</p>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">EMA Settings</h4>
              <p className="text-sm text-white/60">Fast and slow EMA periods for trend detection</p>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">API Keys</h4>
              <p className="text-sm text-white/60">Enter your exchange API keys for live trading (stored securely)</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "backtesting",
      title: "Backtesting",
      icon: <BarChart3 className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Testing Your Strategy</h3>
          <p className="text-white/70 leading-relaxed">
            The Backtester lets you test trading strategies against historical market data before risking real money.
          </p>
          
          <h4 className="text-lg font-semibold text-white mt-6">How to Use:</h4>
          <ol className="list-decimal list-inside space-y-2 text-white/70">
            <li>Select the time period (7, 14, or 30 days)</li>
            <li>Configure your strategy parameters</li>
            <li>Click "Run Backtest" to simulate trades</li>
            <li>Review results: win rate, P&L, trade count</li>
            <li>Adjust parameters and test again</li>
          </ol>
          
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-primary">Pro Tip</h4>
            <p className="text-sm text-white/60 mt-1">
              A strategy that works well in backtesting may not perform identically in live markets due to slippage and market conditions. 
              Always paper trade before going live.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "risk-management",
      title: "Risk Management",
      icon: <Shield className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Protecting Your Capital</h3>
          <p className="text-white/70 leading-relaxed">
            Astraeus AI includes several risk management features to protect your funds.
          </p>
          
          <div className="grid gap-4 mt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h4 className="font-semibold text-white">Kill Switch</h4>
              </div>
              <p className="text-sm text-white/60">Emergency stop button that immediately halts all trading and switches to paper mode.</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-yellow-400" />
                <h4 className="font-semibold text-white">Trailing Stops</h4>
              </div>
              <p className="text-sm text-white/60">Automatically adjusts stop-loss levels as price moves in your favor to lock in profits.</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <h4 className="font-semibold text-white">Position Sizing</h4>
              </div>
              <p className="text-sm text-white/60">Based on your risk profile, the bot calculates appropriate position sizes to limit exposure.</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-400" />
                <h4 className="font-semibold text-white">Cooldown Periods</h4>
              </div>
              <p className="text-sm text-white/60">Prevents overtrading by enforcing minimum wait times between trades.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "ai-features",
      title: "AI Features",
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">AI-Powered Intelligence</h3>
          <p className="text-white/70 leading-relaxed">
            Astraeus AI uses GPT-4 to provide advanced market analysis and trading insights.
          </p>
          
          <div className="space-y-4 mt-4">
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">AI Chat Assistant</h4>
              <p className="text-sm text-white/60">Ask questions about your trades, get strategy advice, and analyze market conditions in natural language.</p>
            </div>
            
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">Strategy Suggestions</h4>
              <p className="text-sm text-white/60">AI analyzes your trading performance and provides personalized recommendations to improve results.</p>
            </div>
            
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">Trade Explanations</h4>
              <p className="text-sm text-white/60">Get AI-generated explanations for why specific trades were made.</p>
            </div>
            
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold text-white">Market Sentiment</h4>
              <p className="text-sm text-white/60">Real-time sentiment analysis of market conditions to inform trading decisions.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "community",
      title: "Community & News",
      icon: <MessageSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-white">Connect & Stay Informed</h3>
          
          <div className="grid gap-4 mt-4">
            <Card className="glass-modern p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Community Forum</h4>
                  <p className="text-sm text-white/60">
                    Connect with other traders, share strategies, ask questions, and learn from the community. 
                    Discuss market analysis, bot configurations, and trading insights.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="glass-modern p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Crypto News Feed</h4>
                  <p className="text-sm text-white/60">
                    Stay updated with AI-curated crypto news headlines. Filter by sentiment (bullish, bearish, neutral) 
                    and category to find relevant market updates.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-2 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Book className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tighter text-gradient uppercase">User Manual</h1>
            <p className="text-xs sm:text-sm text-white/40">Complete guide to using Astraeus AI Trading Bot</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                data-testid={`nav-${section.id}`}
              >
                {section.icon}
                <span className="text-sm font-medium">{section.title}</span>
                {activeSection === section.id && <ChevronRight className="h-4 w-4 ml-auto" />}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0">
          <Card className="glass-modern p-6 sm:p-8">
            {sections.find(s => s.id === activeSection)?.content}
          </Card>
        </main>
      </div>
    </div>
  );
}
