'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Loader2, Check, SlidersHorizontal, Users, ChevronDown } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export interface StudentData {
  id: string;
  nim: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  studyProgram: string;
  faculty: string;
  entryYear: number;
  currentSemester: number;
  status: string;
  ipk: number;
  totalSks?: number;
  dosenPA?: string | null;
  isActive: boolean;
  // Biodata lengkap -- cuma dipakai untuk ekspor, tidak ditampilkan di tabel.
  nik?: string | null;
  nisn?: string | null;
  noKk?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  religion?: string | null;
  streetAddress?: string | null;
  rtRw?: string | null;
  dusun?: string | null;
  kelurahan?: string | null;
  kecamatan?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  schoolName?: string | null;
  npsn?: string | null;
  graduationYear?: string | null;
  major?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  fatherJob?: string | null;
  fatherIncome?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  motherJob?: string | null;
  motherIncome?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianJob?: string | null;
}

const STATUS_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: 'ACTIVE', label: 'AKTIF', className: 'bg-emerald-100 text-emerald-700' },
  { value: 'LEAVE', label: 'CUTI', className: 'bg-amber-100 text-amber-700' },
  { value: 'GRADUATED', label: 'LULUS', className: 'bg-blue-100 text-blue-700' },
  { value: 'DROPOUT', label: 'DO', className: 'bg-red-100 text-red-700' },
  { value: 'TRANSFERRED', label: 'PINDAH', className: 'bg-slate-200 text-slate-600' },
];

const emptyAddForm = {
  fullName: '',
  nim: '',
  studyProgramId: '',
  entryYear: new Date().getFullYear().toString(),
  email: '',
  phone: '',
};

