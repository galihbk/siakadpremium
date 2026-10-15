'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { TablePagination } from '@/components/ui/TablePagination';
import { useServerTable } from '@/lib/useServerTable';
import { getApiBaseUrl } from '@/lib/api';
import { ExamType, ExamScheduleView, EXAM_TYPE_LABEL, formatExamDateShort, examsFetch } from '@/lib/exams';
import { CalendarClock, CheckCircle2, AlertTriangle, RefreshCw, X, Search, Settings2, Trash2 } from 'lucide-react';

interface Row {
  courseClassId: string;
  className: string;
  courseCode: string;
  courseName: string;
  lecturerName: string | null;
  studentCount: number;
  schedule: ExamScheduleView | null;
}

interface YearOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}
interface RoomOption {
  id: string;
  code: string;
  name: string;
  buildingName: string;
  capacity: number;
}
interface LecturerOption {
  id: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';
const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

const lecturerLabel = (l: LecturerOption) =>
  `${[l.titlePrefix, l.fullName].filter(Boolean).join(' ')}${l.titleSuffix ? `, ${l.titleSuffix}` : ''}`;

export default function AdminJadwalUjianPage() {
  const [years, setYears] = useState<YearOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [yearId, setYearId] = useState('');
  const [type, setType] = useState<ExamType>('UTS');
  const [status, setStatus] = useState<'' | 'scheduled' | 'unscheduled'>('');

  const [toast, setToast] = useState<{ ok: boolean; text: string; warnings?: string[] } | null>(null);
  const notify = (ok: boolean, text: string, warnings?: string[]) => {
    setToast({ ok, text, warnings });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), warnings?.length ? 9000 : 5000);
  };

  useEffect(() => {
    examsFetch<{ years: YearOption[]; rooms: RoomOption[] }>('/admin/options')
      .then((d) => {
        setYears(d.years);
        setRooms(d.rooms);
        setYearId((d.years.find((y) => y.isActive) || d.years[0])?.id || '');
      })
      .catch((err) => notify(false, err instanceof Error ? err.message : 'Gagal memuat pilihan.'));
    fetch(`${getApiBaseUrl()}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = j?.data ?? j;
        if (Array.isArray(list)) setLecturers(list);
      })
      .catch(() => {});
  }, []);

  const table = useServerTable<Row, { summary?: { totalClasses: number; scheduledCount: number; unscheduledCount: number } }>({
    endpoint: 'exams/admin',
    defaultSortKey: 'course',
    defaultPageSize: 25,
    params: { academicYearId: yearId, type, status },
  });
  const summary = table.extra.summary;

  // ---- form jadwal
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({
    examDate: '',
    startTime: '08:00',
    endTime: '10:00',
    roomId: '',
    location: '',
    proctor1Id: '',
    proctor2Id: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);

  const openEdit = (r: Row) => {
    setEditing(r);
    const s = r.schedule;
    setForm({
      examDate: s ? s.examDate.slice(0, 10) : '',
      startTime: s?.startTime || '08:00',
      endTime: s?.endTime || '10:00',
      roomId: s?.roomId || '',
      location: s?.location || '',
      proctor1Id: s?.proctor1?.id || '',
      proctor2Id: s?.proctor2?.id || '',
      notes: s?.notes || '',
    });
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await examsFetch<{ warnings: string[] }>('/admin/schedule', {
        method: 'POST',
        body: {
          courseClassId: editing.courseClassId,
          type,
          examDate: form.examDate,
          startTime: form.startTime,
          endTime: form.endTime,
          roomId: form.roomId || null,
          location: form.roomId ? null : form.location,
          proctor1Id: form.proctor1Id || null,
          proctor2Id: form.proctor2Id || null,
          notes: form.notes,
        },
      });
      notify(true, `Jadwal ${type} tersimpan.`, res.warnings);
      setEditing(null);
      table.reload();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menyimpan jadwal.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing?.schedule) return;
    setBusy(true);
    try {
      await examsFetch(`/admin/schedule/${editing.schedule.id}`, { method: 'DELETE' });
      notify(true, 'Jadwal ujian dihapus.');
      setEditing(null);
      table.reload();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menghapus jadwal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalLayout role="admin" userName="" userIdText="">
      <div className="space-y-6 pb-12">
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[60] max-w-md px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-medium ${
              toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span className="flex-1">{toast.text}</span>
              <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {toast.warnings && toast.warnings.length > 0 && (
              <ul className="mt-2 pl-8 list-disc text-amber-300 space-y-1">
                {toast.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Jadwal Ujian (UTS &amp; UAS)</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-3xl leading-relaxed">
                Atur tanggal, jam, ruang, dan pengawas ujian untuk tiap kelas. Sistem memblok bentrok ruang dan pengawas, dan
                memperingatkan jika ada mahasiswa yang punya dua ujian di jam yang sama.
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Tahun Akademik</label>
              <select className={inputCls} value={yearId} onChange={(e) => setYearId(e.target.value)}>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} ({y.code}){y.isActive ? ' -- aktif' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Jenis Ujian</label>
              <div className="flex gap-2">
                {(['UTS', 'UAS'] as ExamType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border cursor-pointer ${
                      type === t ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Status Penjadwalan</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="">Semua kelas</option>
                <option value="scheduled">Sudah terjadwal</option>
                <option value="unscheduled">Belum terjadwal</option>
              </select>
            </div>
          </div>

          {summary && (
            <p className="text-[12px] text-slate-500">
              {EXAM_TYPE_LABEL[type]}: <b className="text-emerald-700">{summary.scheduledCount}</b> kelas terjadwal,{' '}
              <b className="text-amber-700">{summary.unscheduledCount}</b> belum, dari {summary.totalClasses} kelas.
            </p>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Cari kode/nama mata kuliah, kelas, atau dosen pengampu..."
              value={table.searchInput}
              onChange={(e) => table.setSearchInput(e.target.value)}
            />
          </div>

          {table.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat tabel: {table.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl overflow-auto ${table.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Mata Kuliah</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Peserta</th>
                  <th className="py-2.5 px-3">Tanggal &amp; Jam</th>
                  <th className="py-2.5 px-3">Ruang</th>
                  <th className="py-2.5 px-3">Pengawas</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && table.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-3 text-center text-slate-400">
                      Tidak ada kelas untuk filter ini.
                    </td>
                  </tr>
                )}
                {table.items.map((r) => (
                  <tr key={r.courseClassId} className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-900">{r.courseName}</p>
                      <p className="font-mono text-[#1E3A8A]">{r.courseCode}</p>
                      <p className="text-[11px] text-slate-400">{r.lecturerName || 'Dosen belum ditetapkan'}</p>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{r.className}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{r.studentCount}</td>
                    <td className="py-2.5 px-3">
                      {r.schedule ? (
                        <>
                          <p className="font-semibold text-slate-800">{formatExamDateShort(r.schedule.examDate)}</p>
                          <p className="text-slate-500">
                            {r.schedule.startTime} - {r.schedule.endTime}
                          </p>
                        </>
                      ) : (
                        <span className="text-amber-600 font-semibold">Belum terjadwal</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{r.schedule?.roomName || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {r.schedule?.proctor1 ? (
                        <>
                          <p>{r.schedule.proctor1.name}</p>
                          {r.schedule.proctor2 && <p className="text-slate-400">{r.schedule.proctor2.name}</p>}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5" /> {r.schedule ? 'Ubah' : 'Jadwalkan'}
                      </button>
                    </td>
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
            noun="kelas"
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        </div>
      </div>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.courseCode} -- ${editing.courseName}` : ''}
        subtitle={editing ? `Kelas ${editing.className} · ${EXAM_TYPE_LABEL[type]}` : ''}
        icon={<CalendarClock className="w-5 h-5" />}
        maxWidth="2xl"
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Tanggal *</label>
                <input type="date" className={inputCls} value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Jam Mulai *</label>
                <input type="time" className={inputCls} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Jam Selesai *</label>
                <input type="time" className={inputCls} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <div className="sm:col-span-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Ruang (master ruang)</label>
                  <select className={inputCls} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                    <option value="">-- Tidak dari master ruang --</option>
                    {rooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} ({rm.buildingName}) · kap. {rm.capacity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Atau lokasi bebas</label>
                  <input
                    className={inputCls}
                    value={form.location}
                    disabled={!!form.roomId}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={rooms.length === 0 ? 'mis. Aula Gedung A' : 'Dipakai bila ruang tidak dipilih'}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Pengawas 1</label>
                <select className={inputCls} value={form.proctor1Id} onChange={(e) => setForm({ ...form, proctor1Id: e.target.value })}>
                  <option value="">-- Pilih dosen --</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {lecturerLabel(l)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Pengawas 2 (opsional)</label>
                <select className={inputCls} value={form.proctor2Id} onChange={(e) => setForm({ ...form, proctor2Id: e.target.value })}>
                  <option value="">-- Tanpa pengawas 2 --</option>
                  {lecturers
                    .filter((l) => l.id !== form.proctor1Id)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {lecturerLabel(l)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Catatan untuk peserta (opsional)</label>
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-between">
              <div>
                {editing.schedule && (
                  <button
                    disabled={busy}
                    onClick={remove}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl disabled:opacity-60 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Jadwal
                  </button>
                )}
              </div>
              <button
                disabled={busy || !form.examDate || !form.startTime || !form.endTime}
                onClick={save}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer"
              >
                {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
                Simpan Jadwal
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
