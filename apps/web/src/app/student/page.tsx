'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  GraduationCap,
  MapPin,
  Printer,
  UserCheck,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const krsList = [
    { code: 'TIF-301', name: 'Rekayasa Perangkat Lunak', sks: 3, dosen: 'Dr. Bayu Wicaksono, M.Kom.', hari: 'Senin', jam: '08.00 - 10.30 WIB', ruang: 'Lab Komputasi 3' },
    { code: 'TIF-305', name: 'Pemrograman Web & Cloud Lanjut', sks: 3, dosen: 'Ir. Anita Rahmawati, M.T.', hari: 'Selasa', jam: '10.30 - 13.00 WIB', ruang: 'Lab Software Eng.' },
    { code: 'TIF-308', name: 'Keamanan Siber & Kriptografi Terapan', sks: 3, dosen: 'Dr. Hendra Saputra, M.Kom.', hari: 'Rabu', jam: '13.00 - 15.30 WIB', ruang: 'Ruang Teori 402' },
    { code: 'TIF-312', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, dosen: 'Prof. Dr. Eng. Satria Pratama', hari: 'Kamis', jam: '08.00 - 10.30 WIB', ruang: 'Auditorium Riset' },
    { code: 'UNIV-204', name: 'Technopreneurship & Inovasi Bisnis', sks: 2, dosen: 'Dr. Nurul Hidayati, M.M.', hari: 'Jumat', jam: '09.00 - 10.40 WIB', ruang: 'Ruang Teori 201' },
  ];

  return (
    <PortalLayout
      role="student"
      userName="Muhammad Rizky Pratama"
      userIdText="NIM: 2311501001 • Teknik Informatika"
    >
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Status Akademik: Mahasiswa Aktif
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Datang, Muhammad Rizky!
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Program Studi Teknik Informatika (S1) &bull; Fakultas Ilmu Komputer &bull; Angkatan 2023
            </p>
          </div>
          <div className="flex gap-2.5">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors">
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak KHS</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-slate-950 text-xs font-bold rounded-xl shadow-xs hover:bg-[#C59114] transition-colors">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Unduh Kartu Ujian</span>
            </button>
          </div>
        </div>

        {/* 4 Academic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card IPK */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">IPK Kumulatif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">3.84</p>
            <p className="text-xs text-slate-500 mt-1">IPS Semester Lalu: <strong className="text-slate-700">3.90</strong></p>
          </div>

          {/* Card SKS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total SKS Lulus</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">88 <span className="text-base font-normal text-slate-500">/ 144 SKS</span></p>
            <p className="text-xs text-slate-500 mt-1">Beban SKS Semester 5: <strong className="text-slate-700">20 SKS</strong></p>
          </div>

          {/* Card Status KRS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status KRS Gasal</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DISETUJUI DOSEN PA</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Dosen PA: <strong className="text-slate-700">Dr. Bayu Wicaksono</strong></p>
          </div>

          {/* Card SPP */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status UKT / SPP</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200 text-xs font-bold">
              <span>LUNAS (TERVERIFIKASI)</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Nomor Bukti: <strong className="text-slate-700">SPP-20261-00892</strong></p>
          </div>
        </div>

        {/* KRS Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kartu Rencana Studi (KRS) &bull; Semester Gasal 2026/2027
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total 5 Mata Kuliah terdaftar (14 SKS) &bull; Dosen Pembimbing Akademik telah memvalidasi
              </p>
            </div>
            <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200/80 w-fit">
              Tahun Akademik 2026/2027
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode MK</th>
                  <th className="py-3 px-4">Nama Mata Kuliah</th>
                  <th className="py-3 px-4 text-center">SKS</th>
                  <th className="py-3 px-4">Dosen Pengampu</th>
                  <th className="py-3 px-4">Jadwal & Ruang</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {krsList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1E3A8A]">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {item.sks}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.dosen}
                    </td>
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
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Announcement Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-amber-900">
          <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D4A017]"></span>
            Pengumuman BAAK & Ketentuan Akademik
          </p>
          <p className="leading-relaxed text-amber-800">
            Batas pengubahan KRS (KPRS) berakhir pada tanggal 15 September 2026. Pastikan presensi kuliah minimal 75% sebagai syarat mutlak mengikuti Ujian Akhir Semester (UAS). Untuk konsultasi riset dan tugas akhir, silakan gunakan fitur bimbingan online di menu Portal.
          </p>
        </div>

      </div>
    </PortalLayout>
  );
}
