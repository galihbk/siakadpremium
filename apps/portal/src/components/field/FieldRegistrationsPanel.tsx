'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FieldHistoryEvent, FieldHistoryTable } from '@/components/field/FieldHistoryTable';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getApiBaseUrl } from '@/lib/api';
import {
  FieldCategory,
  PeriodState,
  RosterStatus,
  ChargeStatus,
  CHARGE_STATUS_LABEL,
  chargeStatusTone,
  REGISTRATION_STATUS_LABEL,
  PERIOD_STATE_LABEL,
  fieldFetch,
  formatDay,
  formatRupiah,
  periodStateTone,
  registrationStatusTone,
  toDateInput,
} from '@/lib/fieldActivity';
import { CalendarClock, Check, CheckCircle2, AlertTriangle, RefreshCw, Search, X } from 'lucide-react';

interface RegistrationItem {
  id: string | null;
  status: RosterStatus;
  chargeStatus: ChargeStatus;
  studentId: string;
  courseId: string;
  academicYearId: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  courseCode: string;
  courseName: string;
  partnerId: string | null;
  placeName: string | null;
  placeAddress: string | null;
  fieldSupervisorName: string | null;
  plan: string | null;
  adminNote: string | null;
  submittedAt: string | null;
  supervisor1Id: string | null;
  supervisor1Name: string | null;
  supervisor2Id: string | null;
}

interface PeriodRow {
  categoryId: string;
  categoryName: string;
  period: { id: string; openAt: string; closeAt: string; notes: string | null; state: PeriodState } | null;
}

interface LecturerOption {
  id: string;
  nidn: string;
  fullName: string;
}

const selectCls =
  'w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';
const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

