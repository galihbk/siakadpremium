'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { TablePagination } from '@/components/ui/TablePagination';
import { useServerTable } from '@/lib/useServerTable';
import { getApiBaseUrl } from '@/lib/api';
import { ExamType, ExamScheduleView, EXAM_TYPE_LABEL, formatExamDate, formatExamDateShort, examsFetch } from '@/lib/exams';
import { useInstitution } from '@/lib/useInstitution';
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
    proctor1Id: '',
    proctor2Id: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);

  // Ruang & pengawas yang sudah terpakai pada tanggal/jam yang dipilih
  const [availability, setAvailability] = useState<{ busyRooms: Record<string, string>; busyProctors: Record<string, string> }>({
    busyRooms: {},
    busyProctors: {},
  });
  useEffect(() => {
    if (!editing || !form.examDate || !form.startTime || !form.endTime || form.startTime >= form.endTime) {
      setAvailability({ busyRooms: {}, busyProctors: {} });
      return;
    }
    let alive = true;
    const qs = new URLSearchParams({
      academicYearId: yearId,
      date: form.examDate,
      startTime: form.startTime,
      endTime: form.endTime,
      courseClassId: editing.courseClassId,
      type,
    });
    examsFetch<{ busyRooms: Record<string, string>; busyProctors: Record<string, string> }>(`/admin/availability?${qs}`)
      .then((d) => alive && setAvailability(d))
      .catch(() => alive && setAvailability({ busyRooms: {}, busyProctors: {} }));
    return () => {
      alive = false;
    };
  }, [editing, form.examDate, form.startTime, form.endTime, yearId, type]);

  // Berita Acara (PDF dengan KOP surat) per kelas
  const inst = useInstitution();
  const [baBusy, setBaBusy] = useState<string | null>(null);
  const downloadBeritaAcara = async (r: Row) => {
    if (!r.schedule) return;
    setBaBusy(r.schedule.id);
    try {
      const data = await examsFetch<{ year: { name: string }; items: { schedule: any; seats: { seatNo: number | null; nim: string; name: string }[] }[] }>(
        `/admin/print?scheduleId=${r.schedule.id}`,
      );
      const it = data.items[0];
      const { downloadExamBeritaAcaraPdf } = await import('@/lib/academicPdf');
      await downloadExamBeritaAcaraPdf({
        inst,
        typeLabel: EXAM_TYPE_LABEL[type],
        yearName: data.year.name,
        courseCode: r.courseCode,
        courseName: r.courseName,
        className: r.className,
        lecturerName: r.lecturerName,
        dateLabel: formatExamDate(it.schedule.examDate),
        timeLabel: `${it.schedule.startTime} - ${it.schedule.endTime} WIB`,
        roomName: it.schedule.roomName || '-',
        proctor1: it.schedule.proctor1?.name,
        proctor2: it.schedule.proctor2?.name,
        participants: it.seats,
        filename: `Berita-Acara-${type}-${r.courseCode}-${r.className}.pdf`.replace(/\s+/g, '-'),
      });
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal membuat berita acara.');
    } finally {
      setBaBusy(null);
    }
  };

  // Rekap pengawas: diunduh sebagai Excel (ringkasan per dosen + rincian tugas)
  const [recapBusy, setRecapBusy] = useState(false);
  const downloadRecap = async () => {
    setRecapBusy(true);
    try {
      const recap = await examsFetch<{ year: { name: string }; items: { name: string; total: number; duties: any[] }[] }>(
        `/admin/proctors?academicYearId=${yearId}&type=${type}`,
      );
      if (recap.items.length === 0) {
        notify(false, `Belum ada pengawas yang ditugaskan untuk ${type}.`);
        return;
      }
      const XLSX = await import('xlsx');
      const summary = recap.items.map((p, i) => ({ No: i + 1, 'Nama Dosen': p.name, 'Jumlah Tugas': p.total }));
      const detail = recap.items.flatMap((p) =>
        p.duties.map((d) => ({
          'Nama Dosen': p.name,
          Peran: d.role,
          Tanggal: formatExamDateShort(d.examDate),
          Jam: `${d.startTime}-${d.endTime}`,
          'Kode MK': d.courseCode,
          'Mata Kuliah': d.courseName,
          Kelas: d.className,
          Ruang: d.room,
        })),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Rekap per Dosen');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), 'Rincian Tugas');
      XLSX.writeFile(wb, `Rekap-Pengawas-${type}-${recap.year.name.replace('/', '-')}.xlsx`);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal membuat rekap pengawas.');
    } finally {
      setRecapBusy(false);
    }
  };

  // Nomor kursi
  const [seatBusy, setSeatBusy] = useState(false);
  const [seatMode, setSeatMode] = useState<'nim' | 'random'>('random');
  const [seatView, setSeatView] = useState<{ schedule: any; seats: { seatNo: number | null; nim: string; name: string }[] } | null>(null);

  const generateSeats = async (scheduleId?: string) => {
    setSeatBusy(true);
    try {
      const res = await examsFetch<{ generated: number; seats: number; failed: string[] }>('/admin/seats/generate', {
        method: 'POST',
        body: scheduleId ? { scheduleId, mode: seatMode } : { academicYearId: yearId, type, mode: seatMode },
      });
      notify(
        res.failed.length === 0,
        `Nomor kursi dibuat untuk ${res.generated} jadwal (${res.seats} kursi).`,
        res.failed.length ? res.failed : undefined,
      );
      table.reload();
      if (scheduleId) await openSeats(scheduleId);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal membuat nomor kursi.');
    } finally {
      setSeatBusy(false);
    }
  };

  const openSeats = async (scheduleId: string) => {
    try {
      setSeatView(await examsFetch(`/admin/schedule/${scheduleId}/seats`));
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat daftar peserta.');
    }
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    const s = r.schedule;
    setForm({
      examDate: s ? s.examDate.slice(0, 10) : '',
      startTime: s?.startTime || '08:00',
      endTime: s?.endTime || '10:00',
      roomId: s?.roomId || '',
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

          <div className="flex flex-wrap items-center gap-2">
            <select className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white" value={seatMode} onChange={(e) => setSeatMode(e.target.value as 'nim' | 'random')}>
              <option value="random">Acak</option>
              <option value="nim">Urut NIM</option>
            </select>
            <button
              disabled={!yearId || recapBusy}
              onClick={downloadRecap}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg disabled:opacity-60 cursor-pointer"
            >
              {recapBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />} Unduh Rekap Pengawas {type} (Excel)
            </button>
            <button
              disabled={seatBusy || !yearId}
              onClick={() => generateSeats()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg disabled:opacity-60 cursor-pointer"
            >
              {seatBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />} Generate Nomor Kursi Semua Kelas ({type})
            </button>
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
            <table className="w-full min-w-[1040px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Mata Kuliah</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Peserta</th>
                  <th className="py-2.5 px-3">Tanggal &amp; Jam</th>
                  <th className="py-2.5 px-3">Ruang</th>
                  <th className="py-2.5 px-3 text-center">Kursi</th>
                  <th className="py-2.5 px-3">Pengawas</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && table.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 px-3 text-center text-slate-400">
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
                    <td className="py-2.5 px-3 text-center font-mono">
                      {r.schedule ? (
                        <button onClick={() => openSeats(r.schedule!.id)} className="text-[#1E3A8A] underline cursor-pointer" title="Lihat peserta">
                          {r.studentCount}
                        </button>
                      ) : (
                        r.studentCount
                      )}
                    </td>
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
                    <td className="py-2.5 px-3 text-center">
                      {r.schedule ? (
                        r.schedule.seatCount ? (
                          <button onClick={() => openSeats(r.schedule!.id)} className="font-mono text-[#1E3A8A] underline cursor-pointer">
                            {r.schedule.seatCount}/{r.schedule.roomCapacity ?? '-'}
                          </button>
                        ) : (
                          <button
                            disabled={seatBusy}
                            onClick={() => generateSeats(r.schedule!.id)}
                            className="text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-2 py-1 disabled:opacity-60 cursor-pointer"
                          >
                            Generate ({r.studentCount})
                          </button>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
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
                      {r.schedule && (
                        <button
                          disabled={baBusy === r.schedule.id}
                          onClick={() => downloadBeritaAcara(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-60 cursor-pointer"
                        >
                          {baBusy === r.schedule.id && <RefreshCw className="w-3 h-3 animate-spin" />} Berita Acara (PDF)
                        </button>
                      )}
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
              <div className="sm:col-span-3">
                <label className={labelCls}>Ruang ujian *</label>
                <select className={inputCls} value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                  <option value="">-- Pilih ruang --</option>
                  {rooms.map((rm) => {
                    const busy = availability.busyRooms[rm.id];
                    const tooSmall = editing.studentCount > rm.capacity;
                    return (
                      <option key={rm.id} value={rm.id} disabled={!!busy || tooSmall}>
                        {rm.name} ({rm.buildingName}) · kap. {rm.capacity}
                        {busy ? ` — terpakai: ${busy}` : tooSmall ? ' — kapasitas kurang' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {editing.studentCount} peserta. Ruang yang bentrok pada tanggal &amp; jam ini atau yang terlalu kecil dinonaktifkan. Lokasi mengikuti data ruang (gedung &amp; lantai).
                </p>
              </div>
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Pengawas 1</label>
                <SearchableSelect
                  value={form.proctor1Id}
                  onChange={(v) => setForm({ ...form, proctor1Id: v })}
                  options={lecturers.filter((l) => !availability.busyProctors[l.id] || l.id === form.proctor1Id).map((l) => ({ value: l.id, label: lecturerLabel(l) }))}
                  placeholder="-- Pilih dosen --"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                />
              </div>
              <div>
                <label className={labelCls}>Pengawas 2 (opsional)</label>
                <SearchableSelect
                  value={form.proctor2Id}
                  onChange={(v) => setForm({ ...form, proctor2Id: v })}
                  options={lecturers.filter((l) => l.id !== form.proctor1Id && (!availability.busyProctors[l.id] || l.id === form.proctor2Id)).map((l) => ({ value: l.id, label: lecturerLabel(l) }))}
                  placeholder="-- Tanpa pengawas 2 --"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                  emptyLabel="-- Tanpa pengawas 2 --"
                />
              </div>
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
                    disabled={seatBusy}
                    title={`Mengacak nomor kursi untuk ${editing.studentCount} mahasiswa kelas ini`}
                    onClick={() => generateSeats(editing.schedule!.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 mr-2 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl disabled:opacity-60 cursor-pointer"
                  >
                    {seatBusy && <RefreshCw className="w-4 h-4 animate-spin" />} Generate Nomor Kursi ({editing.studentCount} mahasiswa, {seatMode === 'random' ? 'acak' : 'urut NIM'})
                  </button>
                )}
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
                disabled={busy || !form.examDate || !form.startTime || !form.endTime || !form.roomId}
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
      <Modal
        isOpen={!!seatView}
        onClose={() => setSeatView(null)}
        title={seatView ? `Peserta ${type} -- ${seatView.schedule.courseCode} ${seatView.schedule.courseName}` : ''}
        subtitle={seatView ? `Kelas ${seatView.schedule.className} · ${seatView.seats.length} peserta · ${seatView.schedule.roomName || '-'} · ${seatView.schedule.startTime}-${seatView.schedule.endTime}` : ''}
        icon={<CalendarClock className="w-5 h-5" />}
        maxWidth="2xl"
      >
        {seatView && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => window.print()} className="px-3.5 py-2 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer">
                Cetak
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2 px-3 w-20">Kursi</th>
                  <th className="py-2 px-3">NIM</th>
                  <th className="py-2 px-3">Nama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seatView.seats.map((x) => (
                  <tr key={x.nim}>
                    <td className="py-1.5 px-3 font-mono font-bold">{x.seatNo ?? <span className="text-slate-300">-</span>}</td>
                    <td className="py-1.5 px-3 font-mono">{x.nim}</td>
                    <td className="py-1.5 px-3">{x.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </PortalLayout>
  );
}
