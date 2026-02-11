import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts';

interface PriceChartProps {
  symbol: string;
  emaFast?: number;
  emaSlow?: number;
}

interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function PriceChart({ symbol, emaFast = 9, emaSlow = 21 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/market/${encodeURIComponent(symbol)}/ohlcv`);
        if (res.ok) {
          const ohlcv = await res.json();
          setData(ohlcv);
        }
      } catch (e) {
        console.error('Failed to fetch OHLCV', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff4444',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff4444',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff4444',
    });

    const candleData = data.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candlestickSeries.setData(candleData);

    const calculateEMA = (prices: number[], period: number): number[] => {
      const k = 2 / (period + 1);
      const emaArray: number[] = [];
      let ema = prices[0];
      for (let i = 0; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
        emaArray.push(ema);
      }
      return emaArray;
    };

    const closes = data.map(d => d.close);
    const emaFastData = calculateEMA(closes, emaFast);
    const emaSlowData = calculateEMA(closes, emaSlow);

    const emaFastSeries = chart.addSeries(LineSeries, {
      color: '#00ff88',
      lineWidth: 1,
      priceLineVisible: false,
    });
    emaFastSeries.setData(data.map((d, i) => ({ time: d.time as any, value: emaFastData[i] })));

    const emaSlowSeries = chart.addSeries(LineSeries, {
      color: '#ff8800',
      lineWidth: 1,
      priceLineVisible: false,
    });
    emaSlowSeries.setData(data.map((d, i) => ({ time: d.time as any, value: emaSlowData[i] })));

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, emaFast, emaSlow]);

  if (loading) {
    return (
      <div className="h-[350px] flex items-center justify-center text-white/20 font-mono text-[10px] uppercase tracking-widest">
        Loading Chart...
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full" />
      <div className="absolute top-2 left-2 flex gap-4 text-[8px] font-mono uppercase">
        <span className="text-[#00ff88]">EMA {emaFast}</span>
        <span className="text-[#ff8800]">EMA {emaSlow}</span>
      </div>
    </div>
  );
}
