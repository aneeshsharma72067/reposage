import Link from 'next/link';
import { AlertCircle, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import type { Finding, FindingSeverity, FindingType } from '@/types/finding';

interface FindingsListProps {
  findings: Finding[];
}

function toReadableDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time';
  }

  return parsed.toLocaleString();
}

function metadataSummary(metadata: Finding['metadata']): string {
  if (metadata === null || metadata === undefined) {
    return 'No metadata available';
  }

  if (Array.isArray(metadata)) {
    if (metadata.length === 0) {
      return 'No metadata available';
    }

    return metadata
      .slice(0, 3)
      .map((entry) => String(entry))
      .join(' • ');
  }

  if (typeof metadata !== 'object') {
    return String(metadata);
  }

  if (Object.keys(metadata).length === 0) {
    return 'No metadata available';
  }

  const pairs = Object.entries(metadata)
    .slice(0, 3)
    .map(([key, value]) => {
      const normalizedValue =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : '[complex]';

      return `${key}: ${normalizedValue}`;
    });

  return pairs.join(' • ');
}

function descriptionPreview(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim();
  const maxLength = 260;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function typeLabel(type: FindingType): string {
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

function severityStyle(severity: FindingSeverity): {
  badgeClass: string;
  iconClass: string;
  icon: typeof AlertTriangle;
  label: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return {
        badgeClass: 'bg-red-500 text-white',
        iconClass: 'text-red-400',
        icon: AlertCircle,
        label: 'Critical',
      };
    case 'WARNING':
      return {
        badgeClass: 'bg-orange-500 text-white',
        iconClass: 'text-orange-400',
        icon: AlertTriangle,
        label: 'Warning',
      };
    case 'INFO':
    default:
      return {
        badgeClass: 'bg-blue-500 text-white',
        iconClass: 'text-blue-400',
        icon: Info,
        label: 'Info',
      };
  }
}

export function FindingsList({ findings }: FindingsListProps) {
  if (findings.length === 0) {
    return (
      <div className="glass-panel-soft rounded-2xl border border-white/10 px-6 py-12 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-8 w-8 text-white/35" />
        <p className="mt-3 text-[14px] text-textSecondary">No findings detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((finding) => {
        const severity = severityStyle(finding.severity);
        const SeverityIcon = severity.icon;
        const repositoryLabel = finding.repositoryFullName ?? finding.repositoryName;

        return (
          <article
            key={finding.id}
            className="glass-panel-soft rounded-2xl border border-white/10 p-5 shadow-sm transition-colors hover:bg-muted/30 hover:bg-white/[0.04]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${severity.iconClass}`}>
                  <SeverityIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-white/90">{finding.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/65 [overflow-wrap:anywhere]">
                    {descriptionPreview(finding.description)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/45">
                    {repositoryLabel ? (
                      <span className="max-w-full [overflow-wrap:anywhere]">{repositoryLabel}</span>
                    ) : null}
                    <span className="max-w-full [overflow-wrap:anywhere]">
                      {metadataSummary(finding.metadata)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 md:flex-col md:items-end">
                <span className="text-[11px] text-white/45">
                  {toReadableDate(finding.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] ${severity.badgeClass}`}
                  >
                    {severity.label}
                  </span>
                  <span className="inline-flex rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.04em] text-white/80">
                    {typeLabel(finding.type)}
                  </span>
                  <Link
                    href={`/findings/${finding.id}`}
                    className="inline-flex rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.04em] text-white/80 transition hover:border-white/30 hover:text-white"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
