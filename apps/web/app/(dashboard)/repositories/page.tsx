'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { getAccessToken, listRepositories } from '@/lib/auth';
import type { RepositoryListItem } from '@/types/repository';

type StatusFilter = 'all' | 'healthy' | 'analyzing';

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { dot: string; border: string; bg: string; text: string; label: string }
  > = {
    healthy: {
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      label: 'Healthy',
    },
    analyzing: {
      dot: 'bg-cyan-400 animate-pulse',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-300',
      label: 'Analyzing',
    },
  };

  const style = config[status] ?? {
    dot: 'bg-white/40',
    border: 'border-white/10',
    bg: 'bg-white/[0.04]',
    text: 'text-white/50',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border ${style.border} ${style.bg} px-3 py-1 text-[11px] font-medium leading-none tracking-wide ${style.text}`}
    >
      <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function RepoIcon() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04]">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/40">
        <path
          d="M8 1C8 1 8 5 8 7M8 7C6 7 3 7 3 7M8 7C10 7 13 7 13 7M3 7C3 7 3 11 5 13M13 7C13 7 13 11 11 13M8 7V15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function RepositoryCard({ repository }: { repository: RepositoryListItem }) {
  const ownerName = repository.fullName.split('/')[0] ?? '';

  return (
    <article className="glass-panel-soft group flex flex-col rounded-[14px] p-5 transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.06]">
      {/* Top: name + badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <RepoIcon />
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-white/90">
              {repository.name}
            </h3>
            <p className="mt-0.5 truncate text-[12px] leading-relaxed text-white/35">
              {ownerName ? `${ownerName} · ` : ''}
              {repository.private ? 'Private' : 'Public'}
            </p>
          </div>
        </div>
        <StatusBadge status={repository.status} />
      </div>

      {/* Meta row */}
      <div className="mt-5 flex items-center gap-6 border-t border-white/[0.05] pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
            Activity
          </p>
          <p className="mt-1 text-[13px] font-medium text-white/60">—</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">Branch</p>
          <p className="mt-1 truncate text-[13px] font-medium text-white/60">
            {repository.defaultBranch || '—'}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
            Visibility
          </p>
          <p className="mt-1 text-[13px] font-medium text-white/60">
            {repository.private ? 'Private' : 'Public'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-4">
        <span className="text-[12px] text-white/20 transition-colors group-hover:text-white/35">
          ◷ View history
        </span>
        <Link
          href={`/repositories/${repository.id}`}
          className="flex items-center gap-1 text-[12px] font-medium text-white/50 transition-colors hover:text-white"
        >
          Open Details
          <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

function FilterPill({
  label,
  count,
  isActive,
  variant,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  variant: 'default' | 'analyzing' | 'healthy';
  onClick: () => void;
}) {
  const activeMap: Record<string, string> = {
    default: 'border-white/[0.12] bg-white/[0.06] text-white',
    analyzing: 'border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-300',
    healthy: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1 text-[12px] font-medium leading-none transition-all duration-150 ${
        isActive
          ? activeMap[variant]
          : 'border-white/[0.06] text-white/30 hover:border-white/[0.1] hover:text-white/50'
      }`}
    >
      {label}
      {typeof count === 'number' ? ` (${count})` : ''}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="glass-panel-soft rounded-[14px] px-5 py-5">
      <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">{label}</p>
      <p
        className={`mt-2.5 text-[32px] font-bold leading-none tracking-tight ${color ?? 'text-white/90'}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<RepositoryListItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const loadRepositories = async () => {
    setIsLoading(true);

    try {
      const data = await listRepositories();
      setRepositories(data);
      setErrorMessage(null);
    } catch {
      setRepositories([]);
      setErrorMessage('Unable to load repositories. Please try again.');
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

  const healthyCount = useMemo(
    () => repositories.filter((r) => r.status === 'healthy').length,
    [repositories],
  );
  const analyzingCount = useMemo(
    () => repositories.filter((r) => r.status === 'analyzing').length,
    [repositories],
  );

  const filteredRepositories = useMemo(() => {
    let results = repositories;

    if (activeFilter === 'healthy') {
      results = results.filter((r) => r.status === 'healthy');
    } else if (activeFilter === 'analyzing') {
      results = results.filter((r) => r.status === 'analyzing');
    }

    const query = searchText.trim().toLowerCase();
    if (query) {
      results = results.filter(
        (r) => r.name.toLowerCase().includes(query) || r.fullName.toLowerCase().includes(query),
      );
    }

    return results;
  }, [activeFilter, repositories, searchText]);

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <header className="glass-header flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sm:py-0">
          <div className="hidden text-[12px] text-white/30 md:block">
            <span>Organization</span>
            <span className="mx-2 text-white/15">›</span>
            <span className="font-medium text-white/70">Repositories</span>
          </div>
          <div className="relative w-full sm:w-auto">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="glass-input h-8 w-full rounded-lg pl-9 pr-3 text-[13px] sm:w-[220px]"
            />
          </div>
        </header>

        <div className="content-wrap space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Total Repositories" value={repositories.length} />
            <StatCard label="Healthy" value={healthyCount} color="text-emerald-400" />
            <StatCard label="Analyzing" value={analyzingCount} color="text-cyan-400" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-white/90">
              Connected Repositories
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterPill
                label="All"
                isActive={activeFilter === 'all'}
                variant="default"
                onClick={() => setActiveFilter('all')}
              />
              <FilterPill
                label="Analyzing"
                count={analyzingCount}
                isActive={activeFilter === 'analyzing'}
                variant="analyzing"
                onClick={() => setActiveFilter('analyzing')}
              />
              <FilterPill
                label="Healthy"
                count={healthyCount}
                isActive={activeFilter === 'healthy'}
                variant="healthy"
                onClick={() => setActiveFilter('healthy')}
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="glass-panel-soft animate-pulse rounded-[14px] px-5 py-5"
                >
                  <div className="h-4 w-1/3 rounded bg-white/[0.1]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.06]" />
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="h-10 rounded bg-white/[0.06]" />
                    <div className="h-10 rounded bg-white/[0.06]" />
                    <div className="h-10 rounded bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/[0.06] px-5 py-4 text-[13px] text-rose-300/80">
              <div className="flex items-center justify-between gap-3">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => void loadRepositories()}
                  className="shrink-0 rounded-full border border-rose-400/30 px-3 py-0.5 text-[11px] font-medium transition-colors hover:bg-rose-500/10"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="glass-panel-soft rounded-[14px] px-6 py-12 text-center text-[13px] text-white/30">
              {repositories.length === 0
                ? 'No repositories connected yet.'
                : 'No repositories match the current filter.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredRepositories.map((repository) => (
                <RepositoryCard key={repository.id} repository={repository} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
