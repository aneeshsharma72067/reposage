'use client';

import { RefreshCw } from 'lucide-react';
import { useResyncRepositoriesMutation } from '@/lib/queries';
import { PageHeader } from '@/components/layout/page-header';
import { SectionHeaderContent } from '@/components/layout/section-header-content';

interface DashboardHeaderProps {
  onSearchChange: (value: string) => void;
}

export function DashboardHeader({ onSearchChange }: DashboardHeaderProps) {
  const resyncMutation = useResyncRepositoriesMutation();
  const isSyncing = resyncMutation.isPending;

  return (
    <PageHeader
      leftContent={
        <SectionHeaderContent
          title="Dashboard"
          subtitle="Cross-repository health, findings, and analysis activity."
        />
      }
      actionsClassName="sm:gap-3 md:flex-nowrap"
      actions={
        <>
          <input
            type="text"
            placeholder="Search repositories..."
            onChange={(event) => onSearchChange(event.target.value)}
            className="glass-input h-10 w-full rounded-tokenLg px-4 text-[13px] sm:w-[240px]"
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
        </>
      }
    />
  );
}
