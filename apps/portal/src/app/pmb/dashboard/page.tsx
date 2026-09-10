'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  LogOut,
  Mail,
  Phone,
  Printer,
  School,
  User,
  AlertCircle,
} from 'lucide-react';

interface ApplicantSession {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  highSchool: string;
  chosenStudyProgram: string;
  jalurPendaftaran: string;
  status: string;
  testScore?: number | null;
  createdAt: string;
}

export default function PmbDashboardPage() {
  const router = useRouter();
  const [applicant, setApplicant] = useState<ApplicantSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pmb_applicant_session');
      if (stored) {
        try {
          setApplicant(JSON.parse(stored));
        } catch {
          // invalid json
        }
      }
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pmb_applicant_session');
      localStorage.removeItem('pmb_applicant_token');
    }
    router.push('/pmb/login');
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-700">
        <div className="flex items-center gap-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 rounded-full border-2 border-[#1E3A8A] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-800">Memuat Portal Pendaftar...</span>
        </div>
      </div>
    );
  }

  const currentApplicant: ApplicantSession = applicant || {
    id: 'demo-default',
    registrationNumber: 'PMB20270001',
    fullName: 'Aisyah Rahmadani',
    email: 'aisyah.pmb@gmail.com',
    phone: '081234567890',
    highSchool: 'SMAN 1 Teladan Jakarta',
    chosenStudyProgram: 'Teknik Informatika (S1)',
    jalurPendaftaran: 'Jalur Prestasi Akademik (Bebas Tes)',
    status: 'PASSED',
    testScore: 88.5,
    createdAt: new Date().toISOString(),
  };

  const isPassed = currentApplicant.status === 'PASSED' || currentApplicant.status === 'REGISTERED';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      
      {/* Top Header Resmi Kampus */}
      <header className="bg-[#1E3A8A] text-white border-b-2 border-[#D4A017] shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pmb"
              className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-900 text-blue-200 hover:text-white transition-colors"
              title="Kembali ke Beranda PMB"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border-2 border-[#D4A017] flex items-center justify-center font-extrabold text-[#1E3A8A] text-xs shadow-xs">
                ITN
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide block leading-tight">
                  INSTITUT TEKNOLOGI NUSANTARA
                </span>
                <span className="text-[11px] text-blue-200 block">
                  Dashboard Calon Mahasiswa Baru 2027
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{currentApplicant.fullName}</span>
              <span className="text-[11px] text-amber-300 font-mono font-semibold">{currentApplicant.registrationNumber}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-red-600 hover:text-white border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Status Seleksi Banner */}
        <div
          className={`p-6 rounded-2xl border shadow-xs ${
            isPassed
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
              </div>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide mb-1 ${
                    isPassed
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {isPassed ? 'Lulus Seleksi / Diterima' : 'Tahap Verifikasi Berkas'}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isPassed
                    ? `Selamat, ${currentApplicant.fullName}! Anda Dinyatakan Lulus Seleksi`
                    : `Data Pendaftaran ${currentApplicant.fullName} Sedang Diproses`}
                </h1>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
                  {isPassed
                    ? `Selamat, Anda resmi diterima pada program studi ${currentApplicant.chosenStudyProgram} melalui ${currentApplicant.jalurPendaftaran}. Silakan lakukan registrasi ulang dan pembayaran UKT semester 1.`
                    : `Berkas dan formulir pendaftaran Anda dengan nomor ${currentApplicant.registrationNumber} sedang dalam tahap verifikasi panitia PMB ITN. Pantau pengumuman berkala setiap hari Jumat.`}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center gap-2 print:hidden shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu Peserta</span>
              </button>
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20PMB%20ITN,%20saya%20ingin%20konfirmasi%20daftar%20ulang"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Helpdesk PMB</span>
              </a>
            </div>
          </div>
        </div>

        {/* Grid 2 Kolom: Data Pendaftar & Kelengkapan Berkas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Kolom Kiri: Detail Biodata & Akademik */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
              Rincian Informasi Pendaftaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Nomor Registrasi PMB:</span>
                <span className="text-base font-mono font-black text-[#1E3A8A]">
                  {currentApplicant.registrationNumber}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Program Studi Pilihan:</span>
                <span className="text-sm font-bold text-slate-900">
                  {currentApplicant.chosenStudyProgram}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Jalur Pendaftaran:</span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentApplicant.jalurPendaftaran}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Asal Sekolah:</span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentApplicant.highSchool || 'SMAN / SMK Sederajat'}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Email Terdaftar:</span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentApplicant.email}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Nomor WhatsApp:</span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentApplicant.phone}
                </span>
              </div>
            </div>

            {/* Kartu Peserta Ujian PMB (Print Area Resmi) */}
            <div className="border border-slate-300 rounded-xl p-5 bg-slate-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    KARTU TANDA PESERTA PMB ITN TA 2027/2028
                  </span>
                  <span className="text-[11px] text-slate-500">Institut Teknologi Nusantara</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                  Status: Terverifikasi
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Kartu tanda peserta ini merupakan bukti pendaftaran sah calon mahasiswa baru Institut Teknologi Nusantara. Harap simpan dokumen ini atau bawa cetakannya pada saat verifikasi fisik dan registrasi ulang.
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Checklist Berkas & Bantuan */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Checklist Berkas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Tahapan & Berkas Digital
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block">Formulir Pendaftaran</span>
                    <span className="text-[11px] text-emerald-700">Tercatat Online</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block">KTP / Kartu Keluarga</span>
                    <span className="text-[11px] text-emerald-700">Terdaftar</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Ijazah / Rapor Semester 1-5</span>
                    <span className="text-[11px] text-slate-500">Menunggu unggah berkas</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Registrasi Ulang & UKT</span>
                    <span className="text-[11px] text-slate-500">Maks. 30 November 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bantuan Helpdesk */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block mb-2">Pusat Bantuan Calon Mahasiswa:</span>
              <p className="leading-relaxed text-[11px] text-slate-500 mb-3">
                Jika terdapat kekeliruan data atau pertanyaan seputar registrasi ulang, silakan hubungi panitia PMB:
              </p>
              <div className="space-y-1.5 text-xs">
                <p><strong>Hotline:</strong> (021) 7890-1234</p>
                <p><strong>WhatsApp:</strong> 0812-3456-7890</p>
                <p><strong>Email:</strong> pmb@itn.ac.id</p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer Resmi Kampus */}
      <footer className="bg-slate-200/80 border-t border-slate-300 py-4 text-center text-xs text-slate-600 print:hidden">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Panitia Penerimaan Mahasiswa Baru (PMB) • Institut Teknologi Nusantara (ITN)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kampus Utama: Jl. Boulevard Teknologi No. 1, Jakarta • Hotline: (021) 7890-1234 • Email: pmb@itn.ac.id
          </p>
        </div>
      </footer>

    </div>
  );
}
