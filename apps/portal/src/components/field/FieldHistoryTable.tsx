'use client';

import React from 'react';

export interface FieldHistoryEvent {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  createdAt: string;
  courseCode?: string;
}

const TONE: Record<string, string> = {
  REGISTRATION_SUBMITTED: 'bg-blue-500',
  REGISTRATION_RESUBMITTED: 'bg-blue-500',
  REGISTRATION_APPROVED: 'bg-emerald-500',
  REGISTRATION_REJECTED: 'bg-rose-500',
  SUPERVISOR_ASSIGNED: 'bg-emerald-500',
  SUPERVISOR_RELEASED: 'bg-amber-500',
  CHARGE_ISSUED: 'bg-amber-500',
  CHARGE_PAID: 'bg-emerald-500',
  CHARGE_CANCELLED: 'bg-slate-400',
  GROUP_JOINED: 'bg-indigo-500',
  GROUP_LEFT: 'bg-amber-500',
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Tabel riwayat kegiatan lapangan (terbaru di atas). */
export function FieldHistoryTable({ events, showCourse }: { events: FieldHistoryEvent[]; showCourse?: boolean }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Waktu</th>
              <th className="px-3 py-2 text-left font-semibold">Kejadian</th>
              <th className="px-3 py-2 text-left font-semibold">Keterangan</th>
              {showCourse && <th className="px-3 py-2 text-left font-semibold">Mata kuliah</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.length === 0 && (
              <tr>
                <td colSpan={showCourse ? 4 : 3} className="px-3 py-6 text-center text-slate-400">
                  Belum ada riwayat.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${TONE[e.type] ?? 'bg-slate-400'}`} />
                  {e.title}
                </td>
                <td className="px-3 py-2 text-slate-600">{e.detail || <span className="text-slate-300">-</span>}</td>
                {showCourse && <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{e.courseCode}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
