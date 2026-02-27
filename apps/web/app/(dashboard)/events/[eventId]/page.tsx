'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GitMerge,
  GitPullRequest,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { getAccessToken, getEventById } from '@/lib/auth';
import type { EventDetail } from '@/types/event';

/* ─── Helpers ─── */

function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PUSH: 'Push',
    PR_OPENED: 'Pull Request Opened',
    PR_MERGED: 'Pull Request Merged',
  };
  return labels[type] ?? type;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

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

function analysisStatusConfig(status: string) {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        label: 'Completed',
      };
    case 'RUNNING':
      return {
        icon: Loader2,
        border: 'border-cyan-500/20',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-300',
        label: 'Running',
      };
    case 'FAILED':
      return {
        icon: XCircle,
        border: 'border-rose-500/20',
        bg: 'bg-rose-500/10',
        text: 'text-rose-300',
        label: 'Failed',
      };
    case 'PENDING':
    default:
      return {
        icon: Clock,
        border: 'border-amber-500/20',
        bg: 'bg-amber-500/10',
        text: 'text-amber-300',
        label: 'Pending',
      };
  }
}

/* ─── Skeleton ─── */

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-white/[0.06]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-white/[0.06] bg-[#141414] p-5">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="mt-3 h-5 w-24 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="rounded-[14px] border border-white/[0.06] bg-[#141414] p-6">
        <div className="space-y-3">
          <div className="h-4 w-1/3 rounded bg-white/[0.06]" />
          <div className="h-4 w-1/2 rounded bg-white/[0.04]" />
          <div className="h-4 w-1/4 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }

    async function load() {
      setIsLoading(true);
      try {
        const data = await getEventById(eventId);
        setEvent(data);
        setErrorMessage(null);
      } catch {
        setEvent(null);
        setErrorMessage('Unable to load event details.');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [eventId]);

  return (
    <main className="flex h-screen overflow-hidden bg-black text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0e0e0e] px-6">
          <div className="flex items-center gap-3 text-[12px] text-white/30">
            <Link
              href="/events"
              className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Events
            </Link>
            <span className="text-white/15">›</span>
            <span className="font-medium text-white/70">Event Details</span>
          </div>
        </header>

        <div className="space-y-6 px-6 py-6">
          {isLoading ? (
            <DetailSkeleton />
          ) : errorMessage ? (
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/[0.06] px-5 py-4 text-[13px] text-rose-300/80">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </div>
          ) : event ? (
            <>
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04]">
                  <EventTypeIcon type={event.type} className="h-4.5 w-4.5 text-white/50" />
                </div>
                <div>
                  <h1 className="text-[22px] font-bold tracking-tight text-white/90">
                    {eventTypeLabel(event.type)}
                  </h1>
                  <p className="text-[13px] text-white/35">
                    {event.repositoryName}
                    {event.githubEventId ? ` · ${event.githubEventId}` : ''}
                  </p>
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-[14px] border border-white/[0.06] bg-[#141414] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Event Type
                  </p>
                  <p className="mt-2 text-[14px] font-medium text-white/80">
                    {eventTypeLabel(event.type)}
                  </p>
                </div>
                <div className="rounded-[14px] border border-white/[0.06] bg-[#141414] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Repository
                  </p>
                  <Link
                    href={`/repositories/${event.repositoryId}`}
                    className="mt-2 block truncate text-[14px] font-medium text-white/80 hover:text-white"
                  >
                    {event.repositoryName}
                  </Link>
                </div>
                <div className="rounded-[14px] border border-white/[0.06] bg-[#141414] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Status
                  </p>
                  <p className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none ${
                        event.processed
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                      }`}
                    >
                      {event.processed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {event.processed ? 'Processed' : 'Pending'}
                    </span>
                  </p>
                </div>
                <div className="rounded-[14px] border border-white/[0.06] bg-[#141414] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Received At
                  </p>
                  <p className="mt-2 text-[14px] font-medium text-white/80">
                    {formatDateTime(event.createdAt)}
                  </p>
                </div>
              </div>

              {/* Analysis Runs */}
              <div>
                <h2 className="mb-3 text-[16px] font-semibold tracking-tight text-white/90">
                  Analysis Runs
                </h2>
                {event.analysisRuns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[14px] border border-white/[0.06] bg-[#141414] px-6 py-10 text-center">
                    <Activity className="mb-2 h-6 w-6 text-white/15" />
                    <p className="text-[13px] text-white/35">
                      No analysis runs triggered for this event.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {event.analysisRuns.map((run) => {
                      const config = analysisStatusConfig(run.status);
                      const StatusIcon = config.icon;
                      return (
                        <div
                          key={run.id}
                          className={`flex items-center justify-between rounded-[14px] border ${config.border} bg-[#141414] px-5 py-4`}
                        >
                          <div className="flex items-center gap-3">
                            <StatusIcon
                              className={`h-4 w-4 ${config.text} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`}
                            />
                            <div>
                              <p className="text-[14px] font-medium text-white/80">
                                {config.label}
                              </p>
                              <p className="text-[11px] text-white/30">
                                ID: {run.id.slice(0, 12)}…
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {run.startedAt && (
                              <p className="text-[12px] text-white/40">
                                Started: {formatDateTime(run.startedAt)}
                              </p>
                            )}
                            {run.completedAt && (
                              <p className="text-[12px] text-white/40">
                                Completed: {formatDateTime(run.completedAt)}
                              </p>
                            )}
                            {run.errorMessage && (
                              <p className="mt-1 text-[12px] text-rose-400/80">
                                {run.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payload */}
              {event.payload && (
                <div>
                  <h2 className="mb-3 text-[16px] font-semibold tracking-tight text-white/90">
                    Raw Payload
                  </h2>
                  <div className="overflow-x-auto rounded-[14px] border border-white/[0.06] bg-[#141414] p-5">
                    <pre className="text-[12px] leading-relaxed text-white/50">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
