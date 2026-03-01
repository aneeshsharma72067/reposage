'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { RepositoryHeader } from '@/components/layout/repository-header';
import {
  getAccessToken,
  getRepositoryDetails,
  listRepositoryAnalysisRuns,
  listRepositoryFindings,
} from '@/lib/auth';
import type { RepositoryAnalysisRun } from '@/types/analysis';
import type { RepositoryFinding } from '@/types/finding';
import type { RepositoryDetails } from '@/types/repository';

function toReadableDate(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass-panel-soft rounded-tokenLg px-4 py-4">
      <div className="flex items-center gap-2">
        <span className="glass-panel-soft inline-flex h-7 w-7 items-center justify-center rounded-tokenMd text-[14px]">
          {icon}
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">{label}</p>
      </div>
      <p className="mt-3 text-[24px] font-bold text-white">{value}</p>
    </div>
  );
}

function findingSeverityStyle(severity: string): { badge: string; dot: string; label: string } {
  switch (severity) {
    case 'CRITICAL':
      return {
        badge: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
        dot: 'bg-rose-400',
        label: 'Critical',
      };
    case 'WARNING':
      return {
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        dot: 'bg-amber-400',
        label: 'Warning',
      };
    case 'INFO':
    default:
      return {
        badge: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
        dot: 'bg-cyan-400',
        label: 'Info',
      };
  }
}

function toRunStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'RUNNING':
      return 'Running';
    case 'FAILED':
      return 'Failed';
    case 'PENDING':
      return 'Pending';
    default:
      return status;
  }
}

function renderFindingMetadata(metadata: unknown): string {
  if (!metadata) {
    return 'No metadata';
  }

  if (typeof metadata === 'string') {
    return metadata;
  }

  if (typeof metadata === 'number' || typeof metadata === 'boolean') {
    return String(metadata);
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return 'Metadata unavailable';
  }
}

