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
import { PageHeader } from '@/components/layout/page-header';
import { SectionHeaderContent } from '@/components/layout/section-header-content';
import { getAccessToken } from '@/lib/auth';
import { useEventsQuery } from '@/lib/queries';
import type { EventListItem } from '@/types/event';

/* ─── Helpers ─── */

type EventTypeFilter = 'all' | 'PUSH' | 'PR_OPENED' | 'PR_MERGED';
type EventStatusFilter = 'all' | 'processed' | 'pending';
type EventDateRangeFilter = 'all' | '24h' | '7d' | '30d' | '90d';

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

function isWithinEventDateRange(value: string, range: EventDateRangeFilter): boolean {
  if (range === 'all') {
    return true;
  }

  const createdAtMs = new Date(value).getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  const now = Date.now();

  switch (range) {
    case '24h':
      return createdAtMs >= now - 24 * 60 * 60 * 1000;
    case '7d':
      return createdAtMs >= now - 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return createdAtMs >= now - 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return createdAtMs >= now - 90 * 24 * 60 * 60 * 1000;
    default:
      return true;
  }
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
  const { data: events = [], isLoading, error, refetch } = useEventsQuery();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>('all');
  const [repositoryFilter, setRepositoryFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatusFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<EventDateRangeFilter>('all');
  const errorMessage = error ? 'Unable to load events. Please try again.' : null;

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
    }
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

  const repositoryOptions = useMemo(() => {
    const repositoryMap = new Map<string, string>();

    for (const event of events) {
      repositoryMap.set(event.repositoryId, event.repositoryName);
    }

    return Array.from(repositoryMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [events]);

  const filteredEvents = useMemo(() => {
    let results = events;

    if (activeFilter !== 'all') {
      results = results.filter((e) => e.type === activeFilter);
    }

    if (repositoryFilter !== 'all') {
      results = results.filter((e) => e.repositoryId === repositoryFilter);
    }

    if (eventStatusFilter === 'processed') {
      results = results.filter((e) => e.processed);
    }

    if (eventStatusFilter === 'pending') {
      results = results.filter((e) => !e.processed);
    }

    results = results.filter((e) => isWithinEventDateRange(e.createdAt, dateRangeFilter));

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
  }, [activeFilter, dateRangeFilter, eventStatusFilter, events, repositoryFilter, searchText]);

  const filteredStats = useMemo(
    () => ({
      total: filteredEvents.length,
      push: filteredEvents.filter((event) => event.type === 'PUSH').length,
      prOpened: filteredEvents.filter((event) => event.type === 'PR_OPENED').length,
      prMerged: filteredEvents.filter((event) => event.type === 'PR_MERGED').length,
      processed: filteredEvents.filter((event) => event.processed).length,
      pending: filteredEvents.filter((event) => !event.processed).length,
    }),
    [filteredEvents],
  );

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    activeFilter !== 'all' ||
    repositoryFilter !== 'all' ||
    eventStatusFilter !== 'all' ||
    dateRangeFilter !== 'all';

  const clearFilters = () => {
    setSearchText('');
    setActiveFilter('all');
    setRepositoryFilter('all');
    setEventStatusFilter('all');
    setDateRangeFilter('all');
  };

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <PageHeader
          leftContent={
            <SectionHeaderContent
              title="Event Log"
              subtitle="Recent GitHub webhook activity across repositories."
            />
          }
          actionsClassName="sm:flex-nowrap"
          actions={
            <>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isLoading}
                className="glass-input flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] text-white/70 transition-colors hover:border-white/[0.2] hover:text-white/90 disabled:opacity-40"
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
                  className="glass-input h-10 w-full rounded-tokenLg pl-9 pr-3 text-[13px] sm:w-[240px]"
                />
              </div>
            </>
          }
        />

        <div className="content-wrap space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Events In View" value={filteredStats.total} icon={Activity} />
            <StatCard
              label="Pushes"
              value={filteredStats.push}
              color="text-violet-400"
              icon={Upload}
            />
            <StatCard
              label="PRs Opened"
              value={filteredStats.prOpened}
              color="text-sky-400"
              icon={GitPullRequest}
            />
            <StatCard
              label="PRs Merged"
              value={filteredStats.prMerged}
              color="text-fuchsia-400"
              icon={GitMerge}
            />
            <StatCard
              label="Processed"
              value={filteredStats.processed}
              color="text-emerald-400"
              icon={CheckCircle2}
            />
          </div>

          <section className="glass-panel rounded-tokenLg border border-white/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-white/90">Filter Events</h2>
              <p className="text-[12px] text-white/45">
                {filteredStats.pending.toLocaleString()} pending in current view
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Repository
                </span>
                <select
                  value={repositoryFilter}
                  onChange={(event) => setRepositoryFilter(event.target.value)}
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All repositories</option>
                  {repositoryOptions.map((repository) => (
                    <option key={repository.id} value={repository.id}>
                      {repository.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Event Status
                </span>
                <select
                  value={eventStatusFilter}
                  onChange={(event) =>
                    setEventStatusFilter(event.target.value as EventStatusFilter)
                  }
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All statuses</option>
                  <option value="processed">Processed</option>
                  <option value="pending">Pending</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] uppercase tracking-[0.09em] text-white/40">
                  Date Range
                </span>
                <select
                  value={dateRangeFilter}
                  onChange={(event) =>
                    setDateRangeFilter(event.target.value as EventDateRangeFilter)
                  }
                  className="glass-input h-10 w-full rounded-tokenLg px-3 text-[13px]"
                >
                  <option value="all">All time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="glass-input inline-flex h-9 items-center rounded-full px-4 text-[12px] font-medium text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset Filters
              </button>
            </div>
          </section>

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
                  onClick={() => void refetch()}
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
