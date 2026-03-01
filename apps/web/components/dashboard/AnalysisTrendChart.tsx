'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface AnalysisTrendPoint {
  label: string;
  runs: number;
}

interface AnalysisTrendChartProps {
  data: AnalysisTrendPoint[];
}

export function AnalysisTrendChart({ data }: AnalysisTrendChartProps) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">Analysis Trends</h2>
          <p className="text-[12px] text-white/45">Runs over the last 7 days</p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={24}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.18)' }}
              contentStyle={{
                background: 'rgba(12, 12, 15, 0.9)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '12px',
                color: '#fff',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
            />
            <Line
              type="monotone"
              dataKey="runs"
              stroke="rgba(56,189,248,0.9)"
              strokeWidth={2.5}
              dot={{ r: 2, fill: 'rgba(56,189,248,0.95)' }}
              activeDot={{ r: 4, fill: 'rgba(56,189,248,1)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
