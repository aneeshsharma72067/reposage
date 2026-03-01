'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, FolderGit2, Radar, ShieldAlert } from 'lucide-react';
import { ActivityFeed, type ActivityFeedItem } from '@/components/dashboard/ActivityFeed';
import {
  AnalysisTrendChart,
  type AnalysisTrendPoint,
} from '@/components/dashboard/AnalysisTrendChart';
import { FindingsDonutChart } from '@/components/dashboard/FindingsDonutChart';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  RepositoryTable,
  type DashboardRepositoryRow,
} from '@/components/dashboard/RepositoryTable';
import { RepoHealthSummary } from '@/components/dashboard/RepoHealthSummary';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import {
  getAccessToken,
  listRepositories,
  listRepositoryAnalysisRuns,
  listRepositoryFindings,
} from '@/lib/auth';
import type { RepositoryAnalysisRun } from '@/types/analysis';
import type { RepositoryFinding } from '@/types/finding';
import type { RepositoryListItem } from '@/types/repository';

type RepositoryStatus = 'IDLE' | 'ANALYZING' | 'HEALTHY' | 'ISSUES_FOUND';

interface DashboardDataset {
  repository: RepositoryListItem;
  runs: RepositoryAnalysisRun[];
  findings: RepositoryFinding[];
}

interface HealthCounters {
  healthy: number;
  issuesFound: number;
  analyzing: number;
  idle: number;
}

function normalizeRepositoryStatus(status: string): RepositoryStatus {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'HEALTHY':
      return 'HEALTHY';
    case 'ISSUES_FOUND':
      return 'ISSUES_FOUND';
    case 'ANALYZING':
      return 'ANALYZING';
    default:
      return 'IDLE';
  }
}

function normalizeRunStatus(status: string): 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'RUNNING':
      return 'RUNNING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

function normalizeFindingSeverity(severity: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  const normalized = severity.toUpperCase();

  switch (normalized) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'WARNING':
      return 'WARNING';
    default:
      return 'INFO';
  }
}

function toStartOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function toShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function toTimestampLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString();
}

