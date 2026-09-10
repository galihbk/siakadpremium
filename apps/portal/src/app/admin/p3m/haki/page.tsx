'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Award,
  Plus,
  Search,
  Download,
  CheckCircle2,
  ChevronRight,
  Trash2,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

export interface HakiItem {
  id: string;
  title: string;
  type: 'Hak Cipta' | 'Paten Sederhana' | 'Paten Biasa' | 'Desain Industri';
  registrationNumber: string;
  inventors: string[];
  faculty: string;
  year: number;
  status: 'Tersertifikasi' | 'Pemeriksaan Substantif' | 'Permohonan Masuk';
}

export default function HakiAdminPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHaki = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/lp3m/haki?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data?.data || json.data || [];
        // normalize inventors for display
        const normalized = data.map((item: any) => ({
          ...item,
          registrationNumber: item.regNumber || item.registrationNumber,
          inventors: Array.isArray(item.inventors) ? item.inventors : [item.inventor || 'Dosen Peneliti ITN'],
          year: item.grantYear || item.year || 2026,
        }));
        setItems(normalized);
      }
    } catch (err) {
      console.warn('Gagal memuat HAKI dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHaki();
  }, [searchTerm]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchType = selectedType === 'Semua' || item.type === selectedType;
      return matchType;
    });
  }, [items, selectedType]);

  return (
    <PortalLayout
      role="lp3m"
      userName="Prof. Dr. Ir. H. Sudirman, M.T."
      userIdText="Ketua LP3M & Dewan Riset Perguruan Tinggi"
    >
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Banner */}
        <div className="bg-gradient-to-r from-[#091a44] via-[#581c87] to-[#6b21a8] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-2">
              <Link href="/admin/p3m" className="hover:text-white transition-colors">
                Dashboard LP3M
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Sentra HKI</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>Sentra Hak Kekayaan Intelektual (HAKI & Paten)</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-2xl leading-relaxed">
              Fasilitasi pendaftaran perlindungan kekayaan intelektual, paten sederhana, hak cipta program komputer,
              buku ajar, dan desain industri karya dosen dan mahasiswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => showToast('Membuka formulir pendaftaran permohonan HKI baru...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Daftarkan HKI Baru</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul invensi/ciptaan, nomor DJKI, atau nama inventor..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
          >
            <option value="Semua">Semua Jenis HKI</option>
            <option value="Hak Cipta">Hak Cipta</option>
            <option value="Paten Sederhana">Paten Sederhana</option>
            <option value="Paten Biasa">Paten Biasa</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Judul Ciptaan / Invensi</th>
                  <th className="py-3.5 px-4">Jenis HKI</th>
                  <th className="py-3.5 px-4">Nomor DJKI</th>
                  <th className="py-3.5 px-4">Inventor / Pemegang Hak</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Sertifikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-purple-50/20 transition-colors text-slate-800">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 leading-snug">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.faculty} &bull; Tahun {item.year}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {item.registrationNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {(item.inventors || []).map((inv: string, i: number) => (
                          <p key={i} className="text-[11px] font-medium text-slate-700">
                            &bull; {inv}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Tersertifikasi'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => showToast(`Mengunduh sertifikat resmi DJKI: ${item.registrationNumber}`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
