'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface FindingsDonutChartProps {
  info: number;
  warning: number;
  critical: number;
}

const COLORS = {
  INFO: 'rgba(34,211,238,0.9)',
  WARNING: 'rgba(251,191,36,0.9)',
  CRITICAL: 'rgba(251,113,133,0.9)',
};

export function FindingsDonutChart({ info, warning, critical }: FindingsDonutChartProps) {
  const total = info + warning + critical;
  const chartData = [
    { name: 'Info', value: info, color: COLORS.INFO },
    { name: 'Warning', value: warning, color: COLORS.WARNING },
    { name: 'Critical', value: critical, color: COLORS.CRITICAL },
  ];

  return (
    <section className="glass-panel flex-1 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold text-white/90">Findings Distribution</h2>
        <p className="text-[12px] text-white/45">Severity split from latest findings</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px] lg:items-center">
        <div className="relative h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={66}
                outerRadius={92}
                paddingAngle={4}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(12, 12, 15, 0.9)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Findings']}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] uppercase tracking-[0.1em] text-white/45">Total</p>
            <p className="mt-1 text-[30px] font-bold leading-none text-white">
              {total.toLocaleString()}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {chartData.map((item) => (
            <li
              key={item.name}
              className="glass-panel-soft flex items-center justify-between rounded-xl px-3 py-2"
            >
              <span className="inline-flex items-center gap-2 text-[12px] text-white/75">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="text-[13px] font-semibold text-white/90">
                {item.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
