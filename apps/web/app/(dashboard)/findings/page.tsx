'use client';

import { useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { FindingsList } from '@/components/dashboard/FindingsList';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { getAccessToken } from '@/lib/auth';
import { useFindingsQuery, useRepositoriesQuery } from '@/lib/queries';

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

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <header className="glass-header flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sm:py-0">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-white/90">Findings</h1>
            <p className="text-[11px] text-white/35">Issues detected across your repositories.</p>
          </div>

          <button
            type="button"
            onClick={() => void refetchFindings()}
            className="glass-input inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        <div className="content-wrap">
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