function analysisRunStatusStyle(status: string): {
  icon: typeof Activity;
  badgeClass: string;
  label: string;
  iconClass: string;
} {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        label: 'Completed',
        iconClass: 'text-emerald-300',
      };
    case 'RUNNING':
      return {
        icon: Loader2,
        badgeClass: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
        label: 'Running',
        iconClass: 'text-cyan-300 animate-spin',
      };
    case 'FAILED':
      return {
        icon: XCircle,
        badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
        label: 'Failed',
        iconClass: 'text-rose-300',
      };
    case 'PENDING':
    default:
      return {
        icon: Clock3,
        badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        label: 'Pending',
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

export default function RepositoryDetailPage() {
  const params = useParams<{ repositoryId: string }>();
  const [repository, setRepository] = useState<RepositoryDetails | null>(null);
  const [analysisRuns, setAnalysisRuns] = useState<RepositoryAnalysisRun[]>([]);
  const [findings, setFindings] = useState<RepositoryFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const analysisSummary = useMemo(() => {
    const completed = analysisRuns.filter((run) => run.status === 'COMPLETED').length;
    const running = analysisRuns.filter((run) => run.status === 'RUNNING').length;
    const failed = analysisRuns.filter((run) => run.status === 'FAILED').length;
    const pending = analysisRuns.filter((run) => run.status === 'PENDING').length;

    return {
      completed,
      running,
      failed,
      pending,
      total: analysisRuns.length,
    };
  }, [analysisRuns]);

  const findingsSummary = useMemo(() => {
    const critical = findings.filter((finding) => finding.severity === 'CRITICAL').length;
    const warning = findings.filter((finding) => finding.severity === 'WARNING').length;
    const info = findings.filter((finding) => finding.severity === 'INFO').length;

    return {
      critical,
      warning,
      info,
      total: findings.length,
      healthLabel: critical > 0 ? 'Issues Found' : 'Healthy',
      healthStyle:
        critical > 0
          ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    };
  }, [findings]);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    const loadRepositoryDetails = async () => {
      setIsLoading(true);

      try {
        const data = await getRepositoryDetails(params.repositoryId);
        setRepository(data);

        try {
          const runsData = await listRepositoryAnalysisRuns(params.repositoryId);
          setAnalysisRuns(runsData);
        } catch {
          setAnalysisRuns([]);
        }

        try {
          const findingsData = await listRepositoryFindings(params.repositoryId);
          setFindings(findingsData);
        } catch {
          setFindings([]);
        }

        setErrorMessage(null);
      } catch {
        setRepository(null);
        setAnalysisRuns([]);
        setFindings([]);
        setErrorMessage('Unable to load repository data.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepositoryDetails();
  }, [params.repositoryId]);

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        {repository ? <RepositoryHeader repository={repository} /> : null}

        <div className="content-wrap">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="glass-panel-soft animate-pulse rounded-tokenLg px-4 py-4"
                  >
                    <div className="h-3 w-1/3 rounded bg-white/[0.1]" />
                    <div className="mt-3 h-8 w-1/2 rounded bg-white/[0.08]" />
                  </div>
                ))}
              </div>

              <div className="glass-panel animate-pulse rounded-tokenLg p-5">
                <div className="h-4 w-1/4 rounded bg-white/[0.1]" />
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="h-24 rounded bg-white/[0.06]" />
                  <div className="h-24 rounded bg-white/[0.06]" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
                <div className="glass-panel animate-pulse rounded-tokenLg p-5">
                  <div className="h-4 w-1/4 rounded bg-white/[0.1]" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="h-10 rounded bg-white/[0.06]" />
                    ))}
                  </div>
                </div>
                <div className="glass-panel animate-pulse rounded-tokenLg p-5">
                  <div className="h-4 w-1/3 rounded bg-white/[0.1]" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-8 rounded bg-white/[0.06]" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="rounded-tokenLg border border-rose-500/30 bg-rose-500/10 px-6 py-6 text-rose-300">
              {errorMessage}
            </div>
          ) : !repository ? (
            <div className="glass-panel-soft rounded-tokenLg px-6 py-6 text-textSecondary">
              Repository not found.
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon="★"
                  label="Stars"
                  value={repository.stargazersCount.toLocaleString()}
                />
                <StatCard icon="⑂" label="Forks" value={repository.forksCount.toLocaleString()} />
                <StatCard
                  icon="!"
                  label="Open Issues"
                  value={repository.openIssuesCount.toLocaleString()}
                />
                <StatCard
                  icon="◉"
                  label="Watchers"
                  value={repository.watchersCount.toLocaleString()}
                />
              </section>

              <section className="glass-panel mt-6 rounded-tokenLg p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-semibold tracking-tight text-white/90 sm:text-[22px]">
                      Analysis Runs
                    </h2>
                    <p className="mt-1 text-[13px] text-white/45">
                      Lifecycle history for this repository
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-tokenMd border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-emerald-300/80">
                        Done
                      </p>
                      <p className="mt-0.5 text-[16px] font-semibold text-emerald-200">
                        {analysisSummary.completed}
                      </p>
                    </div>
                    <div className="rounded-tokenMd border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-cyan-300/80">
                        Running
                      </p>
                      <p className="mt-0.5 text-[16px] font-semibold text-cyan-200">
                        {analysisSummary.running}
                      </p>
                    </div>
                    <div className="rounded-tokenMd border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-amber-300/80">
                        Pending
                      </p>
                      <p className="mt-0.5 text-[16px] font-semibold text-amber-200">
                        {analysisSummary.pending}
                      </p>
                    </div>
                    <div className="rounded-tokenMd border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-rose-300/80">
                        Failed
                      </p>
                      <p className="mt-0.5 text-[16px] font-semibold text-rose-200">
                        {analysisSummary.failed}
                      </p>
                    </div>
                  </div>
                </div>

                {analysisRuns.length === 0 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-tokenMd border border-white/[0.08] bg-white/[0.02] px-4 py-4 text-white/50">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-[13px]">No analysis runs found for this repository yet.</p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {analysisRuns.map((run) => {
                      const statusStyle = analysisRunStatusStyle(run.status);
                      const StatusIcon = statusStyle.icon;

                      return (
                        <article
                          key={run.id}
                          className="glass-panel-soft rounded-tokenMd px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[12px] uppercase tracking-[0.08em] text-white/30">
                                Run ID
                              </p>
                              <p className="truncate text-[14px] font-medium text-white/85">
                                {run.id}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyle.badgeClass}`}
                            >
                              <StatusIcon className={`h-3.5 w-3.5 ${statusStyle.iconClass}`} />
                              {statusStyle.label}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 text-[12px] text-white/55 sm:grid-cols-2">
                            <div>
                              <p className="font-mono uppercase tracking-[0.06em] text-[10px] text-white/30">
                                Event
                              </p>
                              <p className="mt-1 text-white/75">{eventTypeLabel(run.event.type)}</p>
                            </div>
                            <div>
                              <p className="font-mono uppercase tracking-[0.06em] text-[10px] text-white/30">
                                Triggered
                              </p>
                              <p className="mt-1 text-white/75">
                                {toReadableDate(run.event.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="font-mono uppercase tracking-[0.06em] text-[10px] text-white/30">
                                Started
                              </p>
                              <p className="mt-1 text-white/75">{toReadableDate(run.startedAt)}</p>
                            </div>
                            <div>
                              <p className="font-mono uppercase tracking-[0.06em] text-[10px] text-white/30">
                                Completed
                              </p>
                              <p className="mt-1 text-white/75">
                                {toReadableDate(run.completedAt)}
                              </p>
                            </div>
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

              <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
                <article className="glass-panel rounded-tokenLg px-5 py-5">
                  <h2 className="text-[20px] font-semibold sm:text-[22px]">Repository Overview</h2>
                  <p className="mt-3 text-[14px] leading-[1.6] text-textSecondary">
                    {repository.description ?? 'No repository description available.'}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                        Full Name
                      </p>
                      <p className="mt-1 text-[14px] text-white">{repository.fullName}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                        Visibility
                      </p>
                      <p className="mt-1 text-[14px] text-white">{repository.visibility}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                        Main Language
                      </p>
                      <p className="mt-1 text-[14px] text-white">{repository.language ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                        Default Branch
                      </p>
                      <p className="mt-1 text-[14px] text-white">
                        {repository.defaultBranch || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                        Size
                      </p>
                      <p className="mt-1 text-[14px] text-white">
                        {repository.size.toLocaleString()} KB
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                        License
                      </p>
                      <p className="mt-1 text-[14px] text-white">
                        {repository.licenseName ?? 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-surface400 pt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                      Topics
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {repository.topics.length > 0 ? (
                        repository.topics.map((topic) => (
                          <span
                            key={topic}
                            className="glass-panel-soft rounded-full px-3 py-1 text-[12px] text-textPrimary"
                          >
                            #{topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-textSecondary">
                          No topics configured.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5 sm:gap-3">
                    <Link
                      href={repository.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-full border border-white/20 bg-white px-4 text-[12px] font-semibold text-black sm:text-[13px]"
                    >
                      Open on GitHub
                    </Link>
                    {repository.homepage ? (
                      <Link
                        href={repository.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-[12px] font-medium text-textPrimary sm:text-[13px]"
                      >
                        Visit Homepage
                      </Link>
                    ) : null}
                  </div>
                </article>

                <aside className="space-y-4">
                  <div className="glass-panel rounded-tokenLg px-4 py-4">
                    <h3 className="text-[20px] font-semibold">Recent Commits</h3>
                    {repository.recentCommits.length === 0 ? (
                      <p className="mt-3 text-[13px] text-textSecondary">
                        No recent commits available.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {repository.recentCommits.slice(0, 5).map((commit) => (
                          <li
                            key={commit.sha}
                            className="glass-panel-soft rounded-tokenMd px-3 py-3"
                          >
                            <Link
                              href={commit.url}
                              target="_blank"
                              rel="noreferrer"
                              className="line-clamp-2 text-[13px] font-medium text-textPrimary hover:text-white"
                            >
                              {commit.message}
                            </Link>
                            <p className="mt-1 text-[11px] text-textSecondary">
                              {commit.authorName ?? 'Unknown author'} ·{' '}
                              {toReadableDate(commit.authoredAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="glass-panel rounded-tokenLg px-4 py-4">
                    <h3 className="text-[20px] font-semibold">Status</h3>
                    <div className="mt-3 space-y-2 text-[14px]">
                      <p className="flex items-center justify-between text-textSecondary">
                        <span>Repository Health</span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium ${findingsSummary.healthStyle}`}
                        >
                          {findingsSummary.healthLabel}
                        </span>
                      </p>
                      <p className="flex items-center justify-between text-textSecondary">
                        <span>Critical Findings</span>
                        <span className="font-medium text-white">
                          {findingsSummary.critical.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex items-center justify-between text-textSecondary">
                        <span>Total Findings</span>
                        <span className="font-medium text-white">
                          {findingsSummary.total.toLocaleString()}
                        </span>
                      </p>
                      <p className="flex items-center justify-between text-textSecondary">
                        <span>Archived</span>
                        <span className="font-medium text-white">
                          {repository.archived ? 'Yes' : 'No'}
                        </span>
                      </p>
                      <p className="flex items-center justify-between text-textSecondary">
                        <span>Disabled</span>
                        <span className="font-medium text-white">
                          {repository.disabled ? 'Yes' : 'No'}
                        </span>
                      </p>
                      <p className="flex items-center justify-between text-textSecondary">
                        <span>Subscribers</span>
                        <span className="font-medium text-white">
                          {repository.subscribersCount.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-tokenLg px-4 py-4">
                    <h3 className="text-[20px] font-semibold">Latest Findings</h3>
                    {findings.length === 0 ? (
                      <p className="mt-3 text-[13px] text-textSecondary">
                        No findings from recent analysis runs.
                      </p>
                    ) : (
                      <>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded-tokenMd border border-rose-500/20 bg-rose-500/10 px-2 py-2 text-center text-rose-300">
                            CRIT {findingsSummary.critical}
                          </div>
                          <div className="rounded-tokenMd border border-amber-500/20 bg-amber-500/10 px-2 py-2 text-center text-amber-300">
                            WARN {findingsSummary.warning}
                          </div>
                          <div className="rounded-tokenMd border border-cyan-500/20 bg-cyan-500/10 px-2 py-2 text-center text-cyan-300">
                            INFO {findingsSummary.info}
                          </div>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {findings.slice(0, 6).map((finding) => {
                            const style = findingSeverityStyle(finding.severity);

                            return (
                              <li
                                key={finding.id}
                                className="glass-panel-soft rounded-tokenMd px-3 py-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="line-clamp-2 text-[13px] font-medium text-textPrimary">
                                    {finding.title}
                                  </p>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.badge}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                    {style.label}
                                  </span>
                                </div>

                                <p className="mt-1 line-clamp-2 text-[12px] text-textSecondary">
                                  {finding.description}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-textMuted">
                                  <span>Run: {finding.analysisRun.id.slice(0, 12)}…</span>
                                  <span>{toRunStatusLabel(finding.analysisRun.status)}</span>
                                  <span>{toReadableDate(finding.createdAt)}</span>
                                </div>

                                <p className="mt-1 line-clamp-1 text-[10px] text-textMuted">
                                  {renderFindingMetadata(finding.metadata)}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="rounded-tokenLg border border-surface400 bg-surface200 px-4 py-4">
                    <h3 className="text-[20px] font-semibold">Timeline</h3>
                    <div className="mt-3 space-y-3 text-[13px] text-textSecondary">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                          Created
                        </p>
                        <p className="mt-1 text-textPrimary">
                          {toReadableDate(repository.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                          Updated
                        </p>
                        <p className="mt-1 text-textPrimary">
                          {toReadableDate(repository.updatedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">
                          Last Push
                        </p>
                        <p className="mt-1 text-textPrimary">
                          {toReadableDate(repository.pushedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
