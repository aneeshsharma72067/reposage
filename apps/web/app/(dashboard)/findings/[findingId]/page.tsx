'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { getAccessToken } from '@/lib/auth';
import { useFindingDetailQuery } from '@/lib/queries';

function toReadableDate(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
}

function severityStyle(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
    case 'WARNING':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    case 'INFO':
    default:
      return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';
  }
}

function runStatusStyle(status: string) {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: CheckCircle2,
        badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
        label: 'Completed',
      };
    case 'RUNNING':
      return {
        icon: Loader2,
        badgeClass: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
        label: 'Running',
      };
    case 'FAILED':
      return {
        icon: XCircle,
        badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
        label: 'Failed',
      };
    case 'PENDING':
    default:
      return {
        icon: Clock,
        badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
        label: 'Pending',
      };
  }
}

function findingTypeLabel(type: string): string {
  switch (type) {
    case 'API_BREAK':
      return 'API Break';
    case 'ARCH_VIOLATION':
      return 'Architecture Violation';
    case 'REFACTOR_SUGGESTION':
      return 'Refactor Suggestion';
    default:
      return type;
  }
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'PUSH':
      return 'Push';
    case 'PR_OPENED':
      return 'PR Opened';
    case 'PR_MERGED':
      return 'PR Merged';
    default:
      return type;
  }
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-56 animate-pulse rounded bg-white/[0.08]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-panel-soft h-[88px] animate-pulse rounded-[14px]" />
        ))}
      </div>
      <div className="glass-panel-soft h-[200px] animate-pulse rounded-[14px]" />
      <div className="glass-panel-soft h-[220px] animate-pulse rounded-[14px]" />
    </div>
  );
}

export default function FindingDetailPage() {
  const params = useParams<{ findingId: string }>();
  const findingId = params.findingId;

  const { data: finding, isLoading, error } = useFindingDetailQuery(findingId);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
    }
  }, []);

  const errorMessage = error ? 'Unable to load finding details.' : null;

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <PageHeader
          leftContent={
            <div className="flex items-center gap-3 text-[12px] text-white/30">
              <Link
                href="/findings"
                className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white/80"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Findings
              </Link>
              <span className="text-white/15">›</span>
              <span className="font-medium text-white/70">Finding Details</span>
            </div>
          }
        />

        <div className="content-wrap space-y-6">
          {isLoading ? (
            <DetailSkeleton />
          ) : errorMessage ? (
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/[0.06] px-5 py-4 text-[13px] text-rose-300/80">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </div>
          ) : finding ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-[22px] font-bold tracking-tight text-white/90">
                    {finding.title}
                  </h1>
                  <p className="text-[13px] text-white/35">Finding ID: {finding.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase ${severityStyle(finding.severity)}`}
                  >
                    {finding.severity}
                  </span>
                  <span className="inline-flex rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[11px] font-medium uppercase text-white/75">
                    {findingTypeLabel(finding.type)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Repository
                  </p>
                  <Link
                    href={`/repositories/${finding.repository.id}`}
                    className="mt-2 block truncate text-[14px] font-medium text-white/80 hover:text-white"
                  >
                    {finding.repository.fullName}
                  </Link>
                </div>
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Detected At
                  </p>
                  <p className="mt-2 text-[14px] text-white/80">
                    {toReadableDate(finding.createdAt)}
                  </p>
                </div>
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Run Status
                  </p>
                  <p className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${runStatusStyle(finding.analysisRun.status).badgeClass}`}
                    >
                      {runStatusStyle(finding.analysisRun.status).label}
                    </span>
                  </p>
                </div>
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Event Type
                  </p>
                  <p className="mt-2 text-[14px] text-white/80">
                    {eventTypeLabel(finding.analysisRun.event.type)}
                  </p>
                </div>
              </div>

              <section className="glass-panel rounded-[14px] p-5">
                <h2 className="mb-2 text-[16px] font-semibold text-white/90">Description</h2>
                <p className="text-[14px] leading-relaxed text-white/75">{finding.description}</p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-3 text-[13px] text-white/70">
                    <p className="text-white/35">Analysis Run</p>
                    <Link
                      href={`/analysis/${finding.analysisRun.id}`}
                      className="mt-1 block truncate font-medium text-white/90 hover:text-white"
                    >
                      {finding.analysisRun.id}
                    </Link>
                  </div>
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-3 text-[13px] text-white/70">
                    <p className="text-white/35">Source Event</p>
                    <Link
                      href={`/events/${finding.analysisRun.event.id}`}
                      className="mt-1 block truncate font-medium text-white/90 hover:text-white"
                    >
                      {finding.analysisRun.event.id}
                    </Link>
                  </div>
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-3 text-[13px] text-white/70">
                    <p className="text-white/35">Run Completed</p>
                    <p className="mt-1 font-medium text-white/90">
                      {toReadableDate(finding.analysisRun.completedAt)}
                    </p>
                  </div>
                </div>

                {finding.analysisRun.errorMessage ? (
                  <div className="mt-3 rounded-tokenMd border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
                    {finding.analysisRun.errorMessage}
                  </div>
                ) : null}
              </section>

              <section className="glass-panel rounded-[14px] p-5">
                <h2 className="mb-3 text-[16px] font-semibold text-white/90">Metadata</h2>
                {!finding.metadata || Object.keys(finding.metadata).length === 0 ? (
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-6 text-center text-[13px] text-white/45">
                    No metadata available for this finding.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(finding.metadata).map(([key, value]) => (
                      <div key={key} className="glass-panel-soft rounded-tokenMd px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-white/30">
                          {key}
                        </p>
                        <p className="mt-1 break-words text-[13px] text-white/80">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="glass-panel rounded-[14px] p-5">
                <h2 className="mb-3 text-[16px] font-semibold text-white/90">Raw Event Payload</h2>
                <div className="glass-panel-soft overflow-x-auto rounded-tokenMd p-4">
                  <pre className="text-[12px] leading-relaxed text-white/55">
                    {JSON.stringify(finding.analysisRun.event.payload, null, 2)}
                  </pre>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
