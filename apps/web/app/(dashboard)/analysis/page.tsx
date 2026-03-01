'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from 'lucide-react';
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

function runStatusStyle(status: string): {
  icon: typeof Activity;
  label: string;
  badgeClass: string;
  iconClass: string;
} {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        label: 'Completed',
        badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        iconClass: 'text-emerald-300',
      };
    case 'RUNNING':
      return {
        icon: Loader2,
        label: 'Running',
        badgeClass: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
        iconClass: 'text-cyan-300 animate-spin',
      };
    case 'FAILED':
      return {
        icon: XCircle,
        label: 'Failed',
        badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
        iconClass: 'text-rose-300',
      };
    case 'PENDING':
    default:
      return {
        icon: Clock3,
        label: 'Pending',
        badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        iconClass: 'text-amber-300',
      };
  }
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

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`glass-panel-soft rounded-tokenLg border px-4 py-4 ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-white/60">{label}</p>
      <p className="mt-2 text-[28px] font-bold tracking-tight text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function AnalysisPage() {
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
      setErrorMessage('Unable to load analysis data. Please try again.');
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
    const completed = analysisRuns.filter((run) => run.status === 'COMPLETED').length;
    const running = analysisRuns.filter((run) => run.status === 'RUNNING').length;
    const pending = analysisRuns.filter((run) => run.status === 'PENDING').length;
    const failed = analysisRuns.filter((run) => run.status === 'FAILED').length;

    return {
      total: analysisRuns.length,
      completed,
      running,
      pending,
      failed,
      activeRepos: new Set(analysisRuns.map((run) => run.repository.id)).size,
    };
  }, [analysisRuns]);

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <header className="glass-header flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sm:py-0">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-white/90">
              Analysis Agent
            </h1>
            <p className="text-[11px] text-white/35">All repositories • analysis lifecycle view</p>
          </div>

          <button
            type="button"
            onClick={() => void loadAnalysisRuns()}
            className="glass-input inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        <div className="content-wrap">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MetricCard
              label="Total Runs"
              value={metrics.total}
              className="border-white/[0.1] bg-gradient-to-br from-[#1a1a1a] to-[#121212]"
            />
            <MetricCard
              label="Completed"
              value={metrics.completed}
              className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-950/40"
            />
            <MetricCard
              label="Running"
              value={metrics.running}
              className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-950/40"
            />
            <MetricCard
              label="Pending"
              value={metrics.pending}
              className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-950/40"
            />
            <MetricCard
              label="Failed"
              value={metrics.failed}
              className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-950/40"
            />
            <MetricCard
              label="Repos Covered"
              value={metrics.activeRepos}
              className="border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-950/40"
            />
          </section>

          <section className="glass-panel mt-6 rounded-tokenLg p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[20px] font-semibold tracking-tight text-white/90">
                Analysis Runs
              </h2>
              <span className="text-[12px] text-white/40">Latest first</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="glass-panel-soft animate-pulse rounded-tokenMd px-4 py-4"
                  >
                    <div className="h-4 w-1/3 rounded bg-white/[0.08]" />
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                      <div className="h-3 rounded bg-white/[0.06]" />
                      <div className="h-3 rounded bg-white/[0.06]" />
                      <div className="h-3 rounded bg-white/[0.06]" />
                      <div className="h-3 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <div className="rounded-tokenMd border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-[13px] text-rose-300">
                {errorMessage}
              </div>
            ) : analysisRuns.length === 0 ? (
              <div className="glass-panel-soft rounded-tokenMd px-4 py-6 text-center text-[13px] text-white/45">
                No analysis runs found yet.
              </div>
            ) : (
              <div className="space-y-3">
                {analysisRuns.map((run) => {
                  const style = runStatusStyle(run.status);
                  const StatusIcon = style.icon;

                  return (
                    <article key={run.id} className="glass-panel-soft rounded-tokenMd px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/repositories/${run.repository.id}`}
                            className="truncate text-[14px] font-semibold text-white/90 hover:text-white"
                          >
                            {run.repository.fullName}
                          </Link>
                          <p className="mt-0.5 text-[12px] text-white/45">Run: {run.id}</p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${style.badgeClass}`}
                        >
                          <StatusIcon className={`h-3.5 w-3.5 ${style.iconClass}`} />
                          {style.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-white/55 md:grid-cols-4">
                        <p>
                          <span className="text-white/30">Event:</span>{' '}
                          {eventTypeLabel(run.event.type)}
                        </p>
                        <p>
                          <span className="text-white/30">Triggered:</span>{' '}
                          {toReadableDate(run.event.createdAt)}
                        </p>
                        <p>
                          <span className="text-white/30">Started:</span>{' '}
                          {toReadableDate(run.startedAt)}
                        </p>
                        <p>
                          <span className="text-white/30">Completed:</span>{' '}
                          {toReadableDate(run.completedAt)}
                        </p>
                      </div>

                      {run.errorMessage ? (
                        <div className="mt-3 rounded-tokenSm border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
                          {run.errorMessage}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
