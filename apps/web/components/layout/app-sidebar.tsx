'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAccessToken } from '@/lib/auth';

const navItems = [
  { label: 'Dashboard', shortLabel: 'Home', href: '/dashboard' },
  { label: 'Repositories', shortLabel: 'Repos', href: '/repositories' },
  { label: 'Event Log', shortLabel: 'Events', href: '/events' },
  { label: 'Analysis Agent', shortLabel: 'Agent', href: '/analytics' },
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
        <div className="glass-panel-soft flex h-8 w-8 items-center justify-center rounded-tokenMd text-xs">
          ⚙
        </div>
        <p className="text-[15px] font-semibold text-white">Agentic AI</p>
      </div>

      <p className="mb-2 mt-2 hidden px-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-textMuted lg:block">
        Workspace
      </p>

      <nav className="grid h-full grid-cols-4 gap-1 lg:block lg:h-auto lg:space-y-1">
        {navItems.map((item) => {
          const isDashboardActive = pathname === '/dashboard' && item.label === 'Dashboard';
          const isReposActive =
            pathname.startsWith('/repositories') && item.label === 'Repositories';
          const isEventsActive = pathname.startsWith('/events') && item.label === 'Event Log';
          const isAnalysisActive =
            pathname.startsWith('/analytics') && item.label === 'Analysis Agent';
          const active = isDashboardActive || isReposActive || isEventsActive || isAnalysisActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex h-full items-center justify-center rounded-tokenMd px-2 text-center text-[10px] font-medium leading-tight lg:h-11 lg:justify-start lg:px-3 lg:text-left lg:text-[15px] ${
                active
                  ? 'glass-pill text-white'
                  : 'text-textSecondary hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="lg:hidden">{item.shortLabel}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-1 lg:block">
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
