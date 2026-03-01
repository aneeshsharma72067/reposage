'use client';

import { useState } from 'react';
import { getInstallationUrl } from '@/lib/auth';

interface DashboardHeaderProps {
  onSearchChange: (value: string) => void;
}

export function DashboardHeader({ onSearchChange }: DashboardHeaderProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const onConnectRepository = async () => {
    setIsConnecting(true);

    try {
      const url = await getInstallationUrl();
      window.location.href = url;
    } catch {
      setIsConnecting(false);
    }
  };

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
            void onConnectRepository();
          }}
          className="h-10 w-full rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 sm:w-auto"
        >
          {isConnecting ? 'Connecting...' : '+ Connect Repository'}
        </button>
      </div>
    </header>
  );
}
