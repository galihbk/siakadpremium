'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Loader2, Check, SlidersHorizontal, Users } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export interface LecturerData {
  id: string;
  nidn?: string;
  nuptk?: string;
  nip?: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  email: string;
  phone?: string;
  studyProgramName?: string;
  facultyName?: string;
  isActive: boolean;
}

const emptyAddForm = {
  fullName: '',
  nidn: '',
  nuptk: '',
  nip: '',
  studyProgramId: '',
  email: '',
  phone: '',
};

export function DosenTable({ initialLecturers }: { initialLecturers: LecturerData[] }) {
  const [lecturers, setLecturers] = useState<LecturerData[]>(initialLecturers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [prodiFilter, setProdiFilter] = useState('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState<{ id: string; name: string }[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/lecturers`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setLecturers(json.data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat dosen dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/study-programs`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result)) setStudyPrograms(result);
      })
      .catch((e) => console.warn('Gagal memuat program studi:', e));
  }, []);

  const openAddModal = () => {
    setAddForm(emptyAddForm);
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleAddLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullName.trim() || !addForm.nidn.trim() || !addForm.studyProgramId) {
      setAddError('Nama lengkap, NIDN, dan program studi wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/lecturers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addForm.fullName.trim(),
          nidn: addForm.nidn.trim(),
          nuptk: addForm.nuptk.trim() || undefined,
          nip: addForm.nip.trim() || undefined,
          studyProgramId: addForm.studyProgramId,
          email: addForm.email.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || 'Gagal menambahkan dosen.');
      setIsAddModalOpen(false);
      await fetchLecturers();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan dosen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (lecturer: LecturerData) => {
    const nextActive = !lecturer.isActive;
    setTogglingId(lecturer.id);
    // Optimistic update -- langsung ubah tampilan, dibalikin lagi kalau request gagal.
    setLecturers((prev) => prev.map((l) => (l.id === lecturer.id ? { ...l, isActive: nextActive } : l)));
    try {
      const res = await fetch(`${getApiBaseUrl()}/lecturers/${lecturer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status dosen.');
    } catch (err) {
      console.warn(err);
      setLecturers((prev) => prev.map((l) => (l.id === lecturer.id ? { ...l, isActive: lecturer.isActive } : l)));
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = lecturers.filter(
    (d) =>
      (prodiFilter === 'ALL' || d.studyProgramName === prodiFilter) &&
      ((d.nidn && d.nidn.includes(search)) ||
        (d.nuptk && d.nuptk.includes(search)) ||
        d.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (d.studyProgramName && d.studyProgramName.toLowerCase().includes(search.toLowerCase())) ||
        (d.nip && d.nip.includes(search))),
  );

  const prodiOptions = Array.from(new Set(lecturers.map((d) => d.studyProgramName).filter(Boolean))).sort() as string[];
  const activeFilterCount = prodiFilter !== 'ALL' ? 1 : 0;

  // Jumlah dosen AKTIF per prodi -- dipakai kartu rekap di atas tabel, diurutkan dari yang paling banyak.
  const prodiActiveCounts = Array.from(
    lecturers
      .filter((d) => d.isActive && d.studyProgramName)
      .reduce((map, d) => {
        const key = d.studyProgramName as string;
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<LecturerData>(filtered, 'fullName');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
              BAAK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Data Dosen</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Kelola data dosen pengampu dan tenaga pendidik institusi
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Dosen Aktif</p>
          <p className="text-xl font-black text-white">{lecturers.length} Dosen</p>
        </div>
      </div>

      {prodiActiveCounts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {prodiActiveCounts.map((p) => (
            <button
              key={p.name}
              onClick={() => setProdiFilter((prev) => (prev === p.name ? 'ALL' : p.name))}
              className={`text-left p-3.5 rounded-xl border shadow-xs transition-all ${
                prodiFilter === p.name ? 'bg-blue-50 border-[#1E3A8A]' : 'bg-white border-slate-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black text-slate-900 leading-tight">{p.count}</p>
                  <p className="text-[11px] text-slate-500 truncate">{p.name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIDN, NUPTK, NIP, nama dosen, atau prodi..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={fetchLecturers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
            <ExportDropdown
              data={filtered}
              filename="data-dosen"
              title="Data Dosen"
              columns={[
                { header: 'NIDN', accessor: (d) => d.nidn || '-' },
                { header: 'NUPTK', accessor: (d) => d.nuptk || '-' },
                { header: 'NIP', accessor: (d) => d.nip || '-' },
                { header: 'Nama', accessor: (d) => d.fullName },
                { header: 'Program Studi', accessor: (d) => d.studyProgramName || '-' },
                { header: 'Fakultas', accessor: (d) => d.facultyName || '-' },
                { header: 'Email', accessor: (d) => d.email },
                { header: 'Status', accessor: (d) => (d.isActive ? 'AKTIF' : 'NONAKTIF') },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<LecturerData> label="NIDN / NIP" column="nidn" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<LecturerData> label="Nama Dosen" column="fullName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<LecturerData> label="Program Studi" column="studyProgramName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<LecturerData> label="Fakultas" column="facultyName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<LecturerData> label="Email" column="email" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<LecturerData> label="Status" column="isActive" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data dosen...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data dosen yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-700">{d.nidn && d.nidn !== '-' ? d.nidn : (d.nuptk && d.nuptk !== '-' ? d.nuptk : '-')}</div>
                      {d.nidn && d.nidn !== '-' && d.nuptk && d.nuptk !== '-' && (
                        <div className="text-[10px] text-slate-400 font-mono">NUPTK: {d.nuptk}</div>
                      )}
                      {d.nip && d.nip !== '-' && <div className="text-[10px] text-slate-400 font-mono">NIP: {d.nip}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{d.studyProgramName || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{d.facultyName || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{d.email}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(d)}
                        disabled={togglingId === d.id}
                        title={d.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        className="inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            d.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              d.isActive ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <span className={`text-[10px] font-bold ${d.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {d.isActive ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/dosen/${d.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            itemLabel="dosen"
          />
        )}
      </div>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Dosen"
        icon={<SlidersHorizontal className="w-5 h-5" />}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi</label>
            <select
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
            >
              <option value="ALL">Semua Program Studi</option>
              {prodiOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setProdiFilter('ALL')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
            <button
              onClick={() => setIsFilterModalOpen(false)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Dosen Baru">
        <form onSubmit={handleAddLecturer} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">{addError}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={addForm.fullName}
              onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIDN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.nidn}
                onChange={(e) => setAddForm({ ...addForm, nidn: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NUPTK</label>
              <input
                type="text"
                value={addForm.nuptk}
                onChange={(e) => setAddForm({ ...addForm, nuptk: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Program Studi <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={addForm.studyProgramId}
              onChange={(v) => setAddForm({ ...addForm, studyProgramId: v })}
              placeholder="Pilih program studi..."
              searchPlaceholder="Cari program studi..."
              options={studyPrograms.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="email"
                placeholder="Default dari NIDN kalau kosong"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. Telepon <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Password awal otomatis: <span className="font-mono">Password123!</span> -- bisa diganti dosen setelah login pertama.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Dosen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
