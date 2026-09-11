'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
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
  Award,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Save,
  Sparkles,
  Building,
  Check,
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
  jenjang?: string;
  status: string;
  testScore?: number | null;
  notes?: string | null;
  createdAt: string;
}

// Data Pilihan Program Studi per Jenjang
const STUDY_PROGRAMS = {
  S1: [
    { name: 'Teknik Informatika (S1)', faculty: 'Fakultas Teknologi Informasi', desc: 'Konsentrasi Software Engineering, AI & Cybersecurity' },
    { name: 'Sistem Informasi (S1)', faculty: 'Fakultas Teknologi Informasi', desc: 'Konsentrasi Data Analytics & Enterprise Systems' },
    { name: 'Teknik Elektro (S1)', faculty: 'Fakultas Teknik Industri', desc: 'Konsentrasi IoT, Otomasi & Robotika' },
    { name: 'Teknik Sipil (S1)', faculty: 'Fakultas Teknik Sipil & Perencanaan', desc: 'Konsentrasi Smart Infrastructure & Green Building' },
    { name: 'Bisnis Digital (S1)', faculty: 'Fakultas Ekonomi & Bisnis', desc: 'Konsentrasi E-Commerce & Financial Technology' },
    { name: 'Desain Komunikasi Visual (S1)', faculty: 'Fakultas Seni & Desain', desc: 'Konsentrasi UI/UX, Animasi & Media Kreatif' },
  ],
  S2: [
    { name: 'Magister Teknik Informatika (S2)', faculty: 'Program Pascasarjana', desc: 'Magister Terapan Kecerdasan Buatan & Cloud Computing' },
    { name: 'Magister Manajemen Sistem Informasi (S2)', faculty: 'Program Pascasarjana', desc: 'Magister IT Governance & Digital Transformation' },
  ],
  S3: [
    { name: 'Doktoral Ilmu Komputer (S3)', faculty: 'Program Pascasarjana Doktoral', desc: 'Riset Lanjutan Deep Learning & Advanced Computing' },
  ],
};

// Data Pilihan Jalur Pendaftaran
const REGISTRATION_PATHS = [
  {
    id: 'Jalur Prestasi Akademik (Bebas Tes)',
    name: 'Jalur Prestasi Akademik & Lomba (Bebas Tes)',
    badge: 'Bebas Tes',
    tag: 'Populer',
    desc: 'Untuk peraih juara olimpiade sains, teknologi, olahraga, atau seni minimal tingkat kota/kabupaten.',
    benefits: 'Bebas Tes Tertulis & Potongan Biaya Kuliah',
  },
  {
    id: 'Jalur Nilai Rapor & Portofolio',
    name: 'Jalur Nilai Rapor & Portofolio',
    badge: 'Seleksi Rapor',
    tag: 'Cepat',
    desc: 'Seleksi menggunakan rerata nilai rapor semester 1 sampai semester 5 tanpa perlu ujian tertulis.',
    benefits: 'Tanpa Ujian Tertulis, Cukup Berkas Nilai',
  },
  {
    id: 'Jalur Mandiri Online (CBT)',
    name: 'Jalur Mandiri Online (CBT)',
    badge: 'Tes Online',
    tag: 'Fleksibel',
    desc: 'Ujian Computer-Based Test secara daring dengan waktu pengerjaan yang fleksibel dari rumah.',
    benefits: 'Hasil Tes Langsung Keluar Setelah Ujian',
  },
  {
    id: 'KIP-K & Beasiswa Nusantara',
    name: 'KIP-K & Beasiswa Nusantara',
    badge: 'Beasiswa Penuh',
    tag: 'Bantuan Biaya',
    desc: 'Program beasiswa pendidikan bagi calon mahasiswa berprestasi dari keluarga prasejahtera.',
    benefits: 'Bebas Biaya Kuliah Penuh 8 Semester',
  },
  {
    id: 'Jalur Kemitraan & Rekomendasi',
    name: 'Jalur Kemitraan & Rekomendasi Instansi / Alumni',
    badge: 'Kemitraan',
    tag: 'Khusus',
    desc: 'Khusus bagi calon pendaftar dari sekolah mitra, instansi kerjasama, atau rekomendasi alumni.',
    benefits: 'Prioritas Seleksi & Jalur Administrasi Cepat',
  },
];