function toTrendPercentage(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass-panel h-[154px] animate-pulse rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass-panel h-[380px] animate-pulse rounded-2xl xl:col-span-2" />
        <div className="glass-panel h-[380px] animate-pulse rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass-panel h-[320px] animate-pulse rounded-2xl xl:col-span-2" />
        <div className="glass-panel h-[320px] animate-pulse rounded-2xl" />
      </div>

      <div className="glass-panel h-[420px] animate-pulse rounded-2xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [dataset, setDataset] = useState<DashboardDataset[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);

    try {
      const repositories = await listRepositories();

      const joinedData = await Promise.all(
        repositories.map(async (repository): Promise<DashboardDataset> => {
          const [runsResult, findingsResult] = await Promise.allSettled([
            listRepositoryAnalysisRuns(repository.id),
            listRepositoryFindings(repository.id),
          ]);

          return {
            repository,
            runs: runsResult.status === 'fulfilled' ? runsResult.value : [],
            findings: findingsResult.status === 'fulfilled' ? findingsResult.value : [],
          };
        }),
      );

      setDataset(joinedData);
      setErrorMessage(null);
    } catch {
      setDataset([]);
      setErrorMessage('Unable to load dashboard analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    void loadDashboard();
  }, []);

  const repositories = useMemo(() => dataset.map((item) => item.repository), [dataset]);

  const allRuns = useMemo(
    () =>
      dataset.flatMap((item) =>
        item.runs.map((run) => ({
          ...run,
          repositoryId: item.repository.id,
          repositoryName: item.repository.name,
          repositoryFullName: item.repository.fullName,
        })),
      ),
    [dataset],
  );

  const allFindings = useMemo(
    () =>
      dataset.flatMap((item) =>
        item.findings.map((finding) => ({
          ...finding,
          repositoryId: item.repository.id,
          repositoryName: item.repository.name,
          repositoryFullName: item.repository.fullName,
        })),
      ),
    [dataset],
  );

  const now = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), [now]);
  const fourteenDaysAgo = useMemo(() => new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), [now]);

  const findingsLast7Days = useMemo(
    () =>
      allFindings.filter((finding) => {
        const createdAt = new Date(finding.createdAt);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= sevenDaysAgo;
      }),
    [allFindings, sevenDaysAgo],
  );

  const findingsPrev7Days = useMemo(
    () =>
      allFindings.filter((finding) => {
        const createdAt = new Date(finding.createdAt);
        return (
          !Number.isNaN(createdAt.getTime()) &&
          createdAt >= fourteenDaysAgo &&
          createdAt < sevenDaysAgo
        );
      }),
    [allFindings, fourteenDaysAgo, sevenDaysAgo],
  );

  const runsLast7Days = useMemo(
    () =>
      allRuns.filter((run) => {
        const createdAt = new Date(run.event.createdAt);
        return !Number.isNaN(createdAt.getTime()) && createdAt >= sevenDaysAgo;
      }),
    [allRuns, sevenDaysAgo],
  );

  const runsPrev7Days = useMemo(
    () =>
      allRuns.filter((run) => {
        const createdAt = new Date(run.event.createdAt);
        return (
          !Number.isNaN(createdAt.getTime()) &&
          createdAt >= fourteenDaysAgo &&
          createdAt < sevenDaysAgo
        );
      }),
    [allRuns, fourteenDaysAgo, sevenDaysAgo],
  );

  const criticalCount = useMemo(
    () =>
      allFindings.filter((finding) => normalizeFindingSeverity(finding.severity) === 'CRITICAL')
        .length,
    [allFindings],
  );

  const warningCount = useMemo(
    () =>
      allFindings.filter((finding) => normalizeFindingSeverity(finding.severity) === 'WARNING')
        .length,
    [allFindings],
  );

  const infoCount = useMemo(
    () =>
      allFindings.filter((finding) => normalizeFindingSeverity(finding.severity) === 'INFO').length,
    [allFindings],
  );

  const healthCounters = useMemo<HealthCounters>(() => {
    return repositories.reduce<HealthCounters>(
      (accumulator, repository) => {
        const status = normalizeRepositoryStatus(repository.status);

        if (status === 'HEALTHY') {
          accumulator.healthy += 1;
        } else if (status === 'ISSUES_FOUND') {
          accumulator.issuesFound += 1;
        } else if (status === 'ANALYZING') {
          accumulator.analyzing += 1;
        } else {
          accumulator.idle += 1;
        }

        return accumulator;
      },
      {
        healthy: 0,
        issuesFound: 0,
        analyzing: 0,
        idle: 0,
      },
    );
  }, [repositories]);

  const trendData = useMemo<AnalysisTrendPoint[]>(() => {
    const dayBuckets = new Map<string, AnalysisTrendPoint>();

    for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
      const date = toStartOfDay(new Date(now));
      date.setDate(date.getDate() - dayOffset);
      const key = date.toISOString().slice(0, 10);

      dayBuckets.set(key, {
        label: toShortDate(date),
        runs: 0,
      });
    }

    runsLast7Days.forEach((run) => {
      const runDate = toStartOfDay(new Date(run.event.createdAt));
      const key = runDate.toISOString().slice(0, 10);
      const bucket = dayBuckets.get(key);

      if (bucket) {
        bucket.runs += 1;
      }
    });

    return Array.from(dayBuckets.values());
  }, [now, runsLast7Days]);

  const repositoryRows = useMemo<DashboardRepositoryRow[]>(() => {
    const query = searchText.trim().toLowerCase();

    const rows = dataset.map((item) => {
      const lastAnalysis =
        item.runs
          .map((run) => run.completedAt ?? run.startedAt ?? run.event.createdAt)
          .filter((value): value is string => Boolean(value))
          .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

      const status = normalizeRepositoryStatus(item.repository.status);

      return {
        id: item.repository.id,
        name: item.repository.name,
        fullName: item.repository.fullName,
        visibility: item.repository.private ? 'Private' : 'Public',
        status,
        findingsCount: item.findings.length,
        lastAnalysisAt: lastAnalysis,
      } satisfies DashboardRepositoryRow;
    });

    if (!query) {
      return rows;
    }

    return rows.filter(
      (row) => row.name.toLowerCase().includes(query) || row.fullName.toLowerCase().includes(query),
    );
  }, [dataset, searchText]);

  const activityFeedItems = useMemo<ActivityFeedItem[]>(() => {
    const criticalEvents = allFindings
      .filter((finding) => normalizeFindingSeverity(finding.severity) === 'CRITICAL')
      .map((finding) => ({
        id: `critical-${finding.id}`,
        message: `Critical finding detected in ${finding.repositoryName}: ${finding.title}`,
        timestamp: toTimestampLabel(finding.createdAt),
        sortableTimestamp: new Date(finding.createdAt).getTime(),
        kind: 'critical' as const,
      }));

    const runEvents = allRuns.map((run) => {
      const runStatus = normalizeRunStatus(run.status);
      const eventType = run.event.type.toUpperCase();
      const timestampSource = run.completedAt ?? run.startedAt ?? run.event.createdAt;

      let kind: ActivityFeedItem['kind'] = 'info';
      let message = `Analysis ${runStatus.toLowerCase()} for ${run.repositoryName}`;

      if (eventType === 'PUSH') {
        kind = 'push';
        message = `Push event received for ${run.repositoryName}`;
      } else if (runStatus === 'COMPLETED') {
        kind = 'analysis';
        message = `Analysis completed for ${run.repositoryName}`;
      }

      return {
        id: `run-${run.id}`,
        message,
        timestamp: toTimestampLabel(timestampSource),
        sortableTimestamp: new Date(timestampSource).getTime(),
        kind,
      };
    });

    return [...criticalEvents, ...runEvents]
      .filter((item) => Number.isFinite(item.sortableTimestamp))
      .sort((left, right) => right.sortableTimestamp - left.sortableTimestamp)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        message: item.message,
        timestamp: item.timestamp,
        kind: item.kind,
      }));
  }, [allFindings, allRuns]);

  const topMetrics = useMemo(() => {
    const totalRepositories = repositories.length;
    const activeRepositories = repositories.filter((repository) => repository.isActive).length;
    const repositoriesWithIssues = healthCounters.issuesFound;
    const findingsSevenDays = findingsLast7Days.length;
    const runningAnalyses = allRuns.filter(
      (run) => normalizeRunStatus(run.status) === 'RUNNING',
    ).length;

    return {
      totalRepositories,
      activeRepositories,
      repositoriesWithIssues,
      findingsSevenDays,
      runningAnalyses,
      criticalFindings: criticalCount,
      runTrend: toTrendPercentage(runsLast7Days.length, runsPrev7Days.length),
      findingsTrend: toTrendPercentage(findingsLast7Days.length, findingsPrev7Days.length),
    };
  }, [
    repositories,
    healthCounters.issuesFound,
    findingsLast7Days.length,
    allRuns,
    criticalCount,
    runsLast7Days.length,
    runsPrev7Days.length,
    findingsPrev7Days.length,
  ]);

  const hasRepositories = repositories.length > 0;

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <DashboardHeader onSearchChange={setSearchText} />

        <div className="content-wrap">
          {isLoading ? (
            <DashboardLoadingSkeleton />
          ) : errorMessage ? (
            <section className="glass-panel rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-6 text-[14px] text-rose-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    void loadDashboard();
                  }}
                  className="rounded-full border border-rose-400/40 px-3 py-1 text-[12px]"
                >
                  Retry
                </button>
              </div>
            </section>
          ) : !hasRepositories ? (
            <section className="glass-panel mx-auto max-w-[860px] rounded-2xl p-8 text-center sm:p-10">
              <div className="glass-panel-soft mx-auto flex h-[90px] w-[90px] items-center justify-center rounded-2xl text-4xl">
                ⌥
              </div>
              <h2 className="mt-7 text-[30px] font-bold leading-tight sm:text-[36px]">
                No repositories found
              </h2>
              <p className="mx-auto mt-3 max-w-[620px] text-[14px] leading-[1.7] text-white/60 sm:text-[15px]">
                Connect your GitHub App installation to start receiving repository analytics,
                findings, and operational health insights.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void loadDashboard();
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-[14px] font-semibold text-white"
                >
                  Refresh
                </button>
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[14px] font-semibold text-black"
                >
                  + Connect GitHub App
                </Link>
              </div>
            </section>
          ) : (
            <div className="space-y-6">
              <section className="flex gap-6 flex-wrap">
                <MetricCard
                  label="Total Repositories"
                  value={topMetrics.totalRepositories.toLocaleString()}
                  subtitle="Connected workspace repositories"
                  icon={FolderGit2}
                  iconClassName="text-violet-300"
                />
                <MetricCard
                  label="Active Repositories"
                  value={topMetrics.activeRepositories.toLocaleString()}
                  subtitle="Marked as active"
                  icon={Activity}
                  iconClassName="text-emerald-300"
                />
                <MetricCard
                  label="Repositories With Issues"
                  value={topMetrics.repositoriesWithIssues.toLocaleString()}
                  subtitle="Current risk exposure"
                  icon={ShieldAlert}
                  iconClassName="text-rose-300"
                />
                <MetricCard
                  label="Total Findings (7d)"
                  value={topMetrics.findingsSevenDays.toLocaleString()}
                  subtitle="Last 7 days"
                  icon={Radar}
                  iconClassName="text-cyan-300"
                  trend={topMetrics.findingsTrend}
                />
                {/* <MetricCard
                  label="Critical Findings"
                  value={topMetrics.criticalFindings.toLocaleString()}
                  subtitle="Highest severity findings"
                  icon={AlertTriangle}
                  iconClassName="text-rose-300"
                /> */}
                <MetricCard
                  label="Running Analyses"
                  value={topMetrics.runningAnalyses.toLocaleString()}
                  subtitle="In-flight analysis runs"
                  icon={BarChart3}
                  iconClassName="text-amber-300"
                  trend={topMetrics.runTrend}
                />
              </section>

              <section className="flex gap-6">
                <div className="flex-[2]">
                  <AnalysisTrendChart data={trendData} />
                </div>
                <FindingsDonutChart
                  info={infoCount}
                  warning={warningCount}
                  critical={criticalCount}
                />
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <RepoHealthSummary
                    healthy={healthCounters.healthy}
                    issuesFound={healthCounters.issuesFound}
                    analyzing={healthCounters.analyzing}
                    idle={healthCounters.idle}
                  />
                </div>
                <ActivityFeed items={activityFeedItems} />
              </section>

              <RepositoryTable rows={repositoryRows} initialSearch={searchText} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
