'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export interface DashboardRepositoryRow {
  id: string;
  name: string;
  fullName: string;
  visibility: 'Private' | 'Public';
  status: 'IDLE' | 'ANALYZING' | 'HEALTHY' | 'ISSUES_FOUND';
  findingsCount: number;
  lastAnalysisAt: string | null;
}

interface RepositoryTableProps {
  rows: DashboardRepositoryRow[];
  initialSearch?: string;
}

function statusStyle(status: DashboardRepositoryRow['status']): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'HEALTHY':
      return {
        label: 'Healthy',
        className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
      };
    case 'ISSUES_FOUND':
      return {
        label: 'Issues Found',
        className: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
      };
    case 'ANALYZING':
      return {
        label: 'Analyzing',
        className: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300',
      };
    default:
      return {
        label: 'Idle',
        className: 'border-white/15 bg-white/[0.06] text-white/70',
      };
  }
}

function toReadableDate(date: string | null): string {
  if (!date) {
    return 'N/A';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return parsed.toLocaleString();
}

export function RepositoryTable({ rows, initialSearch = '' }: RepositoryTableProps) {
  const [searchText, setSearchText] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'ALL' | DashboardRepositoryRow['status']>('ALL');

  useEffect(() => {
    setSearchText(initialSearch);
  }, [initialSearch]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const statusMatches = statusFilter === 'ALL' ? true : row.status === statusFilter;
      const textMatches =
        query.length === 0 ||
        row.name.toLowerCase().includes(query) ||
        row.fullName.toLowerCase().includes(query);

      return statusMatches && textMatches;
    });
  }, [rows, searchText, statusFilter]);

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">Repository Table</h2>
          <p className="text-[12px] text-white/45">Filtered operational repository view</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-[250px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search repositories..."
              className="glass-input h-10 w-full rounded-xl pl-9 pr-3 text-[13px]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'ALL' | DashboardRepositoryRow['status'])
            }
            className="glass-input h-10 rounded-xl px-3 text-[13px]"
          >
            <option value="ALL">All statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="ISSUES_FOUND">Issues Found</option>
            <option value="ANALYZING">Analyzing</option>
            <option value="IDLE">Idle</option>
          </select>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="glass-panel-soft rounded-xl px-4 py-8 text-center text-[13px] text-white/50">
          No repositories match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-white/45">
                <th className="px-3 py-2 font-medium">Repository Name</th>
                <th className="px-3 py-2 font-medium">Visibility</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Findings Count</th>
                <th className="px-3 py-2 font-medium">Last Analysis Date</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const status = statusStyle(row.status);

                return (
                  <tr
                    key={row.id}
                    className="glass-panel-soft rounded-xl transition-colors duration-150 hover:border-white/20"
                  >
                    <td className="rounded-l-xl px-3 py-3">
                      <p className="text-[14px] font-medium text-white/90">{row.name}</p>
                      <p className="text-[12px] text-white/45">{row.fullName}</p>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-white/70">{row.visibility}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-white/85">
                      {row.findingsCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-white/60">
                      {toReadableDate(row.lastAnalysisAt)}
                    </td>
                    <td className="rounded-r-xl px-3 py-3 text-right">
                      <Link
                        href={`/repositories/${row.id}`}
                        className="inline-flex rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/80 transition hover:border-white/30 hover:text-white"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
