import Link from 'next/link';
import type { RepositoryDetails, RepositoryListItem } from '@/types/repository';

interface RepositoryHeaderProps {
  repository: RepositoryListItem | RepositoryDetails;
}

export function RepositoryHeader({ repository }: RepositoryHeaderProps) {
  return (
    <header className="flex items-start justify-between border-b border-surface400 bg-surface100 px-6 py-3">
      <div>
        <div className="text-[13px] text-textMuted">
          <Link href="/dashboard" className="hover:text-white">
            Repositories
          </Link>
          <span className="mx-2 text-white/25">›</span>
          <span className="font-semibold text-white">{repository.name}</span>
        </div>

        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-[28px] font-bold leading-tight text-white">{repository.name}</h1>
          <span className="inline-flex h-7 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-emerald-400">
            ● {repository.isActive ? 'Healthy' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-10 rounded-full border border-white/20 bg-transparent px-4 text-[14px] font-medium text-textPrimary"
        >
          ↻ Resync Repository
        </button>
        <button
          type="button"
          className="h-10 rounded-full border border-white/20 bg-white px-4 text-[14px] font-semibold text-black"
        >
          ▶ Run Analysis
        </button>
      </div>
    </header>
  );
}
