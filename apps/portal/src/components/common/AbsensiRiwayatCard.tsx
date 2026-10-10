'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { History, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryRecord {
  date: string;
  checkInPagi: string | null;
  checkInSore: string | null;
  isLatePagi?: boolean | null;
  isLateSore?: boolean | null;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const authHeaders = () => {
  const { token } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export function AbsensiRiwayatCard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: number, y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/attendance/history?month=${m}&year=${y}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRecords(await res.json());
    } catch (err) {
      console.error('Gagal memuat riwayat absensi', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month, year);
  }, [load, month, year]);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const totalHadirPagi = records.filter((r) => r.checkInPagi).length;
  const totalHadirSore = records.filter((r) => r.checkInSore).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#1E3A8A]" />
          <h3 className="text-sm font-bold text-slate-800">Riwayat Bulan Ini</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftMonth(-1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700 w-28 text-center">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={() => shiftMonth(1)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-slate-100">
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
          <p className="text-[10px] text-amber-600 font-semibold">Hadir Pagi</p>
          <p className="text-lg font-black text-amber-700">{totalHadirPagi}x</p>
        </div>
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
          <p className="text-[10px] text-indigo-600 font-semibold">Hadir Sore</p>
          <p className="text-lg font-black text-indigo-700">{totalHadirSore}x</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-80">
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">Memuat...</div>
        ) : records.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">Belum ada absensi tercatat bulan ini.</div>
        ) : (
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.date}>
                  <td className="px-5 py-2.5 text-slate-600">
                    {new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    {r.checkInPagi ? (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${r.isLatePagi ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {formatTime(r.checkInPagi)}
                        {r.isLatePagi && <span className="text-[9px] font-bold">(Telat)</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <XCircle className="w-3 h-3" /> Pagi
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {r.checkInSore ? (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${r.isLateSore ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {formatTime(r.checkInSore)}
                        {r.isLateSore && <span className="text-[9px] font-bold">(Telat)</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <XCircle className="w-3 h-3" /> Sore
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
