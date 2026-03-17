'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, FolderGit2, Info, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FindingsList } from '@/components/dashboard/FindingsList';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { SectionHeaderContent } from '@/components/layout/section-header-content';
import { getAccessToken } from '@/lib/auth';
import { useFindingsQuery, useRepositoriesQuery } from '@/lib/queries';

interface FindingsStatWidgetProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  iconClassName: string;
}

function FindingsStatWidget({
  label,
  value,
  helper,
  icon: Icon,
  iconClassName,
}: FindingsStatWidgetProps) {
  return (
    <article className="glass-panel-soft rounded-tokenLg border border-white/10 px-4 py-4 transition hover:bg-white/[0.05] sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/35">{label}</p>
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 ${iconClassName}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-white/90">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-white/45">{helper}</p>
    </article>
  );
}

function hasMetadataValue(metadata: unknown): boolean {
  if (metadata === null || metadata === undefined) {
    return false;
  }

  if (Array.isArray(metadata)) {
    return metadata.length > 0;
  }

  if (typeof metadata === 'object') {
    return Object.keys(metadata as Record<string, unknown>).length > 0;
  }

  if (typeof metadata === 'string') {
    return metadata.trim().length > 0;
  }

  return true;
}

type FindingsDateRangeFilter = 'all' | '24h' | '7d' | '30d' | '90d';

function isWithinFindingsDateRange(value: string, range: FindingsDateRangeFilter): boolean {
  if (range === 'all') {
    return true;
  }

  const createdAtMs = new Date(value).getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  const now = Date.now();

  switch (range) {
    case '24h':
      return createdAtMs >= now - 24 * 60 * 60 * 1000;
    case '7d':
      return createdAtMs >= now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return createdAtMs >= now - 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return createdAtMs >= now - 90 * 24 * 60 * 60 * 1000;
    default:
      return true;
  }
}

function normalizeAnalysisStatus(status: string | null | undefined): string {
  if (!status) {
    return 'UNKNOWN';
  }

  return status.toUpperCase();
}

function analysisStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'RUNNING':
      return 'Running';
    case 'FAILED':
      return 'Failed';
    case 'PENDING':
      return 'Pending';
    case 'UNKNOWN':
      return 'Unknown';
    default:
      return status;
  }
}

