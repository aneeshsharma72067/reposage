'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { RepositoryHeader } from '@/components/layout/repository-header';
import { getAccessToken, listRepositories } from '@/lib/auth';
import type { RepositoryListItem } from '@/types/repository';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-tokenLg border border-surface400 bg-surface200 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">{label}</p>
      <p className="mt-2 text-[22px] font-bold text-white">{value}</p>
    </div>
  );
}

export default function RepositoryDetailPage() {
  const params = useParams<{ repositoryId: string }>();
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    const loadRepositories = async () => {
      setIsLoading(true);

      try {
        const data = await listRepositories();
        setRepositories(data);
        setErrorMessage(null);
      } catch {
        setRepositories([]);
        setErrorMessage('Unable to load repository data.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepositories();
  }, []);

  const repository = useMemo(
    () => repositories.find((item) => item.id === params.repositoryId) ?? null,
    [params.repositoryId, repositories],
  );

  return (
    <main className="flex min-h-screen bg-black text-white">
      <AppSidebar />

      <section className="flex min-h-screen flex-1 flex-col">
        {repository ? <RepositoryHeader repository={repository} /> : null}

        <div className="px-6 py-6">
          {isLoading ? (
            <div className="rounded-tokenLg border border-surface400 bg-surface200 px-6 py-6 text-textSecondary">
              Loading repository details...
            </div>
          ) : errorMessage ? (
            <div className="rounded-tokenLg border border-rose-500/30 bg-rose-500/10 px-6 py-6 text-rose-300">
              {errorMessage}
            </div>
          ) : !repository ? (
            <div className="rounded-tokenLg border border-surface400 bg-surface200 px-6 py-6 text-textSecondary">
              Repository not found.
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <StatCard label="Main Language" value={repository.private ? 'Private' : 'Public'} />
                <StatCard label="Default Branch" value={repository.defaultBranch || 'unknown'} />
                <StatCard label="Active Findings" value="0" />
                <StatCard label="Repository Status" value={repository.isActive ? 'Healthy' : 'Analyzing'} />
              </section>

              <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[22px] font-semibold">Recent Repository Activity</h2>
                    <span className="text-[14px] text-textSecondary">View all</span>
                  </div>

                  <div className="rounded-tokenLg border border-surface400 bg-surface200">
                    <div className="border-b border-surface400 px-4 py-4">
                      <p className="text-[14px] text-textSecondary">
                        No activity events are available yet for this repository.
                      </p>
                    </div>
                    <div className="px-4 py-4 text-[13px] text-textMuted">
                      Activity feed will appear after webhook events are ingested.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-tokenLg border border-cyan-400/40 bg-surface200 px-4 py-4">
                    <h3 className="text-[22px] font-semibold">✦ AI Analysis Active</h3>
                    <p className="mt-2 text-[14px] leading-[1.5] text-textSecondary">
                      AI insights for this repository are not available yet. Trigger analysis to populate
                      this panel.
                    </p>

                    <div className="mt-4 border-t border-surface400 pt-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Rules applied:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-tokenMd border border-surface400 px-3 py-1 text-[13px] text-textPrimary">API Contract</span>
                        <span className="rounded-tokenMd border border-surface400 px-3 py-1 text-[13px] text-textPrimary">Clean Arch</span>
                        <span className="rounded-tokenMd border border-surface400 px-3 py-1 text-[13px] text-textPrimary">No Circular Deps</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-tokenLg border border-surface400 bg-surface200 px-4 py-4">
                    <h3 className="text-[22px] font-semibold">System Coverage</h3>
                    <div className="mt-4 flex items-center justify-center">
                      <div className="relative h-[120px] w-[120px] rounded-full border-[12px] border-white/20">
                        <div className="absolute inset-0 rounded-full border-[12px] border-white border-r-transparent border-t-transparent" />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-[28px] font-bold">N/A</p>
                        <p className="text-[12px] text-textMuted">Codebase mapped</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[28px] font-bold">N/A</p>
                        <p className="text-[12px] text-textMuted">Files tracked</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
