'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAccessToken } from '@/lib/auth';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Repositories', href: '/dashboard#repositories' },
  { label: 'Analysis Agents', href: '/dashboard#agents' },
  { label: 'Event Log', href: '/dashboard#events' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = () => {
    clearAccessToken();
    router.replace('/login');
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[216px] shrink-0 flex-col overflow-y-auto border-r border-surface400 bg-surface100 px-3 py-3">
      <div className="mb-5 flex items-center gap-3 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-tokenMd border border-white/10 bg-surface200 text-xs">
          ⚙
        </div>
        <p className="text-[15px] font-semibold text-white">Agentic AI</p>
      </div>

      <p className="mb-2 mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-textMuted">
        Workspace
      </p>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith('/dashboard') && item.label === 'Dashboard';
          const isRepoDetail = pathname.startsWith('/repositories') && item.label === 'Repositories';
          const active = isActive || isRepoDetail;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex h-11 items-center rounded-tokenMd px-3 text-[15px] ${
                active ? 'bg-surface300 text-white' : 'text-textSecondary hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <button
          type="button"
          className="flex h-11 w-full items-center rounded-tokenMd px-3 text-left text-[15px] text-textSecondary hover:bg-white/5 hover:text-white"
        >
          Settings
        </button>
        <button
          type="button"
          className="flex h-11 w-full items-center rounded-tokenMd px-3 text-left text-[15px] text-textSecondary hover:bg-white/5 hover:text-white"
        >
          Documentation
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 flex h-11 w-full items-center rounded-tokenMd border border-surface400 px-3 text-left text-[14px] text-textPrimary hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
