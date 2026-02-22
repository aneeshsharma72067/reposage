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
    <header className="flex h-16 items-center justify-between border-b border-surface400 bg-surface100 px-6">
      <div className="text-[13px] text-textMuted">
        <span>Organization</span>
        <span className="mx-2 text-white/25">›</span>
        <span className="font-semibold text-white">Engineering Team</span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search repositories..."
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 w-[240px] rounded-tokenLg border border-surface400 bg-surface200 px-4 text-[14px] text-white placeholder:text-textMuted focus:border-white/20 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            void onConnectRepository();
          }}
          className="h-10 rounded-full bg-white px-5 text-[14px] font-semibold text-black"
        >
          {isConnecting ? 'Connecting...' : '+ Connect Repository'}
        </button>
      </div>
    </header>
  );
}
