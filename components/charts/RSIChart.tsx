import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';

interface RSIChartProps {
  symbol: string;
  threshold?: number;
}

export default function RSIChart({ symbol, threshold = 45 }: RSIChartProps) {
  const [data, setData] = useState<{ time: string; rsi: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/market/${encodeURIComponent(symbol)}/rsi`);
        if (res.ok) {
          const rsiData = await res.json();
          setData(rsiData);
        }
      } catch (e) {
        console.error('Failed to fetch RSI', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="h-[100px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} hide />
          <ReferenceLine y={threshold} stroke="#00ff88" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={70} stroke="#ff4444" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={30} stroke="#00ff88" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="rsi"
            stroke="#00ff88"
            strokeWidth={1}
            fill="url(#rsiGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