export default function PmbDashboardPage() {
  const router = useRouter();
  const [applicant, setApplicant] = useState<ApplicantSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Form Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [wizardForm, setWizardForm] = useState({
    jenjang: 'S1' as 'S1' | 'S2' | 'S3',
    chosenStudyProgram: '',
    jalurPendaftaran: '',
    gelombang: 'Gelombang 1 (Early Bird)',
    highSchool: '',
    schoolType: 'SMA',
    major: 'IPA',
    graduationYear: '2026',
    nisn: '',
    averageScore: '',
    nik: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    religion: 'Islam',
    address: '',
    parentName: '',
    parentPhone: '',
    parentJob: '',
    statementAgreed: false,
  });

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pmb_applicant_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setApplicant(parsed);

          // Cek apakah formulir pendaftaran sudah pernah diisi lengkap
          const needsForm = !parsed.chosenStudyProgram || parsed.chosenStudyProgram === 'Belum Dipilih' ||
                            !parsed.jalurPendaftaran || parsed.jalurPendaftaran === 'Belum Dipilih';

          if (needsForm) {
            setShowWizard(true);
          }

          // Pre-populate form
          setWizardForm((prev) => ({
            ...prev,
            chosenStudyProgram: parsed.chosenStudyProgram !== 'Belum Dipilih' ? parsed.chosenStudyProgram : '',
            jalurPendaftaran: parsed.jalurPendaftaran !== 'Belum Dipilih' ? parsed.jalurPendaftaran : '',
            highSchool: parsed.highSchool && parsed.highSchool !== '-' ? parsed.highSchool : '',
          }));
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

  // Navigasi Langkah Wizard dengan Validasi
  const handleNextStep = () => {
    setWizardError(null);

    if (currentStep === 1) {
      if (!wizardForm.chosenStudyProgram) {
        setWizardError('Silakan pilih salah satu Program Studi pilihan Anda.');
        return;
      }
    } else if (currentStep === 2) {
      if (!wizardForm.jalurPendaftaran) {
        setWizardError('Silakan pilih salah satu Jalur Pendaftaran yang diinginkan.');
        return;
      }
    } else if (currentStep === 3) {
      if (!wizardForm.highSchool.trim()) {
        setWizardError('Nama Asal Sekolah / Perguruan Tinggi wajib diisi.');
        return;
      }
    } else if (currentStep === 4) {
      if (!wizardForm.nik.trim()) {
        setWizardError('Nomor Induk Kependudukan (NIK) wajib diisi.');
        return;
      }
      if (!wizardForm.address.trim()) {
        setWizardError('Alamat lengkap domisili wajib diisi.');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setWizardError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Finalisasi Formulir Pendaftaran
  const handleSaveWizard = async () => {
    if (!wizardForm.statementAgreed) {
      setWizardError('Harap centang pernyataan persetujuan kebenaran data untuk melanjutkan.');
      return;
    }

    if (!applicant) return;
    setIsSaving(true);
    setWizardError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/applicants/${applicant.id}/form`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardForm),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal menyimpan formulir pendaftaran.');
      }

      const updatedApplicant: ApplicantSession = {
        ...applicant,
        chosenStudyProgram: wizardForm.chosenStudyProgram,
        jalurPendaftaran: wizardForm.jalurPendaftaran,
        highSchool: wizardForm.highSchool,
        jenjang: wizardForm.jenjang,
        status: 'PENDING',
      };

      setApplicant(updatedApplicant);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pmb_applicant_session', JSON.stringify(updatedApplicant));
      }

      setShowWizard(false);
    } catch (err: any) {
      setWizardError(err.message || 'Terjadi kesalahan saat menyimpan formulir. Silakan coba kembali.');
    } finally {
      setIsSaving(false);
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
    fullName: 'Galih Bagaskoro',
    email: 'net.galih7@gmail.com',
    phone: '081276438553',
    highSchool: '-',
    chosenStudyProgram: 'Belum Dipilih',
    jalurPendaftaran: 'Belum Dipilih',
    status: 'PENDING',
    testScore: null,
    createdAt: new Date().toISOString(),
  };

  const isFormCompleted =
    currentApplicant.chosenStudyProgram &&
    currentApplicant.chosenStudyProgram !== 'Belum Dipilih' &&
    currentApplicant.jalurPendaftaran &&
    currentApplicant.jalurPendaftaran !== 'Belum Dipilih';

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
        {/* ========================================================================= */}
        {/* MODA 1: FORM WIZARD PENGISIAN FORMULIR PENDAFTARAN LENGKAP               */}
        {/* ========================================================================= */}
        {showWizard ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in">
            {/* Header Wizard */}
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-amber-300/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Formulir Pendaftaran Mahasiswa Baru</span>
                </div>
                <h1 className="text-xl font-black">
                  Lengkapi Data Pendaftaran Anda
                </h1>
                <p className="text-xs text-blue-200 mt-1">
                  Nomor Registrasi: <strong className="font-mono text-amber-300">{currentApplicant.registrationNumber}</strong> • Calon Mahasiswa: <strong>{currentApplicant.fullName}</strong>
                </p>
              </div>

              {isFormCompleted && (
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
                >
                  Tutup Formulir & Kembali ke Dashboard
                </button>
              )}
            </div>

            {/* Stepper Wizard Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  { step: 1, title: 'Program Studi', desc: 'Jenjang & Jurusan' },
                  { step: 2, title: 'Jalur Masuk', desc: 'Pilihan Seleksi' },
                  { step: 3, title: 'Asal Sekolah', desc: 'Riwayat Akademik' },
                  { step: 4, title: 'Data Diri', desc: 'NIK & Biodata' },
                  { step: 5, title: 'Finalisasi', desc: 'Konfirmasi Kirim' },
                ].map((s) => {
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-all ${
                          isActive
                            ? 'bg-[#1E3A8A] text-white ring-4 ring-blue-100 shadow-sm'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : s.step}
                      </div>
                      <span className={`hidden sm:block font-bold text-[11px] ${isActive ? 'text-[#1E3A8A]' : isDone ? 'text-emerald-800' : 'text-slate-400'}`}>
                        {s.title}
                      </span>
                      <span className="hidden md:block text-[10px] text-slate-400">
                        {s.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wizard Body Content */}
            <div className="p-6 sm:p-8">
              {wizardError && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* ================= STEP 1: JENJANG & PROGRAM STUDI ================= */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                      Pilih Jenjang Pendidikan
                    </h2>
                    <p className="text-xs text-slate-500 mb-3">
                      Tentukan tingkatan jenjang studi yang ingin Anda tempuh di Institut Teknologi Nusantara.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {(['S1', 'S2', 'S3'] as const).map((j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => {
                            setWizardForm((prev) => ({
                              ...prev,
                              jenjang: j,
                              chosenStudyProgram: '', // reset prodi saat ganti jenjang
                            }));
                          }}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            wizardForm.jenjang === j
                              ? 'bg-blue-50 border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-base font-black text-[#1E3A8A]">{j}</span>
                          <span className="block text-[11px] text-slate-600 font-medium">
                            {j === 'S1' ? 'Sarjana Reguler' : j === 'S2' ? 'Magister Pascasarjana' : 'Doktoral Riset'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1E3A8A]" />
                      Pilih Program Studi Pilihan ({wizardForm.jenjang})
                    </h2>
                    <p className="text-xs text-slate-500 mb-3">
                      Pilih program studi yang Anda minati sesuai dengan prospek karir masa depan Anda:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {STUDY_PROGRAMS[wizardForm.jenjang].map((p, idx) => {
                        const isSelected = wizardForm.chosenStudyProgram === p.name;
                        return (
                          <div
                            key={idx}
                            onClick={() => setWizardForm((prev) => ({ ...prev, chosenStudyProgram: p.name }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50/80 border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-[#D4A017] uppercase tracking-wider block">
                                  {p.faculty}
                                </span>
                                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">
                                  {p.name}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                  {p.desc}
                                </p>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: JALUR PENDAFTARAN ================= */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#D4A017]" />
                      Pilih Jalur Seleksi Penerimaan Mahasiswa Baru
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Silakan pilih mekanisme jalur seleksi yang paling sesuai dengan kualifikasi dan prestasi Anda:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {REGISTRATION_PATHS.map((path) => {
                      const isSelected = wizardForm.jalurPendaftaran === path.id;
                      return (
                        <div
                          key={path.id}
                          onClick={() => setWizardForm((prev) => ({ ...prev, jalurPendaftaran: path.id }))}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-50/80 border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1E3A8A]">
                                  {path.badge}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {path.tag}
                                </span>
                              </div>
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                {path.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {path.desc}
                              </p>
                            </div>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                              ✓ {path.benefits}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= STEP 3: ASAL SEKOLAH / PENDIDIKAN ================= */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <School className="w-4 h-4 text-[#1E3A8A]" />
                      Data Riwayat Pendidikan & Asal Sekolah
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Lengkapi informasi asal institusi pendidikan terakhir Anda:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Asal Sekolah / Perguruan Tinggi Terakhir <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SMAN 1 Teladan Jakarta atau Universitas Nusantara"
                        value={wizardForm.highSchool}
                        onChange={(e) => setWizardForm({ ...wizardForm, highSchool: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jenis Asal Pendidikan
                      </label>
                      <select
                        value={wizardForm.schoolType}
                        onChange={(e) => setWizardForm({ ...wizardForm, schoolType: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A] bg-white"
                      >
                        <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                        <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                        <option value="MA">MA (Madrasah Aliyah)</option>
                        <option value="Perguruan Tinggi">Perguruan Tinggi (D3 / S1 / S2)</option>
                        <option value="Lainnya">Lainnya / Paket C</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jurusan / Peminatan Asal
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: MIPA, IPS, Rekayasa Perangkat Lunak"
                        value={wizardForm.major}
                        onChange={(e) => setWizardForm({ ...wizardForm, major: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tahun Kelulusan
                      </label>
                      <select
                        value={wizardForm.graduationYear}
                        onChange={(e) => setWizardForm({ ...wizardForm, graduationYear: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A] bg-white"
                      >
                        <option value="2027">2027 (Lulus Tahun Depan)</option>
                        <option value="2026">2026 (Lulus Tahun Ini)</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023 atau Sebelumnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nilai Rata-rata Rapor / IPK Terakhir
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 88.50 atau 3.75"
                        value={wizardForm.averageScore}
                        onChange={(e) => setWizardForm({ ...wizardForm, averageScore: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: DATA PRIBADI & ORANG TUA ================= */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1E3A8A]" />
                      Data Kependudukan & Informasi Keluarga
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Data ini digunakan untuk verifikasi identitas resmi dan penerbitan nomor pokok mahasiswa:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor Induk Kependudukan (NIK / KTP) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="16 digit NIK sesuai KTP / KK"
                        value={wizardForm.nik}
                        onChange={(e) => setWizardForm({ ...wizardForm, nik: e.target.value.replace(/[^0-9]/g, '') })}
                        maxLength={16}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={wizardForm.gender}
                        onChange={(e) => setWizardForm({ ...wizardForm, gender: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A] bg-white"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        placeholder="Kota / Kabupaten Lahir"
                        value={wizardForm.birthPlace}
                        onChange={(e) => setWizardForm({ ...wizardForm, birthPlace: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={wizardForm.birthDate}
                        onChange={(e) => setWizardForm({ ...wizardForm, birthDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A] bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Alamat Lengkap Domisili <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi, Kode Pos"
                        value={wizardForm.address}
                        onChange={(e) => setWizardForm({ ...wizardForm, address: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Orang Tua / Wali
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Ayah / Ibu / Wali"
                        value={wizardForm.parentName}
                        onChange={(e) => setWizardForm({ ...wizardForm, parentName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor Kontak / WhatsApp Orang Tua
                      </label>
                      <input
                        type="tel"
                        placeholder="0812xxxxxxxx"
                        value={wizardForm.parentPhone}
                        onChange={(e) => setWizardForm({ ...wizardForm, parentPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= STEP 5: FINALISASI & KONFIRMASI ================= */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Rangkuman Pendaftaran & Konfirmasi Data
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Harap periksa kembali seluruh data yang Anda masukkan sebelum mengirimkan formulir:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jenjang & Program Studi:</span>
                      <strong className="text-slate-900 text-sm">{wizardForm.chosenStudyProgram} ({wizardForm.jenjang})</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Jalur Seleksi:</span>
                      <strong className="text-[#1E3A8A]">{wizardForm.jalurPendaftaran}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Asal Sekolah:</span>
                      <span className="text-slate-800 font-semibold">{wizardForm.highSchool} ({wizardForm.major || '-'})</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Tahun Lulus:</span>
                      <span className="text-slate-800 font-semibold">{wizardForm.graduationYear}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">NIK / KTP:</span>
                      <span className="text-slate-800 font-mono font-semibold">{wizardForm.nik || '-'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Kontak Pendaftar:</span>
                      <span className="text-slate-800">{currentApplicant.email} / {currentApplicant.phone}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Alamat Domisili:</span>
                      <span className="text-slate-800">{wizardForm.address || '-'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={wizardForm.statementAgreed}
                        onChange={(e) => setWizardForm({ ...wizardForm, statementAgreed: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] mt-0.5 cursor-pointer"
                      />
                      <span className="leading-relaxed">
                        Saya menyatakan bahwa seluruh data yang diisikan dalam formulir pendaftaran ini adalah benar, sah, dan dapat dipertanggungjawabkan sesuai ketentuan Penerimaan Mahasiswa Baru Institut Teknologi Nusantara.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Wizard Footer Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={isSaving}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>
                  )}
                </div>

                <div>
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Lanjutkan</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveWizard}
                      disabled={isSaving || !wizardForm.statementAgreed}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Menyimpan Formulir...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Kirim & Finalisasi Pendaftaran</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODA 2: DASHBOARD UTAMA SETELAH FORMULIR TERISI LENGKAP                  */
          /* ========================================================================= */
          <>
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
                        : `Berkas dan formulir pendaftaran Anda dengan nomor ${currentApplicant.registrationNumber} telah diajukan dan sedang dalam tahap verifikasi panitia PMB ITN.`}
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

                  <button
                    type="button"
                    onClick={() => {
                      setShowWizard(true);
                      setCurrentStep(1);
                    }}
                    className="w-full py-2 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Perbarui Formulir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid 2 Kolom: Data Pendaftar & Kelengkapan Berkas */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Kolom Kiri: Detail Biodata & Akademik */}
              <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                    Rincian Informasi Pendaftaran
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWizard(true);
                      setCurrentStep(1);
                    }}
                    className="text-xs font-bold text-[#1E3A8A] hover:underline inline-flex items-center gap-1 print:hidden"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Formulir</span>
                  </button>
                </div>

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
                    <span className="text-xs font-semibold text-[#1E3A8A]">
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
                        <span className="text-[11px] text-slate-500">Menunggu verifikasi panitia</span>
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
          </>
        )}
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
