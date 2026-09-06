'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Users,
  UserCheck,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  Building,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const facultiesData = [
    { nama: 'Fakultas Ilmu Komputer', mahasiswa: 2450, dosen: 84, prodi: 4, akreditasi: 'Unggul', krsProgress: 98.2 },
    { nama: 'Fakultas Teknik', mahasiswa: 2180, dosen: 92, prodi: 6, akreditasi: 'Unggul', krsProgress: 97.5 },
    { nama: 'Fakultas Ekonomi & Bisnis', mahasiswa: 1820, dosen: 64, prodi: 4, akreditasi: 'Unggul', krsProgress: 96.0 },
    { nama: 'Fakultas Hukum', mahasiswa: 980, dosen: 36, prodi: 2, akreditasi: 'Unggul', krsProgress: 95.8 },
    { nama: 'Fakultas Pertanian & Biosains', mahasiswa: 610, dosen: 28, prodi: 3, akreditasi: 'Unggul', krsProgress: 94.2 },
    { nama: 'Fakultas Sains & Desain', mahasiswa: 500, dosen: 20, prodi: 3, akreditasi: 'Baik Sekali', krsProgress: 96.4 },
  ];

  return (
    <PortalLayout
      role="admin"
      userName="Ahmad Fauzi, S.Kom."
      userIdText="Admin BAAK & Sistem Informasi Pusat"
    >
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Biro Administrasi Akademik & Kemahasiswaan (BAAK)
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pusat Kendali Administrasi Akademik ITN
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Monitoring Real-Time Civitas Akademika, Registrasi Mahasiswa, dan Pelaporan PDDIKTI
            </p>
          </div>
          <div className="flex gap-2.5">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan PDDIKTI</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-slate-950 text-xs font-bold rounded-xl shadow-xs hover:bg-[#C59114] transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan BAAK</span>
            </button>
          </div>
        </div>

        {/* 4 Admin Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mahasiswa Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">8.540</p>
            <p className="text-xs text-slate-500 mt-1">Status: <strong className="text-emerald-700">100% Terdaftar PDDIKTI</strong></p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dosen & Pengajar</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">324</p>
            <p className="text-xs text-slate-500 mt-1">Rasio Dosen : Mhs: <strong className="text-slate-700">1 : 26.3</strong></p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registrasi KRS Selesai</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">96.8%</p>
            <p className="text-xs text-slate-500 mt-1">8.267 Mahasiswa telah memvalidasi KRS</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendaftar PMB 2027</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">1.850</p>
            <p className="text-xs text-slate-500 mt-1">Gelombang 1 &bull; 1.420 Terverifikasi Berkas</p>
          </div>
        </div>

        {/* PDDIKTI Sync Status Panel */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Status Integrasi PDDIKTI Feeder: SINKRON & TERVALIDASI
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Sinkronisasi terakhir pada 06 September 2026, 04.00 WIB &bull; 0 Anomali Data &bull; Neofeeder API v2
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-200/60 text-emerald-900 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Kepatuhan 100%</span>
          </span>
        </div>

        {/* Faculty Distribution Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Distribusi & Kinerja Akademik per Fakultas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring sebaran mahasiswa, jumlah dosen, dan progres pengisian KRS per fakultas
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Fakultas</th>
                  <th className="py-3 px-4 text-center">Program Studi</th>
                  <th className="py-3 px-4 text-center">Mahasiswa Aktif</th>
                  <th className="py-3 px-4 text-center">Dosen</th>
                  <th className="py-3 px-4 text-center">Akreditasi</th>
                  <th className="py-3 px-4">Progres KRS Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {facultiesData.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#1E3A8A]" />
                      <span>{f.nama}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">{f.prodi} Prodi</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#1E3A8A]">
                      {f.mahasiswa.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">{f.dosen} Orang</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                        {f.akreditasi}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#1E3A8A] h-2 rounded-full"
                            style={{ width: `${f.krsProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{f.krsProgress}%</span>
                      </div>
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
