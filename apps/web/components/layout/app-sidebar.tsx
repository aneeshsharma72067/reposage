'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  FolderGit2,
  LayoutDashboard,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { clearAccessToken } from '@/lib/auth';
import Image from 'next/image';
import Logo from '../../assets/logo.png';

const navItems: Array<{
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}> = [
  { label: 'Dashboard', shortLabel: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Repositories', shortLabel: 'Repos', href: '/repositories', icon: FolderGit2 },
  { label: 'Findings', shortLabel: 'Find', href: '/findings', icon: AlertTriangle },
  { label: 'Analysis Agent', shortLabel: 'Agent', href: '/analysis', icon: Sparkles },
  { label: 'Event Log', shortLabel: 'Events', href: '/events', icon: Activity },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = () => {
    clearAccessToken();
    router.replace('/login');
  };

  return (
    <aside className="glass-panel fixed inset-x-3 bottom-3 z-40 flex h-[64px] flex-col rounded-tokenXl border border-white/12 px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] lg:sticky lg:top-0 lg:inset-auto lg:h-screen lg:w-[224px] lg:shrink-0 lg:rounded-none lg:border-r lg:px-3 lg:py-4 lg:shadow-none">
      <div className="mb-5 hidden items-center gap-3 px-2 lg:flex">
        <div className="glass-panel-soft overflow-hidden flex h-10 w-10 items-center justify-center rounded-tokenMd text-xs">
          <Image src={Logo} fill alt="Reposage" />
        </div>
        <p className="text-[15px] font-semibold text-white">Reposage AI</p>
      </div>

      <p className="mb-2 mt-2 hidden px-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-textMuted lg:block">
        Workspace
      </p>

      <nav className="grid h-full grid-cols-5 gap-1 lg:block lg:h-auto lg:space-y-1">
        {navItems.map((item) => {
          const isDashboardActive = pathname === '/dashboard' && item.label === 'Dashboard';
          const isReposActive =
            pathname.startsWith('/repositories') && item.label === 'Repositories';
          const isFindingsActive = pathname.startsWith('/findings') && item.label === 'Findings';
          const isEventsActive = pathname.startsWith('/events') && item.label === 'Event Log';
          const isAnalysisActive =
            pathname.startsWith('/analysis') && item.label === 'Analysis Agent';
          const active =
            isDashboardActive ||
            isReposActive ||
            isFindingsActive ||
            isEventsActive ||
            isAnalysisActive;

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex h-full flex-col items-center justify-center gap-1 rounded-tokenMd px-2 text-center text-[10px] font-medium leading-tight transition-colors lg:h-11 lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:text-left lg:text-[15px] ${
                active
                  ? 'glass-pill text-white'
                  : 'text-textSecondary hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border lg:h-6 lg:w-6 ${
                  active
                    ? 'border-white/25 bg-white/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/65'
                }`}
              >
                <Icon className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
              </span>
              <span className="lg:hidden">{item.shortLabel}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-1 lg:block">
        {/*
        <button
          type="button"
          className="flex h-11 w-full items-center rounded-tokenMd px-3 text-left text-[15px] text-textSecondary hover:bg-white/[0.06] hover:text-white"
        >
          Settings
        </button>
        <button
          type="button"
          className="flex h-11 w-full items-center rounded-tokenMd px-3 text-left text-[15px] text-textSecondary hover:bg-white/[0.06] hover:text-white"
        >
          Documentation
        </button>
        */}

        <button
          type="button"
          onClick={onSignOut}
          className="glass-panel-soft mt-2 flex h-11 w-full items-center rounded-tokenMd px-3 text-left text-[14px] text-textPrimary hover:bg-white/[0.08]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
