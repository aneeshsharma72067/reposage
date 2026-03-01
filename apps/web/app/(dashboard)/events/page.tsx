'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  GitMerge,
  GitPullRequest,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { getAccessToken, listEvents } from '@/lib/auth';
import type { EventListItem } from '@/types/event';

/* ─── Helpers ─── */

type EventTypeFilter = 'all' | 'PUSH' | 'PR_OPENED' | 'PR_MERGED';

function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PUSH: 'Push',
    PR_OPENED: 'Pull Request Opened',
    PR_MERGED: 'Pull Request Merged',
  };
  return labels[type] ?? type;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ─── Sub‑components ─── */

function EventTypeIcon({ type, className }: { type: string; className?: string }) {
  const base = className ?? 'h-4 w-4';
  switch (type) {
    case 'PUSH':
      return <Upload className={base} />;
    case 'PR_OPENED':
      return <GitPullRequest className={base} />;
    case 'PR_MERGED':
      return <GitMerge className={base} />;
    default:
      return <Activity className={base} />;
  }
}

function eventTypeColor(type: string) {
  switch (type) {
    case 'PUSH':
      return {
        icon: 'text-violet-400',
        border: 'border-violet-500/20',
        bg: 'bg-violet-500/10',
        text: 'text-violet-300',
      };
    case 'PR_OPENED':
      return {
        icon: 'text-sky-400',
        border: 'border-sky-500/20',
        bg: 'bg-sky-500/10',
        text: 'text-sky-300',
      };
    case 'PR_MERGED':
      return {
        icon: 'text-fuchsia-400',
        border: 'border-fuchsia-500/20',
        bg: 'bg-fuchsia-500/10',
        text: 'text-fuchsia-300',
      };
    default:
      return {
        icon: 'text-white/40',
        border: 'border-white/10',
        bg: 'bg-white/[0.04]',
        text: 'text-white/50',
      };
  }
}

function EventTypeBadge({ type }: { type: string }) {
  const style = eventTypeColor(type);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border ${style.border} ${style.bg} px-3 py-1 text-[11px] font-medium leading-none tracking-wide ${style.text}`}
    >
      <EventTypeIcon type={type} className="h-3 w-3" />
      {eventTypeLabel(type)}
    </span>
  );
}

function ProcessedBadge({ processed }: { processed: boolean }) {
  if (processed) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium leading-none tracking-wide text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Processed
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-medium leading-none tracking-wide text-amber-300">
      <Clock className="h-3 w-3" />
      Pending
    </span>
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
  variant: 'default' | 'push' | 'pr_opened' | 'pr_merged';
  onClick: () => void;
}) {
  const activeMap: Record<string, string> = {
    default: 'border-white/[0.12] bg-white/[0.06] text-white',
    push: 'border-violet-500/25 bg-violet-500/[0.08] text-violet-300',
    pr_opened: 'border-sky-500/25 bg-sky-500/[0.08] text-sky-300',
    pr_merged: 'border-fuchsia-500/25 bg-fuchsia-500/[0.08] text-fuchsia-300',
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

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass-panel-soft rounded-[14px] px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${color ?? 'text-white/20'}`} />}
      </div>
      <p
        className={`mt-2.5 text-[32px] font-bold leading-none tracking-tight ${color ?? 'text-white/90'}`}
      >
        {value}
      </p>
    </div>
  );
}

