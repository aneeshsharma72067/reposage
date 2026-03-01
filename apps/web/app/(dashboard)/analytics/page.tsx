'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { getAccessToken, listRepositories, listRepositoryAnalysisRuns } from '@/lib/auth';
import type { RepositoryAnalysisRun } from '@/types/analysis';
import type { RepositoryListItem } from '@/types/repository';

interface AggregatedRun extends RepositoryAnalysisRun {
  repository: {
    id: string;
    name: string;
    fullName: string;
  };
}

interface TrendPoint {
  label: string;
  total: number;
  completed: number;
  failed: number;
}

function toReadableDate(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
}

function formatShortDate(value: Date): string {
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'PUSH':
      return 'Push';
    case 'PR_OPENED':
      return 'PR Opened';
    case 'PR_MERGED':
      return 'PR Merged';
    default:
      return type;
  }
}

function runStatusStyle(status: string): {
  icon: typeof Activity;
  label: string;
  text: string;
  badge: string;
  pip: string;
  isRunning: boolean;
} {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        label: 'Completed',
        text: 'text-emerald-300',
        badge: 'bg-emerald-500/10 border-emerald-400/30',
        pip: 'bg-emerald-300',
        isRunning: false,
      };
    case 'RUNNING':
      return {
        icon: Loader2,
        label: 'Running',
        text: 'text-cyan-300',
        badge: 'bg-cyan-500/10 border-cyan-400/30',
        pip: 'bg-cyan-300',
        isRunning: true,
      };
    case 'FAILED':
      return {
        icon: XCircle,
        label: 'Failed',
        text: 'text-rose-300',
        badge: 'bg-rose-500/10 border-rose-400/30',
        pip: 'bg-rose-300',
        isRunning: false,
      };
    case 'PENDING':
    default:
      return {
        icon: Clock3,
        label: 'Pending',
        text: 'text-amber-300',
        badge: 'bg-amber-500/10 border-amber-400/30',
        pip: 'bg-amber-300',
        isRunning: false,
      };
  }
}

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        isPositive
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
          : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
      }`}
    >
      {isPositive ? '+' : ''}
      {value}%
    </span>
  );
}

function HeroMetricCard({
  title,
  value,
  subtitle,
  trend,
  glowClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: number;
  glowClass: string;
}) {
  return (
    <motion.div
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md shadow-[0_25px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${glowClass}`}
      />
      <div className="relative">
        <p className="text-[12px] uppercase tracking-[0.09em] text-white/50">{title}</p>
        <p className="mt-2 text-[44px] font-bold leading-none tracking-tight text-white">{value}</p>
        <div className="mt-3 flex items-center gap-2">
          <TrendBadge value={trend} />
          <span className="text-[12px] text-white/45">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );
}

function MiniMetricCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <motion.div
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
    >
      <p className="text-[11px] uppercase tracking-[0.09em] text-white/45">{label}</p>
      <p className={`mt-2 text-[32px] font-bold leading-none ${colorClass}`}>
        {value.toLocaleString()}
      </p>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [analysisRuns, setAnalysisRuns] = useState<AggregatedRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAnalysisRuns = async () => {
    setIsLoading(true);

    try {
      const repositories: RepositoryListItem[] = await listRepositories();

      const perRepoRuns = await Promise.allSettled(
        repositories.map(async (repository) => {
          const runs = await listRepositoryAnalysisRuns(repository.id);

          return runs.map((run) => ({
            ...run,
            repository: {
              id: repository.id,
              name: repository.name,
              fullName: repository.fullName,
            },
          }));
        }),
      );

      const flattenedRuns = perRepoRuns
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .sort((left, right) => {
          const leftTime = new Date(left.event.createdAt).getTime();
          const rightTime = new Date(right.event.createdAt).getTime();
          return rightTime - leftTime;
        });

      setAnalysisRuns(flattenedRuns);
      setErrorMessage(null);
    } catch {
      setAnalysisRuns([]);
      setErrorMessage('Unable to load analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    void loadAnalysisRuns();
  }, []);

  const metrics = useMemo(() => {
    const total = analysisRuns.length;
    const completed = analysisRuns.filter((run) => run.status === 'COMPLETED').length;
    const running = analysisRuns.filter((run) => run.status === 'RUNNING').length;
    const pending = analysisRuns.filter((run) => run.status === 'PENDING').length;
    const failed = analysisRuns.filter((run) => run.status === 'FAILED').length;

    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      running,
      pending,
      failed,
      successRate,
    };
  }, [analysisRuns]);

  const trendData = useMemo<TrendPoint[]>(() => {
    const days = 10;
    const buckets = new Map<string, TrendPoint>();

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);

      buckets.set(key, {
        label: formatShortDate(date),
        total: 0,
        completed: 0,
        failed: 0,
      });
    }

    analysisRuns.forEach((run) => {
      const createdDate = new Date(run.event.createdAt);
      if (Number.isNaN(createdDate.getTime())) {
        return;
      }

      const bucketDate = new Date(createdDate);
      bucketDate.setHours(0, 0, 0, 0);
      const key = bucketDate.toISOString().slice(0, 10);
      const bucket = buckets.get(key);

      if (!bucket) {
        return;
      }

      bucket.total += 1;
      if (run.status === 'COMPLETED') {
        bucket.completed += 1;
      }
      if (run.status === 'FAILED') {
        bucket.failed += 1;
      }
    });

    return Array.from(buckets.values());
  }, [analysisRuns]);

  const trendDelta = useMemo(() => {
    if (trendData.length < 2) {
      return 0;
    }

    const split = Math.floor(trendData.length / 2);
    const previous = trendData.slice(0, split).reduce((sum, item) => sum + item.total, 0);
    const latest = trendData.slice(split).reduce((sum, item) => sum + item.total, 0);

    if (previous === 0) {
      return latest > 0 ? 100 : 0;
    }

    return Math.round(((latest - previous) / previous) * 100);
  }, [trendData]);

  const successTrendDelta = useMemo(() => {
    if (trendData.length < 2) {
      return 0;
    }

    const split = Math.floor(trendData.length / 2);

    const previousTotal = trendData.slice(0, split).reduce((sum, item) => sum + item.total, 0);
    const previousCompleted = trendData
      .slice(0, split)
      .reduce((sum, item) => sum + item.completed, 0);

    const latestTotal = trendData.slice(split).reduce((sum, item) => sum + item.total, 0);
    const latestCompleted = trendData.slice(split).reduce((sum, item) => sum + item.completed, 0);

    const previousRate = previousTotal > 0 ? previousCompleted / previousTotal : 0;
    const latestRate = latestTotal > 0 ? latestCompleted / latestTotal : 0;

    return Math.round((latestRate - previousRate) * 100);
  }, [trendData]);

  return (
    <main className="relative flex h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.16),transparent_40%),radial-gradient(circle_at_85%_18%,rgba(168,85,247,0.14),transparent_42%),radial-gradient(circle_at_50%_85%,rgba(16,185,129,0.12),transparent_46%)]" />
      <AppSidebar />

      <section className="relative z-10 flex h-screen flex-1 flex-col overflow-y-auto">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/20 px-6 backdrop-blur-md">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white/95">Analytics</h1>
            <p className="text-[12px] text-white/50">
              Analysis Intelligence • Cross-repository metrics
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAnalysisRuns()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-white/80 backdrop-blur-md transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </header>

        <div className="px-6 py-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="glass-panel animate-pulse rounded-2xl p-6 xl:col-span-6">
                <div className="h-4 w-1/3 rounded bg-white/[0.1]" />
                <div className="mt-4 h-12 w-2/3 rounded bg-white/[0.08]" />
                <div className="mt-4 h-4 w-1/2 rounded bg-white/[0.06]" />
              </div>
              <div className="glass-panel animate-pulse rounded-2xl p-6 xl:col-span-6">
                <div className="h-4 w-1/3 rounded bg-white/[0.1]" />
                <div className="mt-4 h-12 w-2/3 rounded bg-white/[0.08]" />
                <div className="mt-4 h-4 w-1/2 rounded bg-white/[0.06]" />
              </div>

              <div className="glass-panel animate-pulse rounded-2xl p-6 xl:col-span-8">
                <div className="h-4 w-1/4 rounded bg-white/[0.1]" />
                <div className="mt-4 h-[240px] rounded-xl bg-white/[0.06]" />
              </div>
              <div className="glass-panel animate-pulse rounded-2xl p-6 xl:col-span-4">
                <div className="h-4 w-1/3 rounded bg-white/[0.1]" />
                <div className="mt-4 h-[240px] rounded-xl bg-white/[0.06]" />
              </div>

              <div className="glass-panel animate-pulse rounded-2xl p-6 xl:col-span-12">
                <div className="h-4 w-1/4 rounded bg-white/[0.1]" />
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-12 rounded-xl bg-white/[0.06]" />
                  ))}
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-[14px] text-rose-300 backdrop-blur-md">
              {errorMessage}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
              className="grid grid-cols-1 gap-4 xl:grid-cols-12"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                className="xl:col-span-6"
              >
                <HeroMetricCard
                  title="Total Runs"
                  value={metrics.total.toLocaleString()}
                  subtitle="vs previous window"
                  trend={trendDelta}
                  glowClass="bg-cyan-500/20"
                />
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                className="xl:col-span-6"
              >
                <HeroMetricCard
                  title="Success Rate"
                  value={`${metrics.successRate.toFixed(1)}%`}
                  subtitle="completion efficiency"
                  trend={successTrendDelta}
                  glowClass="bg-emerald-500/20"
                />
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                className="xl:col-span-3"
              >
                <MiniMetricCard
                  label="Pending"
                  value={metrics.pending}
                  colorClass="text-amber-300"
                />
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                className="xl:col-span-3"
              >
                <MiniMetricCard label="Failed" value={metrics.failed} colorClass="text-rose-300" />
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md shadow-[0_22px_70px_rgba(0,0,0,0.42)] xl:col-span-6"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[17px] font-semibold text-white/90">Analysis Trend</h2>
                    <p className="text-[11px] text-white/45">Last 10 days</p>
                  </div>

                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendData}
                        margin={{ top: 10, right: 6, left: -18, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient id="trend-total" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
                          </linearGradient>
                          <linearGradient id="trend-completed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(12,12,14,0.88)',
                            border: '1px solid rgba(255,255,255,0.14)',
                            borderRadius: 12,
                            backdropFilter: 'blur(12px)',
                          }}
                          labelStyle={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          fill="url(#trend-total)"
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#trend-completed)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
                className="xl:col-span-12"
              >
                <motion.section
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-[0_22px_70px_rgba(0,0,0,0.45)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[18px] font-semibold text-white/92">Analysis Runs</h2>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/45">
                      {analysisRuns.length} records
                    </p>
                  </div>

                  {analysisRuns.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-[13px] text-white/55">
                      No analysis runs found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {analysisRuns.map((run, index) => {
                        const style = runStatusStyle(run.status);
                        const StatusIcon = style.icon;

                        return (
                          <motion.article
                            key={run.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + index * 0.02, duration: 0.2 }}
                            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md transition hover:border-cyan-300/25"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  href={`/repositories/${run.repository.id}`}
                                  className="truncate text-[14px] font-semibold text-white hover:text-cyan-200"
                                >
                                  {run.repository.fullName}
                                </Link>
                                <p className="mt-0.5 text-[11px] text-white/45">{run.id}</p>
                              </div>

                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.badge} ${style.text}`}
                              >
                                <span
                                  className={`relative inline-flex h-2 w-2 rounded-full ${style.pip}`}
                                >
                                  {style.isRunning ? (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/70" />
                                  ) : null}
                                </span>
                                <StatusIcon
                                  className={`h-3.5 w-3.5 ${style.text} ${style.isRunning ? 'animate-spin' : ''}`}
                                />
                                {style.label}
                              </span>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-1 text-[12px] text-white/60 md:grid-cols-4">
                              <p>
                                <span className="text-white/35">Event:</span>{' '}
                                {eventTypeLabel(run.event.type)}
                              </p>
                              <p>
                                <span className="text-white/35">Triggered:</span>{' '}
                                {toReadableDate(run.event.createdAt)}
                              </p>
                              <p>
                                <span className="text-white/35">Started:</span>{' '}
                                {toReadableDate(run.startedAt)}
                              </p>
                              <p>
                                <span className="text-white/35">Completed:</span>{' '}
                                {toReadableDate(run.completedAt)}
                              </p>
                            </div>

                            {run.errorMessage ? (
                              <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <p>{run.errorMessage}</p>
                                </div>
                              </div>
                            ) : null}
                          </motion.article>
                        );
                      })}
                    </div>
                  )}
                </motion.section>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