/** Pendaftaran mahasiswa untuk jenis kegiatan yang wajib mendaftar: periode, antrean, dan persetujuan. */
export function FieldRegistrationsPanel({ category, onChanged }: { category: FieldCategory; onChanged?: () => void }) {
  const [status, setStatus] = useState<'' | RosterStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ NONE: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [yearName, setYearName] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);

  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ openAt: '', closeAt: '', notes: '' });
  const [reviewing, setReviewing] = useState<RegistrationItem | null>(null);
  const [reviewForm, setReviewForm] = useState({ adminNote: '', supervisor1Id: '', supervisor2Id: '' });
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<FieldHistoryEvent[]>([]);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 4500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ categoryId: category.id });
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const [reg, per] = await Promise.all([
        fieldFetch<{ academicYearName: string; counts: Record<string, number>; items: RegistrationItem[] }>(`/admin/registrations?${params}`),
        fieldFetch<{ items: PeriodRow[] }>('/admin/periods'),
      ]);
      setItems(reg.items);
      setCounts(reg.counts);
      setYearName(reg.academicYearName);
      setPeriod(per.items.find((p) => p.categoryId === category.id) ?? null);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat pendaftaran.');
    } finally {
      setLoading(false);
    }
  }, [category.id, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setLecturers(j.data || []))
      .catch(() => undefined);
  }, []);

  const openPeriod = () => {
    setPeriodForm({
      openAt: toDateInput(period?.period?.openAt),
      closeAt: toDateInput(period?.period?.closeAt),
      notes: period?.period?.notes ?? '',
    });
    setPeriodOpen(true);
  };

  const savePeriod = async () => {
    setBusy(true);
    try {
      const r = await fieldFetch<{ message: string }>('/admin/periods', { method: 'PUT', body: { categoryId: category.id, ...periodForm } });
      notify(true, r.message);
      setPeriodOpen(false);
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menyimpan periode.');
    } finally {
      setBusy(false);
    }
  };

  const removePeriod = async () => {
    if (!period?.period) return;
    setBusy(true);
    try {
      const r = await fieldFetch<{ message: string }>(`/admin/periods/${period.period.id}`, { method: 'DELETE' });
      notify(true, r.message);
      setPeriodOpen(false);
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menghapus periode.');
    } finally {
      setBusy(false);
    }
  };

  const openReview = (item: RegistrationItem) => {
    setReviewing(item);
    setHistory([]);
    fieldFetch<{ items: FieldHistoryEvent[] }>(`/admin/history?studentId=${item.studentId}&courseId=${item.courseId}&academicYearId=${item.academicYearId}`)
      .then((r) => setHistory(r.items))
      .catch(() => setHistory([]));
    setReviewForm({ adminNote: item.status === 'REJECTED' ? item.adminNote ?? '' : '', supervisor1Id: item.supervisor1Id ?? '', supervisor2Id: item.supervisor2Id ?? '' });
  };

  const review = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!reviewing) return;
    setBusy(true);
    try {
      if (!reviewing.id) return;
      const r = await fieldFetch<{ message: string }>(`/admin/registrations/${reviewing.id}/review`, {
        method: 'POST',
        body: {
          status: decision,
          adminNote: reviewForm.adminNote,
          supervisor1Id: decision === 'APPROVED' ? reviewForm.supervisor1Id || null : null,
          supervisor2Id: decision === 'APPROVED' ? reviewForm.supervisor2Id || null : null,
        },
      });
      notify(true, r.message);
      setReviewing(null);
      await load();
      onChanged?.();
      window.dispatchEvent(new Event('siakad:thesis-updated')); // segarkan lencana sidebar
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memproses pendaftaran.');
    } finally {
      setBusy(false);
    }
  };

  const state: PeriodState = period?.period?.state ?? 'NOT_SET';
  const lecturerOptions = lecturers.map((l) => ({ value: l.id, label: `${l.fullName} (NIDN: ${l.nidn})` }));

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'}`}>
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="max-w-sm">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Periode pendaftaran */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
              Periode Pendaftaran {category.name}
              <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${periodStateTone(state)}`}>{PERIOD_STATE_LABEL[state]}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {period?.period
                ? `${formatDay(period.period.openAt)} - ${formatDay(period.period.closeAt)}`
                : 'Mahasiswa belum dapat mendaftar sebelum periode diatur.'}
              {yearName && <> &bull; Tahun akademik {yearName}</>}
            </p>
            {period?.period?.notes && <p className="text-[11px] text-slate-400 mt-0.5">{period.period.notes}</p>}
          </div>
        </div>
        <button onClick={openPeriod} className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer">
          {period?.period ? 'Ubah Periode' : 'Atur Periode'}
        </button>
      </div>

      {/* Antrean */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap gap-2">
            {([['PENDING', 'Menunggu'], ['APPROVED', 'Disetujui'], ['REJECTED', 'Ditolak'], ['NONE', 'Belum mendaftar'], ['', 'Semua']] as const).map(([k, label]) => (
              <button
                key={k || 'all'}
                onClick={() => setStatus(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${status === k ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {label}
                {k ? ` (${counts[k] ?? 0})` : ` (${(counts.NONE ?? 0) + (counts.PENDING ?? 0) + (counts.APPROVED ?? 0) + (counts.REJECTED ?? 0)})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIM, atau tempat kegiatan..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mahasiswa</th>
                <th className="px-4 py-3 text-left font-semibold">Tempat Kegiatan</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                {category.feeAmount > 0 && <th className="px-4 py-3 text-left font-semibold">Pembayaran</th>}
                {!category.isGroup && <th className="px-4 py-3 text-left font-semibold">Pembimbing</th>}
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={(category.isGroup ? 4 : 5) + (category.feeAmount > 0 ? 1 : 0)} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada mahasiswa {category.name} untuk filter ini.
                  </td>
                </tr>
              )}
              {items.map((r) => (
                <tr key={r.id ?? `${r.nim}:${r.courseCode}`} className="hover:bg-slate-50/70 align-top">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{r.studentName}</span>
                    <span className="text-[11px] font-mono text-slate-500">{r.nim} &bull; {r.studyProgram}</span>
                    <span className="block text-[11px] text-slate-400">{r.courseCode} - {r.courseName}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    {r.status === 'NONE' && <span className="text-slate-400">-</span>}
                    <span className="font-semibold text-slate-700 block">{r.placeName}</span>
                    {category.hasPartners && r.status !== 'NONE' && (
                      <span className={`inline-flex mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${r.partnerId ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {r.partnerId ? 'Mitra kampus' : 'Usulan mahasiswa'}
                      </span>
                    )}
                    {r.placeAddress && <span className="block text-[11px] text-slate-500">{r.placeAddress}</span>}
                    {r.fieldSupervisorName && <span className="block text-[11px] text-slate-400">Pembimbing lapangan: {r.fieldSupervisorName}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${registrationStatusTone(r.status)}`}>{REGISTRATION_STATUS_LABEL[r.status]}</span>
                    {r.submittedAt && <span className="block text-[11px] text-slate-400 mt-1">{formatDay(r.submittedAt)}</span>}
                  </td>
                  {category.feeAmount > 0 && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${chargeStatusTone(r.chargeStatus)}`}>{CHARGE_STATUS_LABEL[r.chargeStatus]}</span>
                    </td>
                  )}
                  {!category.isGroup && <td className="px-4 py-3 text-slate-600">{r.supervisor1Name || <span className="text-slate-400">-</span>}</td>}
                  <td className="px-4 py-3 text-center">
                    {r.status === 'NONE' ? (
                      <span className="text-[11px] text-slate-400">-</span>
                    ) : (
                      <button onClick={() => openReview(r)} className="px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-[11px] cursor-pointer">
                        {r.status === 'PENDING' ? 'Tinjau' : 'Detail'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal periode */}
      <Modal isOpen={periodOpen} onClose={() => setPeriodOpen(false)} title={`Periode Pendaftaran ${category.name}`} subtitle="Mahasiswa hanya dapat mendaftar di antara tanggal buka dan tutup">
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal buka</label>
              <input type="date" value={periodForm.openAt} onChange={(e) => setPeriodForm({ ...periodForm, openAt: e.target.value })} className={selectCls} />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal tutup</label>
              <input type="date" value={periodForm.closeAt} onChange={(e) => setPeriodForm({ ...periodForm, closeAt: e.target.value })} className={selectCls} />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan untuk mahasiswa (opsional)</label>
            <textarea rows={2} value={periodForm.notes} onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })} className={inputCls} placeholder="Contoh: siapkan surat pengantar dari kampus." />
          </div>
          <p className="text-[11px] text-slate-500">Hanya mahasiswa yang sudah mengambil mata kuliah {category.name} di KRS tahun akademik aktif yang bisa mendaftar.</p>
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={removePeriod} disabled={busy || !period?.period} className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 cursor-pointer">
              Hapus Periode
            </button>
            <button type="button" onClick={savePeriod} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-60 cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal tinjau */}
      <Modal
        isOpen={!!reviewing}
        onClose={() => setReviewing(null)}
        title={reviewing?.status === 'PENDING' ? `Tinjau Pendaftaran ${category.name}` : `Pendaftaran ${category.name}`}
        subtitle={reviewing ? `${reviewing.studentName} (${reviewing.nim})` : undefined}
        maxWidth="2xl"
      >
        {reviewing && (
          <div className="space-y-4 text-xs">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div>
                <dt className="text-[11px] font-bold text-slate-500 uppercase">Mata kuliah</dt>
                <dd className="text-slate-800">{reviewing.courseCode} - {reviewing.courseName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold text-slate-500 uppercase">Tempat kegiatan</dt>
                <dd className="text-slate-800 font-semibold">
                  {reviewing.placeName ?? '-'}
                  {category.hasPartners && (
                    <span className={`ml-2 inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border ${reviewing.partnerId ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {reviewing.partnerId ? 'Mitra kampus' : 'Usulan mahasiswa'}
                    </span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold text-slate-500 uppercase">Alamat</dt>
                <dd className="text-slate-800">{reviewing.placeAddress || '-'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold text-slate-500 uppercase">Pembimbing lapangan</dt>
                <dd className="text-slate-800">{reviewing.fieldSupervisorName || '-'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold text-slate-500 uppercase">Diajukan</dt>
                <dd className="text-slate-800">{reviewing.submittedAt ? formatDay(reviewing.submittedAt) : '-'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold text-slate-500 uppercase">Rencana kegiatan</dt>
                <dd className="text-slate-800 whitespace-pre-line">{reviewing.plan || '-'}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="font-bold text-slate-700">Riwayat</p>
              <FieldHistoryTable events={history} />
            </div>

            <div className="space-y-3">
              {category.feeAmount > 0 && (
                <p className="rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 px-3 py-2">
                  Ada biaya {category.feeLabel || `Biaya ${category.name}`} ({formatRupiah(category.feeAmount)}). Tagihan terbit otomatis saat mata kuliahnya masuk KRS mahasiswa; pembimbing atau kelompok baru dapat ditetapkan setelah mahasiswa melunasinya.
                </p>
              )}
              {category.isGroup && (
                <p className="rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-slate-600 px-3 py-2">
                  Setelah disetujui, mahasiswa ini dapat dimasukkan ke kelompok di sub-tab Kelompok. Pembimbing ditetapkan per kelompok.
                </p>
              )}
              {!category.isGroup && (
              <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pembimbing 1 (opsional saat menyetujui)</label>
                <SearchableSelect
                  value={reviewForm.supervisor1Id}
                  onChange={(id) => setReviewForm({ ...reviewForm, supervisor1Id: id })}
                  emptyLabel="Tetapkan nanti"
                  placeholder="Tetapkan nanti"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                  options={lecturerOptions}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pembimbing 2 (opsional)</label>
                <SearchableSelect
                  value={reviewForm.supervisor2Id}
                  onChange={(id) => setReviewForm({ ...reviewForm, supervisor2Id: id })}
                  emptyLabel="Tidak ada"
                  placeholder="Tidak ada"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                  options={lecturerOptions.filter((o) => o.value !== reviewForm.supervisor1Id)}
                />
              </div>
              </>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / alasan penolakan</label>
                <textarea rows={2} value={reviewForm.adminNote} onChange={(e) => setReviewForm({ ...reviewForm, adminNote: e.target.value })} className={inputCls} placeholder="Wajib diisi bila menolak; dikirim ke mahasiswa." />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => review('REJECTED')} disabled={busy || reviewing.status === 'REJECTED'} className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 cursor-pointer">
                Tolak
              </button>
              <button type="button" onClick={() => review('APPROVED')} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 cursor-pointer">
                <Check className="w-3.5 h-3.5" /> {reviewing.status === 'APPROVED' ? 'Simpan' : 'Setujui'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
