import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface EquityCurveProps {
  data: { timestamp: string; balance: number }[];
}

export default function EquityCurve({ data }: EquityCurveProps) {
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    balance: d.balance,
  }));

  const minBalance = Math.min(...chartData.map(d => d.balance));
  const maxBalance = Math.max(...chartData.map(d => d.balance));
  const isProfit = chartData.length > 1 && chartData[chartData.length - 1].balance >= chartData[0].balance;

  return (
    <div className="h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isProfit ? "#00ff88" : "#ff4444"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isProfit ? "#00ff88" : "#ff4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis 
            domain={[minBalance * 0.99, maxBalance * 1.01]} 
            tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={isProfit ? "#00ff88" : "#ff4444"}
            strokeWidth={2}
            fill="url(#equityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