export function MahasiswaTable({ initialStudents }: { initialStudents: StudentData[] }) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [prodiFilter, setProdiFilter] = useState('ALL');
  const [angkatanFilter, setAngkatanFilter] = useState('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState<{ id: string; name: string }[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/students/list`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setStudents(json.data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data mahasiswa dari database:', err);
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
    setAddForm({ ...emptyAddForm, entryYear: new Date().getFullYear().toString() });
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullName.trim() || !addForm.nim.trim() || !addForm.studyProgramId) {
      setAddError('Nama lengkap, NIM, dan program studi wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addForm.fullName.trim(),
          nim: addForm.nim.trim(),
          studyProgramId: addForm.studyProgramId,
          entryYear: addForm.entryYear ? Number(addForm.entryYear) : undefined,
          email: addForm.email.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || 'Gagal menambahkan mahasiswa.');
      setIsAddModalOpen(false);
      await fetchStudents();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan mahasiswa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (student: StudentData, nextStatus: string) => {
    if (nextStatus === student.status) return;
    setTogglingId(student.id);
    // Optimistic update -- langsung ubah tampilan, dibalikin lagi kalau request gagal.
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s)));
    try {
      const res = await fetch(`${getApiBaseUrl()}/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status mahasiswa.');
    } catch (err) {
      console.warn(err);
      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: student.status } : s)));
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = students.filter(
    (d) =>
      (statusFilter === 'ALL' || d.status === statusFilter) &&
      (prodiFilter === 'ALL' || d.studyProgram === prodiFilter) &&
      (angkatanFilter === 'ALL' || d.entryYear.toString() === angkatanFilter) &&
      (d.nim.includes(search) ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.studyProgram.toLowerCase().includes(search.toLowerCase())),
  );

  const prodiOptions = Array.from(new Set(students.map((d) => d.studyProgram).filter(Boolean))).sort();
  const angkatanOptions = Array.from(new Set(students.map((d) => d.entryYear).filter(Boolean))).sort((a, b) => b - a);
  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) + (prodiFilter !== 'ALL' ? 1 : 0) + (angkatanFilter !== 'ALL' ? 1 : 0);
  const resetFilters = () => {
    setStatusFilter('ALL');
    setProdiFilter('ALL');
    setAngkatanFilter('ALL');
  };

  // Rekap mahasiswa per prodi -- dipakai accordion rekap di atas tabel. Ikut filter status/angkatan/pencarian
  // yang aktif (tapi bukan prodiFilter itu sendiri, karena kartunya dipakai untuk memilih prodi).
  const prodiCounts = Array.from(
    students
      .filter(
        (d) =>
          (statusFilter === 'ALL' || d.status === statusFilter) &&
          (angkatanFilter === 'ALL' || d.entryYear.toString() === angkatanFilter) &&
          (d.nim.includes(search) ||
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.studyProgram.toLowerCase().includes(search.toLowerCase())),
      )
      .reduce((map, d) => {
        if (!d.studyProgram) return map;
        map.set(d.studyProgram, (map.get(d.studyProgram) || 0) + 1);
        return map;
      }, new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<StudentData>(filtered, 'entryYear', 10, 'desc');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
              BAAK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Data Mahasiswa</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Kelola data induk seluruh mahasiswa aktif, cuti, dan alumni
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Mahasiswa Terdaftar</p>
          <p className="text-xl font-black text-white">{students.length} Mahasiswa</p>
        </div>
      </div>

      {prodiCounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setIsRecapOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Rekap Mahasiswa per Program Studi</p>
                <p className="text-[11px] text-slate-400">{prodiCounts.length} program studi</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isRecapOpen ? 'rotate-180' : ''}`} />
          </button>

          {isRecapOpen && (
            <div className="border-t border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {prodiCounts.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setProdiFilter((prev) => (prev === p.name ? 'ALL' : p.name))}
                  className={`text-left p-3.5 rounded-xl border shadow-xs transition-all ${
                    prodiFilter === p.name ? 'bg-blue-50 border-[#1E3A8A]' : 'bg-white border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <p className="text-lg font-black text-slate-900 leading-tight">{p.count}</p>
                  <p className="text-[11px] text-slate-500 truncate">{p.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIM, nama, atau prodi..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchStudents}
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
              filename="data-mahasiswa"
              title="Data Mahasiswa"
              columns={[
                { header: 'NIM', accessor: (d) => d.nim },
                { header: 'Nama', accessor: (d) => d.name },
                { header: 'Jenis Kelamin', accessor: (d) => (d.gender === 'FEMALE' ? 'Perempuan' : d.gender === 'MALE' ? 'Laki-laki' : '-') },
                { header: 'Tempat Lahir', accessor: (d) => d.birthPlace || '-' },
                { header: 'Tanggal Lahir', accessor: (d) => d.birthDate || '-' },
                { header: 'NIK', accessor: (d) => d.nik || '-' },
                { header: 'NISN', accessor: (d) => d.nisn || '-' },
                { header: 'No. KK', accessor: (d) => d.noKk || '-' },
                { header: 'Agama', accessor: (d) => d.religion || '-' },
                { header: 'Email', accessor: (d) => d.email },
                { header: 'No. Telepon', accessor: (d) => d.phone || '-' },
                { header: 'Alamat', accessor: (d) => d.address || '-' },
                { header: 'Alamat Jalan', accessor: (d) => d.streetAddress || '-' },
                { header: 'RT/RW', accessor: (d) => d.rtRw || '-' },
                { header: 'Dusun', accessor: (d) => d.dusun || '-' },
                { header: 'Kelurahan', accessor: (d) => d.kelurahan || '-' },
                { header: 'Kecamatan', accessor: (d) => d.kecamatan || '-' },
                { header: 'Kota/Kabupaten', accessor: (d) => d.city || '-' },
                { header: 'Provinsi', accessor: (d) => d.province || '-' },
                { header: 'Kode Pos', accessor: (d) => d.postalCode || '-' },
                { header: 'Program Studi', accessor: (d) => d.studyProgram },
                { header: 'Fakultas', accessor: (d) => d.faculty },
                { header: 'Angkatan', accessor: (d) => d.entryYear },
                { header: 'Semester', accessor: (d) => d.currentSemester },
                { header: 'Total SKS', accessor: (d) => d.totalSks ?? '-' },
                { header: 'IPK', accessor: (d) => (d.ipk > 0 ? d.ipk.toFixed(2) : '-') },
                { header: 'Dosen PA', accessor: (d) => d.dosenPA || '-' },
                { header: 'Status', accessor: (d) => d.status },
                { header: 'Asal Sekolah', accessor: (d) => d.schoolName || '-' },
                { header: 'NPSN', accessor: (d) => d.npsn || '-' },
                { header: 'Tahun Lulus Sekolah', accessor: (d) => d.graduationYear || '-' },
                { header: 'Jurusan Sekolah', accessor: (d) => d.major || '-' },
                { header: 'Nama Ayah', accessor: (d) => d.fatherName || '-' },
                { header: 'No. HP Ayah', accessor: (d) => d.fatherPhone || '-' },
                { header: 'Pekerjaan Ayah', accessor: (d) => d.fatherJob || '-' },
                { header: 'Penghasilan Ayah', accessor: (d) => d.fatherIncome || '-' },
                { header: 'Nama Ibu', accessor: (d) => d.motherName || '-' },
                { header: 'No. HP Ibu', accessor: (d) => d.motherPhone || '-' },
                { header: 'Pekerjaan Ibu', accessor: (d) => d.motherJob || '-' },
                { header: 'Penghasilan Ibu', accessor: (d) => d.motherIncome || '-' },
                { header: 'Nama Wali', accessor: (d) => d.guardianName || '-' },
                { header: 'No. HP Wali', accessor: (d) => d.guardianPhone || '-' },
                { header: 'Pekerjaan Wali', accessor: (d) => d.guardianJob || '-' },
              ]}
              pdfColumns={[
                { header: 'NIM', accessor: (d) => d.nim },
                { header: 'Nama', accessor: (d) => d.name },
                { header: 'Program Studi', accessor: (d) => d.studyProgram },
                { header: 'Angkatan', accessor: (d) => d.entryYear },
                { header: 'Semester', accessor: (d) => d.currentSemester },
                { header: 'IPK', accessor: (d) => (d.ipk > 0 ? d.ipk.toFixed(2) : '-') },
                { header: 'Status', accessor: (d) => d.status },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<StudentData> label="NIM" column="nim" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<StudentData> label="Nama Mahasiswa" column="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<StudentData> label="Program Studi" column="studyProgram" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<StudentData> label="Fakultas" column="faculty" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<StudentData> label="Angkatan" column="entryYear" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortableTh<StudentData> label="Semester" column="currentSemester" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortableTh<StudentData> label="IPK" column="ipk" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortableTh<StudentData> label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data mahasiswa...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data mahasiswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.nim}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{d.name}</div>
                      <div className="text-[11px] text-slate-400">{d.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.studyProgram}</td>
                    <td className="px-4 py-3 text-slate-500">{d.faculty}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{d.entryYear}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{d.currentSemester}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {d.ipk > 0 ? d.ipk.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const opt = STATUS_OPTIONS.find((o) => o.value === d.status) ?? STATUS_OPTIONS[0];
                        return (
                          <select
                            value={d.status}
                            onChange={(e) => handleChangeStatus(d, e.target.value)}
                            disabled={togglingId === d.id}
                            title="Klik untuk mengubah status mahasiswa"
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border-0 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 ${opt.className}`}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/mahasiswa/${d.id}`}
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
            itemLabel="mahasiswa"
          />
        )}
      </div>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Mahasiswa"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Angkatan</label>
            <select
              value={angkatanFilter}
              onChange={(e) => setAngkatanFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
            >
              <option value="ALL">Semua Angkatan</option>
              {angkatanOptions.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="LEAVE">Cuti</option>
              <option value="GRADUATED">Lulus</option>
              <option value="DROPOUT">Drop Out</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={resetFilters}
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Mahasiswa Baru">
        <form onSubmit={handleAddStudent} className="space-y-4">
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
                NIM <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.nim}
                onChange={(e) => setAddForm({ ...addForm, nim: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Angkatan</label>
              <input
                type="number"
                value={addForm.entryYear}
                onChange={(e) => setAddForm({ ...addForm, entryYear: e.target.value })}
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
                placeholder="Default dari NIM kalau kosong"
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
            Password awal otomatis sama dengan NIM -- bisa diganti mahasiswa setelah login pertama.
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
                  <span>Simpan Mahasiswa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