function EventCard({ event }: { event: EventListItem }) {
  const typeColor = eventTypeColor(event.type);

  return (
    <Link
      href={`/events/${event.id}`}
      className="glass-panel-soft group flex flex-col rounded-[14px] p-5 transition-all duration-200 hover:border-white/[0.16] hover:bg-white/[0.06]"
    >
      {/* Top: icon + repo name + badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${typeColor.border} ${typeColor.bg}`}
          >
            <EventTypeIcon type={event.type} className={`h-3.5 w-3.5 ${typeColor.icon}`} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-snug text-white/90">
              {event.repositoryName}
            </h3>
            <p className="mt-0.5 truncate text-[12px] leading-relaxed text-white/35">
              {eventTypeLabel(event.type)}
              {event.githubEventId ? ` · ${event.githubEventId.slice(0, 8)}` : ''}
            </p>
          </div>
        </div>
        <EventTypeBadge type={event.type} />
      </div>

      {/* Meta row */}
      <div className="mt-5 flex items-center gap-6 border-t border-white/[0.05] pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">Status</p>
          <div className="mt-1.5">
            <ProcessedBadge processed={event.processed} />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">Time</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-white/60">
            <Clock className="h-3 w-3 text-white/25" />
            {relativeTime(event.createdAt)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
            Repository
          </p>
          <p className="mt-1 truncate text-[13px] font-medium text-white/60">
            {event.repositoryName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end border-t border-white/[0.05] pt-4">
        <span className="flex items-center gap-1 text-[12px] font-medium text-white/50 transition-colors hover:text-white">
          View Details
          <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

/* ─── Skeleton loader ─── */

function SkeletonCard() {
  return (
    <div className="glass-panel-soft animate-pulse rounded-[14px] p-5">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/4 rounded bg-white/[0.04]" />
        </div>
        <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-5 border-t border-white/[0.05] pt-4">
        <div className="flex gap-6">
          <div className="h-6 w-20 rounded bg-white/[0.04]" />
          <div className="h-6 w-16 rounded bg-white/[0.04]" />
          <div className="h-6 w-24 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function EventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>('all');

  const loadEvents = async () => {
    setIsLoading(true);

    try {
      const data = await listEvents();
      setEvents(data);
      setErrorMessage(null);
    } catch {
      setEvents([]);
      setErrorMessage('Unable to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    void loadEvents();
  }, []);

  const pushCount = useMemo(() => events.filter((e) => e.type === 'PUSH').length, [events]);
  const prOpenedCount = useMemo(
    () => events.filter((e) => e.type === 'PR_OPENED').length,
    [events],
  );
  const prMergedCount = useMemo(
    () => events.filter((e) => e.type === 'PR_MERGED').length,
    [events],
  );

  const filteredEvents = useMemo(() => {
    let results = events;

    if (activeFilter !== 'all') {
      results = results.filter((e) => e.type === activeFilter);
    }

    const query = searchText.trim().toLowerCase();
    if (query) {
      results = results.filter(
        (e) =>
          e.repositoryName.toLowerCase().includes(query) ||
          e.type.toLowerCase().includes(query) ||
          (e.githubEventId && e.githubEventId.toLowerCase().includes(query)),
      );
    }

    return results;
  }, [activeFilter, events, searchText]);

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <header className="glass-header flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sm:py-0">
          <div className="hidden text-[12px] text-white/30 md:block">
            <span>Organization</span>
            <span className="mx-2 text-white/15">›</span>
            <span className="font-medium text-white/70">Event Log</span>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => void loadEvents()}
              disabled={isLoading}
              className="glass-input flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] text-white/70 transition-colors hover:border-white/[0.2] hover:text-white/90 disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="relative flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="glass-input h-8 w-full rounded-lg pl-9 pr-3 text-[13px] sm:w-[220px]"
              />
            </div>
          </div>
        </header>

        <div className="content-wrap space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Events" value={events.length} icon={Activity} />
            <StatCard label="Pushes" value={pushCount} color="text-violet-400" icon={Upload} />
            <StatCard
              label="PRs Opened"
              value={prOpenedCount}
              color="text-sky-400"
              icon={GitPullRequest}
            />
            <StatCard
              label="PRs Merged"
              value={prMergedCount}
              color="text-fuchsia-400"
              icon={GitMerge}
            />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight text-white/90">
              Recent Events
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterPill
                label="All"
                isActive={activeFilter === 'all'}
                variant="default"
                onClick={() => setActiveFilter('all')}
              />
              <FilterPill
                label="Push"
                count={pushCount}
                isActive={activeFilter === 'PUSH'}
                variant="push"
                onClick={() => setActiveFilter('PUSH')}
              />
              <FilterPill
                label="PR Opened"
                count={prOpenedCount}
                isActive={activeFilter === 'PR_OPENED'}
                variant="pr_opened"
                onClick={() => setActiveFilter('PR_OPENED')}
              />
              <FilterPill
                label="PR Merged"
                count={prMergedCount}
                isActive={activeFilter === 'PR_MERGED'}
                variant="pr_merged"
                onClick={() => setActiveFilter('PR_MERGED')}
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/[0.06] px-5 py-4 text-[13px] text-rose-300/80">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadEvents()}
                  className="shrink-0 rounded-full border border-rose-400/30 px-3 py-0.5 text-[11px] font-medium transition-colors hover:bg-rose-500/10"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="glass-panel-soft flex flex-col items-center justify-center rounded-[14px] px-6 py-16 text-center">
              <Activity className="mb-3 h-8 w-8 text-white/15" />
              <p className="text-[14px] font-medium text-white/40">
                {events.length === 0
                  ? 'No events recorded yet'
                  : 'No events match the current filter'}
              </p>
              <p className="mt-1 text-[12px] text-white/20">
                {events.length === 0
                  ? 'Push events and pull requests from your connected repositories will appear here.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
