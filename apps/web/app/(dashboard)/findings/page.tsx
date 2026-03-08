'use client';

import { useEffect, useMemo } from 'react';
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

export default function FindingsPage() {
  const {
    data: findingsData = [],
    isLoading: findingsLoading,
    error: findingsError,
    refetch: refetchFindings,
  } = useFindingsQuery();
  const { data: repositories = [], isLoading: reposLoading } = useRepositoriesQuery();

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

  const findingsStats = useMemo(() => {
    const now = Date.now();
    const last24HoursWindowStart = now - 24 * 60 * 60 * 1000;

    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let last24HoursCount = 0;
    let findingsWithMetadataCount = 0;

    const affectedRepositories = new Set<string>();

    for (const finding of sortedFindings) {
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
      total: sortedFindings.length,
      criticalCount,
      warningCount,
      infoCount,
      last24HoursCount,
      affectedRepositoriesCount: affectedRepositories.size,
      findingsWithMetadataCount,
    };
  }, [sortedFindings]);

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <PageHeader
          leftContent={
            <SectionHeaderContent
              sectionLabel="Findings"
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
              <FindingsList findings={sortedFindings} />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
