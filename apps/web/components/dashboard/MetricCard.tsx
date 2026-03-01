import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName: string;
  trend?: number;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend,
}: MetricCardProps) {
  const hasTrend = typeof trend === 'number';
  const isPositive = (trend ?? 0) >= 0;

  return (
    <article className="glass-panel flex-1 group relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:border-white/20">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/[0.05] blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/45">
            {label}
          </p>
          <p className="mt-2 text-[30px] font-bold leading-none tracking-tight text-white sm:text-[34px]">
            {value}
          </p>
          <p className="mt-2 text-[12px] text-white/45">{subtitle}</p>
        </div>

        <div
          className={`glass-panel-soft flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {hasTrend ? (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px]">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-300" />
          ) : (
            <TrendingDown className="h-3 w-3 text-rose-300" />
          )}
          <span className={isPositive ? 'text-emerald-300' : 'text-rose-300'}>
            {isPositive ? '+' : ''}
            {trend}%
          </span>
        </div>
      ) : null}
    </article>
  );
}
