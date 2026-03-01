interface RepoHealthSummaryProps {
  healthy: number;
  issuesFound: number;
  analyzing: number;
  idle: number;
}

interface Segment {
  key: string;
  label: string;
  value: number;
  colorClass: string;
  barClass: string;
}

export function RepoHealthSummary({
  healthy,
  issuesFound,
  analyzing,
  idle,
}: RepoHealthSummaryProps) {
  const segments: Segment[] = [
    {
      key: 'healthy',
      label: 'Healthy',
      value: healthy,
      colorClass: 'text-emerald-300',
      barClass: 'bg-emerald-400/85',
    },
    {
      key: 'issues',
      label: 'Issues Found',
      value: issuesFound,
      colorClass: 'text-rose-300',
      barClass: 'bg-rose-400/85',
    },
    {
      key: 'analyzing',
      label: 'Analyzing',
      value: analyzing,
      colorClass: 'text-cyan-300',
      barClass: 'bg-cyan-400/85',
    },
    {
      key: 'idle',
      label: 'Idle',
      value: idle,
      colorClass: 'text-white/70',
      barClass: 'bg-white/35',
    },
  ];

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold text-white/90">Repository Health Overview</h2>
        <p className="text-[12px] text-white/45">
          Current system-wide repository state distribution
        </p>
      </div>

      <div className="glass-panel-soft flex h-5 overflow-hidden rounded-full">
        {segments.map((segment) => {
          const width = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={segment.key}
              className={segment.barClass}
              style={{ width: `${width}%` }}
              title={`${segment.label}: ${segment.value}`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {segments.map((segment) => (
          <div key={segment.key} className="glass-panel-soft rounded-xl px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/45">{segment.label}</p>
            <p className={`mt-1 text-[24px] font-bold leading-none ${segment.colorClass}`}>
              {segment.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
