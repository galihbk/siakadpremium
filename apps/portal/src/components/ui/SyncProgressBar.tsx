'use client';

import React from 'react';

export interface SyncProgressBarProps {
  /** Tampilkan bar atau tidak (biasanya sama dengan state isLoading). */
  active: boolean;
  /**
   * 'determinate'   -- progres asli diketahui (mis. loop batch dari browser dengan hitungan done/total).
   * 'indeterminate' -- satu permintaan tunggal ke server, tidak ada progres yang bisa dilaporkan selagi menunggu.
   */
  mode: 'determinate' | 'indeterminate';
  done?: number;
  total?: number;
  /** Apakah halaman ini aman ditinggal/ditutup sebelum proses selesai. */
  canLeavePage: boolean;
  /** Penjelasan singkat kenapa (disesuaikan dengan metode pengambilan datanya). */
  note: string;
}

/**
 * Progress bar generik untuk aksi sinkronisasi Feeder (Tarik / Push / Update / Bandingkan).
 * Mode dan keterangan "boleh ditinggal atau tidak" HARUS disesuaikan dengan cara request
 * dikirim: satu panggilan tunggal ke backend (indeterminate, aman ditinggal, server tetap
 * memprosesnya) vs loop bertahap yang didorong dari browser (determinate, tidak boleh
 * ditutup karena loop berhenti kalau halaman ditutup).
 */
export function SyncProgressBar({ active, mode, done = 0, total = 0, canLeavePage, note }: SyncProgressBarProps) {
  if (!active) return null;
  const pct = mode === 'determinate' && total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null;

  return (
    <div className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
        {mode === 'determinate' ? (
          <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-300" style={{ width: `${pct ?? 0}%` }} />
        ) : (
          <div className="absolute inset-y-0 left-0 w-1/3 bg-[#1E3A8A] rounded-full sync-progress-indeterminate" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-600">
          {mode === 'determinate' ? `${done} / ${total} data (${pct}%)` : 'Diproses di server...'}
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            canLeavePage ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
          }`}
        >
          {canLeavePage ? 'Boleh ditinggal' : 'Jangan tutup halaman ini'}
        </span>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed">{note}</p>
    </div>
  );
}
