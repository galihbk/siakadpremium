'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LOGBOOK_STATUS_LABEL, LogbookCounts, LogbookEntry, fieldFetch, formatDay, logbookStatusTone } from '@/lib/fieldActivity';
import { Award, Check, RotateCcw, X } from 'lucide-react';

interface Props {
  student: { studentId: string; name: string; nim: string };
  courseId: string;
  academicYearId: string;
  /** Hanya Pembimbing 1 yang boleh memberi nilai akhir. */
  canGrade: boolean;
  grade: { score: number; letter: string | null; status: string } | null;
  onClose: () => void;
  onChanged: () => void;
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

/** Tinjau logbook satu mahasiswa bimbingan (setuju / minta revisi) dan beri nilai akhir. */
export function LecturerLogbookModal({ student, courseId, academicYearId, canGrade, grade, onClose, onChanged }: Props) {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [counts, setCounts] = useState<LogbookCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [score, setScore] = useState(grade ? String(grade.score) : '');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const query = `studentId=${student.studentId}&courseId=${courseId}&academicYearId=${academicYearId}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fieldFetch<{ entries: LogbookEntry[]; counts: LogbookCounts }>(`/lecturer/logbooks?${query}`);
      setEntries(res.entries);
      setCounts(res.counts);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal memuat logbook.' });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, decision: 'APPROVED' | 'REVISION') => {
    setBusy(id);
    setMsg(null);
    try {
      await fieldFetch(`/lecturer/logbooks/${id}/review`, { method: 'POST', body: { decision, note: decision === 'REVISION' ? note : undefined } });
      setNoteFor(null);
      setNote('');
      await load();
      onChanged();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal menyimpan tanggapan.' });
    } finally {
      setBusy(null);
    }
  };

  const giveGrade = async () => {
    setBusy('grade');
    setMsg(null);
    try {
      const res = await fieldFetch<{ message: string }>('/lecturer/grade', { method: 'POST', body: { studentId: student.studentId, courseId, academicYearId, score: score === '' ? undefined : Number(score) } });
      setMsg({ ok: true, text: res.message });
      onChanged();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal menyimpan nilai.' });
    } finally {
      setBusy(null);
    }
  };

  const enough = counts ? counts.approved >= counts.min : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900">Logbook &amp; Nilai</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.name} <span className="font-mono">{student.nim}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {msg && <p className={`text-xs rounded-lg px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}

          {counts && (
            <p className="text-xs text-slate-600">
              Disetujui <b>{counts.approved}</b>
              {counts.min > 0 ? ` dari minimal ${counts.min}` : ''} · menunggu {counts.submitted} · revisi {counts.revision}
            </p>
          )}

          {loading && entries.length === 0 ? (
            <p className="text-xs text-slate-400">Memuat...</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-slate-500">Mahasiswa belum mengisi logbook.</p>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {entries.map((e) => (
                <li key={e.id} className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm">
                        {formatDay(e.date)} <span className="font-normal text-slate-600">· {e.activity}</span>
                      </p>
                      {e.description && <p className="text-slate-500 mt-0.5 whitespace-pre-line">{e.description}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${logbookStatusTone(e.status)}`}>{LOGBOOK_STATUS_LABEL[e.status]}</span>
                  </div>
                  {e.reviewNote && <p className="mt-2 rounded-lg px-3 py-2 bg-slate-50 text-slate-600">Catatan: {e.reviewNote}</p>}
                  {e.status === 'SUBMITTED' && (
                    <div className="mt-2.5">
                      {noteFor === e.id ? (
                        <div className="space-y-2">
                          <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={2} placeholder="Bagian yang perlu diperbaiki" className={inputCls} />
                          <div className="flex gap-2">
                            <button onClick={() => review(e.id, 'REVISION')} disabled={busy === e.id} className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg disabled:opacity-60 cursor-pointer">
                              Kirim revisi
                            </button>
                            <button onClick={() => { setNoteFor(null); setNote(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer">
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => review(e.id, 'APPROVED')} disabled={busy === e.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg disabled:opacity-60 cursor-pointer">
                            <Check className="w-3.5 h-3.5" /> Setujui
                          </button>
                          <button onClick={() => { setNoteFor(e.id); setNote(''); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer">
                            <RotateCcw className="w-3.5 h-3.5" /> Minta revisi
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#1E3A8A]" /> Nilai akhir
              {grade && (
                <span className="ml-1 font-normal text-slate-500">
                  saat ini {grade.score}
                  {grade.letter ? ` (${grade.letter})` : ''}
                </span>
              )}
            </p>
            {canGrade ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="0-100" className={`${inputCls} max-w-[140px]`} disabled={!enough} />
                  <button onClick={giveGrade} disabled={!enough || busy === 'grade' || score === ''} className="px-3 py-2 text-xs font-bold text-white bg-[#1E3A8A] rounded-lg disabled:opacity-50 cursor-pointer">
                    {busy === 'grade' ? 'Menyimpan...' : 'Simpan nilai'}
                  </button>
                </div>
                {!enough && counts && <p className="text-[11px] text-slate-500 mt-2">Nilai bisa diberikan setelah logbook yang disetujui mencapai {counts.min}.</p>}
              </>
            ) : (
              <p className="text-[11px] text-slate-500 mt-2">Nilai akhir diberikan oleh Pembimbing 1.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
