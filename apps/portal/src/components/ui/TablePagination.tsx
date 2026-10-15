'use client';

import React from 'react';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  noun: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/** Kontrol pagination seragam untuk tabel server-side halaman Sinkronisasi Feeder. */
export function TablePagination({ page, pageSize, total, totalPages, noun, onPageChange, onPageSizeChange }: TablePaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const btn = 'px-2.5 py-1 rounded-md border border-slate-200 font-bold disabled:opacity-40 cursor-pointer';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
      <span>
        {total === 0
          ? 'Tidak ada data'
          : `Menampilkan ${start.toLocaleString('id-ID')}-${end.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')} ${noun}`}
      </span>
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-1.5">
          Per halaman
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-slate-200 rounded-md px-1.5 py-1 bg-white text-[11px]"
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => onPageChange(1)} disabled={page <= 1} className={btn}>
          «
        </button>
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={btn}>
          ‹
        </button>
        <span className="font-semibold text-slate-700">
          {page} / {totalPages}
        </span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={btn}>
          ›
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className={btn}>
          »
        </button>
      </div>
    </div>
  );
}
