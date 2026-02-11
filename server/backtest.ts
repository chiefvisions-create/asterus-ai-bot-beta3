import { storage } from "./storage";
import { Bot, InsertBacktest } from "@shared/schema";
import ccxt from "ccxt";

export class BacktestEngine {
  async runBacktest(botId: number, days: number): Promise<InsertBacktest> {
    const bot = await storage.getBot(botId);
    if (!bot) throw new Error("Bot not found");

    const exchange = new ccxt.coinbase();
    const symbol = bot.symbol;
    const timeframe = '1h'; 
    const limit = days * 24;

    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    const closes: number[] = ohlcv.map(c => c[4] as number).filter((v): v is number => v !== undefined);
    const highs: number[] = ohlcv.map(c => c[2] as number).filter((v): v is number => v !== undefined);
    const lows: number[] = ohlcv.map(c => c[3] as number).filter((v): v is number => v !== undefined);
    const volumes: number[] = ohlcv.map(c => c[5] as number).filter((v): v is number => v !== undefined);
    const timestamps: number[] = ohlcv.map(c => c[0] as number).filter((v): v is number => v !== undefined);

    let balance = 1000;
    const initialBalance = balance;
    let position = 0;
    let entryPrice = 0;
    let trades = 0;
    let wins = 0;
    let peak = balance;
    let maxDD = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    const rsiPeriod = 14;
    const emaFastPeriod = bot.emaFast || 9;
    const emaSlowPeriod = bot.emaSlow || 21;
    const rsiThreshold = bot.rsiThreshold || 45;

    const slippage = 0.001;
    const fee = 0.001;

    const trailingStopEnabled = bot.trailingStop ?? false;
    const riskProfiles: Record<string, { size: number, sl: number, tp: number }> = {
      safe: { size: 0.03, sl: 0.008, tp: 0.025 },
      balanced: { size: 0.07, sl: 0.015, tp: 0.06 },
      aggressive: { size: 0.15, sl: 0.02, tp: 0.12 }
    };
    const profile = riskProfiles[bot.riskProfile] || riskProfiles.safe;
    let highestPrice = 0;

    const equityCurve: {time: number, value: number}[] = [];
    const tradeLog: {time: number, side: string, price: number, pnl: number}[] = [];

    // Track RSI history for divergence detection
    const rsiHistory: number[] = [];
    const priceHistory: number[] = [];

    for (let i = 50; i < closes.length; i++) {
      const slice = closes.slice(0, i + 1);
      const currentPrice = closes[i];
      const currentTime = timestamps[i];

      const rsi = this.calculateRSI(slice, rsiPeriod);
      const emaFast = this.calculateEMA(slice, emaFastPeriod);
      const emaSlow = this.calculateEMA(slice, emaSlowPeriod);
      const ema200 = slice.length >= 200 ? this.calculateEMA(slice.slice(-200), 200) : emaSlow;

      // Track RSI and price for divergence
      rsiHistory.push(rsi);
      priceHistory.push(currentPrice);
      if (rsiHistory.length > 20) {
        rsiHistory.shift();
        priceHistory.shift();
      }

      // Calculate ATR for volatility-based sizing
      const atr = this.calculateATR(highs.slice(0, i+1), lows.slice(0, i+1), closes.slice(0, i+1), 14);
      const volatilityFactor = atr / currentPrice;

      // Volume analysis
      const volumeSlice = volumes.slice(Math.max(0, i - 20), i + 1);
      const avgVolume = volumeSlice.reduce((a, b) => a + b, 0) / volumeSlice.length;
      const currentVolume = volumes[i];
      const volumeConfirmed = currentVolume > avgVolume * 0.8;

      // Trend strength using ADX approximation
      const trendStrength = Math.abs(emaFast - emaSlow) / emaSlow * 100;
      const strongTrend = trendStrength > 0.5;

      // Bullish RSI divergence: price making lower lows but RSI making higher lows
      const bullishDivergence = this.detectBullishDivergence(priceHistory, rsiHistory);

      // Momentum confirmation: price above short-term moving average
      const momentum = currentPrice > this.calculateEMA(slice.slice(-5), 5);

      // Enhanced entry conditions - equity includes cash + position value
      const currentEquity = balance + (position > 0 ? position * currentPrice : 0);
      equityCurve.push({ time: currentTime, value: currentEquity });

      if (position === 0) {
        // Multi-factor entry confirmation
        const trendBullish = emaFast > emaSlow;
        const rsiOversold = rsi < rsiThreshold;
        const aboveMajorTrend = currentPrice > ema200 * 0.98; // Allow 2% buffer below 200 EMA
        const notOverbought = rsi < 65;
        
        // Score-based entry system (max 10 points, matching live engine)
        let entryScore = 0;
        if (trendBullish) entryScore += 2;
        if (rsiOversold) entryScore += 2;
        if (volumeConfirmed) entryScore += 1;
        if (strongTrend) entryScore += 1;
        if (bullishDivergence) entryScore += 1;
        if (momentum) entryScore += 1;
        if (aboveMajorTrend) entryScore += 1;
        if (consecutiveLosses >= 2) entryScore -= 1; // Reduce aggression after losses
        
        // Cap score at 10
        entryScore = Math.min(10, Math.max(0, entryScore));

        // Require minimum score of 5 for entry
        if (entryScore >= 5 && notOverbought) {
          const executionPrice = currentPrice * (1 + slippage);
          
          // Volatility-adjusted position sizing
          const volatilityAdjustment = Math.max(0.5, Math.min(1.5, 1 / (volatilityFactor * 50)));
          const adjustedSize = profile.size * volatilityAdjustment;
          
          position = (balance * adjustedSize * (1 - fee)) / executionPrice;
          entryPrice = executionPrice;
          highestPrice = executionPrice;
          balance = balance * (1 - adjustedSize);
          tradeLog.push({ time: currentTime, side: 'BUY', price: executionPrice, pnl: 0 });
        }
      } else {
        const executionPrice = currentPrice * (1 - slippage);
        const equity = balance + position * executionPrice;
        if (equity > peak) peak = equity;
        const dd = (peak - equity) / peak;
        if (dd > maxDD) maxDD = dd;

        if (executionPrice > highestPrice) highestPrice = executionPrice;

        const profitPercent = (executionPrice - entryPrice) / entryPrice;

        // Progressive stop loss tightening - matching live engine (30/50/75%)
        let dynamicSL = profile.sl;
        if (profitPercent > profile.tp * 0.3) dynamicSL = profile.sl * 0.7;
        if (profitPercent > profile.tp * 0.5) dynamicSL = profile.sl * 0.5;
        if (profitPercent > profile.tp * 0.75) dynamicSL = profile.sl * 0.35;

        // Dynamic take profit based on volatility and trend strength
        const dynamicTP = profile.tp * (1 + volatilityFactor * 10) * (strongTrend ? 1.2 : 1);

        const slPrice = trailingStopEnabled 
          ? highestPrice * (1 - dynamicSL)
          : entryPrice * (1 - dynamicSL);
        const tpPrice = entryPrice * (1 + dynamicTP);

        // Exit conditions with momentum confirmation
        const trendReversal = emaFast < emaSlow && !momentum;
        const rsiOverbought = rsi > 78;
        const bearishMomentum = currentPrice < this.calculateEMA(slice.slice(-3), 3);

        if (executionPrice < slPrice || executionPrice > tpPrice || (trendReversal && bearishMomentum) || rsiOverbought) {
          const exitValue = (position * executionPrice) * (1 - fee);
          const tradePnl = exitValue - (position * entryPrice);
          balance = balance + exitValue;
          
          if (tradePnl > 0) {
            wins++;
            grossProfit += tradePnl;
            consecutiveLosses = 0;
          } else {
            grossLoss += Math.abs(tradePnl);
            consecutiveLosses++;
            if (consecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = consecutiveLosses;
          }
          
          tradeLog.push({ time: currentTime, side: 'SELL', price: executionPrice, pnl: tradePnl });
          position = 0;
          trades++;
          highestPrice = 0;
        }
      }
    }

    // Close any open position at end
    if (position > 0) {
      const finalPrice = closes[closes.length - 1] * (1 - slippage);
      const exitValue = (position * finalPrice) * (1 - fee);
      balance = balance + exitValue;
    }

    const finalEquity = balance;
    
    // Calculate returns for Sharpe ratio
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      returns.push((equityCurve[i].value - equityCurve[i-1].value) / equityCurve[i-1].value);
    }
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length) : 0.001;
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365 * 24) : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 10 : 0;

    const sampledCurve = equityCurve.filter((_, i) => i % Math.max(1, Math.floor(equityCurve.length / 100)) === 0);

    return {
      botId,
      symbol,
      days,
      totalTrades: trades,
      winRate: trades > 0 ? (wins / trades) * 100 : 0,
      netProfit: finalEquity - initialBalance,
      maxDrawdown: maxDD * 100,
      equityCurve: sampledCurve,
      tradeLog,
      rsiThreshold,
      emaFast: emaFastPeriod,
      emaSlow: emaSlowPeriod,
      riskProfile: bot.riskProfile,
      sharpeRatio,
      profitFactor
    };
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    return 100 - (100 / (1 + (gains / period) / (losses / period || 1)));
  }

  private calculateEMA(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    return prices.reduce((acc, val) => val * k + acc * (1 - k), prices[0]);
  }

  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length < period + 1) return 0;
    let atr = 0;
    for (let i = highs.length - period; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      atr += tr;
    }
    return atr / period;
  }

  private detectBullishDivergence(prices: number[], rsiValues: number[]): boolean {
    if (prices.length < 10 || rsiValues.length < 10) return false;
    
    // Find recent lows
    const recentPrices = prices.slice(-10);
    const recentRsi = rsiValues.slice(-10);
    
    const priceMin1 = Math.min(...recentPrices.slice(0, 5));
    const priceMin2 = Math.min(...recentPrices.slice(5));
    const rsiMin1 = Math.min(...recentRsi.slice(0, 5));
    const rsiMin2 = Math.min(...recentRsi.slice(5));
    
    // Bullish divergence: price making lower low, RSI making higher low
    return priceMin2 < priceMin1 * 1.01 && rsiMin2 > rsiMin1 * 1.05 && rsiMin2 < 40;
  }
}

export const backtestEngine = new BacktestEngine();
