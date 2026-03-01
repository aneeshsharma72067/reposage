import { Activity, AlertTriangle, CheckCircle2, GitCommitHorizontal } from 'lucide-react';

export interface ActivityFeedItem {
  id: string;
  message: string;
  timestamp: string;
  kind: 'analysis' | 'critical' | 'push' | 'info';
}

interface ActivityFeedProps {
  items: ActivityFeedItem[];
}

function kindConfig(kind: ActivityFeedItem['kind']) {
  switch (kind) {
    case 'analysis':
      return {
        icon: CheckCircle2,
        iconClass: 'text-emerald-300',
        badgeClass: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
        label: 'Completed',
      };
    case 'critical':
      return {
        icon: AlertTriangle,
        iconClass: 'text-rose-300',
        badgeClass: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
        label: 'Critical',
      };
    case 'push':
      return {
        icon: GitCommitHorizontal,
        iconClass: 'text-cyan-300',
        badgeClass: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300',
        label: 'Push',
      };
    default:
      return {
        icon: Activity,
        iconClass: 'text-white/70',
        badgeClass: 'border-white/15 bg-white/[0.06] text-white/70',
        label: 'Event',
      };
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold text-white/90">Recent Activity Feed</h2>
        <p className="text-[12px] text-white/45">Latest analysis and event updates</p>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel-soft rounded-xl px-4 py-6 text-center text-[13px] text-white/50">
          No activity recorded yet.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const config = kindConfig(item.kind);
            const Icon = config.icon;

            return (
              <li key={item.id} className="glass-panel-soft rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${config.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-white/85">{item.message}</p>
                    <p className="mt-1 text-[11px] text-white/45">{item.timestamp}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
