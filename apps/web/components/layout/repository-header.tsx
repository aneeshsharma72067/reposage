import Link from 'next/link';
import type { RepositoryDetails, RepositoryListItem } from '@/types/repository';

interface RepositoryHeaderProps {
  repository: RepositoryListItem | RepositoryDetails;
}

export function RepositoryHeader({ repository }: RepositoryHeaderProps) {
  return (
    <header className="glass-header flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <div className="text-[13px] text-textMuted">
          <Link href="/dashboard" className="hover:text-white">
            Repositories
          </Link>
          <span className="mx-2 text-white/25">›</span>
          <span className="font-semibold text-white">{repository.name}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="truncate text-[22px] font-bold leading-tight text-white sm:text-[28px]">
            {repository.name}
          </h1>
          <span className="inline-flex h-7 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-emerald-400">
            ● {repository.isActive ? 'Healthy' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
        <button
          type="button"
          className="glass-panel-soft h-10 flex-1 rounded-full px-4 text-[13px] font-medium text-textPrimary transition hover:bg-white/[0.08] sm:flex-none sm:text-[14px]"
        >
          ↻ Resync Repository
        </button>
        <button
          type="button"
          className="h-10 flex-1 rounded-full border border-white/20 bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 sm:flex-none sm:text-[14px]"
        >
          ▶ Run Analysis
        </button>
      </div>
    </header>
  );
}
