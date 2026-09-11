'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { UserCheck, Search, Download, Plus, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface LecturerData {
  id: string;
  nidn: string;
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

export default function AdminDosenPage() {
  const [lecturers, setLecturers] = useState<LecturerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    fetchLecturers();
  }, []);

  const filtered = lecturers.filter(
    (d) =>
      d.nidn.includes(search) ||
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (d.studyProgramName && d.studyProgramName.toLowerCase().includes(search.toLowerCase())) ||
      (d.nip && d.nip.includes(search)),
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIDN, NIP, nama dosen, atau prodi..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchLecturers}
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
                  {['NIDN / NIP', 'Nama Dosen', 'Program Studi', 'Fakultas', 'Email', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-slate-500 font-semibold">
                      {h}
                    </th>
                  ))}
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
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-700">{d.nidn}</div>
                        {d.nip && d.nip !== '-' && <div className="text-[10px] text-slate-400 font-mono">NIP: {d.nip}</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{d.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{d.studyProgramName || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{d.facultyName || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{d.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {d.isActive ? 'AKTIF' : 'NONAKTIF'}
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
