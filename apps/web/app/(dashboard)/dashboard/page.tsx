'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { getAccessToken, listRepositories } from '@/lib/auth';
import type { RepositoryListItem } from '@/types/repository';

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-semibold uppercase tracking-[0.04em] ${
        isActive
          ? 'border-white/10 bg-white/10 text-white'
          : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
      }`}
    >
      {isActive ? 'Healthy' : 'Analyzing'}
    </span>
  );
}

export default function DashboardPage() {
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'analyzing'>('all');

  const loadRepositories = async () => {
    setIsLoading(true);

    try {
      const data = await listRepositories();
      setRepositories(data);
      setErrorMessage(null);
    } catch {
      setRepositories([]);
      setErrorMessage('Unable to load repositories. Please reconnect and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    void loadRepositories();
  }, []);

  const filteredRepositories = useMemo<RepositoryListItem[]>(() => {
    const filterMatched = repositories.filter((repository) => {
      if (activeFilter === 'healthy') {
        return repository.isActive;
      }

      if (activeFilter === 'analyzing') {
        return !repository.isActive;
      }

      return true;
    });

    if (!searchText.trim()) {
      return filterMatched;
    }

    const query = searchText.toLowerCase();
    return filterMatched.filter(
      (repository) =>
        repository.name.toLowerCase().includes(query) ||
        repository.fullName.toLowerCase().includes(query),
    );
  }, [activeFilter, repositories, searchText]);

  const hasRepositories = repositories.length > 0;
  const activeRepositoryCount = repositories.filter((repository) => repository.isActive).length;
  const privateRepositoryCount = repositories.filter((repository) => repository.private).length;
  const analyzingRepositoryCount = repositories.length - activeRepositoryCount;

  return (
    <main className="flex h-screen overflow-hidden bg-black text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <DashboardHeader onSearchChange={setSearchText} />

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-tokenLg border border-surface400 bg-surface200 px-6 py-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Connected Repos</p>
              <p className="mt-2 text-[40px] font-bold leading-none">{repositories.length}</p>
            </div>
            <div className="rounded-tokenLg border border-surface400 bg-surface200 px-6 py-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Active Repos</p>
              <p className="mt-2 text-[40px] font-bold leading-none">{activeRepositoryCount}</p>
            </div>
            <div className="rounded-tokenLg border border-surface400 bg-surface200 px-6 py-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Private Repos</p>
              <p className="mt-2 text-[40px] font-bold leading-none text-emerald-400">{privateRepositoryCount}</p>
            </div>
          </div>

          {isLoading ? (
            <section className="mt-8 rounded-tokenLg border border-surface400 bg-surface200 px-6 py-8 text-[14px] text-textSecondary">
              Loading repositories...
            </section>
          ) : errorMessage ? (
            <section className="mt-8 rounded-tokenLg border border-rose-500/30 bg-rose-500/10 px-6 py-6 text-[14px] text-rose-300">
              <div className="flex items-center justify-between gap-3">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => {
                    void loadRepositories();
                  }}
                  className="rounded-full border border-rose-400/40 px-3 py-1 text-[12px]"
                >
                  Retry
                </button>
              </div>
            </section>
          ) : !hasRepositories ? (
            <section className="mx-auto mt-10 max-w-[760px] text-center">
              <div className="mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-token2xl border border-white/10 bg-[#1c1c1e] text-4xl">
                ⌥
              </div>
              <h2 className="mt-8 text-[36px] font-bold leading-tight">No repositories found</h2>
              <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-[1.65] text-textSecondary">
                Your account is authenticated, but we did not receive any repositories yet.
                Install the GitHub App or refresh after installation sync completes.
              </p>

              <div className="mt-8 rounded-tokenXl border border-surface400 bg-surface200 px-8 py-8 text-left">
                <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[30px] font-semibold">Install GitHub App</p>
                      <p className="text-[13px] text-textSecondary">
                        Grant access to your organization or specific repos.
                      </p>
                    </div>
                    <div>
                      <p className="text-[30px] font-semibold">Sync Metadata</p>
                      <p className="text-[13px] text-textSecondary">
                        We&apos;ll map your system boundaries and dependencies.
                      </p>
                    </div>
                    <div>
                      <p className="text-[30px] font-semibold">Activate Agents</p>
                      <p className="text-[13px] text-textSecondary">AI agents begin observing PRs and pushes.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        void loadRepositories();
                      }}
                      className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 px-8 text-[14px] font-semibold text-white"
                    >
                      Refresh
                    </button>
                    <Link
                      href="/onboarding"
                      className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-[14px] font-semibold text-black"
                    >
                      + Install GitHub Extension
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="mt-8" id="repositories">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[32px] font-semibold">Connected Repositories</h2>
                  <div className="flex items-center gap-2 text-[13px]">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`rounded-full border px-3 py-1 ${
                        activeFilter === 'all'
                          ? 'border-white/10 bg-surface300 text-white'
                          : 'border-white/10 bg-transparent text-textSecondary'
                      }`}
                    >
                      ✓ All Repos
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('analyzing')}
                      className={`rounded-full border px-3 py-1 ${
                        activeFilter === 'analyzing'
                          ? 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
                          : 'border-white/10 bg-transparent text-textSecondary'
                      }`}
                    >
                      Analyzing ({analyzingRepositoryCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('healthy')}
                      className={`rounded-full border px-3 py-1 ${
                        activeFilter === 'healthy'
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                          : 'border-white/10 bg-transparent text-textSecondary'
                      }`}
                    >
                      Healthy ({activeRepositoryCount})
                    </button>
                  </div>
                </div>

                {filteredRepositories.length === 0 ? (
                  <div className="rounded-tokenLg border border-surface400 bg-surface200 px-6 py-8 text-[14px] text-textSecondary">
                    No repositories matched the current search/filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filteredRepositories.map((repository) => (
                      <article
                        key={repository.id}
                        className="rounded-tokenLg border border-surface400 bg-surface200 px-5 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[28px] font-semibold">{repository.name}</h3>
                            <p className="mt-1 font-mono text-[13px] text-textSecondary">{repository.fullName}</p>
                          </div>
                          <StatusBadge isActive={repository.isActive} />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4 border-b border-surface400 pb-4">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Last Activity</p>
                            <p className="mt-1 text-[13px]">Not Available</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Branches</p>
                            <p className="mt-1 text-[13px]">{repository.defaultBranch || 'unknown'}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-textMuted">Language</p>
                            <p className="mt-1 text-[13px]">{repository.private ? 'Private Repo' : 'Public Repo'}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[13px] text-textSecondary">
                          <span>◷ View history</span>
                          <Link href={`/repositories/${repository.id}`} className="text-textPrimary hover:text-white">
                            Open Details →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-tokenLg border border-surface400 bg-surface200 px-6 py-5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-[22px] font-semibold">Agent Analysis Velocity</h3>
                    <p className="text-[13px] text-textSecondary">Total events processed by AI agents across all repos</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-surface300 px-3 py-1 text-[12px] text-textPrimary">Last 7 Days</span>
                </div>
                <div className="h-[180px] rounded-tokenMd border border-surface400 bg-black/20 p-3">
                  <svg viewBox="0 0 100 30" className="h-full w-full">
                    <path
                      d="M 0 22 C 10 21, 20 20, 30 21 C 40 22, 50 18, 60 15 C 70 12, 80 20, 90 18 C 95 17, 98 14, 100 12"
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
