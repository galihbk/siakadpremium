'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Users, Search, Download, Plus, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface StudentData {
  id: string;
  nim: string;
  name: string;
  email: string;
  studyProgram: string;
  faculty: string;
  entryYear: number;
  currentSemester: number;
  status: string;
  ipk: number;
  isActive: boolean;
}

export default function AdminMahasiswaPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
    fetchStudents();
  }, []);

  const filtered = students.filter(
    (d) =>
      (statusFilter === 'ALL' || d.status === statusFilter) &&
      (d.nim.includes(search) ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.studyProgram.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="LEAVE">Cuti</option>
                <option value="GRADUATED">Lulus</option>
                <option value="DROPOUT">Drop Out</option>
              </select>
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Ekspor
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['NIM', 'Nama Mahasiswa', 'Program Studi', 'Fakultas', 'Angkatan', 'Semester', 'IPK', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-slate-500 font-semibold">
                      {h}
                    </th>
                  ))}
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
                  filtered.map((d) => (
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : d.status === 'LEAVE'
                              ? 'bg-amber-100 text-amber-700'
                              : d.status === 'GRADUATED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {d.status === 'ACTIVE'
                            ? 'AKTIF'
                            : d.status === 'LEAVE'
                            ? 'CUTI'
                            : d.status === 'GRADUATED'
                            ? 'LULUS'
                            : d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
