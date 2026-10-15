'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { TablePagination } from '@/components/ui/TablePagination';
import { useServerTable } from '@/lib/useServerTable';
import { getApiBaseUrl } from '@/lib/api';
import { Search, AlertTriangle } from 'lucide-react';

export interface ProdiColumn<T> {
  key: string;
  label: string;
  /** Kunci pengurutan di server; kosong = kolom tidak bisa diurutkan. */
  sortKey?: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export interface ProdiFilter {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ProdiDataPageProps<T, E> {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** Path di bawah API base, mis. `prodi/students`. */
  endpoint: string;
  columns: ProdiColumn<T>[];
  rowKey: (row: T) => string;
  defaultSortKey?: string;
  searchPlaceholder: string;
  noun: string;
  emptyText?: string;
  /** Filter dropdown; bisa bergantung pada data tambahan dari server (mis. daftar angkatan). */
  filters?: (extra: E) => ProdiFilter[];
  /** Tampilkan pemilih semester (tahun akademik) yang dikirim sebagai `academicYearId`. */
  yearSelect?: boolean;
  /** Ringkasan di atas tabel (chip jumlah per status, dsb). */
  summary?: (extra: E, total: number) => React.ReactNode;
}

interface YearOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

const inputCls =
  'px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

/**
 * Halaman data program studi seragam: header, pencarian, filter, tabel server-side dengan
 * urutan dan pagination. Seluruh data dibatasi ke prodi milik akun oleh API.
 */
export function ProdiDataPage<T, E = Record<string, never>>({
  title,
  subtitle,
  icon,
  endpoint,
  columns,
  rowKey,
  defaultSortKey = '',
  searchPlaceholder,
  noun,
  emptyText = 'Tidak ada data.',
  filters,
  yearSelect,
  summary,
}: ProdiDataPageProps<T, E>) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [years, setYears] = useState<YearOption[]>([]);
  const [yearId, setYearId] = useState('');

  useEffect(() => {
    if (!yearSelect) return;
    fetch(`${getApiBaseUrl()}/academic/years`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = j?.data ?? j;
        if (!Array.isArray(list)) return;
        const opts: YearOption[] = list
          .map((y: any) => ({ id: y.id, code: String(y.code), name: String(y.name), isActive: Boolean(y.isActive) }))
          .sort((a: YearOption, b: YearOption) => b.code.localeCompare(a.code));
        setYears(opts);
        setYearId((opts.find((y) => y.isActive) || opts[0])?.id || '');
      })
      .catch(() => {});
  }, [yearSelect]);

  const params: Record<string, string> = { ...filterValues };
  if (yearSelect && yearId) params.academicYearId = yearId;

  const table = useServerTable<T, E>({ endpoint, defaultSortKey, params });
  const filterDefs = filters ? filters(table.extra) : [];
  const sortIndicator = (key: string) => (table.sortKey === key ? (table.sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅');

  return (
    <PortalLayout role="prodi" userName="" userIdText="">
      <div className="space-y-6 pb-12">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
              {icon}
            </div>
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
                Admin Program Studi
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-3xl leading-relaxed">{subtitle}</p>
            </div>
          </div>
        </div>

        {summary && !table.isLoading && (
          <div className="flex flex-wrap gap-2">{summary(table.extra, table.total)}</div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputCls} w-full pl-9`}
                placeholder={searchPlaceholder}
                value={table.searchInput}
                onChange={(e) => table.setSearchInput(e.target.value)}
              />
            </div>
            {yearSelect && (
              <select className={inputCls} value={yearId} onChange={(e) => setYearId(e.target.value)}>
                {years.length === 0 && <option value="">Memuat semester...</option>}
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} ({y.code}){y.isActive ? ' -- aktif' : ''}
                  </option>
                ))}
              </select>
            )}
            {filterDefs.map((f) => (
              <select
                key={f.name}
                className={inputCls}
                value={filterValues[f.name] || ''}
                onChange={(e) => setFilterValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                aria-label={f.label}
              >
                <option value="">{f.label}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ))}
          </div>

          {table.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat data: {table.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl overflow-auto ${table.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      onClick={c.sortKey ? () => table.toggleSort(c.sortKey!) : undefined}
                      className={`py-2.5 px-3 ${c.sortKey ? 'cursor-pointer select-none hover:text-[#1E3A8A]' : ''} ${c.className || ''}`}
                    >
                      {c.label}
                      {c.sortKey && (
                        <span className={`text-[9px] ${table.sortKey === c.sortKey ? '' : 'text-slate-300'}`}>
                          {sortIndicator(c.sortKey)}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && table.items.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-8 px-3 text-center text-slate-400">
                      {emptyText}
                    </td>
                  </tr>
                )}
                {table.items.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-slate-50/70 align-top">
                    {columns.map((c) => (
                      <td key={c.key} className={`py-2.5 px-3 ${c.className || ''}`}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            totalPages={table.totalPages}
            noun={noun}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        </div>
      </div>
    </PortalLayout>
  );
}

/** Chip ringkasan kecil untuk header halaman prodi. */
export function StatChip({ label, value, tone = 'slate' }: { label: string; value: number | string; tone?: 'slate' | 'emerald' | 'amber' | 'blue' | 'rose' }) {
  const tones: Record<string, string> = {
    slate: 'bg-white text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${tones[tone]}`}>
      <span className="font-medium opacity-80">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </span>
  );
}
