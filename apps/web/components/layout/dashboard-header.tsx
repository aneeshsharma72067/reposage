'use client';

import { RefreshCw } from 'lucide-react';
import { useResyncRepositoriesMutation } from '@/lib/queries';

interface DashboardHeaderProps {
  onSearchChange: (value: string) => void;
}

export function DashboardHeader({ onSearchChange }: DashboardHeaderProps) {
  const resyncMutation = useResyncRepositoriesMutation();
  const isSyncing = resyncMutation.isPending;

  return (
    <header className="glass-header flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-0">
      <div className="hidden text-[13px] text-textMuted md:block">
        <span>Organization</span>
        <span className="mx-2 text-white/25">›</span>
        <span className="font-semibold text-white">Engineering Team</span>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:flex-nowrap">
        <input
          type="text"
          placeholder="Search repositories..."
          onChange={(event) => onSearchChange(event.target.value)}
          className="glass-input h-10 w-full rounded-tokenLg px-4 text-[14px] sm:w-[240px]"
        />
        <button
          type="button"
          onClick={() => {
            resyncMutation.mutate();
          }}
          disabled={isSyncing}
          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/80 disabled:text-black/75 sm:w-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Repositories'}
        </button>
      </div>
    </header>
  );
}
