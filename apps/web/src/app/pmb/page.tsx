import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  FileText,
  GraduationCap,
  Laptop,
  Mail,
  Phone,
  Sparkles,
  LogIn,
  Users,
} from 'lucide-react';

interface AdmissionBatch {
  id: string;
  name: string;
  academicYear: string;
  jenjang?: string;
  startDate: string;
  endDate: string;
  examDate?: string;
  announcementDate?: string;
  registrationFee: number;
  reRegistrationFee?: number;
  reRegistrationFees?: Array<{
    id?: string;
    name: string;
    amount: number;
    note?: string;
  }>;
  quota: number;
  availableJalur: string[];
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  isDefault: boolean;
  description?: string;
  applicantCount?: number;
}

const FALLBACK_BATCHES: AdmissionBatch[] = [
  {
    id: 'default-batch-1',
    name: 'Gelombang 1 (Early Bird)',
    academicYear: '2027/2028',
    jenjang: 'S1',
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    examDate: '2026-12-05',
    announcementDate: '2026-12-10',
    registrationFee: 200000,
    reRegistrationFee: 7300000,
    reRegistrationFees: [
      { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
      { id: 'fee-2', name: 'Biaya Pengembangan Institusi (Diskon Early Bird 50%)', amount: 2500000, note: 'Dapat diangsur 2x' },
      { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
      { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
    ],
    quota: 350,
    availableJalur: [
      'Jalur Prestasi Akademik (Bebas Tes)',
      'Jalur Nilai Rapor & Portofolio',
      'Jalur Mandiri Online (CBT)',
      'KIP-K & Beasiswa Nusantara',
    ],
    status: 'OPEN',
    isDefault: true,
    description: 'Pendaftaran gelombang pembuka dengan potongan biaya formulir & beasiswa berprestasi.',
  },
  {
    id: 'default-batch-2',
    name: 'Gelombang 2 (Reguler)',
    academicYear: '2027/2028',
    jenjang: 'S1',
    startDate: '2026-12-01',
    endDate: '2027-03-31',
    examDate: '2027-04-05',
    announcementDate: '2027-04-10',
    registrationFee: 250000,
    reRegistrationFee: 9300000,
    reRegistrationFees: [
      { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
      { id: 'fee-2', name: 'Biaya Pengembangan Institusi (DPP)', amount: 4500000, note: 'Dapat diangsur 2x' },
      { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
      { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
    ],
    quota: 400,
    availableJalur: [
      'Jalur Mandiri Online (CBT)',
      'Jalur Nilai Rapor & Portofolio',
    ],
    status: 'UPCOMING',
    isDefault: false,
    description: 'Pendaftaran reguler semester genap dengan seleksi CBT daring.',
  },
  {
    id: 'default-batch-3',
    name: 'Gelombang 3 (Terakhir)',
    academicYear: '2027/2028',
    jenjang: 'S1',
    startDate: '2027-04-01',
    endDate: '2027-07-31',
    examDate: '2027-08-05',
    announcementDate: '2027-08-10',
    registrationFee: 300000,
    reRegistrationFee: 10300000,
    reRegistrationFees: [
      { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
      { id: 'fee-2', name: 'Biaya Pengembangan Institusi (DPP Normal)', amount: 5500000, note: 'Dapat diangsur 2x' },
      { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
      { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
    ],
    quota: 250,
    availableJalur: [
      'Jalur Mandiri Online (CBT)',
    ],
    status: 'UPCOMING',
    isDefault: false,
    description: 'Gelombang penutup kuota penerimaan mahasiswa baru.',
  },
];

const DEFAULT_RE_REGISTRATION_FEES_BY_JENJANG: Record<string, Array<{ name: string; amount: number; note?: string }>> = {
  S1: [
    { name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
    { name: 'Biaya Pengembangan Institusi (DPP)', amount: 2500000, note: 'Dapat diangsur 2x' },
    { name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
    { name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
  ],
  S2: [
    { name: 'Biaya Matrikulasi Pascasarjana', amount: 2500000, note: 'Sekali bayar di awal' },
    { name: 'SPP / UKT Tetap Semester 1 (S2)', amount: 6500000, note: 'Biaya kuliah semester 1' },
    { name: 'Dana Pengembangan Akademik & Riset', amount: 3000000, note: 'Dapat diangsur 2x' },
    { name: 'Layanan Perpustakaan Digital & Lab Riset', amount: 800000, note: 'Akses jurnal internasional' },
  ],
  S3: [
    { name: 'Biaya Ujian Kualifikasi & Matrikulasi', amount: 3500000, note: 'Sekali bayar di awal' },
    { name: 'SPP / UKT Tetap Semester 1 (S3)', amount: 10000000, note: 'Biaya kuliah semester 1' },
    { name: 'Dana Kolaborasi Riset & Hibah Publikasi', amount: 5000000, note: 'Dapat diangsur' },
    { name: 'Fasilitas Laboratorium Riset Doktoral', amount: 1500000, note: 'Akses fasilitas riset penuh' },
  ],
};

async function getAdmissionBatches(): Promise<AdmissionBatch[]> {
  try {
    const baseUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001/api/v1';

    const res = await fetch(`${baseUrl}/admissions/batches`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return FALLBACK_BATCHES;
    }

    const json = await res.json();
    const payload = json.data !== undefined ? json.data : json;
    const list = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    if (list.length === 0) return FALLBACK_BATCHES;
    return list;
  } catch {
    return FALLBACK_BATCHES;
  }
}

function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatRupiah(amount: number): string {
  if (!amount || amount === 0) return 'Gratis (Rp 0)';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PmbPage() {
  const batches = await getAdmissionBatches();
  const activeBatches = batches.filter((b) => b.status === 'OPEN');
  const activeBatch = activeBatches.find((b) => b.isDefault) || activeBatches[0] || batches[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      
      {/* Top Bar PMB Hotline */}
      <div className="bg-[#0F172A] text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Hotline PMB: <strong>(021) 7890-1234 ext. 101</strong></span>
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Email: pmb@itn.ac.id</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Kembali ke Website Utama ITN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main PMB Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo PMB */}
            <Link href="/pmb" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1E3A8A] border-2 border-[#D4A017] flex items-center justify-center text-white font-black text-sm sm:text-base shadow-xs">
                ITN
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base text-[#1E3A8A] tracking-tight leading-tight">
                  PMB INSTITUT TEKNOLOGI NUSANTARA
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#D4A017] tracking-wider uppercase">
                  Penerimaan Mahasiswa Baru TA 2027/2028
                </span>
              </div>
            </Link>

            {/* Quick Links Desktop */}
            <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-700">
              <a href="#gelombang" className="hover:text-[#1E3A8A] transition-colors">Gelombang</a>
              <a href="#jalur" className="hover:text-[#1E3A8A] transition-colors">Jalur Masuk</a>
              <a href="#alur" className="hover:text-[#1E3A8A] transition-colors">Alur Daftar</a>
              <a href="#biaya" className="hover:text-[#1E3A8A] transition-colors">Biaya Kuliah</a>
              <Link href="/pmb/daftar" className="hover:text-[#1E3A8A] transition-colors">Register Akun</Link>
              <a href="#faq" className="hover:text-[#1E3A8A] transition-colors">FAQ</a>
            </nav>

            {/* Action CTA: Login, Daftar */}
            <div className="flex items-center gap-3">
              <Link
                href="/pmb/login"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-[#1E3A8A] border border-[#1E3A8A] hover:bg-blue-50 rounded-xl transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </Link>

              <Link
                href="/pmb/daftar"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-slate-950 bg-[#D4A017] hover:bg-[#C59114] rounded-xl shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Register Akun</span>
              </Link>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-grow">
        
        {/* Hero Banner PMB */}
        <section className="bg-gradient-to-br from-[#0A1128] via-[#1E3A8A] to-[#172554] text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:18px_18px]"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2 text-[#D4A017] text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-ping"></span>
                  <span>{activeBatch ? `${activeBatch.name.toUpperCase()} TELAH DIBUKA` : 'PENDAFTARAN MAHASISWA BARU DIBUKA'}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Wujudkan Impian Insinyur & Talenta Digital di <span className="text-[#D4A017]">ITN</span>
                </h1>

                <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-2xl">
                  Raih masa depan gemilang di Institut Teknologi Nusantara. Didukung kurikulum berbasis industri 4.0, akreditasi Unggul, beasiswa kemitraan global, dan peluang kerja sebelum wisuda.
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    href="/pmb/daftar"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#D4A017] text-slate-950 font-bold text-sm shadow-md hover:bg-[#C59114] transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Register Akun Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/pmb/login"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] border border-blue-400/40 text-white font-bold text-sm transition-all shadow-md"
                  >
                    <LogIn className="w-4 h-4 text-[#D4A017]" />
                    <span>Masuk ke Akun PMB</span>
                  </Link>

                  <div className="relative group">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#D4A017]" />
                      <span>Download Brosur PMB</span>
                      <ChevronDown className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-180 transition-transform" />
                    </button>

                    <div className="absolute left-0 top-full mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 hidden group-hover:block z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Pilih Jenjang Brosur
                      </div>
                      <a
                        href="/downloads/brosur-pmb-s1.pdf"
                        target="_blank"
                        rel="noreferrer"
                        download="Brosur-PMB-ITN-S1-2027.pdf"
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 text-[#1E3A8A] font-extrabold flex items-center justify-center text-[11px]">S1</span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">Brosur Sarjana (S1)</p>
                            <p className="text-[10px] text-slate-400">Teknik, Bisnis & Desain</p>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                      <a
                        href="/downloads/brosur-pmb-s2.pdf"
                        target="_blank"
                        rel="noreferrer"
                        download="Brosur-PMB-ITN-S2-2027.pdf"
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-[11px]">S2</span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">Brosur Magister (S2)</p>
                            <p className="text-[10px] text-slate-400">Program Pascasarjana</p>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                      <a
                        href="/downloads/brosur-pmb-s3.pdf"
                        target="_blank"
                        rel="noreferrer"
                        download="Brosur-PMB-ITN-S3-2027.pdf"
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 font-extrabold flex items-center justify-center text-[11px]">S3</span>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">Brosur Doktoral (S3)</p>
                            <p className="text-[10px] text-slate-400">Riset & Inovasi Tingkat Lanjut</p>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                      <div className="border-t border-slate-100 my-1"></div>
                      <a
                        href="/downloads/brosur-pmb-2027.pdf"
                        target="_blank"
                        rel="noreferrer"
                        download="Brosur-PMB-ITN-2027.pdf"
                        className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-[11px]">Unduh Brosur Lengkap (Semua)</span>
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3 Quick highlights */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-xs text-blue-200">
                  <div>
                    <p className="font-extrabold text-white text-base sm:text-lg">Bebas Tes</p>
                    <p className="text-[11px] text-blue-300">Jalur Prestasi & Rapor</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-base sm:text-lg">100% Beasiswa</p>
                    <p className="text-[11px] text-blue-300">KIP-K & Peduli Cendekia</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-base sm:text-lg">CBT Fleksibel</p>
                    <p className="text-[11px] text-blue-300">Ujian Mandiri Daring</p>
                  </div>
                </div>
              </div>

              {/* Hero Right Visual Card */}
              <div className="lg:col-span-5">
                <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Periode Seleksi</span>
                      <p className="text-base font-extrabold text-[#1E3A8A]">
                        {activeBatch ? `${activeBatch.name} (Jenjang ${activeBatch.jenjang || 'S1'})` : 'Gelombang Pendaftaran'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{activeBatch?.status === 'OPEN' ? 'Aktif Buka' : 'Periode Berjalan'}</span>
                    </div>
                  </div>

                  <div className="py-5 space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">
                          {activeBatch ? `${formatDateIndo(activeBatch.startDate)} - ${formatDateIndo(activeBatch.endDate)}` : '1 Agustus - 30 November 2026'}
                        </strong>
                        <p className="text-slate-500">Pendaftaran & pengunggahan berkas digital</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">
                          {activeBatch?.examDate && activeBatch.examDate !== '-' ? `Ujian: ${formatDateIndo(activeBatch.examDate)}` : 'Pengumuman Setiap Hari Jumat'}
                        </strong>
                        <p className="text-slate-500">Hasil verifikasi berkas tanpa perlu menunggu lama</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Biaya Formulir: {activeBatch ? formatRupiah(activeBatch.registrationFee) : 'Rp 200.000'}</strong>
                        <p className="text-slate-500">Alokasi kuota {activeBatch?.quota || 350} pendaftar baru</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/pmb/daftar"
                      className="w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <span>Register Akun {activeBatch?.name || 'Sekarang'}</span>
                      <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                    </Link>
                    <Link
                      href="/pmb/login"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>Sudah punya akun? Masuk ke Akun PMB</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION GELOMBANG PENDAFTARAN (Ambil dari Database, Tanpa Badge) */}
        {/* ========================================================================= */}
        <section id="gelombang" className="py-16 sm:py-20 bg-slate-100/70 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                Jadwal & Periode Seleksi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Gelombang Pendaftaran Aktif
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Pilih gelombang pendaftaran yang sedang dibuka saat ini dan daftarkan akun Anda segera untuk mengamankan kuota program studi impian di Institut Teknologi Nusantara.
              </p>
            </div>

            {activeBatches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-subtle">
                <p className="text-sm font-bold text-slate-700">Saat ini belum ada gelombang pendaftaran yang sedang dibuka.</p>
                <p className="text-xs text-slate-500 mt-1">Silakan cek berkala jadwal penerimaan mahasiswa baru kami.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeBatches.map((batch) => {
                  const fees = (batch.reRegistrationFees && batch.reRegistrationFees.length > 0)
                    ? batch.reRegistrationFees
                    : (DEFAULT_RE_REGISTRATION_FEES_BY_JENJANG[batch.jenjang || 'S1'] || DEFAULT_RE_REGISTRATION_FEES_BY_JENJANG['S1']);
                  const totalReReg = Number(batch.reRegistrationFee) > 0
                    ? Number(batch.reRegistrationFee)
                    : fees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

                  return (
                    <div
                      key={batch.id}
                      className="bg-white rounded-2xl p-6 border border-blue-300 ring-1 ring-blue-200 hover:shadow-md transition-all flex flex-col justify-between shadow-subtle"
                    >
                      <div>
                        {/* Header Card: Jenjang, Tahun Akademik & Status Indikator (Tanpa Badge) */}
                        <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70">
                              {batch.jenjang ? `Jenjang ${batch.jenjang}` : 'Jenjang S1'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              TA {batch.academicYear || '2027/2028'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Sedang Dibuka</span>
                          </div>
                        </div>

                        {/* Nama Gelombang & Deskripsi */}
                        <div className="mt-4">
                          <h3 className="text-lg font-extrabold text-slate-900">
                            {batch.name}
                          </h3>
                          {batch.description && (
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                              {batch.description}
                            </p>
                          )}
                        </div>

                        {/* Rincian Tanggal & Ketentuan */}
                        <div className="mt-5 space-y-3 text-xs text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex items-start gap-2.5">
                            <Calendar className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[11px] text-slate-400 block">Masa Pendaftaran:</span>
                              <strong className="text-slate-900">
                                {formatDateIndo(batch.startDate)} &ndash; {formatDateIndo(batch.endDate)}
                              </strong>
                            </div>
                          </div>

                          {batch.examDate && batch.examDate !== '-' && (
                            <div className="flex items-start gap-2.5">
                              <Clock className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[11px] text-slate-400 block">Pelaksanaan Ujian / CBT:</span>
                                <strong className="text-slate-900">{formatDateIndo(batch.examDate)}</strong>
                              </div>
                            </div>
                          )}

                          {batch.announcementDate && batch.announcementDate !== '-' && (
                            <div className="flex items-start gap-2.5">
                              <Award className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[11px] text-slate-400 block">Pengumuman Kelulusan:</span>
                                <strong className="text-slate-900">{formatDateIndo(batch.announcementDate)}</strong>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[11px] text-slate-400 block">Biaya Formulir:</span>
                              <span className="font-extrabold text-[#1E3A8A] text-sm">
                                {formatRupiah(batch.registrationFee)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 block">Alokasi Kuota:</span>
                              <span className="font-bold text-slate-800 flex items-center gap-1 justify-end">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>{batch.quota} Kursi</span>
                              </span>
                            </div>
                          </div>

                          {/* Rincian Biaya Daftar Ulang */}
                          <div className="pt-2.5 border-t border-slate-200/80">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-[#1E3A8A]" />
                                <span>Biaya Daftar Ulang:</span>
                              </span>
                              <span className="font-mono font-black text-[#1E3A8A] text-xs">
                                {formatRupiah(totalReReg)}
                              </span>
                            </div>

                            {fees && fees.length > 0 && (
                              <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/70 text-[11px]">
                                {fees.map((fee, fIdx) => (
                                  <div key={fIdx} className="flex items-start justify-between gap-2 text-slate-600">
                                    <span className="truncate" title={fee.name}>
                                      &bull; {fee.name}
                                    </span>
                                    <span className="font-mono font-semibold text-slate-800 shrink-0">
                                      {formatRupiah(fee.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Jalur yang Tersedia */}
                        {batch.availableJalur && batch.availableJalur.length > 0 && (
                          <div className="mt-4">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                              Jalur Tersedia:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {batch.availableJalur.map((jalur, jIdx) => (
                                <span
                                  key={jIdx}
                                  className="text-[11px] text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md"
                                >
                                  {jalur}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tombol CTA */}
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <Link
                          href="/pmb/daftar"
                          className="w-full py-2.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <span>Daftar {batch.name}</span>
                          <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4 Jalur Penerimaan */}
        <section id="jalur" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
              Pilihan Jalur Masuk
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Jalur Penerimaan Mahasiswa Baru 2027
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Pilih jalur seleksi yang paling sesuai dengan bakat akademik, prestasi lomba, atau nilai rapor Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Jalur 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wide">Bebas Tes</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Jalur Prestasi Akademik & Lomba</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Bagi peraih juara olimpiade sains, teknologi, seni, maupun olahraga minimal tingkat kota/kabupaten.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>&bull; Bebas Biaya Pendaftaran</p>
                  <p>&bull; Beasiswa Potongan Biaya Kuliah</p>
                </div>
              </div>
              <Link
                href="/pmb/daftar"
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Jalur 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-[#D4A017] uppercase tracking-wide">Seleksi Berkas</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Jalur Nilai Rapor & Portofolio</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Seleksi berdasarkan rata-rata nilai rapor semester 1 sampai 5 minimal 78.00 untuk program sarjana.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>&bull; Tanpa Tes Tulis</p>
                  <p>&bull; Hasil Seleksi Cepat (3 Hari)</p>
                </div>
              </div>
              <Link
                href="/pmb/daftar"
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Jalur 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <Laptop className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Tes Online</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Jalur Mandiri Online (CBT)</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Ujian seleksi berbasis komputer (TPA & Bahasa Inggris) yang dapat dikerjakan secara fleksibel dari rumah.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>&bull; Jadwal Tes Bebas Pilih</p>
                  <p>&bull; Hasil Skor Langsung Keluar</p>
                </div>
              </div>
              <Link
                href="/pmb/daftar"
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Jalur 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle hover:shadow-card hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wide">Beasiswa Penuh</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">KIP-K & Beasiswa Nusantara</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Bantuan pendidikan bebas biaya kuliah 8 semester dan tunjangan biaya hidup bulanan bagi siswa berprestasi.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>&bull; 100% Bebas Biaya SPP</p>
                  <p>&bull; Diberikan Hingga Lulus</p>
                </div>
              </div>
              <Link
                href="/pmb/daftar"
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </section>

        {/* 5 Langkah Alur Pendaftaran */}
        <section id="alur" className="bg-white py-16 sm:py-20 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Mudah & Transparan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                5 Langkah Mudah Menjadi Mahasiswa ITN
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { step: '01', title: 'Buat Akun PMB', desc: 'Isi formulir pendaftaran online dengan data diri dan program studi impian Anda.' },
                { step: '02', title: 'Unggah Berkas', desc: 'Upload file digital scan rapor, ijazah/SKL, dan sertifikat prestasi yang dimiliki.' },
                { step: '03', title: 'Verifikasi & Tes', desc: 'Verifikasi berkas atau ikuti ujian CBT online mandiri dari mana saja.' },
                { step: '04', title: 'Pengumuman', desc: 'Cek status kelulusan di portal PMB atau via notifikasi WhatsApp resmi.' },
                { step: '05', title: 'Registrasi Ulang', desc: 'Konfirmasi penerimaan, peroleh Nomor Induk Mahasiswa (NIM), dan masuk SIAKAD.' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 relative flex flex-col justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-[#D4A017]">{item.step}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CTA BANNER: DAFTAR & LOGIN AKUN PMB */}
        {/* ========================================================================= */}
        <section className="py-14 bg-gradient-to-r from-[#0A1128] via-[#1E3A8A] to-[#0A1128] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PENDAFTARAN ONLINE GELOMBANG 1 DIBUKA</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Siap Menjadi Bagian dari Sivitas Akademika ITN?
            </h2>

            <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
              Mulai langkah sukses Anda bersama ribuan mahasiswa ITN lainnya. Buat akun pendaftaran baru atau masuk ke akun portal Anda untuk memantau proses seleksi.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/pmb/daftar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Register Akun Calon Mahasiswa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/pmb/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all"
              >
                <LogIn className="w-4 h-4 text-[#D4A017]" />
                <span>Masuk ke Akun Calon Mahasiswa</span>
              </Link>
            </div>
          </div>
        </section>


        {/* Biaya Kuliah & UKT Section */}
        <section id="biaya" className="bg-white py-16 sm:py-20 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                Transparan & Terjangkau
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Estimasi Biaya Kuliah & Uang Kuliah Tunggal (UKT)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                ITN menerapkan sistem UKT berkeadilan tanpa pungutan liar uang gedung tersembunyi bagi jalur prestasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Fakultas Ilmu Komputer</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">Teknik Informatika & Sistem Informasi</h3>
                  <p className="text-2xl font-black text-[#1E3A8A] mt-3">Rp 4.850.000 <span className="text-xs font-normal text-slate-500">/ semester</span></p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bebas Biaya Laboratorium Komputasi</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sertifikasi Internasional Gratis</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Akses Cloud Computing AWS/GCP</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl p-6 border-2 border-[#1E3A8A] bg-blue-50/40 relative flex flex-col justify-between shadow-card">
                <div>
                  <div className="text-[11px] font-extrabold tracking-wider text-[#D4A017] uppercase mb-2">
                    Program Studi Pilihan Utama
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Fakultas Teknik</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">Elektro, Mesin, Sipil & Industri</h3>
                  <p className="text-2xl font-black text-[#1E3A8A] mt-3">Rp 4.950.000 <span className="text-xs font-normal text-slate-500">/ semester</span></p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bebas Biaya Workshop & Mesin</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fasilitas Keselamatan K3 Lengkap</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kerjasama Magang BUMN & Swasta</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Fakultas Ekonomi & Bisnis</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">Bisnis Digital, Akuntansi, Manajemen</h3>
                  <p className="text-2xl font-black text-[#1E3A8A] mt-3">Rp 4.250.000 <span className="text-xs font-normal text-slate-500">/ semester</span></p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Inkubator Startup & Modal Awal</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Program Exchange Luar Negeri</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mentoring Bersama Founder Bisnis</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ PMB */}
        <section id="faq" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">Informasi Penting</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Pertanyaan Umum Calon Mahasiswa (FAQ)</h2>
          </div>

          <div className="space-y-3.5">
            {[
              { q: 'Apakah lulusan SMK dapat mendaftar di program studi keteknikan ITN?', a: 'Sangat bisa. Lulusan SMK rumpun teknik maupun non-teknik memiliki peluang yang sama untuk diterima di seluruh prodi sarjana ITN dengan kurikulum matrikulasi dasar.' },
              { q: 'Bagaimana mekanisme ujian CBT online mandiri?', a: 'Ujian CBT diselenggarakan secara daring menggunakan sistem tes proctoring ITN. Anda dapat memilih waktu ujian fleksibel dalam rentang 3 hari setelah menyelesaikan pendaftaran online.' },
              { q: 'Apakah ada keringanan atau skema cicilan pembayaran UKT?', a: 'Ya, ITN menyediakan fasilitas cicilan biaya UKT 3 tahap per semester tanpa bunga tambahan yang dapat diajukan melalui Biro Keuangan Kampus.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle text-xs">
                <p className="font-bold text-slate-900 text-sm">{item.q}</p>
                <p className="text-slate-600 mt-1.5 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer PMB */}
      <footer className="bg-[#0F172A] text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] border border-[#D4A017] text-white flex items-center justify-center font-bold text-xs">
              ITN
            </div>
            <div>
              <p className="font-bold text-white text-sm">Panitia Penerimaan Mahasiswa Baru ITN</p>
              <p className="text-slate-400 text-[11px]">Gedung Rektorat Lt. 1, Jl. Nusantara Raya No. 101, Jakarta Selatan</p>
            </div>
          </div>
          <p className="text-slate-500 text-[11px]">
            &copy; 2026 Institut Teknologi Nusantara. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>

    </div>
  );
}