export default function FindingsPage() {
  const {
    data: findingsData = [],
    isLoading: findingsLoading,
    error: findingsError,
    refetch: refetchFindings,
  } = useFindingsQuery();
  const { data: repositories = [], isLoading: reposLoading } = useRepositoriesQuery();
  const [repositoryFilter, setRepositoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'CRITICAL' | 'WARNING' | 'INFO'>(
    'all',
  );
  const [suggestionFilter, setSuggestionFilter] = useState<
    'all' | 'suggestions' | 'non_suggestions'
  >('all');
  const [analysisStatusFilter, setAnalysisStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<FindingsDateRangeFilter>('all');

  const isLoading = findingsLoading || reposLoading;
  const errorMessage = findingsError ? 'Unable to load findings. Please try again.' : null;

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
    }
  }, []);

  const findings = useMemo(() => {
    const repositoryMap = new Map(
      repositories.map((repository) => [
        repository.id,
        { name: repository.name, fullName: repository.fullName },
      ]),
    );

    return findingsData.map((finding) => {
      const repository = repositoryMap.get(finding.repositoryId);
      return {
        ...finding,
        repositoryName: repository?.name,
        repositoryFullName: repository?.fullName,
      };
    });
  }, [findingsData, repositories]);

  const sortedFindings = useMemo(
    () =>
      [...findings].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [findings],
  );

  const repositoryOptions = useMemo(
    () =>
      repositories
        .map((repository) => ({
          id: repository.id,
          label: repository.fullName || repository.name,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [repositories],
  );

  const analysisStatusOptions = useMemo(() => {
    const statusSet = new Set<string>();

    for (const finding of sortedFindings) {
      statusSet.add(normalizeAnalysisStatus(finding.analysisRun?.status));
    }

    const preferredOrder = ['COMPLETED', 'RUNNING', 'PENDING', 'FAILED', 'UNKNOWN'];

    return preferredOrder.filter((status) => statusSet.has(status));
  }, [sortedFindings]);

  const filteredFindings = useMemo(() => {
    return sortedFindings.filter((finding) => {
      if (repositoryFilter !== 'all' && finding.repositoryId !== repositoryFilter) {
        return false;
      }

      if (severityFilter !== 'all' && finding.severity !== severityFilter) {
        return false;
      }

      if (suggestionFilter === 'suggestions' && finding.type !== 'REFACTOR_SUGGESTION') {
        return false;
      }

      if (suggestionFilter === 'non_suggestions' && finding.type === 'REFACTOR_SUGGESTION') {
        return false;
      }

      if (analysisStatusFilter !== 'all') {
        const status = normalizeAnalysisStatus(finding.analysisRun?.status);
        if (status !== analysisStatusFilter) {
          return false;
        }
      }

      if (!isWithinFindingsDateRange(finding.createdAt, dateRangeFilter)) {
        return false;
      }

      return true;
    });
  }, [
    analysisStatusFilter,
    dateRangeFilter,
    repositoryFilter,
    severityFilter,
    sortedFindings,
    suggestionFilter,
  ]);

  const hasActiveFilters =
    repositoryFilter !== 'all' ||
    severityFilter !== 'all' ||
    suggestionFilter !== 'all' ||
    analysisStatusFilter !== 'all' ||
    dateRangeFilter !== 'all';

  const clearFilters = () => {
    setRepositoryFilter('all');
    setSeverityFilter('all');
    setSuggestionFilter('all');
    setAnalysisStatusFilter('all');
    setDateRangeFilter('all');
  };

  const findingsStats = useMemo(() => {
    const now = Date.now();
    const last24HoursWindowStart = now - 24 * 60 * 60 * 1000;

    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let last24HoursCount = 0;
    let findingsWithMetadataCount = 0;

    const affectedRepositories = new Set<string>();

    for (const finding of filteredFindings) {
      affectedRepositories.add(finding.repositoryId);

      if (finding.severity === 'CRITICAL') {
        criticalCount += 1;
      } else if (finding.severity === 'WARNING') {
        warningCount += 1;
      } else {
        infoCount += 1;
      }

      const createdAtMs = new Date(finding.createdAt).getTime();
      if (!Number.isNaN(createdAtMs) && createdAtMs >= last24HoursWindowStart) {
        last24HoursCount += 1;
      }

      if (hasMetadataValue(finding.metadata)) {
        findingsWithMetadataCount += 1;
      }
    }

    return {
      total: filteredFindings.length,
      criticalCount,
      warningCount,
      infoCount,
      last24HoursCount,
      affectedRepositoriesCount: affectedRepositories.size,
      findingsWithMetadataCount,
    };
  }, [filteredFindings]);

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <PageHeader
          leftContent={
            <SectionHeaderContent
              title="Findings"
              subtitle="Issues detected across your repositories."
            />
          }
          actions={
            <button
              type="button"
              onClick={() => void refetchFindings()}
              className="glass-input inline-flex h-10 items-center gap-2 rounded-full px-4 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.08]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          }
        />

        <div className="content-wrap">
          <section className="glass-panel mb-5 rounded-tokenLg border border-white/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-white/90">Filter Findings</h2>
              <p className="text-[12px] text-white/45">
                Showing {filteredFindings.length.toLocaleString()} of{' '}
                {sortedFindings.length.toLocaleString()} findings
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Repository
                </span>
                <select
                  value={repositoryFilter}
                  onChange={(event) => setRepositoryFilter(event.target.value)}
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All repositories</option>
                  {repositoryOptions.map((repository) => (
                    <option key={repository.id} value={repository.id}>
                      {repository.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Severity
                </span>
                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(event.target.value as 'all' | 'CRITICAL' | 'WARNING' | 'INFO')
                  }
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Suggestion Type
                </span>
                <select
                  value={suggestionFilter}
                  onChange={(event) =>
                    setSuggestionFilter(
                      event.target.value as 'all' | 'suggestions' | 'non_suggestions',
                    )
                  }
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All findings</option>
                  <option value="suggestions">Suggestions only</option>
                  <option value="non_suggestions">Exclude suggestions</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Analysis Status
                </span>
                <select
                  value={analysisStatusFilter}
                  onChange={(event) => setAnalysisStatusFilter(event.target.value)}
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All statuses</option>
                  {analysisStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {analysisStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Date Range
                </span>
                <select
                  value={dateRangeFilter}
                  onChange={(event) =>
                    setDateRangeFilter(event.target.value as FindingsDateRangeFilter)
                  }
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="glass-input inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset Filters
              </button>
            </div>
          </section>

          <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <FindingsStatWidget
              label="Total Findings"
              value={findingsStats.total.toLocaleString()}
              helper={`${findingsStats.last24HoursCount.toLocaleString()} in the last 24 hours`}
              icon={AlertCircle}
              iconClassName="text-cyan-300"
            />
            <FindingsStatWidget
              label="Critical"
              value={findingsStats.criticalCount.toLocaleString()}
              helper="Requires immediate attention"
              icon={AlertCircle}
              iconClassName="text-rose-300"
            />
            <FindingsStatWidget
              label="Warnings"
              value={findingsStats.warningCount.toLocaleString()}
              helper="Potentially risky patterns"
              icon={AlertTriangle}
              iconClassName="text-amber-300"
            />
            <FindingsStatWidget
              label="Info"
              value={findingsStats.infoCount.toLocaleString()}
              helper="Non-blocking recommendations"
              icon={Info}
              iconClassName="text-sky-300"
            />
            <FindingsStatWidget
              label="Impacted Repositories"
              value={findingsStats.affectedRepositoriesCount.toLocaleString()}
              helper={`${findingsStats.findingsWithMetadataCount.toLocaleString()} findings include metadata`}
              icon={FolderGit2}
              iconClassName="text-emerald-300"
            />
          </section>

          <section className="glass-panel rounded-tokenLg p-5">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="glass-panel-soft h-[108px] animate-pulse rounded-2xl border border-white/10"
                  />
                ))}
              </div>
            ) : errorMessage ? (
              <div className="rounded-tokenMd border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-[13px] text-rose-300">
                {errorMessage}
              </div>
            ) : (
              <FindingsList findings={filteredFindings} />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
