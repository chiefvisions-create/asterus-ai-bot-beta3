import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Bot, 
  Cpu,
  LogIn,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="font-display text-base sm:text-xl font-bold tracking-tight">Astraeus AI</span>
          </div>
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="h-8 sm:h-10 px-3 sm:px-6 font-display text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] bg-primary hover:bg-primary/80 text-black uppercase rounded-none"
            data-testid="button-login-nav"
          >
            <LogIn className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Sign In</span>
            <span className="xs:hidden">Login</span>
          </Button>
        </div>
      </nav>

      <main className="pt-16 sm:pt-24">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-primary text-xs sm:text-sm mb-6 sm:mb-8">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            AI-Powered Crypto Trading
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter mb-4 sm:mb-6 leading-tight">
            Trade Smarter with
            <span className="block text-gradient">Astraeus AI</span>
          </h1>
          
          <p className="text-sm sm:text-lg text-white/60 max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
            Professional-grade AI trading bot with real-time market analysis, 
            multi-exchange support, and advanced risk management.
          </p>

          <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button
              onClick={() => window.location.href = '/api/login'}
              className="h-12 sm:h-14 px-6 sm:px-10 font-display text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] bg-primary hover:bg-primary/80 text-black uppercase rounded-none w-full sm:w-auto sm:mx-auto"
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-white/40">
            <span className="flex items-center gap-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              Free paper trading
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              50+ cryptocurrencies
            </span>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="glass-modern p-5 sm:p-8 group hover:border-primary/20 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <Cpu className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2 sm:mb-3">AI-Driven Analysis</h3>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                GPT-powered market intelligence with real-time sentiment analysis and adaptive confidence scoring.
              </p>
            </Card>

            <Card className="glass-modern p-5 sm:p-8 group hover:border-primary/20 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2 sm:mb-3">Advanced Backtesting</h3>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                Test strategies against historical data with realistic fee simulation and performance analytics.
              </p>
            </Card>

            <Card className="glass-modern p-5 sm:p-8 group hover:border-primary/20 transition-all sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2 sm:mb-3">Risk Management</h3>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                Built-in kill switch, position sizing, trailing stops, and volatility scaling to protect your capital.
              </p>
            </Card>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center">
          <h2 className="text-xl sm:text-3xl font-display font-bold text-white mb-3 sm:mb-4">Ready to Start Trading?</h2>
          <p className="text-white/50 text-sm sm:text-base mb-6 sm:mb-8">Sign in to access your personal trading terminal</p>
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="h-11 sm:h-12 px-6 sm:px-8 font-display text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] bg-white/5 hover:bg-primary text-white hover:text-black border border-white/10 hover:border-primary uppercase rounded-none transition-all w-full sm:w-auto"
            data-testid="button-signin-cta"
          >
            <LogIn className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Sign In to Continue
          </Button>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-white/30">
          Astraeus AI Trading Terminal
        </div>
      </footer>
    </div>
  );
}
