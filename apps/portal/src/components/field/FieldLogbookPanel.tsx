'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FieldGrade, LOGBOOK_STATUS_LABEL, LogbookCounts, LogbookEntry, fieldFetch, formatDay, logbookStatusTone } from '@/lib/fieldActivity';
import { Award, BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';

interface Props {
  courses: { id: string; code: string; name: string }[];
  /** Mata kuliah yang sudah punya pembimbing; logbook baru hanya bisa diisi untuk ini. */
  supervisedCourseIds: string[];
  work: { courseId: string; logbook: LogbookCounts; grade: FieldGrade | null }[];
  notify: (ok: boolean, text: string) => void;
  onChanged: () => void;
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';
const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';
const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

/** Logbook kegiatan lapangan di halaman mahasiswa: isi, perbaiki, hapus (selama belum disetujui), dan lihat tanggapan pembimbing. */
export function FieldLogbookPanel({ courses, supervisedCourseIds, work, notify, onChanged }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ date: todayWib(), activity: '', description: '' });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const supervised = supervisedCourseIds.includes(courseId);
  const w = work.find((x) => x.courseId === courseId);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fieldFetch<{ entries: LogbookEntry[] }>(`/me/logbooks?courseId=${courseId}`);
      setEntries(res.entries);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat logbook.');
    } finally {
      setLoading(false);
    }
  }, [courseId, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setOpen(false);
    setForm({ date: todayWib(), activity: '', description: '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { courseId, date: form.date, activity: form.activity, description: form.description };
      const res = await fieldFetch<{ message: string }>(editing ? `/me/logbooks/${editing}` : '/me/logbooks', { method: editing ? 'PUT' : 'POST', body });
      notify(true, res.message);
      reset();
      await load();
      onChanged();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menyimpan logbook.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Hapus logbook ini?')) return;
    try {
      await fieldFetch(`/me/logbooks/${id}`, { method: 'DELETE' });
      notify(true, 'Logbook dihapus.');
      await load();
      onChanged();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menghapus logbook.');
    }
  };

  const approved = w?.logbook.approved ?? 0;
  const min = w?.logbook.min ?? 0;

  return (
    <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-[#1E3A8A]" /> Logbook kegiatan
        </p>
        <div className="flex items-center gap-2">
          {courses.length > 1 && (
            <select value={courseId} onChange={(e) => { setCourseId(e.target.value); reset(); }} className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white" aria-label="Mata kuliah">
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          )}
          {supervised && !open && (
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] rounded-lg cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Isi logbook
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className={`px-2.5 py-1 rounded-lg font-bold ${min > 0 && approved >= min ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          Disetujui {approved}
          {min > 0 ? ` dari minimal ${min}` : ''}
        </span>
        {w?.grade && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-blue-50 text-[#1E3A8A]">
            <Award className="w-3.5 h-3.5" /> Nilai akhir {w.grade.score}
            {w.grade.letter ? ` (${w.grade.letter})` : ''}
          </span>
        )}
      </div>

      {!supervised && <p className="text-xs text-slate-500">Logbook bisa diisi setelah dosen pembimbing ditetapkan.</p>}

      {open && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid sm:grid-cols-[160px_1fr] gap-3">
            <div>
              <label className={labelCls}>Tanggal</label>
              <input type="date" value={form.date} max={todayWib()} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kegiatan</label>
              <input value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} placeholder="Ringkasan kegiatan hari itu" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Uraian (opsional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={reset} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer">
              Batal
            </button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] rounded-lg disabled:opacity-60 cursor-pointer">
              {saving ? 'Menyimpan...' : editing ? 'Simpan & kirim ulang' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {loading && entries.length === 0 ? (
        <p className="text-xs text-slate-400">Memuat...</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-slate-500">Belum ada logbook.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {entries.map((e) => (
            <li key={e.id} className="px-4 py-3 text-xs bg-white">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm">
                    {formatDay(e.date)} <span className="font-normal text-slate-600">· {e.activity}</span>
                  </p>
                  {e.description && <p className="text-slate-500 mt-0.5 whitespace-pre-line">{e.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${logbookStatusTone(e.status)}`}>{LOGBOOK_STATUS_LABEL[e.status]}</span>
                  {e.status !== 'APPROVED' && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(e.id);
                          setOpen(true);
                          setForm({ date: e.date, activity: e.activity, description: e.description ?? '' });
                        }}
                        className="p-1 text-slate-400 hover:text-[#1E3A8A] cursor-pointer"
                        aria-label="Ubah"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(e.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {e.reviewNote && (
                <p className={`mt-2 rounded-lg px-3 py-2 ${e.status === 'REVISION' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}`}>Tanggapan pembimbing: {e.reviewNote}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
