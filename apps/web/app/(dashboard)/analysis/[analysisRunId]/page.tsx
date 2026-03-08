'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageHeader } from '@/components/layout/page-header';
import { getAccessToken } from '@/lib/auth';
import { useAnalysisRunDetailQuery } from '@/lib/queries';

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

function metadataSummary(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return 'No metadata';
  }

  const entries = Object.entries(metadata as Record<string, unknown>)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`);

  return entries.length > 0 ? entries.join(' • ') : 'No metadata';
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
      <div className="glass-panel-soft h-[220px] animate-pulse rounded-[14px]" />
      <div className="glass-panel-soft h-[260px] animate-pulse rounded-[14px]" />
    </div>
  );
}

export default function AnalysisRunDetailPage() {
  const params = useParams<{ analysisRunId: string }>();
  const analysisRunId = params.analysisRunId;

  const { data: run, isLoading, error } = useAnalysisRunDetailQuery(analysisRunId);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
    }
  }, []);

  const errorMessage = error ? 'Unable to load analysis run details.' : null;

  return (
    <main className="page-shell flex h-screen overflow-hidden text-white">
      <AppSidebar />

      <section className="flex h-screen flex-1 flex-col overflow-y-auto">
        <PageHeader
          leftContent={
            <div className="flex items-center gap-3 text-[12px] text-white/30">
              <Link
                href="/analysis"
                className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white/80"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Analysis
              </Link>
              <span className="text-white/15">›</span>
              <span className="font-medium text-white/70">Run Details</span>
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
          ) : run ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-[22px] font-bold tracking-tight text-white/90">
                    Analysis Run
                  </h1>
                  <p className="text-[13px] text-white/35">Run ID: {run.id}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${runStatusStyle(run.status).badgeClass}`}
                >
                  {runStatusStyle(run.status).label}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Repository
                  </p>
                  <Link
                    href={`/repositories/${run.repository.id}`}
                    className="mt-2 block truncate text-[14px] font-medium text-white/80 hover:text-white"
                  >
                    {run.repository.fullName}
                  </Link>
                </div>
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Triggered At
                  </p>
                  <p className="mt-2 text-[14px] text-white/80">
                    {toReadableDate(run.event.createdAt)}
                  </p>
                </div>
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Completed At
                  </p>
                  <p className="mt-2 text-[14px] text-white/80">
                    {toReadableDate(run.completedAt)}
                  </p>
                </div>
                <div className="glass-panel-soft rounded-[14px] px-5 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                    Findings
                  </p>
                  <p className="mt-2 text-[18px] font-semibold text-white/90">
                    {run.findings.length}
                  </p>
                </div>
              </div>

              <section className="glass-panel rounded-[14px] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-[16px] font-semibold text-white/90">Source Event</h2>
                  <Link
                    href={`/events/${run.event.id}`}
                    className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition hover:border-white/30 hover:text-white"
                  >
                    Open Event
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 text-[13px] text-white/70 md:grid-cols-3">
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-3">
                    <p className="text-white/35">Event Type</p>
                    <p className="mt-1 font-medium text-white/90">
                      {eventTypeLabel(run.event.type)}
                    </p>
                  </div>
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-3">
                    <p className="text-white/35">GitHub Event</p>
                    <p className="mt-1 font-medium text-white/90">
                      {run.event.githubEventId ?? 'N/A'}
                    </p>
                  </div>
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-3">
                    <p className="text-white/35">Processed</p>
                    <p className="mt-1 font-medium text-white/90">
                      {run.event.processed ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {run.errorMessage ? (
                  <div className="mt-3 rounded-tokenMd border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
                    {run.errorMessage}
                  </div>
                ) : null}
              </section>

              <section className="glass-panel rounded-[14px] p-5">
                <h2 className="mb-3 text-[16px] font-semibold text-white/90">
                  Findings From This Run
                </h2>
                {run.findings.length === 0 ? (
                  <div className="glass-panel-soft rounded-tokenMd px-4 py-6 text-center text-[13px] text-white/45">
                    No findings generated for this analysis run.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {run.findings.map((finding) => (
                      <article
                        key={finding.id}
                        className="glass-panel-soft rounded-tokenMd px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-[14px] font-semibold text-white/90">
                              {finding.title}
                            </h3>
                            <p className="mt-1 text-[12px] text-white/55">{finding.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${severityStyle(finding.severity)}`}
                            >
                              {finding.severity}
                            </span>
                            <Link
                              href={`/findings/${finding.id}`}
                              className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-medium text-white/80 transition hover:border-white/30 hover:text-white"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-white/45">
                          {metadataSummary(finding.metadata)}
                        </p>
                        <p className="mt-1 text-[11px] text-white/35">
                          {toReadableDate(finding.createdAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="glass-panel rounded-[14px] p-5">
                <h2 className="mb-3 text-[16px] font-semibold text-white/90">Raw Event Payload</h2>
                <div className="glass-panel-soft overflow-x-auto rounded-tokenMd p-4">
                  <pre className="text-[12px] leading-relaxed text-white/55">
                    {JSON.stringify(run.event.payload, null, 2)}
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
