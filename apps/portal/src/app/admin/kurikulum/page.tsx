'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { BookOpen, Search, Download, Plus, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface CourseData {
  id: string;
  code: string;
  name: string;
  studyProgram?: string;
  facultyCode?: string;
  sks: number;
  totalSks?: number;
  semester: number;
  type: string;
  coordinator?: string;
  status: string;
  description?: string;
}

export default function AdminKurikulumPage() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academic/courses`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setCourses(json.data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat mata kuliah dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = courses.filter(
    (d) =>
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.studyProgram && d.studyProgram.toLowerCase().includes(search.toLowerCase())),
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
            <h1 className="text-xl sm:text-2xl font-black">Kurikulum &amp; Mata Kuliah</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Katalog kurikulum akademik dan struktur mata kuliah institusi
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <p className="text-xs text-blue-200">Total Mata Kuliah</p>
            <p className="text-xl font-black text-white">{courses.length} Mata Kuliah</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode, nama mata kuliah, atau prodi..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchCourses}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Segarkan
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Tambah MK
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
                  {['Kode MK', 'Nama Mata Kuliah', 'Program Studi', 'SKS', 'Semester', 'Jenis', 'Koordinator', 'Status'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-slate-500 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Memuat data kurikulum...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada mata kuliah yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{d.name}</div>
                        {d.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">{d.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{d.studyProgram || 'Semua Prodi (MKDU)'}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">{d.sks || d.totalSks || 3}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{d.semester}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.type.includes('Wajib')
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-violet-100 text-violet-700'
                          }`}
                        >
                          {d.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{d.coordinator || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {d.status || 'Aktif'}
                        </span>
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
