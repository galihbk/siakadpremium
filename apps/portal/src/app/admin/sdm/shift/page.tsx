'use client';

import { confirmDialog, alertDialog } from '@/components/ui/ConfirmHost';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';
import { Plus, Pencil, Trash2, Clock, Star, Loader2, Search, Users, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ShiftItem {
  id: string;
  name: string;
  startPagi: string | null;
  toleransiPagi: number;
  startSore: string | null;
  toleransiSore: number;
  isDefault: boolean;
  totalPegawai: number;
}

interface EmployeeRow {
  id: string;
  nip: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  category: string;
  department: string;
  position: string;
  status: string;
  shiftId?: string | null;
  shiftName?: string | null;
}

const displayName = (e: EmployeeRow) => `${e.titlePrefix ? e.titlePrefix + ' ' : ''}${e.fullName}${e.titleSuffix ? ', ' + e.titleSuffix : ''}`;
const CATEGORY_FILTERS = ['Semua', 'Dosen Tetap', 'Dosen Luar Biasa', 'Tenaga Kependidikan', 'Satpam / Petugas Keamanan', 'Office Boy / Office Girl (OB/OG)', 'Petugas Kebersihan (Cleaning Service)', 'Sopir / Pengemudi', 'Teknisi / Pemeliharaan Gedung', 'Petugas Taman', 'Tenaga Penunjang Lainnya'];
const PER_PAGE = 10;

const emptyForm = {
  name: '',
  startPagi: '07:00',
  toleransiPagi: 15,
  startSore: '15:00',
  toleransiSore: 15,
  isDefault: false,
};

export default function PengaturanShiftPage() {
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Penempatan shift pegawai & dosen
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Semua');
  const [shiftFilter, setShiftFilter] = useState('ALL'); // ALL | NONE | shiftId
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkShift, setBulkShift] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/shifts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setShifts(json.data ?? json ?? []);
    } catch (err) {
      console.error('Gagal memuat shift', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/employees`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json.data ?? json;
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Gagal memuat pegawai', err);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const defaultShift = shifts.find((s) => s.isDefault) || null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (catFilter !== 'Semua' && e.category !== catFilter) return false;
      if (shiftFilter === 'NONE' ? !!e.shiftId : shiftFilter !== 'ALL' && e.shiftId !== shiftFilter) return false;
      if (!q) return true;
      return (
        displayName(e).toLowerCase().includes(q) ||
        (e.nip || '').toLowerCase().includes(q) ||
        (e.position || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
      );
    });
  }, [employees, search, catFilter, shiftFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((e) => selected.has(e.id));

  useEffect(() => setPage(1), [search, catFilter, shiftFilter]);

  const setShiftFor = async (ids: string[], shiftId: string | null, busy: 'row' | 'bulk') => {
    if (busy === 'row') setBusyId(ids[0]);
    else setBulkBusy(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/employees/bulk-shift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, shiftId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      const name = shiftId ? shifts.find((s) => s.id === shiftId)?.name : null;
      setEmployees((prev) => prev.map((e) => (ids.includes(e.id) ? { ...e, shiftId, shiftName: name ?? null } : e)));
      flash(`${ids.length} pegawai ${shiftId ? `ditempatkan di "${name}"` : 'kembali ke shift default'}.`);
      if (busy === 'bulk') {
        setSelected(new Set());
        setBulkShift('');
      }
      void load();
    } catch (err) {
      void alertDialog(err instanceof Error ? err.message : 'Gagal mengatur shift.', { type: 'error' });
    } finally {
      setBusyId(null);
      setBulkBusy(false);
    }
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const togglePage = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((e) => n.delete(e.id));
      else pageRows.forEach((e) => n.add(e.id));
      return n;
    });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: ShiftItem) => {
    setEditing(s);
    setForm({
      name: s.name,
      startPagi: s.startPagi || '',
      toleransiPagi: s.toleransiPagi,
      startSore: s.startSore || '',
      toleransiSore: s.toleransiSore,
      isDefault: s.isDefault,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      void alertDialog('Nama shift wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `${getApiBaseUrl()}/shifts/${editing.id}` : `${getApiBaseUrl()}/shifts`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error('Gagal menyimpan shift', err);
      void alertDialog('Gagal menyimpan shift. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: ShiftItem) => {
    if (!(await confirmDialog(`Hapus shift "${s.name}"? Pegawai yang memakai shift ini akan kembali ke shift default.`))) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/shifts/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (err) {
      console.error('Gagal menghapus shift', err);
      void alertDialog('Gagal menghapus shift.');
    }
  };

  return (
    <PortalLayout role="sdm" userName="Dewi Lestari, S.Psi., M.M." userIdText="Kepala Biro SDM & Kepegawaian">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Kepegawaian
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Pengaturan Shift</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Template jam kerja untuk menentukan batas tepat waktu absen pagi & sore
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#1E3A8A] rounded-xl text-xs font-bold hover:bg-blue-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Shift
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nama Shift</th>
                  <th className="px-4 py-3 text-left font-semibold">Jam Masuk Pagi</th>
                  <th className="px-4 py-3 text-left font-semibold">Jam Masuk Sore</th>
                  <th className="px-4 py-3 text-center font-semibold">Pegawai</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loading && shifts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Belum ada shift. Tambahkan template shift pertama.
                    </td>
                  </tr>
                )}
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {s.name}
                        {s.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-2.5 h-2.5" /> Default
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.startPagi ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" /> {s.startPagi} (+{s.toleransiPagi} menit)
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.startSore ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> {s.startSore} (+{s.toleransiSore} menit)
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{s.totalPegawai}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit shift"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            Pegawai tanpa shift otomatis memakai shift yang ditandai Default. Penempatan shift diatur di tabel di bawah.
          </div>
        </div>

        {/* Penempatan shift pegawai & dosen */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1E3A8A]" /> Penempatan Shift Pegawai &amp; Dosen
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih shift langsung di setiap baris, atau centang beberapa orang lalu terapkan sekaligus.
                  {defaultShift ? ` Tanpa shift = ikut "${defaultShift.name}".` : ' Belum ada shift default.'}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">{filtered.length} dari {employees.length} orang</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, NIP, jabatan, atau unit…"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                {CATEGORY_FILTERS.map((c) => (
                  <option key={c} value={c}>{c === 'Semua' ? 'Semua Kategori' : c}</option>
                ))}
              </select>
              <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                <option value="ALL">Semua Shift</option>
                <option value="NONE">Belum diatur (ikut default)</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <span className="font-bold text-[#1E3A8A]">{selected.size} dipilih</span>
                <select value={bulkShift} onChange={(e) => setBulkShift(e.target.value)} className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white">
                  <option value="">Pilih shift…</option>
                  <option value="__DEFAULT__">Ikut shift default</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  disabled={!bulkShift || bulkBusy}
                  onClick={() => setShiftFor(Array.from(selected), bulkShift === '__DEFAULT__' ? null : bulkShift, 'bulk')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  {bulkBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Terapkan
                </button>
                <button onClick={() => setSelected(new Set())} className="ml-auto font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                  Batal pilih
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} className="w-4 h-4 rounded border-slate-300 accent-[#1E3A8A] cursor-pointer" aria-label="Pilih semua di halaman ini" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Pegawai / Dosen</th>
                  <th className="px-4 py-3 text-left font-semibold">Jabatan &amp; Unit</th>
                  <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                  <th className="px-4 py-3 text-left font-semibold">Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></td>
                  </tr>
                )}
                {!empLoading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Tidak ada pegawai yang cocok dengan filter.</td>
                  </tr>
                )}
                {pageRows.map((e) => (
                  <tr key={e.id} className={`hover:bg-slate-50/70 ${selected.has(e.id) ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleOne(e.id)} className="w-4 h-4 rounded border-slate-300 accent-[#1E3A8A] cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{displayName(e)}</p>
                      <p className="text-[10px] font-mono text-slate-400">{e.nip}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{e.position}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[18rem]">{e.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">{e.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={e.shiftId || ''}
                          disabled={busyId === e.id || shifts.length === 0}
                          onChange={(ev) => setShiftFor([e.id], ev.target.value || null, 'row')}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs bg-white disabled:opacity-50 ${e.shiftId ? 'border-slate-200 text-slate-800 font-semibold' : 'border-dashed border-slate-300 text-slate-500'}`}
                        >
                          <option value="">{defaultShift ? `Ikut default (${defaultShift.name})` : 'Belum diatur'}</option>
                          {shifts.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}{s.isDefault ? ' (Default)' : ''}</option>
                          ))}
                        </select>
                        {busyId === e.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>
              Menampilkan {filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}-{Math.min(safePage * PER_PAGE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer" aria-label="Sebelumnya">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-semibold text-slate-700">{safePage} / {totalPages}</span>
              <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer" aria-label="Berikutnya">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{toast}</span>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Shift: ${editing.name}` : 'Tambah Shift Baru'}
        subtitle="Jam masuk dipakai sebagai batas tepat waktu absen pagi/sore"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Shift</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Shift Pagi, Shift Normal"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk Pagi</label>
              <input
                type="time"
                value={form.startPagi}
                onChange={(e) => setForm((f) => ({ ...f, startPagi: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Toleransi Telat (menit)</label>
              <input
                type="number"
                min={0}
                value={form.toleransiPagi}
                onChange={(e) => setForm((f) => ({ ...f, toleransiPagi: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk Sore</label>
              <input
                type="time"
                value={form.startSore}
                onChange={(e) => setForm((f) => ({ ...f, startSore: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Toleransi Telat (menit)</label>
              <input
                type="number"
                min={0}
                value={form.toleransiSore}
                onChange={(e) => setForm((f) => ({ ...f, toleransiSore: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
            <span className="text-xs font-semibold text-slate-700">Jadikan shift default (berlaku untuk pegawai tanpa shift)</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
