'use client';

import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileCheck,
  GraduationCap,
  MapPin,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';

export default function LecturerDashboardPage() {
  const teachingClasses = [
    { code: 'TIF-301', nama: 'Rekayasa Perangkat Lunak', kelas: 'TIF-5A', hari: 'Senin', jam: '08.00 - 10.30 WIB', ruang: 'Lab Komputasi 3', peserta: 35, presensiRata: '94%' },
    { code: 'TIF-301', nama: 'Rekayasa Perangkat Lunak', kelas: 'TIF-5B', hari: 'Senin', jam: '13.00 - 15.30 WIB', ruang: 'Lab Komputasi 3', peserta: 34, presensiRata: '91%' },
    { code: 'TIF-702', nama: 'Arsitektur Perangkat Lunak Enterprise', kelas: 'TIF-7A', hari: 'Rabu', jam: '08.00 - 10.30 WIB', ruang: 'Ruang Seminar 204', peserta: 28, presensiRata: '96%' },
    { code: 'TIF-499', nama: 'Bimbingan Skripsi & Seminar Hasil', kelas: 'SKRIPSI', hari: 'Kamis', jam: '10.00 - 14.00 WIB', ruang: 'Ruang Dosen FIK', peserta: 6, presensiRata: '100%' },
  ];

  const pendingApprovals = [
    { nim: '2311501001', nama: 'Muhammad Rizky Pratama', prodi: 'Teknik Informatika', sks: 20, status: 'Menunggu Persetujuan KPRS' },
    { nim: '2311501045', nama: 'Nadia Salsabila', prodi: 'Teknik Informatika', sks: 22, status: 'Menunggu Persetujuan KPRS' },
    { nim: '2211501012', nama: 'Fajar Nugroho', prodi: 'Teknik Informatika', sks: 18, status: 'Pengajuan Ujian Proposal Skripsi' },
  ];

  return (
    <PortalLayout
      role="lecturer"
      userName="Dr. Bayu Wicaksono, M.Kom."
      userIdText="NIDN: 0412088501 • Dosen Informatika"
    >
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Jabatan Fungsional: Lektor Kepala (S3)
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Datang, Dr. Bayu Wicaksono!
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Dosen Tetap Program Studi Teknik Informatika &bull; Fakultas Ilmu Komputer
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/lecturer/nilai"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Input Nilai UTS/UAS</span>
            </Link>
            <Link
              href="/lecturer/bimbingan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-slate-950 text-xs font-bold rounded-xl shadow-xs hover:bg-[#C59114] transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Validasi KRS Online</span>
            </Link>
          </div>
        </div>

        {/* 4 Lecturer Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kelas Mengajar</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">4 <span className="text-base font-normal text-slate-500">Kelas</span></p>
            <p className="text-xs text-slate-500 mt-1">Total Mahasiswa: <strong className="text-slate-700">103 Orang</strong></p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bimbingan Akademik (PA)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">28 <span className="text-base font-normal text-slate-500">Mahasiswa</span></p>
            <p className="text-xs text-slate-500 mt-1">Angkatan 2022, 2023, 2024</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bimbingan Tugas Akhir</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">6 <span className="text-base font-normal text-slate-500">Mahasiswa</span></p>
            <p className="text-xs text-slate-500 mt-1">2 Siap Ujian Sidang Skripsi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Beban Kinerja Dosen (BKD)</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">14 <span className="text-base font-normal text-slate-500">SKS</span></p>
            <p className="text-xs text-slate-500 mt-1">Status: <strong className="text-emerald-700">MEMENUHI SYARAT</strong></p>
          </div>
        </div>

        {/* Teaching Schedule Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Jadwal Perkuliahan Gasal 2026/2027</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar kelas reguler dan praktikum yang diampu semester ini</p>
            </div>
            <Link
              href="/lecturer/jadwal"
              className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua Jadwal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode MK</th>
                  <th className="py-3 px-4">Nama Mata Kuliah</th>
                  <th className="py-3 px-4 text-center">Kelas</th>
                  <th className="py-3 px-4">Jadwal & Ruang</th>
                  <th className="py-3 px-4 text-center">Peserta</th>
                  <th className="py-3 px-4 text-center">Kehadiran</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {teachingClasses.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1E3A8A]">{item.code}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{item.nama}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{item.kelas}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.hari}, {item.jam}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.ruang}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">{item.peserta} Orang</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{item.presensiRata}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href="/lecturer/nilai"
                        className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                      >
                        Input Nilai
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">Permintaan Persetujuan Bimbingan Akademik (3 Menunggu)</h3>
          <p className="text-xs text-slate-500 mb-4">Mahasiswa bimbingan yang membutuhkan verifikasi KRS atau permohonan skripsi</p>

          <div className="space-y-3">
            {pendingApprovals.map((req, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{req.nama} <span className="font-mono text-slate-500 font-normal">({req.nim})</span></p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{req.prodi} &bull; Beban: {req.sks} SKS &bull; <span className="text-[#1E3A8A] font-semibold">{req.status}</span></p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/lecturer/bimbingan"
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-lg inline-flex items-center"
                  >
                    Setujui
                  </Link>
                  <Link
                    href="/lecturer/bimbingan"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg inline-flex items-center"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
