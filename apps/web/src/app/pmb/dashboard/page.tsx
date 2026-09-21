'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Search,
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
  CreditCard,
  Upload,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Eye,
  Trash2,
  FileUp,
  Download,
  X,
} from 'lucide-react';
import {
  AdmissionApplicationItem,
  AdmissionBatchItem,
  AdmissionRegistrationTypeItem,
  AdmissionTrackItem,
  AdmissionClassItem,
  AdmissionPaymentItem,
} from '@siakad/types';

interface RegionItem {
  id: string;
  name: string;
  province_id?: string;
  regency_id?: string;
  district_id?: string;
}

interface SchoolSearchResult {
  id: string;
  npsn: string;
  name: string;
  rawName?: string;
  bentuk: string;
  status: string;
  province: string;
  regency: string;
  district: string;
  address?: string;
}

function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  const preserveUpper = new Set([
    'RT', 'RW', 'KTP', 'KK', 'SMA', 'SMK', 'MA', 'SMP', 'MTS', 'SD',
    'IPA', 'IPS', 'MIPA', 'D3', 'D4', 'S1', 'S2', 'S3', 'DKI', 'DI', 'DIY', 'RI',
    'PTN', 'PTS', 'NPSN', 'NIK', 'NISN', 'PNS', 'TNI', 'POLRI', 'BUMN', 'BUMD'
  ]);

  return str
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const cleanWord = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (preserveUpper.has(cleanWord)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * DEGREE_LEVEL_INFO: label UI dan flag perilaku per degreeLevel.
 * Ini adalah satu-satunya tempat konfigurasi front-end per jenjang.
 * Data degreeLevel itu sendiri DATANG DARI DATABASE (options.studyPrograms).
 * Tambahkan entry baru di sini jika kampus membuka jenjang baru (D2, Profesi, Sp1, dsb).
 */
const DEGREE_LEVEL_INFO: Record<string, {
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  kipEligible: boolean;    // apakah jenjang ini bisa daftar KIP-Kuliah
  showTrackClass: boolean; // apakah jenjang ini perlu pilih Jalur & Kelas
}> = {
  S1: {
    title: 'Sarjana (S1)',
    subtitle: 'Program Sarjana Strata 1',
    desc: 'Tersedia opsi Beasiswa KIP-Kuliah, Mahasiswa Baru / Transfer, serta Kelas Reguler & Karyawan.',
    badge: 'Reguler & KIP',
    kipEligible: true,
    showTrackClass: true,
  },
  D4: {
    title: 'Sarjana Terapan (D4)',
    subtitle: 'Program Diploma IV / Vokasi',
    desc: 'Program vokasi setara sarjana dengan fokus pada kompetensi terapan dan industri.',
    badge: 'Vokasi D4',
    kipEligible: true,
    showTrackClass: true,
  },
  D3: {
    title: 'Diploma (D3)',
    subtitle: 'Program Diploma III',
    desc: 'Program vokasi 3 tahun dengan kurikulum berorientasi keahlian terapan profesional.',
    badge: 'Vokasi D3',
    kipEligible: true,
    showTrackClass: false,
  },
  S2: {
    title: 'Pascasarjana Magister (S2)',
    subtitle: 'Program Pascasarjana Strata 2',
    desc: 'Program studi magister lanjutan untuk lulusan S1/D4 dengan kurikulum riset & profesional terpadu.',
    badge: 'Pascasarjana',
    kipEligible: false,
    showTrackClass: false,
  },
  S3: {
    title: 'Pascasarjana Doktoral (S3)',
    subtitle: 'Program Doktoral Strata 3',
    desc: 'Program riset akademik doktoral tertinggi untuk pengembangan ilmu, riset, dan kepakaran.',
    badge: 'Riset Doktoral',
    kipEligible: false,
    showTrackClass: false,
  },
};

/** Ambil info UI untuk degreeLevel. Kembalikan null jika tidak dikonfigurasi di DEGREE_LEVEL_INFO */
function getDegreeInfo(degreeLevel: string) {
  return DEGREE_LEVEL_INFO[degreeLevel] ?? null;
}

/** Component Portal untuk memindahkan Modal Overlay ke document.body agar tidak terkena clipping/margin space-y parent */
function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

/**
 * Helper kompresi dan konversi file berkas ke Base64 Data URL
 */
async function processDocumentFile(file: File): Promise<string> {
  // Jika tipe file gambar (JPG, PNG, WebP) -> kompres canvas agar ukuran ramah penyimpanan & cepat upload
  if (file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1600;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // Jika tipe file dokumen non-gambar (PDF, dll)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/** Helper Format Tanggal Indonesia (Contoh: 19 September 2026) */
function formatIndoDate(dateStr?: string | Date) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/** Lambang / Logo Resmi Institut Teknologi Nusantara (ITN) */
function UniversitySealLogo({ className = 'w-18 h-18' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lingkaran Luar Ganda Elegan */}
      <circle cx="60" cy="60" r="56" stroke="#1E3A8A" strokeWidth="3" fill="#F8FAFC" />
      <circle cx="60" cy="60" r="50" stroke="#D4A017" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="60" cy="60" r="46" stroke="#1E3A8A" strokeWidth="1" />

      {/* Teks Melingkar Institusi */}
      <path id="itnCirclePath" d="M 18,60 A 42,42 0 1,1 102,60 A 42,42 0 1,1 18,60" fill="none" />
      <text fill="#1E3A8A" fontSize="7" fontWeight="800" letterSpacing="1.2">
        <textPath href="#itnCirclePath" startOffset="50%" textAnchor="middle">
          INSTITUT TEKNOLOGI NUSANTARA
        </textPath>
      </text>

      {/* Perisai Utama */}
      <circle cx="60" cy="60" r="32" fill="#1E3A8A" />
      <polygon points="60,34 78,44 78,66 60,82 42,66 42,44" fill="#0F172A" stroke="#D4A017" strokeWidth="1.5" />

      {/* Buku Terbuka */}
      <path d="M50 63 C55 60 60 62 60 62 C60 62 65 60 70 63 L70 70 C65 67 60 69 60 69 C60 69 55 67 50 70 Z" fill="#FFFFFF" />
      <path d="M60 62 L60 69" stroke="#D4A017" strokeWidth="1" />

      {/* Obor / Api Ilmu Pengetahuan */}
      <path d="M58 55 C57 51 59 48 60 46 C61 48 63 51 62 55 C61 57 59 57 58 55 Z" fill="#F59E0B" />
      <ellipse cx="60" cy="55" rx="1.5" ry="3" fill="#EF4444" />

      {/* Monogram ITN */}
      <text x="60" y="78" textAnchor="middle" fill="#D4A017" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
        ITN
      </text>
    </svg>
  );
}

/** QR Code Validasi Dokumen (SVG Vector) */
function DocumentQrCode({ text, size = 68 }: { text: string; size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs">
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="white" />
          {/* Pojok Kiri Atas */}
          <rect x="6" y="6" width="26" height="26" stroke="#0F172A" strokeWidth="4" fill="none" />
          <rect x="13" y="13" width="12" height="12" fill="#1E3A8A" />
          {/* Pojok Kanan Atas */}
          <rect x="68" y="6" width="26" height="26" stroke="#0F172A" strokeWidth="4" fill="none" />
          <rect x="75" y="13" width="12" height="12" fill="#1E3A8A" />
          {/* Pojok Kiri Bawah */}
          <rect x="6" y="68" width="26" height="26" stroke="#0F172A" strokeWidth="4" fill="none" />
          <rect x="13" y="75" width="12" height="12" fill="#1E3A8A" />
          {/* Pola Data Titik */}
          <rect x="42" y="8" width="6" height="6" fill="#0F172A" />
          <rect x="52" y="8" width="6" height="6" fill="#0F172A" />
          <rect x="8" y="42" width="6" height="6" fill="#0F172A" />
          <rect x="8" y="52" width="6" height="6" fill="#0F172A" />
          <line x1="38" y1="18" x2="62" y2="18" stroke="#0F172A" strokeWidth="3" strokeDasharray="3 3" />
          <line x1="18" y1="38" x2="18" y2="62" stroke="#0F172A" strokeWidth="3" strokeDasharray="3 3" />
          <rect x="38" y="38" width="7" height="7" fill="#1E3A8A" />
          <rect x="54" y="38" width="6" height="6" fill="#0F172A" />
          <rect x="38" y="54" width="6" height="6" fill="#0F172A" />
          <rect x="62" y="52" width="7" height="7" fill="#1E3A8A" />
          <rect x="74" y="40" width="6" height="6" fill="#0F172A" />
          <rect x="84" y="48" width="6" height="6" fill="#0F172A" />
          <rect x="42" y="72" width="6" height="6" fill="#0F172A" />
          <rect x="54" y="68" width="6" height="6" fill="#1E3A8A" />
          <rect x="68" y="72" width="6" height="6" fill="#0F172A" />
          <rect x="80" y="80" width="8" height="8" fill="#1E3A8A" />
          <rect x="70" y="82" width="5" height="5" fill="#0F172A" />
          <rect x="44" y="84" width="6" height="6" fill="#0F172A" />
          {/* Logo Tengah ITN */}
          <rect x="43" y="43" width="14" height="14" fill="#D4A017" rx="2" />
          <text x="50" y="52" textAnchor="middle" fill="#1E3A8A" fontSize="6.5" fontWeight="900">
            ITN
          </text>
        </svg>
      </div>
      <span className="text-[8px] font-mono font-bold text-slate-500 mt-0.5 uppercase tracking-tighter">
        Validasi PMB
      </span>
    </div>
  );
}

/** Komponen Cetak Resmi Bukti Pendaftaran Mahasiswa Baru dengan Kop Surat */
function BuktiPendaftaranDocument({
  application,
  regPayment,
  isRegistrationPaid,
}: {
  application: any;
  regPayment?: any;
  isRegistrationPaid?: boolean;
}) {
  const printDate = formatIndoDate(new Date());
  const regDate = formatIndoDate(application?.createdAt);
  const regNumber = application?.registrationNumber || 'PMB-2027-000007';

  return (
    <div className="w-full bg-white text-slate-900 font-sans p-4 sm:p-5 text-[10px] leading-snug max-w-[210mm] mx-auto print:p-2 print:max-w-full">
      {/* 1. KOP SURAT RESMI */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b-0">
        <div className="w-16 shrink-0 flex items-center justify-center">
          <UniversitySealLogo className="w-16 h-16" />
        </div>
        <div className="flex-1 text-center px-1">
          <h4 className="text-[9px] sm:text-[10px] font-bold tracking-[0.18em] uppercase text-slate-700">
            YAYASAN PENDIDIKAN TINGGI TEKNOLOGI NUSANTARA
          </h4>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-[#1E3A8A] uppercase mt-0.5">
            INSTITUT TEKNOLOGI NUSANTARA
          </h1>
          <h2 className="text-[11px] sm:text-[11.5px] font-extrabold uppercase tracking-wide text-slate-900 mt-0.5">
            PANITIA PENERIMAAN MAHASISWA BARU (PMB) T.A. 2027/2028
          </h2>
          <p className="text-[8.5px] sm:text-[9px] text-slate-600 mt-0.5 leading-tight">
            Kampus Utama: Jl. Boulevard Teknologi No. 1, Menteng, Jakarta Pusat 10310 • Telp: (021) 7890-1234
          </p>
          <p className="text-[8px] sm:text-[8.5px] text-slate-500 leading-tight">
            Laman Resmi: https://pmb.siakadpremium.ac.id • Surel: pmb@itn.ac.id • WhatsApp PMB: 0812-7643-8553
          </p>
        </div>
        <div className="w-16 shrink-0 flex items-center justify-center">
          <DocumentQrCode text={regNumber} size={58} />
        </div>
      </div>

      {/* Garis Ganda Kop Surat Resmi */}
      <div className="border-t-[2.5px] border-[#1E3A8A] w-full mt-1"></div>
      <div className="border-t border-[#D4A017] w-full mt-[1px] mb-2.5"></div>

      {/* 2. JUDUL DOKUMEN & IDENTITAS REGISTRASI */}
      <div className="text-center mb-2">
        <h3 className="text-[13px] sm:text-sm font-black uppercase tracking-wider text-slate-900">
          KARTU TANDA BUKTI PENDAFTARAN
        </h3>
        <p className="text-[9px] sm:text-[9.5px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
          CALON MAHASISWA BARU TAHUN AKADEMIK 2027/2028
        </p>
        <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '4px' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '3px 18px',
              backgroundColor: '#f1f5f9',
              border: '1.5px solid #64748b',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.5px',
            }}
          >
            NOMOR REGISTRASI :{' '}
            <span style={{ color: '#1e3a8a', fontWeight: 900 }}>
              {regNumber}
            </span>
          </div>
        </div>
      </div>

      {/* 3. HERO DATA PENDAFTARAN & PAS FOTO */}
      <div className="border border-slate-300 rounded-md p-2 mb-2 bg-slate-50/60 flex flex-col sm:flex-row gap-3 items-center sm:items-start justify-between">
        <div className="flex-1 space-y-0.5 w-full text-[10px]">
          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-slate-200">
            <span className="col-span-4 font-semibold text-slate-600">Program Studi Pilihan</span>
            <span className="col-span-8 font-black text-slate-900 text-[11px] sm:text-xs">
              {application?.studyProgram?.name || '-'} ({application?.studyProgram?.degreeLevel || 'S1'})
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-slate-200">
            <span className="col-span-4 font-semibold text-slate-600">Fakultas</span>
            <span className="col-span-8 font-bold text-slate-800">
              {application?.studyProgram?.faculty?.name || 'Fakultas Ilmu Komputer & Desain'}
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-slate-200">
            <span className="col-span-4 font-semibold text-slate-600">Gelombang & Jalur</span>
            <span className="col-span-8 font-medium text-slate-800">
              {application?.wave?.name || 'Gelombang 1'} • {application?.track?.name || 'Jalur Reguler'}
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1 py-0.5 border-b border-slate-200">
            <span className="col-span-4 font-semibold text-slate-600">Jenis Kelas</span>
            <span className="col-span-8 font-medium text-slate-800">
              {application?.admissionClass?.name || 'Kelas Reguler'}
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1 py-0.5">
            <span className="col-span-4 font-semibold text-slate-600">Tanggal Pendaftaran</span>
            <span className="col-span-8 font-medium text-slate-800">{regDate}</span>
          </div>
        </div>

        {/* Pas Foto 3x4 */}
        <div className="w-20 h-28 shrink-0 border-2 border-slate-400 bg-slate-100 rounded-sm overflow-hidden flex flex-col items-center justify-center shadow-xs">
          {application?.fileFoto ? (
            <img
              src={application.fileFoto}
              alt="Pas Foto Calon Mahasiswa"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-1 text-slate-400">
              <User className="w-8 h-8 mx-auto mb-0.5 opacity-40 text-slate-500" />
              <span className="text-[8px] font-bold block uppercase leading-tight text-slate-500">
                Pas Foto<br />3 x 4
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. TABEL RINCIAN DATA PENDAFTAR */}
      <div className="space-y-1.5 mb-2">
        {/* BAGIAN I: DATA PRIBADI */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="bg-[#1E3A8A] text-white px-2.5 py-0.5 font-bold text-[9px] tracking-wider uppercase flex items-center justify-between">
            <span>I. DATA PRIBADI CALON MAHASISWA</span>
            <span className="text-[8px] font-normal text-blue-200">Sesuai KTP / KK Asli</span>
          </div>
          <table className="w-full text-[9.5px]">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-1/3 py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Nama Lengkap (Sesuai Ijazah)</td>
                <td className="py-0.5 px-2 font-black text-slate-900 uppercase">{application?.fullName || '-'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Nomor Induk Kependudukan (NIK)</td>
                <td className="py-0.5 px-2 font-mono font-bold text-slate-800">{application?.nik || '-'}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Tempat, Tanggal Lahir</td>
                <td className="py-0.5 px-2 text-slate-800">
                  {application?.birthPlace || '-'}, {formatIndoDate(application?.birthDate)}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Jenis Kelamin / Agama</td>
                <td className="py-0.5 px-2 text-slate-800">
                  {application?.gender || '-'} • {application?.religion || 'Islam'}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Nomor WhatsApp / Surel (Email)</td>
                <td className="py-0.5 px-2 text-slate-800">
                  {application?.phone || '-'} • {application?.email || '-'}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Alamat Lengkap Sesuai KTP</td>
                <td className="py-0.5 px-2 text-slate-800 leading-tight">{application?.address || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BAGIAN II: ASAL PENDIDIKAN & ORANG TUA (2 Kolom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* ASAL SEKOLAH */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-[#1E3A8A] text-white px-2.5 py-0.5 font-bold text-[9px] tracking-wider uppercase">
              II. ASAL SEKOLAH / PENDIDIKAN
            </div>
            <table className="w-full text-[9.5px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-2/5 py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Nama Sekolah</td>
                  <td className="py-0.5 px-2 font-bold text-slate-800">{application?.schoolName || '-'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">NPSN / NISN</td>
                  <td className="py-0.5 px-2 font-mono text-slate-800">
                    {application?.npsn || '-'} / {(application as any)?.nisn || '-'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Jurusan Asal</td>
                  <td className="py-0.5 px-2 text-slate-800">{application?.major || '-'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Tahun Kelulusan</td>
                  <td className="py-0.5 px-2 text-slate-800">{application?.graduationYear || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DATA ORANG TUA / WALI */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-[#1E3A8A] text-white px-2.5 py-0.5 font-bold text-[9px] tracking-wider uppercase">
              III. DATA ORANG TUA / WALI
            </div>
            <table className="w-full text-[9.5px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-2/5 py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Nama Ayah</td>
                  <td className="py-0.5 px-2 text-slate-800">
                    <span className="font-bold">
                      {(application as any)?.fatherName || application?.parentName || '-'}
                    </span>
                    {(application as any)?.fatherJob && (
                      <span className="text-[8.5px] text-slate-500 block">
                        {(application as any).fatherJob} • {(application as any).fatherIncome || '-'}
                      </span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Nama Ibu</td>
                  <td className="py-0.5 px-2 text-slate-800">
                    <span className="font-bold">{(application as any)?.motherName || '-'}</span>
                    {(application as any)?.motherJob && (
                      <span className="text-[8.5px] text-slate-500 block">
                        {(application as any).motherJob} • {(application as any).motherIncome || '-'}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Kontak Ortu</td>
                  <td className="py-0.5 px-2 text-slate-800">
                    {(application as any)?.fatherPhone ||
                      (application as any)?.motherPhone ||
                      application?.parentPhone ||
                      '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BAGIAN IV: STATUS KEUANGAN & BERKAS */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="bg-[#1E3A8A] text-white px-2.5 py-0.5 font-bold text-[9px] tracking-wider uppercase">
            IV. STATUS KEUANGAN REGISTRASI & VERIFIKASI BERKAS
          </div>
          <table className="w-full text-[9.5px]">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="w-1/4 py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Jalur Pembiayaan</td>
                <td className="w-1/4 py-0.5 px-2 font-bold text-slate-800">
                  {application?.isKip ? 'Program Beasiswa KIP-Kuliah' : 'Reguler Mandiri'}
                </td>
                <td className="w-1/4 py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Biaya Formulir Registrasi</td>
                <td className="w-1/4 py-0.5 px-2 font-bold text-slate-900">
                  {application?.isKip ? 'Rp 0 (Bebas Biaya KIP-K)' : `Rp ${(regPayment?.amount || 250000).toLocaleString('id-ID')}`}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Status Pembayaran</td>
                <td className="py-0.5 px-2">
                  {isRegistrationPaid || application?.isKip ? (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] border border-emerald-300">
                      ✓ LUNAS / TERVALIDASI
                    </span>
                  ) : regPayment?.status === 'VERIFYING' ? (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                      MENUNGGU VERIFIKASI
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-bold text-[9px] border border-red-300">
                      MENUNGGU PEMBAYARAN
                    </span>
                  )}
                </td>
                <td className="py-0.5 px-2 font-semibold text-slate-600 bg-slate-50">Status Berkas Persyaratan</td>
                <td className="py-0.5 px-2">
                  {application?.verificationStatus === 'VERIFIED' ? (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] border border-emerald-300">
                      ✓ BERKAS LENGKAP & VALID
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold text-[9px] border border-blue-200">
                      TERVERIFIKASI SISTEM PMB
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TANDA TANGAN PENDAFTAR */}
      <div className="flex justify-end mt-2 pt-0.5 text-[9.5px]">
        <div className="text-center w-56 flex flex-col justify-between h-20">
          <div>
            <p className="text-slate-600">
              {application?.birthPlace ? `${application.birthPlace}, ` : 'Jakarta, '}
              {printDate}
            </p>
            <p className="font-semibold text-slate-800">Calon Mahasiswa Baru / Pendaftar,</p>
          </div>
          <div>
            <p className="font-bold uppercase text-slate-900 border-b border-slate-400 inline-block px-6 pb-0.5">
              {application?.fullName || '...........................................'}
            </p>
            <p className="text-[8px] text-slate-500 mt-0.5">Tanda tangan & nama terang</p>
          </div>
        </div>
      </div>

      {/* 6. CATATAN & PETUNJUK RESMI */}
      <div className="mt-2 p-1.5 rounded border border-slate-300 bg-slate-50/80 text-[8px] text-slate-600 leading-snug">
        <span className="font-bold text-slate-800 block mb-0.5 uppercase tracking-wider">
          Petunjuk & Ketentuan Penting Bagi Calon Mahasiswa:
        </span>
        <ol className="list-decimal pl-3.5 space-y-0.2">
          <li>
            Lembar ini merupakan <strong>Tanda Bukti Pendaftaran Resmi</strong> Seleksi Penerimaan Mahasiswa Baru Institut Teknologi Nusantara (ITN) Tahun Akademik 2027/2028.
          </li>
          <li>
            Cetak dan simpan kartu bukti pendaftaran ini dengan baik. Dokumen ini wajib dilampirkan atau ditunjukkan saat verifikasi fisik berkas serta proses registrasi ulang.
          </li>
          <li>
            Pantau hasil seleksi kelulusan dan tahapan registrasi secara berkala melalui portal resmi di <strong>https://pmb.siakadpremium.ac.id</strong>.
          </li>
          <li>
            Layanan Bantuan & Informasi Resmi Helpdesk PMB: WhatsApp Hotline <strong>0812-7643-8553</strong> atau Surel <strong>pmb@itn.ac.id</strong>.
          </li>
        </ol>
      </div>

      {/* Watermark Catatan Cetak */}
      <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[7px] text-slate-400 font-mono">
        <span>DOKUMEN RESMI PMB ONLINE • INSTITUT TEKNOLOGI NUSANTARA (ITN)</span>
        <span>DICETAK: {new Date().toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}

interface DocumentUploadCardProps {
  label: string;
  sublabel: string;
  accept?: string;
  value?: string;
  required?: boolean;
  onChange: (val: string) => void;
  onPreview: (url: string, title: string) => void;
}

function DocumentUploadCard({
  label,
  sublabel,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  value,
  required = false,
  onChange,
  onPreview,
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await processDocumentFile(file);
      onChange(dataUrl);
    } catch (err) {
      console.error('Gagal memproses file:', err);
      setErrorMsg('Gagal memproses file. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isImage = value && (value.startsWith('data:image') || value.match(/\.(jpeg|jpg|png|webp)($|\?)/i));
  const isPdf = value && (value.startsWith('data:application/pdf') || value.match(/\.pdf($|\?)/i));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
            <span>Terlampir</span>
          </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {value ? (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            {isImage ? (
              <img
                src={value}
                alt={label}
                onClick={() => onPreview(value, label)}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-[#1E3A8A] transition-all"
                title="Klik untuk melihat pratinjau penuh"
              />
            ) : isPdf ? (
              <div
                onClick={() => onPreview(value, label)}
                className="w-12 h-12 rounded-lg bg-red-100 text-red-700 flex flex-col items-center justify-center shrink-0 border border-red-200 cursor-pointer hover:bg-red-200 transition-colors"
                title="Klik untuk membuka dokumen PDF"
              >
                <FileText className="w-5 h-5 text-red-600" />
                <span className="text-[9px] font-black uppercase tracking-wider">PDF</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0 border border-blue-200">
                <FileCheck className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {isImage ? 'Foto / Scan Dokumen' : isPdf ? 'Dokumen PDF Resmi' : 'Berkas Terunggah'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {sublabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onPreview(value, label)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Lihat Pratinjau Dokumen"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Lihat</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Ganti Berkas dengan Berkas Baru"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Ganti</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              title="Hapus Berkas Ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#1E3A8A] bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30'
          }`}
        >
          {isProcessing ? (
            <div className="py-2 flex flex-col items-center justify-center space-y-1.5">
              <RefreshCw className="w-6 h-6 text-[#1E3A8A] animate-spin" />
              <span className="text-xs font-bold text-slate-700">Mengoptimalkan dan memproses berkas...</span>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center mx-auto shadow-2xs">
                <FileUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] hover:underline">
                  Klik untuk pilih file
                </span>
                <span className="text-xs text-slate-500"> atau seret ke sini</span>
              </div>
              <p className="text-[11px] text-slate-400">{sublabel}</p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
}

export default function PmbDashboardPage() {
  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [application, setApplication] = useState<AdmissionApplicationItem | null>(null);

  // Wilayah Indonesia (Emsifa API) States
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [isManualVillage, setIsManualVillage] = useState(false);

  // School Autocomplete States
  const [schoolSuggestions, setSchoolSuggestions] = useState<SchoolSearchResult[]>([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const schoolSearchDebounce = useRef<any>(null);
  const prodiSectionRef = useRef<HTMLDivElement | null>(null);

  const [addressState, setAddressState] = useState({
    country: 'Indonesia',
    provinceId: '',
    provinceName: '',
    regencyId: '',
    regencyName: '',
    districtId: '',
    districtName: '',
    villageId: '',
    villageName: '',
    rtRw: '',
    postalCode: '',
    streetAddress: '',
  });

  // Master Options dari PostgreSQL
  const [options, setOptions] = useState<{
    waves: AdmissionBatchItem[];
    registrationTypes: AdmissionRegistrationTypeItem[];
    tracks: AdmissionTrackItem[];
    classes: AdmissionClassItem[];
    studyPrograms: Array<{
      id: string;
      code: string;
      name: string;
      degreeLevel: string;
      facultyName: string;
      accreditation?: string;
    }>;
  }>({
    waves: [],
    registrationTypes: [],
    tracks: [],
    classes: [],
    studyPrograms: [],
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const isProdiError = Boolean(wizardError && wizardError.toLowerCase().includes('program studi'));
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);

  // Upload Payment Proof modal/state
  const [selectedPayment, setSelectedPayment] = useState<AdmissionPaymentItem | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BNI');
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [portalLoginUrl, setPortalLoginUrl] = useState('http://portal.siakadpremium.ac.id/login');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setPortalLoginUrl('http://localhost:3002/login');
      } else if (hostname === 'siakadpremium.ac.id' || hostname.endsWith('.siakadpremium.ac.id')) {
        setPortalLoginUrl('http://portal.siakadpremium.ac.id/login');
      } else if (hostname === 'galihjp.com' || hostname.endsWith('.galihjp.com')) {
        setPortalLoginUrl('https://portal.galihjp.com/login');
      } else if (process.env.NEXT_PUBLIC_PORTAL_URL) {
        setPortalLoginUrl(`${process.env.NEXT_PUBLIC_PORTAL_URL}/login`);
      } else {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        setPortalLoginUrl(`${protocol}//portal.${rootDomain}/login`);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Fallback copy error:', err);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    const label = fieldName === 'nim' ? 'NIM / Username Login' : 'Password login';
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedField(fieldName);
          setTimeout(() => setCopiedField(null), 2000);
          showToast(`${label} (${text}) berhasil disalin ke clipboard!`);
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
          setCopiedField(fieldName);
          setTimeout(() => setCopiedField(null), 2000);
          showToast(`${label} (${text}) berhasil disalin ke clipboard!`);
        });
    } else {
      fallbackCopyTextToClipboard(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      showToast(`${label} (${text}) berhasil disalin ke clipboard!`);
    }
  };

  const formatStudentPassword = (birthDateInput?: string | Date | null): string => {
    if (!birthDateInput) return '17092005';
    try {
      const s = String(birthDateInput).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const parts = s.split('T')[0].split('-');
        return `${parts[2]}${parts[1]}${parts[0]}`;
      }
      if (/^\d{2}[-\/]\d{2}[-\/]\d{4}/.test(s)) {
        const parts = s.split(/[-\/]/);
        return `${parts[0]}${parts[1]}${parts[2]}`;
      }
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const d = parsed.getDate().toString().padStart(2, '0');
        const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
        const y = parsed.getFullYear().toString();
        return `${d}${m}${y}`;
      }
    } catch (err) {
      console.error(err);
    }
    return '17092005';
  };


  // Form State — selectedJenjang kosong ('') saat pertama load, user harus pilih sendiri
  const [selectedJenjang, setSelectedJenjang] = useState<string>('');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState({
    waveId: '',
    registrationTypeId: '',
    trackId: '',
    classId: '',
    studyProgramId: '',
    isKip: false,

    // Pribadi
    nik: '',
    fullName: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki',
    religion: 'Islam',
    phone: '',
    email: '',
    address: '',

    // Sekolah
    schoolName: '',
    npsn: '',
    nisn: '',
    graduationYear: '2026',
    major: 'IPA',

    // Ortu & Wali
    parentName: '',
    parentPhone: '',
    parentJob: 'Karyawan Swasta',
    parentIncome: 'Rp2.500.000 - Rp5.000.000',

    // Ayah & Ibu Lengkap
    fatherName: '',
    fatherPhone: '',
    fatherJob: 'Karyawan Swasta',
    fatherIncome: 'Rp2.500.000 - Rp5.000.000',
    motherName: '',
    motherPhone: '',
    motherJob: 'Ibu Rumah Tangga (IRT)',
    motherIncome: 'Tidak Berpenghasilan',

    // Dokumen
    fileKtp: '',
    fileKk: '',
    fileIjazah: '',
    fileFoto: '',
    fileKip: '',
    fileTambahan: '',

    statementAgreed: false,
  });

  // Load user session & fetch options + profile
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      let storedAccount: any = null;
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('pmb_account_session') || localStorage.getItem('pmb_applicant_session');
        if (raw) {
          storedAccount = JSON.parse(raw);
          setAccount(storedAccount);
        }
      }

      if (!storedAccount || !storedAccount.id || storedAccount.isEmailVerified === false) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pmb_account_session');
          localStorage.removeItem('pmb_account_token');
          localStorage.removeItem('pmb_applicant_session');
          localStorage.removeItem('pmb_applicant_token');
        }
        router.push('/pmb/daftar');
        return;
      }




      // Fetch options & profile in parallel
      const accountQuery = encodeURIComponent(storedAccount.id || storedAccount.email || '');
      const [optRes, meRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admissions/pmb/options`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/admissions/pmb/me?accountId=${accountQuery}`, { cache: 'no-store' }),
      ]);

      if (!meRes.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pmb_account_session');
          localStorage.removeItem('pmb_account_token');
          localStorage.removeItem('pmb_applicant_session');
          localStorage.removeItem('pmb_applicant_token');
        }
        router.push('/pmb/login');
        return;
      }

      if (optRes.ok) {
        const optJson = await optRes.json();
        const optData = optJson.data !== undefined ? optJson.data : optJson;
        setOptions(optData);

        // Pre-select default wave, registrationType, track, class
        if (optData.waves && optData.waves.length > 0) {
          const defaultWave = optData.waves.find((w: any) => w.isDefault) || optData.waves[0];
          setFormData((prev) => ({
            ...prev,
            waveId: prev.waveId || defaultWave.id,
          }));
        }
        if (optData.registrationTypes && optData.registrationTypes.length > 0) {
          const defaultReg = optData.registrationTypes.find((r: any) => !r.isKip) || optData.registrationTypes[0];
          setFormData((prev) => ({
            ...prev,
            registrationTypeId: prev.registrationTypeId || defaultReg.id,
            isKip: prev.registrationTypeId ? prev.isKip : defaultReg.isKip,
          }));
        }
        if (optData.tracks && optData.tracks.length > 0) {
          setFormData((prev) => ({
            ...prev,
            trackId: prev.trackId || optData.tracks[0].id,
          }));
        }
        if (optData.classes && optData.classes.length > 0) {
          setFormData((prev) => ({
            ...prev,
            classId: prev.classId || optData.classes[0].id,
          }));
        }
      }

      if (meRes.ok) {
        const meJson = await meRes.json();
        const meData = meJson.data !== undefined ? meJson.data : meJson;
        if (meData.account) {
          setAccount(meData.account);
        }
        if (meData.application) {
          setApplication(meData.application);
          // Prepopulate form data with existing application
          const app = meData.application;
          setFormData((prev) => ({
            ...prev,
            waveId: app.waveId || prev.waveId,
            registrationTypeId: app.registrationTypeId || prev.registrationTypeId,
            trackId: app.trackId || prev.trackId,
            classId: app.classId || prev.classId,
            studyProgramId: app.studyProgramId || prev.studyProgramId,
            isKip: app.isKip ?? false,
            nik: app.nik || '',
            fullName: app.fullName || storedAccount.fullName || '',
            birthPlace: app.birthPlace || '',
            birthDate: app.birthDate || '',
            gender: app.gender || 'Laki-laki',
            religion: app.religion || 'Islam',
            phone: app.phone || storedAccount.whatsapp || '',
            email: app.email || storedAccount.email || '',
            address: app.address || '',
            schoolName: app.schoolName || '',
            npsn: app.npsn || '',
            nisn: app.nisn || '',
            graduationYear: app.graduationYear || '2026',
            major: app.major || 'IPA',
            parentName: app.parentName || '',
            parentPhone: app.parentPhone || '',
            parentJob: app.parentJob || '',
            parentIncome: app.parentIncome || 'Rp2.500.000 - Rp5.000.000',
            fatherName: (app as any).fatherName || app.parentName || '',
            fatherPhone: (app as any).fatherPhone || app.parentPhone || '',
            fatherJob: (app as any).fatherJob || app.parentJob || 'Karyawan Swasta',
            fatherIncome: (app as any).fatherIncome || app.parentIncome || 'Rp2.500.000 - Rp5.000.000',
            motherName: (app as any).motherName || '',
            motherPhone: (app as any).motherPhone || '',
            motherJob: (app as any).motherJob || 'Ibu Rumah Tangga (IRT)',
            motherIncome: (app as any).motherIncome || 'Tidak Berpenghasilan',
            fileKtp: app.fileKtp || '',
            fileKk: app.fileKk || '',
            fileIjazah: app.fileIjazah || '',
            fileFoto: app.fileFoto || '',
            fileKip: (app as any).fileKip || app.fileTambahan || '',
            fileTambahan: app.fileTambahan || '',
            statementAgreed: true,
          }));

          // Set jenjang berdasarkan degreeLevel prodi langsung dari database
          if (app.studyProgram?.degreeLevel) {
            setSelectedJenjang(app.studyProgram.degreeLevel);
          }

          if ((app as any).streetAddress || (app as any).province || (app as any).city) {
            setAddressState((prev) => ({
              ...prev,
              streetAddress: (app as any).streetAddress || prev.streetAddress,
              rtRw: (app as any).rtRw || prev.rtRw,
              villageName: (app as any).kelurahan || prev.villageName,
              districtName: (app as any).kecamatan || prev.districtName,
              regencyName: (app as any).city || prev.regencyName,
              provinceName: (app as any).province || prev.provinceName,
              postalCode: (app as any).postalCode || prev.postalCode,
            }));
          }
        } else {
          // Initialize with account defaults
          setFormData((prev) => ({
            ...prev,
            fullName: storedAccount.fullName || '',
            email: storedAccount.email || '',
            phone: storedAccount.whatsapp || storedAccount.phone || '',
          }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching PMB dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);




  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const accountRaw = localStorage.getItem('pmb_account_session') || localStorage.getItem('pmb_applicant_session');
      if (accountRaw) {
        try {
          const acc = JSON.parse(accountRaw);
          localStorage.removeItem(`pmb_address_state_${acc.id || acc.email}`);
        } catch {}
      }
      localStorage.removeItem('pmb_account_session');
      localStorage.removeItem('pmb_account_token');
      localStorage.removeItem('pmb_applicant_session');
      localStorage.removeItem('pmb_applicant_token');
    }
    router.push('/pmb/login');
  };


  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      if (typeof window === 'undefined') return;

      // 1. Pastikan html2pdf sudah dimuat ke window
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[src="/js/html2pdf.bundle.min.js"]');
          if (existing) {
            if ((window as any).html2pdf) {
              resolve();
              return;
            }
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Gagal memuat pustaka PDF')));
            return;
          }
          const script = document.createElement('script');
          script.src = '/js/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Gagal memuat pustaka PDF'));
          document.head.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;
      const element = document.getElementById('bukti-pendaftaran-document-card');
      if (!element) throw new Error('Elemen dokumen cetak tidak ditemukan');

      const cleanReg = application?.registrationNumber
        ? application.registrationNumber.replace(/[^a-zA-Z0-9-_]/g, '_')
        : 'PMB_ITN';

      const opt = {
        margin: [4, 6, 4, 6],
        filename: `Bukti_Pendaftaran_${cleanReg}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      console.error('Download PDF error:', err);
      // Fallback ke browser print
      if (typeof window !== 'undefined') {
        window.print();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Preload html2pdf library agar download langsung instan saat tombol diklik
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).html2pdf) return;
    const existing = document.querySelector('script[src="/js/html2pdf.bundle.min.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = '/js/html2pdf.bundle.min.js';
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Gelombang otomatis sesuai jenjang yang dipilih (prioritas status OPEN > default > first)
  const activeWave = useMemo(() => {
    if (!selectedJenjang) return null; // belum ada jenjang dipilih
    const matchingWaves = options.waves.filter((w) => (w.jenjang || 'S1') === selectedJenjang);
    return (
      matchingWaves.find((w: any) => w.status === 'OPEN' || w.isActive) ||
      matchingWaves.find((w: any) => w.isDefault) ||
      matchingWaves[0] ||
      null
    );
  }, [options.waves, selectedJenjang]);

  // Validasi apakah gelombang pendaftaran saat ini benar-benar dibuka dan aktif
  const isWaveOpen = useMemo(() => {
    if (!selectedJenjang || !activeWave) return false;

    // Status batch di database harus 'OPEN'
    if (activeWave.status && activeWave.status !== 'OPEN') return false;

    // Validasi periode tanggal pendaftaran
    if (activeWave.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(activeWave.startDate);
      if (!isNaN(start.getTime()) && today < start) {
        return false;
      }
    }

    if (activeWave.endDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const end = new Date(activeWave.endDate);
      if (!isNaN(end.getTime()) && today > end) {
        return false;
      }
    }

    return true;
  }, [selectedJenjang, activeWave]);

  // Otomatis sinkronkan waveId ke gelombang aktif (hanya jika jenjang sudah dipilih)
  useEffect(() => {
    if (!selectedJenjang) return;
    if (activeWave && (!formData.waveId || !options.waves.some((w) => w.id === formData.waveId && (w.jenjang || 'S1') === selectedJenjang))) {
      setFormData((prev) => ({ ...prev, waveId: activeWave.id }));
    }
  }, [activeWave, selectedJenjang, options.waves, formData.waveId]);

  // 1. Fetch Provinces from Emsifa API Wilayah
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setProvinces(data);
        }
      } catch (err) {
        console.warn('Gagal memuat provinsi dari API wilayah:', err);
      } finally {
        setLoadingProvinces(false);
      }
    }
    loadProvinces();
  }, []);

  // Sync Province Selection when provinceName exists but provinceId is empty
  useEffect(() => {
    if (!addressState.provinceName || provinces.length === 0 || addressState.provinceId) return;
    const currentProvUpper = addressState.provinceName.toUpperCase().trim();
    const match = provinces.find(
      (p) => p.name === currentProvUpper || p.name.includes(currentProvUpper) || currentProvUpper.includes(p.name)
    );
    if (match) {
      setAddressState((prev) => ({ ...prev, provinceId: match.id, provinceName: toTitleCase(match.name) }));
    }
  }, [addressState.provinceName, provinces, addressState.provinceId]);

  // 2. Fetch Regencies / Kota-Kabupaten when provinceId changes
  useEffect(() => {
    if (!addressState.provinceId) {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      return;
    }

    async function loadRegencies() {
      setLoadingRegencies(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${addressState.provinceId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setRegencies(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kabupaten/kota:', err);
      } finally {
        setLoadingRegencies(false);
      }
    }
    loadRegencies();
  }, [addressState.provinceId]);

  // Sync Regency Selection when regencyName exists but regencyId is empty
  useEffect(() => {
    if (!addressState.regencyName || regencies.length === 0 || addressState.regencyId) return;
    const currentCityUpper = addressState.regencyName.toUpperCase().trim();
    const match = regencies.find(
      (r) => r.name === currentCityUpper || r.name.includes(currentCityUpper) || currentCityUpper.includes(r.name)
    );
    if (match) {
      setAddressState((prev) => ({ ...prev, regencyId: match.id, regencyName: toTitleCase(match.name) }));
    }
  }, [addressState.regencyName, regencies, addressState.regencyId]);

  // 3. Fetch Districts / Kecamatan when regencyId changes
  useEffect(() => {
    if (!addressState.regencyId) {
      setDistricts([]);
      setVillages([]);
      return;
    }

    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${addressState.regencyId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setDistricts(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kecamatan:', err);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [addressState.regencyId]);

  // Sync District Selection when districtName exists but districtId is empty
  useEffect(() => {
    if (!addressState.districtName || districts.length === 0 || addressState.districtId) return;
    const currentKecUpper = addressState.districtName.toUpperCase().trim();
    const match = districts.find(
      (d) => d.name === currentKecUpper || d.name.includes(currentKecUpper) || currentKecUpper.includes(d.name)
    );
    if (match) {
      setAddressState((prev) => ({ ...prev, districtId: match.id, districtName: toTitleCase(match.name) }));
    }
  }, [addressState.districtName, districts, addressState.districtId]);

  // 4. Fetch Villages / Kelurahan when districtId changes
  useEffect(() => {
    setIsManualVillage(false);
    if (!addressState.districtId) {
      setVillages([]);
      return;
    }

    async function loadVillages() {
      setLoadingVillages(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${addressState.districtId}.json`
        );
        if (res.ok) {
          let data: RegionItem[] = await res.json();
          // Patch Desa Bener di Kec. Majenang (Cilacap - ID 3301030) jika terlewat dari data API publik
          if (addressState.districtId === '3301030' || addressState.districtName?.toUpperCase().includes('MAJENANG')) {
            if (!data.some((v) => v.name?.toUpperCase() === 'BENER')) {
              data.push({
                id: '3301030012',
                district_id: addressState.districtId,
                name: 'BENER',
              });
              data.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
          setVillages(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kelurahan:', err);
      } finally {
        setLoadingVillages(false);
      }
    }
    loadVillages();
  }, [addressState.districtId, addressState.districtName]);

  // Sync Village Selection when villageName exists but villageId is empty
  useEffect(() => {
    if (!addressState.villageName || villages.length === 0 || addressState.villageId) return;
    const currentVilUpper = addressState.villageName.toUpperCase().trim();
    const match = villages.find(
      (v) => v.name === currentVilUpper || v.name.includes(currentVilUpper) || currentVilUpper.includes(v.name)
    );
    if (match) {
      setAddressState((prev) => ({ ...prev, villageId: match.id, villageName: toTitleCase(match.name) }));
    }
  }, [addressState.villageName, villages, addressState.villageId]);

  // 5. Automatically compose standardized full address into formData.address
  useEffect(() => {
    const parts: string[] = [];
    if (addressState.streetAddress.trim()) parts.push(toTitleCase(addressState.streetAddress.trim()));
    if (addressState.rtRw.trim()) parts.push(`RT/RW: ${addressState.rtRw.trim().toUpperCase()}`);
    if (addressState.villageName) parts.push(`Kel./Desa ${toTitleCase(addressState.villageName)}`);
    if (addressState.districtName) parts.push(`Kec. ${toTitleCase(addressState.districtName)}`);
    if (addressState.regencyName) parts.push(toTitleCase(addressState.regencyName));
    if (addressState.provinceName) parts.push(`Prov. ${toTitleCase(addressState.provinceName)}`);
    if (addressState.postalCode.trim()) parts.push(`Kode Pos ${addressState.postalCode.trim()}`);
    if (addressState.country && addressState.country.trim() !== 'Indonesia') parts.push(toTitleCase(addressState.country.trim()));

    if (parts.length > 0) {
      setFormData((prev) => ({ ...prev, address: parts.join(', ') }));
    }
  }, [addressState]);

  // Jenjang yang tersedia diambil dari unique degreeLevel prodi di database
  // Hanya tampilkan yang ada entry-nya di DEGREE_LEVEL_INFO (tidak ada fallback hardcode)
  const availableJenjang = useMemo(() => {
    const ORDER = ['S1', 'D4', 'D3', 'S2', 'S3'];
    const fromDB = Array.from(new Set(options.studyPrograms.map((p) => p.degreeLevel).filter(Boolean)));
    // Hanya masukkan degreeLevel yang dikenal (ada di DEGREE_LEVEL_INFO)
    const known = fromDB.filter((dl) => dl in DEGREE_LEVEL_INFO);
    return known.sort((a, b) => {
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [options.studyPrograms]);

  // Filter prodi sesuai jenjang yang dipilih — langsung match degreeLevel dari DB
  const filteredStudyPrograms = useMemo(() => {
    if (!selectedJenjang) return [];
    return options.studyPrograms.filter((p) => p.degreeLevel === selectedJenjang);
  }, [options.studyPrograms, selectedJenjang]);

  // Kelompokkan prodi berdasarkan fakultas untuk jenjang yang dipilih
  const availableFaculties = useMemo(() => {
    const map = new Map<string, typeof filteredStudyPrograms>();
    filteredStudyPrograms.forEach((p) => {
      const facName = (p.facultyName || 'Fakultas Umum').trim();
      if (!map.has(facName)) {
        map.set(facName, []);
      }
      map.get(facName)!.push(p);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, prodis]) => ({
        name,
        count: prodis.length,
        prodis,
        hasSelected: prodis.some((p) => p.id === formData.studyProgramId),
      }));
  }, [filteredStudyPrograms, formData.studyProgramId]);

  // Group prodi per fakultas sesuai filter aktif
  const groupedStudyPrograms = useMemo(() => {
    if (selectedFacultyFilter === 'ALL') {
      return availableFaculties;
    }
    return availableFaculties.filter((f) => f.name === selectedFacultyFilter);
  }, [availableFaculties, selectedFacultyFilter]);

  // Handler pergantian jenjang kuliah
  const handleSelectJenjang = (j: string) => {
    setSelectedJenjang(j);
    setSelectedFacultyFilter('ALL');

    // Ambil gelombang aktif untuk jenjang baru
    const matchingWaves = options.waves.filter((w) => (w.jenjang || 'S1') === j);
    const active =
      matchingWaves.find((w: any) => w.status === 'OPEN' || w.isActive) ||
      matchingWaves.find((w: any) => w.isDefault) ||
      matchingWaves[0];
    const nextWaveId = active?.id || '';

    // Ambil prodi yang cocok dengan jenjang baru — langsung filter degreeLevel
    const matchingProdis = options.studyPrograms.filter((p) => p.degreeLevel === j);
    const curProdiValid = matchingProdis.some((p) => p.id === formData.studyProgramId);
    const nextProdiId = curProdiValid ? formData.studyProgramId : '';

    const info = getDegreeInfo(j);
    setFormData((prev) => ({
      ...prev,
      waveId: nextWaveId,
      studyProgramId: nextProdiId,
      isKip: info?.kipEligible ? prev.isKip : false,
      trackId: prev.trackId || (options.tracks[0]?.id || ''),
      classId: prev.classId || (options.classes[0]?.id || ''),
    }));
  };

  // Step Validation
  const handleNextStep = () => {
    setWizardError(null);
    if (currentStep === 1) {
      if (!isWaveOpen) {
        if (!activeWave) {
          setWizardError(`Belum ada gelombang pendaftaran aktif untuk jenjang ${selectedJenjang}. Pendaftaran tidak dapat dilanjutkan.`);
        } else {
          setWizardError(`Gelombang "${activeWave.name}" untuk jenjang ${selectedJenjang} saat ini belum dibuka / sudah berakhir. Pendaftaran hanya dapat dilakukan pada periode yang telah ditentukan.`);
        }
        return;
      }
      const effectiveWaveId = formData.waveId || activeWave?.id;
      if (!effectiveWaveId || !activeWave) {
        setWizardError(`Belum ada gelombang pendaftaran aktif untuk jenjang ${selectedJenjang}. Silakan hubungi panitia PMB.`);
        return;
      }
      if (getDegreeInfo(selectedJenjang).showTrackClass && !formData.trackId) {
        setWizardError('Silakan pilih salah satu Jalur Mahasiswa.');
        return;
      }
      if (!formData.studyProgramId) {
        setWizardError('Silakan pilih salah satu Program Studi yang Anda minati di bawah ini.');
        setTimeout(() => {
          prodiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }
      // Pastikan waveId, trackId dan classId terisi
      setFormData((prev) => ({
        ...prev,
        waveId: effectiveWaveId,
        trackId: prev.trackId || (options.tracks[0]?.id || ''),
        classId: prev.classId || (options.classes[0]?.id || ''),
      }));
    } else if (currentStep === 2) {
      if (!formData.fullName.trim()) {
        setWizardError('Nama Lengkap wajib diisi.');
        return;
      }
      if (!formData.nik.trim()) {
        setWizardError('Nomor Induk Kependudukan (NIK) 16 digit wajib diisi.');
        return;
      }
      if (!formData.phone.trim()) {
        setWizardError('Nomor WhatsApp aktif wajib diisi.');
        return;
      }
      if (!addressState.provinceName && !formData.address.trim()) {
        setWizardError('Silakan pilih Provinsi tempat tinggal Anda.');
        return;
      }
      if (!addressState.regencyName && !formData.address.trim()) {
        setWizardError('Silakan pilih Kota / Kabupaten tempat tinggal Anda.');
        return;
      }
      if (!addressState.streetAddress.trim() && !formData.address.trim()) {
        setWizardError('Alamat Jalan / No. Rumah domisili wajib diisi.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        fullName: toTitleCase(prev.fullName),
        birthPlace: toTitleCase(prev.birthPlace),
      }));
      setAddressState((prev) => ({
        ...prev,
        streetAddress: toTitleCase(prev.streetAddress),
        villageName: toTitleCase(prev.villageName),
      }));
    } else if (currentStep === 3) {
      if (!formData.schoolName.trim()) {
        setWizardError('Nama Asal Sekolah / Kampus wajib diisi.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        schoolName: toTitleCase(prev.schoolName),
        major: prev.major ? toTitleCase(prev.major) : prev.major,
      }));
    } else if (currentStep === 4) {
      if (!formData.fatherName.trim()) {
        setWizardError('Nama Lengkap Ayah wajib diisi.');
        return;
      }
      if (!formData.motherName.trim()) {
        setWizardError('Nama Lengkap Ibu wajib diisi.');
        return;
      }
      const primaryName = formData.parentName.trim() || formData.fatherName.trim() || formData.motherName.trim();
      const primaryPhone = formData.parentPhone.trim() || formData.fatherPhone.trim() || formData.motherPhone.trim();
      setFormData((prev) => ({
        ...prev,
        parentName: toTitleCase(primaryName),
        parentPhone: primaryPhone,
        parentJob: prev.parentJob || prev.fatherJob,
        parentIncome: prev.parentIncome || prev.fatherIncome,
        fatherName: toTitleCase(prev.fatherName),
        motherName: toTitleCase(prev.motherName),
      }));
    }

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setWizardError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Helper sanitasi kapitalisasi huruf pertama otomatis (Title Case)
  const sanitizeFormTitleCase = (data: typeof formData) => ({
    ...data,
    fullName: toTitleCase(data.fullName),
    birthPlace: toTitleCase(data.birthPlace),
    address: toTitleCase(data.address),
    schoolName: toTitleCase(data.schoolName),
    major: data.major ? toTitleCase(data.major) : data.major,
    parentName: toTitleCase(data.parentName) || toTitleCase(data.fatherName) || toTitleCase(data.motherName),
    parentJob: toTitleCase(data.parentJob) || toTitleCase(data.fatherJob),
    fatherName: toTitleCase(data.fatherName),
    motherName: toTitleCase(data.motherName),
  });

  const handleSchoolNameChange = (val: string) => {
    setFormData((p) => ({ ...p, schoolName: val }));
    setShowSchoolDropdown(true);

    if (schoolSearchDebounce.current) {
      clearTimeout(schoolSearchDebounce.current);
    }

    if (val.trim().length >= 3) {
      setIsSearchingSchool(true);
      schoolSearchDebounce.current = setTimeout(async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/admissions/pmb/schools?search=${encodeURIComponent(val.trim())}`);
          if (res.ok) {
            const json = await res.json();
            const list = json.data !== undefined ? json.data : json;
            if (Array.isArray(list)) {
              setSchoolSuggestions(list);
            }
          }
        } catch (err) {
          console.warn('Gagal mencari sekolah:', err);
        } finally {
          setIsSearchingSchool(false);
        }
      }, 350);
    } else {
      setSchoolSuggestions([]);
      setIsSearchingSchool(false);
    }
  };

  const handleSelectSchool = (item: SchoolSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      schoolName: toTitleCase(item.name || item.rawName || ''),
      npsn: item.npsn || prev.npsn,
    }));
    setShowSchoolDropdown(false);
  };

  // 1. Simpan Draf Formulir
  const handleSaveDraft = async () => {
    if (!account) return;
    setIsSaving(true);
    setWizardError(null);
    setSuccessNotice(null);

    const sanitized = sanitizeFormTitleCase(formData);
    setFormData(sanitized);

    try {
      const { statementAgreed, ...draftFields } = sanitized;
      const payload = {
        ...draftFields,
        accountId: account.id,
        email: sanitized.email || account?.email || '',
        isKip: getDegreeInfo(selectedJenjang).kipEligible ? sanitized.isKip : false,
        trackId: sanitized.trackId || (options.tracks[0]?.id || ''),
        classId: sanitized.classId || (options.classes[0]?.id || ''),
        streetAddress: addressState.streetAddress,
        rtRw: addressState.rtRw,
        kelurahan: addressState.villageName,
        kecamatan: addressState.districtName,
        city: addressState.regencyName,
        province: addressState.provinceName,
        postalCode: addressState.postalCode,
      };

      const accountQuery = encodeURIComponent(account.id || account.email || '');
      const res = await fetch(`${apiBaseUrl}/admissions/pmb/draft?accountId=${accountQuery}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || (!json?.success && !json?.data?.success)) {
        throw new Error(json?.message || 'Gagal menyimpan draf pendaftaran.');
      }

      const resData = json.data !== undefined ? json.data : json;
      if (resData?.account) {
        setAccount(resData.account);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pmb_account_session', JSON.stringify(resData.account));
        }
      }
      if (resData?.application) {
        setApplication(resData.application);
      }

      setSuccessNotice('Draf formulir pendaftaran berhasil disimpan! Anda dapat melanjutkannya sewaktu-waktu.');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setWizardError(err.message || 'Terjadi gangguan saat menyimpan draf.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Submit & Finalisasi Formulir Pendaftaran
  const handleSubmitApplication = async () => {
    if (!formData.statementAgreed) {
      setWizardError('Harap centang persetujuan kebenaran berkas pendaftaran.');
      return;
    }

    if (!account) return;
    setIsSaving(true);
    setWizardError(null);

    const sanitized = sanitizeFormTitleCase(formData);
    setFormData(sanitized);

    try {
      const { statementAgreed, ...submitFields } = sanitized;
      const payload = {
        ...submitFields,
        accountId: account.id,
        statementAgreed: true,
        email: sanitized.email || account?.email || '',
        isKip: getDegreeInfo(selectedJenjang).kipEligible ? sanitized.isKip : false,
        trackId: sanitized.trackId || (options.tracks[0]?.id || ''),
        classId: sanitized.classId || (options.classes[0]?.id || ''),
        streetAddress: addressState.streetAddress,
        rtRw: addressState.rtRw,
        kelurahan: addressState.villageName,
        kecamatan: addressState.districtName,
        city: addressState.regencyName,
        province: addressState.provinceName,
        postalCode: addressState.postalCode,
      };

      const accountQuery = encodeURIComponent(account.id || account.email || '');
      const res = await fetch(`${apiBaseUrl}/admissions/pmb/submit?accountId=${accountQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || (!json?.success && !json?.data?.success)) {
        throw new Error(json?.message || 'Gagal mengirim pendaftaran.');
      }

      const resData = json.data !== undefined ? json.data : json;
      if (resData?.account) {
        setAccount(resData.account);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pmb_account_session', JSON.stringify(resData.account));
        }
      }
      setApplication(resData.application || resData);
      setIsEditingSubmitted(false);
      setSuccessNotice('Pendaftaran berhasil dikirim! Silakan selesaikan pembayaran biaya registrasi.');
    } catch (err: any) {
      setWizardError(err.message || 'Terjadi kesalahan saat finalisasi formulir.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Konfirmasi Upload Bukti Pembayaran
  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    setIsUploadingPayment(true);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/pmb/payments/${selectedPayment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          proofUrl: proofUrl || 'bukti-transfer-valid.png',
          notes: 'Konfirmasi bukti transfer dari portal pendaftar',
        }),
      });

      const json = await res.json();
      if (!res.ok || (!json?.success && !json?.data?.success)) {
        throw new Error(json?.message || 'Gagal mengunggah bukti bayar.');
      }

      setSelectedPayment(null);
      setProofUrl('');
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-700">
        <div className="flex items-center gap-3 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 rounded-full border-2 border-[#1E3A8A] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-800">Memuat Portal Pendaftar PMB...</span>
        </div>
      </div>
    );
  }

  // Cek apakah pendaftaran sudah di-submit
  const isSubmitted = application?.formStatus === 'SUBMITTED' && !isEditingSubmitted;

  // Payments lookup
  const regPayment = application?.payments?.find((p) => p.type === 'REGISTRATION');
  const reRegPayment = application?.payments?.find((p) => p.type === 'RE_REGISTRATION');

  const isRegistrationPaid = regPayment?.status === 'PAID';
  const isReRegistrationPaid = reRegPayment?.status === 'PAID';
  const isPassed = application?.selectionStatus === 'PASSED';
  const isConvertedStudent = Boolean(application?.studentId && application?.nim);

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
              <span className="text-xs font-bold text-white block">{account?.fullName || 'Calon Mahasiswa'}</span>
              <span className="text-[11px] text-amber-300 font-mono font-semibold">
                {application?.registrationNumber || 'Draf Pendaftaran'}
              </span>
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:hidden">
        {/* Success Alert Notice */}
        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="flex-1">{successNotice}</span>
          </div>
        )}

        {/* Error Notice jika sudah submit (halaman status pendaftaran) */}
        {isSubmitted && wizardError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs font-semibold shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="flex-1">{wizardError}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAMPILAN 1: JIKA SUDAH DISUBMIT (DASHBOARD PROGRESS PMB)          */}
        {/* ================================================================= */}
        {isSubmitted ? (
          <div className="space-y-6">
            {/* Status Hero Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#1E3A8A] bg-blue-50/90 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {application.wave?.name || 'Gelombang 1'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/80">
                      {application.track?.name || 'Jalur Reguler'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/80">
                      {application.admissionClass?.name || 'Kelas Reguler'}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Pendaftaran: {application.fullName}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nomor Pendaftaran: <span className="font-mono font-bold text-[#1E3A8A]">{application.registrationNumber}</span> | Program Studi:{' '}
                    <span className="font-bold text-slate-800">{application.studyProgram?.name || '-'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                    title="Pratinjau & Cetak Kartu Tanda Bukti Pendaftaran Resmi"
                  >
                    <Printer className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Cetak Bukti Pendaftaran</span>
                  </button>
                  <button
                    onClick={() => setIsEditingSubmitted(true)}
                    className="px-3.5 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Perbarui Berkas</span>
                  </button>
                </div>
              </div>

              {/* Progress Stepper Tracking PMB */}
              <div className="pt-6">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
                  Tahapan Seleksi & Registrasi PMB
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Step 1: Formulir Terkirim */}
                  <div className="p-3.5 rounded-xl border bg-emerald-50/70 border-emerald-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-emerald-800">1. Formulir</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-extrabold text-emerald-900 block">Terkirim</span>
                    <span className="text-[10px] text-emerald-700 font-mono mt-0.5">{application.registrationNumber}</span>
                  </div>

                  {/* Step 2: Pembayaran Registrasi */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isRegistrationPaid
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : regPayment?.status === 'VERIFYING'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">2. Biaya Registrasi</span>
                      {isRegistrationPaid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        isRegistrationPaid ? 'text-emerald-900' : regPayment?.status === 'VERIFYING' ? 'text-amber-800' : 'text-red-800'
                      }`}
                    >
                      {isRegistrationPaid ? 'Lunas' : regPayment?.status === 'VERIFYING' ? 'Menunggu Verifikasi' : 'Menunggu Pembayaran'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Rp{(regPayment?.amount || 250000).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Step 3: Verifikasi Berkas */}
                  {(() => {
                    const isDocVerified =
                      application.verificationStatus === 'VERIFIED' ||
                      isPassed ||
                      application.selectionStatus === 'PASSED' ||
                      !!application.studentId;

                    return (
                      <div
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          isDocVerified
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : application.verificationStatus === 'REJECTED'
                            ? 'bg-red-50/70 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-700">3. Berkas Dokumen</span>
                          {isDocVerified ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : application.verificationStatus === 'REJECTED' ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-extrabold block ${
                            isDocVerified
                              ? 'text-emerald-900'
                              : application.verificationStatus === 'REJECTED'
                              ? 'text-red-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {isDocVerified
                            ? 'Terverifikasi'
                            : application.verificationStatus === 'REJECTED'
                            ? 'Ditolak / Perbaikan'
                            : 'Menunggu Verifikasi'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          {isDocVerified ? 'Berkas Valid' : 'Panitia PMB'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Step 4: Hasil Seleksi */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isPassed
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : application.selectionStatus === 'FAILED'
                        ? 'bg-red-50/70 border-red-200'
                        : application.selectionStatus === 'RESERVE'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">4. Seleksi & Kelulusan</span>
                      {isPassed ? (
                        <Award className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        isPassed
                          ? 'text-emerald-900'
                          : application.selectionStatus === 'FAILED'
                          ? 'text-red-800'
                          : application.selectionStatus === 'RESERVE'
                          ? 'text-amber-800'
                          : 'text-slate-700'
                      }`}
                    >
                      {isPassed
                        ? 'Dinyatakan LULUS'
                        : application.selectionStatus === 'FAILED'
                        ? 'Tidak Lulus'
                        : application.selectionStatus === 'RESERVE'
                        ? 'Cadangan'
                        : 'Proses Seleksi'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {isPassed ? 'Lolos Administrasi' : 'Verifikasi Berkas'}
                    </span>
                  </div>

                  {/* Step 5: Daftar Ulang & NIM */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isConvertedStudent
                        ? 'bg-blue-50/70 border-blue-200'
                        : isReRegistrationPaid
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-700">5. Mahasiswa Resmi</span>
                      {isConvertedStudent ? (
                        <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold block ${
                        isConvertedStudent ? 'text-[#1E3A8A]' : isReRegistrationPaid ? 'text-emerald-800' : 'text-slate-600'
                      }`}
                    >
                      {isConvertedStudent ? 'NIM Resmi Terbit' : isReRegistrationPaid ? 'Daftar Ulang Lunas' : 'Menunggu Pelunasan'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {application.nim || 'Pasca Kelulusan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BANNER 1: Mahasiswa Resmi (Dikonversi & Lunas Daftar Ulang) */}
            {(isConvertedStudent || isReRegistrationPaid) && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Selamat! Pembayaran Daftar Ulang Lunas
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Anda resmi terdaftar sebagai mahasiswa baru {application.studyProgram?.name || 'ITN'}. Berikut kredensial portal akademik Anda:
                    </p>
                  </div>

                  <a
                    href={portalLoginUrl}
                    className="px-4 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Masuk Portal Student</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

                <div className="p-5 bg-slate-50/70 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. NIM / Username */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">NIM / Username Login</span>
                      <span className="text-base font-mono font-bold text-slate-900">{application.nim || '270010016'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(application.nim || '270010016', 'nim')}
                      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                    >
                      <span>{copiedField === 'nim' ? 'Tersalin' : 'Salin'}</span>
                      <Check className={`w-3.5 h-3.5 ${copiedField === 'nim' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </button>
                  </div>

                  {/* 2. Password Login */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        Password Login <span className="text-slate-400 font-normal">(Tanggal Lahir DDMMYYYY)</span>
                      </span>
                      <span className="text-base font-mono font-bold text-slate-900">
                        {formatStudentPassword(application.birthDate)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(formatStudentPassword(application.birthDate), 'password')}
                      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                    >
                      <span>{copiedField === 'password' ? 'Tersalin' : 'Salin'}</span>
                      <Check className={`w-3.5 h-3.5 ${copiedField === 'password' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BANNER 2: Tagihan Biaya Registrasi (Belum Lunas) */}
            {!isRegistrationPaid && regPayment && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Tagihan Biaya Registrasi: Rp{regPayment.amount.toLocaleString('id-ID')}
                    </span>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Silakan lakukan pembayaran biaya registrasi awal ke Virtual Account BNI ITN:{' '}
                      <span className="font-mono font-bold text-slate-900">8802 0812 7643 8553</span> a.n. ITN Penerimaan Mahasiswa Baru.
                    </p>
                    {regPayment.status === 'VERIFYING' && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        Bukti bayar telah dikirim, menunggu verifikasi bagian keuangan.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPayment(regPayment)}
                  className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{regPayment.status === 'VERIFYING' ? 'Ganti Bukti Bayar' : 'Konfirmasi Pembayaran'}</span>
                </button>
              </div>
            )}

            {/* ACTION BANNER 3: Berkas Ditolak */}
            {application.verificationStatus === 'REJECTED' && (
              <div className="p-5 bg-red-50 border border-red-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-red-900 block">
                      Berkas Pendaftaran Memerlukan Perbaikan
                    </span>
                    <p className="text-xs text-red-700 mt-0.5">
                      Catatan Verifikator: {application.verificationNote || 'Harap periksa kembali berkas dokumen Anda.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingSubmitted(true)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Perbaiki Dokumen Sekarang</span>
                </button>
              </div>
            )}

            {/* ACTION BANNER 4: Lulus Seleksi & Tagihan Daftar Ulang */}
            {isPassed && reRegPayment && !isReRegistrationPaid && (
              <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wide">
                      Tahap Akhir: Pembayaran Biaya Daftar Ulang
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Total Biaya Daftar Ulang: Rp{reRegPayment.amount.toLocaleString('id-ID')}
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 max-w-xl">
                      Selamat atas kelulusan Anda! Segera selesaikan pelunasan daftar ulang untuk penerbitan Nomor Induk Mahasiswa (NIM) resmi dan pembuatan akun portal akademik Anda.
                    </p>
                    {reRegPayment.status === 'VERIFYING' && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        Bukti bayar daftar ulang sedang diverifikasi oleh staf keuangan.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPayment(reRegPayment)}
                  className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{reRegPayment.status === 'VERIFYING' ? 'Ganti Bukti Daftar Ulang' : 'Bayar Daftar Ulang'}</span>
                </button>
              </div>
            )}

            {/* Detail Ringkasan Formulir Terdaftar */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1E3A8A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Rincian Data Formulir Calon Mahasiswa
                  </span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Data Kependudukan & Kontak</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NIK:</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-800">{application.nik || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <span className="col-span-2 font-bold text-slate-900">{application.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tempat, Tgl Lahir:</span>
                    <span className="col-span-2 text-slate-800">
                      {application.birthPlace || '-'}, {application.birthDate || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Jenis Kelamin:</span>
                    <span className="col-span-2 text-slate-800">{application.gender || '-'}</span>
                  </div>
                  {(application as any).province && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Provinsi:</span>
                      <span className="col-span-2 text-slate-800 font-medium">{(application as any).province}</span>
                    </div>
                  )}
                  {(application as any).city && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Kota / Kab:</span>
                      <span className="col-span-2 text-slate-800 font-medium">{(application as any).city}</span>
                    </div>
                  )}
                  {(application as any).kecamatan && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Kecamatan:</span>
                      <span className="col-span-2 text-slate-800">{(application as any).kecamatan}</span>
                    </div>
                  )}
                  {(application as any).kelurahan && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">Kelurahan:</span>
                      <span className="col-span-2 text-slate-800">{(application as any).kelurahan}</span>
                    </div>
                  )}
                  {((application as any).rtRw || (application as any).postalCode) && (
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-slate-500">RT/RW / Pos:</span>
                      <span className="col-span-2 text-slate-800">
                        {[
                          (application as any).rtRw ? `RT/RW ${(application as any).rtRw}` : '',
                          (application as any).postalCode ? `Kode Pos ${(application as any).postalCode}` : '',
                        ].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Alamat Jalan:</span>
                    <span className="col-span-2 text-slate-800 leading-relaxed">{(application as any).streetAddress || application.address || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">WhatsApp:</span>
                    <span className="col-span-2 text-slate-800">{application.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Email:</span>
                    <span className="col-span-2 text-slate-800">{application.email}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pendidikan & Orang Tua</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Asal Sekolah:</span>
                    <span className="col-span-2 font-bold text-slate-900">{application.schoolName || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NPSN / Jurusan:</span>
                    <span className="col-span-2 text-slate-800">
                      {application.npsn || '-'} / {application.major || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">NISN:</span>
                    <span className="col-span-2 font-mono font-semibold text-slate-800">{(application as any).nisn || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Tahun Lulus:</span>
                    <span className="col-span-2 text-slate-800">{application.graduationYear || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Ayah:</span>
                    <span className="col-span-2 text-slate-800">
                      {(application as any).fatherName || application.parentName || '-'}
                      {(application as any).fatherJob && ` (${(application as any).fatherJob} • ${(application as any).fatherIncome || '-'})`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Ibu:</span>
                    <span className="col-span-2 text-slate-800">
                      {(application as any).motherName || '-'}
                      {(application as any).motherJob && ` (${(application as any).motherJob} • ${(application as any).motherIncome || '-'})`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Kontak Ortu:</span>
                    <span className="col-span-2 text-slate-800">
                      {(application as any).fatherPhone || (application as any).motherPhone || application.parentPhone || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">KIP-Kuliah:</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      {application.isKip ? 'Ya (Mengajukan KIP-K)' : 'Tidak (Reguler Mandiri)'}
                    </span>
                  </div>
                </div>

                {/* Berkas Dokumen Persyaratan */}
                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Berkas Dokumen Persyaratan</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">Klik untuk melihat pratinjau</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { title: 'KTP Calon Mahasiswa', file: application.fileKtp, label: 'KTP' },
                      { title: 'Kartu Keluarga (KK)', file: application.fileKk, label: 'Kartu Keluarga' },
                      { title: 'Ijazah / SKL / Rapor', file: application.fileIjazah, label: 'Ijazah / SKL' },
                      { title: 'Pas Foto Resmi', file: application.fileFoto, label: 'Pas Foto' },
                      ...(application.isKip || (application as any).fileKip || application.fileTambahan
                        ? [{ title: 'Foto Kartu KIP-Kuliah', file: (application as any).fileKip || application.fileTambahan, label: 'Kartu KIP' }]
                        : []),
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                          doc.file
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400'
                        }`}
                      >
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 block truncate">{doc.label}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{doc.title}</span>
                        </div>
                        {doc.file ? (
                          <button
                            type="button"
                            onClick={() => setPreviewModal({ url: doc.file!, title: `Dokumen ${doc.title}` })}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-300 hover:bg-blue-50 hover:text-[#1E3A8A] text-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3 text-blue-600" />
                            <span>Lihat Berkas</span>
                          </button>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Belum diunggah</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* TAMPILAN 2: FORMULIR PENDAFTARAN WIZARD (DRAFT & SUBMIT)           */
          /* ================================================================= */
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Header Form */}
            <div className="bg-[#1E3A8A] text-white p-6 sm:p-8 border-b border-blue-950">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                    <span>FORMULIR PENDAFTARAN MAHASISWA BARU</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Lengkapi Data Pendaftaran Anda
                  </h1>
                  <p className="text-xs text-blue-200 mt-1">
                    Calon Mahasiswa: <strong className="text-white">{account?.fullName}</strong> ({account?.email})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Draf'}</span>
                  </button>
                  {application?.formStatus === 'SUBMITTED' && (
                    <button
                      onClick={() => setIsEditingSubmitted(false)}
                      className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="grid grid-cols-5 gap-2 mt-8">
                {[
                  { step: 1, title: 'Pilihan', desc: 'Jenjang & Prodi' },
                  { step: 2, title: 'Data Diri', desc: 'NIK & Biodata' },
                  { step: 3, title: 'Sekolah', desc: 'Asal Sekolah' },
                  { step: 4, title: 'Orang Tua', desc: 'Data Ayah & Ibu' },
                  { step: 5, title: 'Finalisasi', desc: 'Kirim Berkas' },
                  ].map((item) => (
                  <button
                    key={item.step}
                    onClick={() => {
                      // Hanya boleh navigate ke step yang sudah pernah dicapai (backward navigation)
                      // Maju hanya bisa lewat tombol Lanjutkan agar validasi berjalan
                      if (item.step < currentStep) {
                        setWizardError(null);
                        setCurrentStep(item.step);
                      }
                    }}
                    disabled={item.step > currentStep}
                    className={`text-left p-2.5 rounded-lg transition-all border ${
                      currentStep === item.step
                        ? 'bg-white text-[#1E3A8A] border-white shadow-xs'
                        : item.step < currentStep
                        ? 'bg-blue-900/60 text-emerald-300 border-blue-800 cursor-pointer hover:bg-blue-800/80'
                        : 'bg-blue-900/30 text-blue-300/50 border-transparent cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-black">0{item.step}</span>
                      {item.step < currentStep && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.step > currentStep && <span className="text-[9px] opacity-70">🔒</span>}
                    </div>
                    <span className="text-[11px] font-bold block truncate">{item.title}</span>
                    <span className="text-[9px] opacity-80 block truncate hidden md:block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8">
              {/* STEP 1: PILIHAN PENDAFTARAN */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* 1. PILIH JENJANG PENDIDIKAN DULU */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          1. Pilih Jenjang Pendidikan
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Pilih jenjang studi yang ingin Anda tempuh untuk menyesuaikan formulir pendaftaran
                        </span>
                      </div>
                      {selectedJenjang && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          Jenjang Terpilih: {selectedJenjang}
                        </span>
                      )}
                    </div>

                    <div className={`grid grid-cols-1 gap-3 ${
                        availableJenjang.length <= 2 ? 'md:grid-cols-2' :
                        availableJenjang.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
                      }`}>
                      {availableJenjang.map((jenjang) => {
                        const info = getDegreeInfo(jenjang);
                        // Skip jika degreeLevel tidak dikenal di DEGREE_LEVEL_INFO
                        if (!info) return null;
                        const isSelected = selectedJenjang === jenjang;
                        return (
                          <button
                            key={jenjang}
                            type="button"
                            onClick={() => handleSelectJenjang(jenjang)}
                            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#1E3A8A] bg-blue-50/60 shadow-xs ring-1 ring-[#1E3A8A]/30'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-black ${isSelected ? 'text-[#1E3A8A]' : 'text-slate-900'}`}>
                                  {info.title}
                                </span>
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                                {info.subtitle}
                              </span>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{info.desc}</p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400">Jenjang {jenjang}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {info.badge}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* GELOMBANG PENDAFTARAN AKTIF (OTOMATIS) — hanya tampil jika jenjang sudah dipilih */}
                  {selectedJenjang && <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Gelombang Pendaftaran Aktif ({selectedJenjang})
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Otomatis diterapkan oleh sistem sesuai jenjang yang Anda pilih
                      </span>
                    </div>

                    {activeWave ? (
                      <div
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                          isWaveOpen
                            ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-blue-200/80'
                            : 'bg-gradient-to-r from-amber-50/80 to-orange-50/60 border-amber-200/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                              isWaveOpen ? 'bg-[#1E3A8A]' : 'bg-amber-600'
                            }`}
                          >
                            <Calendar className="w-5 h-5 text-white/90" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900">{activeWave.name}</span>
                              {isWaveOpen ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  Gelombang Aktif
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Belum Dibuka
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">
                              Periode Pendaftaran: <strong className="text-slate-800">{activeWave.startDate}</strong> s.d.{' '}
                              <strong className="text-slate-800">{activeWave.endDate}</strong>
                            </p>
                            {!isWaveOpen && (
                              <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Pendaftaran gelombang ini belum dibuka. Tombol lanjutkan dinonaktifkan.</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0 text-xs">
                          <div className="bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Biaya Registrasi</span>
                            <span className="font-extrabold text-sm text-[#1E3A8A]">
                              Rp{(activeWave.registrationFee ?? 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Biaya Daftar Ulang</span>
                            <span className="font-extrabold text-sm text-emerald-700">
                              Rp{(activeWave.reRegistrationFee ?? 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Belum ada gelombang pendaftaran aktif untuk jenjang {selectedJenjang}. Silakan hubungi admin PMB.</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 shrink-0 self-start sm:self-center">
                          Pendaftaran Ditutup
                        </span>
                      </div>
                    )}
                  </div>}

                  {/* 3. CONDITIONAL FIELDS: JENIS PENDAFTARAN, JENIS MAHASISWA & KELAS KULIAH */}
                  {/* Ditampilkan hanya untuk jenjang dengan showTrackClass: true di DEGREE_LEVEL_INFO */}
                  {getDegreeInfo(selectedJenjang)?.showTrackClass ? (
                    <>
                      {/* Jenis Pendaftaran & Jenis Mahasiswa */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 3a. JENIS PENDAFTARAN */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Jenis Pendaftaran
                          </label>
                          <div className="space-y-2">
                            {options.registrationTypes && options.registrationTypes.length > 0 ? (
                              options.registrationTypes.map((rt) => {
                                const isSelected =
                                  formData.registrationTypeId === rt.id ||
                                  (!formData.registrationTypeId && (rt.isKip ? formData.isKip : !formData.isKip));

                                return (
                                  <label
                                    key={rt.id}
                                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs ring-1 ring-[#1E3A8A]/30'
                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name="jenisPendaftaran"
                                        value={rt.id}
                                        checked={isSelected}
                                        onChange={() =>
                                          setFormData((p) => ({
                                            ...p,
                                            registrationTypeId: rt.id,
                                            isKip: rt.isKip,
                                          }))
                                        }
                                        className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-900 block">{rt.name}</span>
                                          {rt.badge && (
                                            <span
                                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                rt.isKip
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-blue-100 text-[#1E3A8A]'
                                              }`}
                                            >
                                              {rt.badge}
                                            </span>
                                          )}
                                        </div>
                                        {rt.description && (
                                          <span className="text-[11px] text-slate-500 block mt-0.5">
                                            {rt.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })
                            ) : (
                              <>
                                <label
                                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    !formData.isKip
                                      ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="jenisPendaftaran"
                                      checked={!formData.isKip}
                                      onChange={() => setFormData((p) => ({ ...p, isKip: false }))}
                                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                    />
                                    <div>
                                      <span className="text-xs font-bold text-slate-900 block">NON-KIP (Reguler Mandiri)</span>
                                      <span className="text-[11px] text-slate-500 block">Pendaftaran umum dengan pembiayaan mandiri</span>
                                    </div>
                                  </div>
                                </label>

                                <label
                                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    formData.isKip
                                      ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="jenisPendaftaran"
                                      checked={formData.isKip}
                                      onChange={() => setFormData((p) => ({ ...p, isKip: true }))}
                                      className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900 block">KIP-Kuliah (Beasiswa)</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Beasiswa Penuh</span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">Bagi pemegang nomor KIP / kartu bantuan pendidikan</span>
                                    </div>
                                  </div>
                                </label>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 3b. JENIS MAHASISWA: REGULER vs TRANSFER */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Jenis Mahasiswa
                          </label>
                          <div className="space-y-2">
                            {options.tracks.map((t) => (
                              <label
                                key={t.id}
                                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  formData.trackId === t.id
                                    ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="trackId"
                                    value={t.id}
                                    checked={formData.trackId === t.id}
                                    onChange={(e) => setFormData((p) => ({ ...p, trackId: e.target.value }))}
                                    className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 block">{t.name}</span>
                                    {t.description && <span className="text-[11px] text-slate-500 block">{t.description}</span>}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3c. PILIHAN KELAS KULIAH */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Pilihan Kelas Kuliah
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {options.classes.map((c) => (
                            <label
                              key={c.id}
                              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                formData.classId === c.id
                                  ? 'border-[#1E3A8A] bg-blue-50/50 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="classId"
                                  value={c.id}
                                  checked={formData.classId === c.id}
                                  onChange={(e) => setFormData((p) => ({ ...p, classId: e.target.value }))}
                                  className="text-[#1E3A8A] focus:ring-[#1E3A8A]"
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                                  {c.description && <span className="text-[11px] text-slate-500 block">{c.description}</span>}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* NOTIFIKASI KHUSUS S2 / S3: Tidak ada KIP, jenis mahasiswa & kelas */
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">
                          Jalur Masuk Reguler Pascasarjana ({selectedJenjang})
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Pendaftaran program {selectedJenjang === 'S2' ? 'Magister (S2)' : 'Doktoral (S3)'} diproses secara reguler akademik mandiri tanpa seleksi beasiswa KIP-Kuliah dan tanpa pembagian kelas kuliah. Anda dapat langsung memilih Program Studi tujuan Anda di bawah.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. PROGRAM STUDI DARI MASTER AKADEMIK */}
                  <div
                    ref={prodiSectionRef}
                    id="prodi-selection-section"
                    className={`pt-4 border-t transition-all duration-300 ${
                      isProdiError
                        ? 'border-red-400 bg-red-50/20 p-3.5 sm:p-4 rounded-2xl ring-2 ring-red-400/70 shadow-sm'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Inline alert ketika prodi belum dipilih */}
                    {isProdiError && (
                      <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-300 flex items-center justify-between gap-2 text-red-800 text-xs font-bold shadow-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Silakan pilih salah satu Program Studi di bawah ini untuk melanjutkan.</span>
                        </div>
                        <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0">
                          Wajib Dipilih
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          3. Pilih Program Studi ({selectedJenjang}) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Data disinkronkan langsung dari Master Data Akademik Kampus ({filteredStudyPrograms.length} program studi tersedia dalam {availableFaculties.length} fakultas)
                        </span>
                      </div>
                    </div>

                    {/* Filter Tab Berdasarkan Fakultas */}
                    {availableFaculties.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <button
                          type="button"
                          onClick={() => setSelectedFacultyFilter('ALL')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedFacultyFilter === 'ALL'
                              ? 'bg-[#1E3A8A] text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span>Semua Fakultas</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              selectedFacultyFilter === 'ALL'
                                ? 'bg-white/20 text-white'
                                : 'bg-white text-slate-600'
                            }`}
                          >
                            {filteredStudyPrograms.length}
                          </span>
                        </button>
                        {availableFaculties.map((fac) => {
                          const isCurrent = selectedFacultyFilter === fac.name;
                          return (
                            <button
                              key={fac.name}
                              type="button"
                              onClick={() => setSelectedFacultyFilter(fac.name)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              <span>{fac.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isCurrent ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                                }`}
                              >
                                {fac.count}
                              </span>
                              {fac.hasSelected && (
                                <span
                                  className="w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white"
                                  title="Pilihan Anda berada di fakultas ini"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {filteredStudyPrograms.length > 0 ? (
                      <div className="space-y-4">
                        {groupedStudyPrograms.map((fac) => (
                          <div
                            key={fac.name}
                            className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-3.5 sm:p-4 transition-all"
                          >
                            {/* Header Grup Fakultas */}
                            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0">
                                  <Building className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="font-extrabold text-xs text-slate-800 tracking-tight uppercase">
                                  {fac.name}
                                </h4>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                                {fac.count} Program Studi
                              </span>
                            </div>

                            {/* Grid Program Studi */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {fac.prodis.map((p) => {
                                const isSelected = formData.studyProgramId === p.id;
                                return (
                                  <label
                                    key={p.id}
                                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer block ${
                                      isSelected
                                        ? 'border-[#1E3A8A] bg-blue-50/60 shadow-xs ring-1 ring-[#1E3A8A]/20'
                                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="studyProgramId"
                                      value={p.id}
                                      checked={isSelected}
                                      onChange={(e) => {
                                        setWizardError(null);
                                        setFormData((prev) => ({ ...prev, studyProgramId: e.target.value }));
                                      }}
                                      className="sr-only"
                                    />
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-extrabold text-xs text-slate-900 leading-snug">
                                        {p.name}
                                      </span>
                                      <span
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                          isSelected
                                            ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                                            : 'border-slate-300 bg-white'
                                        }`}
                                      >
                                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                      <span className="font-medium text-slate-600">{p.facultyName}</span>
                                      <span>•</span>
                                      <span className="font-semibold text-amber-700">
                                        Akreditasi: {p.accreditation || 'Unggul'}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Tidak ada program studi yang ditemukan untuk jenjang {selectedJenjang}.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: DATA KEPENDUDUKAN & PRIBADI */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="16 digit sesuai KTP/KK"
                        value={formData.nik}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '');
                          let autoBirthDate = '';
                          let autoGender = '';
                          if (clean.length === 16) {
                            let day = parseInt(clean.slice(6, 8), 10);
                            const month = parseInt(clean.slice(8, 10), 10);
                            const year = parseInt(clean.slice(10, 12), 10);
                            if (day > 40) {
                              day -= 40;
                              autoGender = 'Perempuan';
                            } else {
                              autoGender = 'Laki-laki';
                            }
                            const currentYearLast2 = new Date().getFullYear() % 100;
                            const fullYear = year <= currentYearLast2 ? 2000 + year : 1900 + year;
                            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                              autoBirthDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            }
                          }
                          setFormData((p) => ({
                            ...p,
                            nik: clean,
                            birthDate: (!p.birthDate && autoBirthDate) ? autoBirthDate : p.birthDate,
                            gender: autoGender || p.gender,
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Sesuai Ijazah <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, fullName: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Kota / Kabupaten"
                        value={formData.birthPlace}
                        onChange={(e) => setFormData((p) => ({ ...p, birthPlace: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, birthPlace: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                      <select
                        value={formData.religion}
                        onChange={(e) => setFormData((p) => ({ ...p, religion: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Kristen Protestan">Kristen Protestan</option>
                        <option value="Katolik">Katolik</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option>
                        <option value="Konghucu">Konghucu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kewarganegaraan / Negara Asal <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addressState.country}
                        onChange={(e) => setAddressState((prev) => ({ ...prev, country: e.target.value }))}
                        placeholder="Indonesia"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>

                  {/* ALAMAT DOMISILI STANDAR KEMENDAGRI (API WILAYAH INDONESIA) */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Alamat Domisili Sesuai KTP / KK <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Pilih wilayah administrasi resmi (Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200">
                        Standar Kemendagri RI
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Provinsi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Provinsi <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={addressState.provinceId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const prov = provinces.find((p) => p.id === id);
                            setAddressState((prev) => ({
                              ...prev,
                              provinceId: id,
                              provinceName: prov ? toTitleCase(prov.name) : '',
                              regencyId: '',
                              regencyName: '',
                              districtId: '',
                              districtName: '',
                              villageId: '',
                              villageName: '',
                            }));
                          }}
                          disabled={loadingProvinces}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer"
                        >
                          <option value="">{loadingProvinces ? 'Memuat daftar provinsi...' : '-- Pilih Provinsi --'}</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>
                              {toTitleCase(p.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Kota / Kabupaten */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kota / Kabupaten <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={addressState.regencyId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const reg = regencies.find((r) => r.id === id);
                            setAddressState((prev) => ({
                              ...prev,
                              regencyId: id,
                              regencyName: reg ? toTitleCase(reg.name) : '',
                              districtId: '',
                              districtName: '',
                              villageId: '',
                              villageName: '',
                            }));
                          }}
                          disabled={!addressState.provinceId || loadingRegencies}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!addressState.provinceId
                              ? '-- Pilih Provinsi Terlebih Dahulu --'
                              : loadingRegencies
                              ? 'Memuat data kabupaten/kota...'
                              : '-- Pilih Kota / Kabupaten --'}
                          </option>
                          {regencies.map((r) => (
                            <option key={r.id} value={r.id}>
                              {toTitleCase(r.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Kecamatan */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kecamatan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={addressState.districtId}
                          onChange={(e) => {
                            const id = e.target.value;
                            const dist = districts.find((d) => d.id === id);
                            setAddressState((prev) => ({
                              ...prev,
                              districtId: id,
                              districtName: dist ? toTitleCase(dist.name) : '',
                              villageId: '',
                              villageName: '',
                            }));
                          }}
                          disabled={!addressState.regencyId || loadingDistricts}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!addressState.regencyId
                              ? '-- Pilih Kota/Kabupaten Dulu --'
                              : loadingDistricts
                              ? 'Memuat data kecamatan...'
                              : '-- Pilih Kecamatan --'}
                          </option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {toTitleCase(d.name)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Kelurahan / Desa */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Kelurahan / Desa <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !isManualVillage;
                              setIsManualVillage(next);
                              if (next) {
                                setAddressState((prev) => ({ ...prev, villageId: 'MANUAL', villageName: '' }));
                              } else {
                                setAddressState((prev) => ({ ...prev, villageId: '', villageName: '' }));
                              }
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {isManualVillage ? '← Pilih dari Daftar' : '+ Tidak ada di daftar? Ketik Manual'}
                          </button>
                        </div>

                        {isManualVillage ? (
                          <input
                            type="text"
                            placeholder="Ketik nama Kelurahan / Desa Anda..."
                            value={addressState.villageName}
                            onChange={(e) =>
                              setAddressState((prev) => ({
                                ...prev,
                                villageId: 'MANUAL',
                                villageName: e.target.value,
                              }))
                            }
                            onBlur={(e) =>
                              setAddressState((prev) => ({
                                ...prev,
                                villageName: toTitleCase(e.target.value),
                              }))
                            }
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-blue-50/20 font-semibold"
                          />
                        ) : (
                          <select
                            value={addressState.villageId}
                            onChange={(e) => {
                              const id = e.target.value;
                              if (id === '__MANUAL__') {
                                setIsManualVillage(true);
                                setAddressState((prev) => ({ ...prev, villageId: 'MANUAL', villageName: '' }));
                                return;
                              }
                              const vil = villages.find((v) => v.id === id);
                              setAddressState((prev) => ({
                                ...prev,
                                villageId: id,
                                villageName: vil ? toTitleCase(vil.name) : '',
                              }));
                            }}
                            disabled={!addressState.districtId || loadingVillages}
                            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {!addressState.districtId
                                ? '-- Pilih Kecamatan Dulu --'
                                : loadingVillages
                                ? 'Memuat data kelurahan/desa...'
                                : '-- Pilih Kelurahan / Desa --'}
                            </option>
                            {villages.map((v) => (
                              <option key={v.id} value={v.id}>
                                {toTitleCase(v.name)}
                              </option>
                            ))}
                            {addressState.districtId && !loadingVillages && (
                              <option value="__MANUAL__" className="font-semibold text-blue-600">
                                + Tidak ada di daftar? Ketik Manual...
                              </option>
                            )}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* RT/RW, Kode Pos & Detail Jalan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">RT / RW (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: 004 / 007"
                          value={addressState.rtRw}
                          onChange={(e) => setAddressState((prev) => ({ ...prev, rtRw: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kode Pos</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="5 digit kode pos"
                          value={addressState.postalCode}
                          onChange={(e) => setAddressState((prev) => ({ ...prev, postalCode: e.target.value.replace(/[^0-9]/g, '') }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Alamat Jalan / Gang / No. Rumah / Blok <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Jl. Diponegoro No. 45, Komplek Perumahan Griya Indah Blok C3"
                          value={addressState.streetAddress}
                          onChange={(e) => setAddressState((prev) => ({ ...prev, streetAddress: e.target.value }))}
                          onBlur={(e) => setAddressState((prev) => ({ ...prev, streetAddress: toTitleCase(e.target.value) }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DATA ASAL SEKOLAH */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Nama Asal Sekolah / Perguruan Tinggi <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-200 flex items-center gap-1">
                          <Search className="w-2.5 h-2.5" />
                          Database Sekolah Kemendikbud RI
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ketik nama sekolah atau kecamatan (misal: SMAN 1 Sidareja / Cilacap)..."
                          value={formData.schoolName}
                          onChange={(e) => handleSchoolNameChange(e.target.value)}
                          onFocus={() => {
                            if (formData.schoolName.trim().length >= 3) {
                              setShowSchoolDropdown(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowSchoolDropdown(false);
                              setFormData((p) => ({ ...p, schoolName: toTitleCase(p.schoolName) }));
                            }, 250);
                          }}
                          className="w-full pl-9 pr-8 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        {isSearchingSchool && (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-3" />
                        )}
                      </div>

                      {/* Dropdown Suggestions */}
                      {showSchoolDropdown && formData.schoolName.trim().length >= 3 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {isSearchingSchool && schoolSuggestions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              <span>Mencari di database sekolah nasional...</span>
                            </div>
                          ) : schoolSuggestions.length > 0 ? (
                            <div>
                              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Rekomendasi Sekolah Resmi Kemendikbud ({schoolSuggestions.length} ditemukan)
                              </div>
                              {schoolSuggestions.map((item) => (
                                <button
                                  type="button"
                                  key={item.id || item.npsn}
                                  onMouseDown={() => handleSelectSchool(item)}
                                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/80 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900">
                                        {item.name}
                                      </span>
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                        {item.bentuk}
                                      </span>
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {item.status}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {item.district && `Kec. ${item.district}, `}
                                      {item.regency && `${item.regency}, `}
                                      {item.province}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                      NPSN: {item.npsn}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-xs text-slate-500 text-center">
                              Sekolah tidak ada di rekomendasi online? Anda dapat langsung menggunakan teks yang Anda ketik.
                            </div>
                          )}
                        </div>
                      )}

                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Ketik minimal 3 karakter untuk mencari sekolah di Indonesia secara otomatis (NPSN akan otomatis terisi).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NPSN Sekolah (Otomatis / Manual)
                      </label>
                      <input
                        type="text"
                        placeholder="8 digit NPSN"
                        value={formData.npsn}
                        onChange={(e) => setFormData((p) => ({ ...p, npsn: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NISN (Nomor Induk Siswa Nasional)
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="10 digit NISN"
                        value={formData.nisn}
                        onChange={(e) => setFormData((p) => ({ ...p, nisn: e.target.value.replace(/[^0-9]/g, '') }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">Dapat ditemukan di ijazah / kartu pelajar atau melalui nisn.data.kemdikbud.go.id</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jurusan di Sekolah</label>
                      <input
                        type="text"
                        placeholder="Contoh: MIPA / IPS / Rekayasa Perangkat Lunak"
                        value={formData.major}
                        onChange={(e) => setFormData((p) => ({ ...p, major: e.target.value }))}
                        onBlur={(e) => setFormData((p) => ({ ...p, major: toTitleCase(e.target.value) }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Kelulusan</label>
                      <select
                        value={formData.graduationYear}
                        onChange={(e) => setFormData((p) => ({ ...p, graduationYear: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="2027">2027 (Lulus Tahun Ini)</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023 atau Sebelumnya</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: ORANG TUA (AYAH & IBU) */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* SEKSI 1: DATA AYAH KANDUNG */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 tracking-wide uppercase">
                            Data Ayah Kandung
                          </h4>
                          <span className="text-[11px] text-slate-500">Informasi identitas dan pekerjaan ayah</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A]">
                        Ayah Kandung
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Lengkap Ayah <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap ayah kandung..."
                          value={formData.fatherName}
                          onChange={(e) => {
                            setWizardError(null);
                            setFormData((p) => ({ ...p, fatherName: e.target.value, parentName: e.target.value || p.parentName }));
                          }}
                          onBlur={(e) => setFormData((p) => ({ ...p, fatherName: toTitleCase(e.target.value) }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor WhatsApp / HP Ayah
                        </label>
                        <input
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={formData.fatherPhone}
                          onChange={(e) => setFormData((p) => ({ ...p, fatherPhone: e.target.value.replace(/[^0-9+]/g, '') }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pekerjaan Ayah <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.fatherJob}
                          onChange={(e) => setFormData((p) => ({ ...p, fatherJob: e.target.value, parentJob: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer"
                        >
                          <option value="Karyawan Swasta">Karyawan Swasta</option>
                          <option value="PNS / ASN">PNS / ASN</option>
                          <option value="Wiraswasta / Usaha Mandiri">Wiraswasta / Usaha Mandiri</option>
                          <option value="Petani / Peternak / Nelayan">Petani / Peternak / Nelayan</option>
                          <option value="Buruh / Pekerja Lepas">Buruh / Pekerja Lepas</option>
                          <option value="Pegawai BUMN / BUMD">Pegawai BUMN / BUMD</option>
                          <option value="TNI / Polri">TNI / Polri</option>
                          <option value="Pensiunan">Pensiunan</option>
                          <option value="Sudah Meninggal">Sudah Meninggal</option>
                          <option value="Tidak Bekerja / Lainnya">Tidak Bekerja / Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Penghasilan Ayah per Bulan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.fatherIncome}
                          onChange={(e) => setFormData((p) => ({ ...p, fatherIncome: e.target.value, parentIncome: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer"
                        >
                          <option value="Tidak Berpenghasilan">Tidak Berpenghasilan / Rp 0</option>
                          <option value="< Rp1.000.000">&lt; Rp1.000.000</option>
                          <option value="Rp1.000.000 - Rp2.500.000">Rp1.000.000 - Rp2.500.000</option>
                          <option value="Rp2.500.000 - Rp5.000.000">Rp2.500.000 - Rp5.000.000</option>
                          <option value="Rp5.000.000 - Rp10.000.000">Rp5.000.000 - Rp10.000.000</option>
                          <option value="> Rp10.000.000">&gt; Rp10.000.000</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SEKSI 2: DATA IBU KANDUNG */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 tracking-wide uppercase">
                            Data Ibu Kandung
                          </h4>
                          <span className="text-[11px] text-slate-500">Informasi identitas dan pekerjaan ibu</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        Ibu Kandung
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Lengkap Ibu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap ibu kandung..."
                          value={formData.motherName}
                          onChange={(e) => {
                            setWizardError(null);
                            setFormData((p) => ({ ...p, motherName: e.target.value }));
                          }}
                          onBlur={(e) => setFormData((p) => ({ ...p, motherName: toTitleCase(e.target.value) }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor WhatsApp / HP Ibu
                        </label>
                        <input
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={formData.motherPhone}
                          onChange={(e) => setFormData((p) => ({ ...p, motherPhone: e.target.value.replace(/[^0-9+]/g, '') }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pekerjaan Ibu <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.motherJob}
                          onChange={(e) => setFormData((p) => ({ ...p, motherJob: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer"
                        >
                          <option value="Ibu Rumah Tangga (IRT)">Ibu Rumah Tangga (IRT)</option>
                          <option value="Karyawan Swasta">Karyawan Swasta</option>
                          <option value="PNS / ASN">PNS / ASN</option>
                          <option value="Wiraswasta / Usaha Mandiri">Wiraswasta / Usaha Mandiri</option>
                          <option value="Pedagang">Pedagang</option>
                          <option value="Petani / Peternak">Petani / Peternak</option>
                          <option value="Buruh / Pekerja Lepas">Buruh / Pekerja Lepas</option>
                          <option value="Pegawai BUMN / BUMD">Pegawai BUMN / BUMD</option>
                          <option value="Pensiunan">Pensiunan</option>
                          <option value="Sudah Meninggal">Sudah Meninggal</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Penghasilan Ibu per Bulan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.motherIncome}
                          onChange={(e) => setFormData((p) => ({ ...p, motherIncome: e.target.value }))}
                          className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] bg-white cursor-pointer"
                        >
                          <option value="Tidak Berpenghasilan">Tidak Berpenghasilan / Rp 0</option>
                          <option value="< Rp1.000.000">&lt; Rp1.000.000</option>
                          <option value="Rp1.000.000 - Rp2.500.000">Rp1.000.000 - Rp2.500.000</option>
                          <option value="Rp2.500.000 - Rp5.000.000">Rp2.500.000 - Rp5.000.000</option>
                          <option value="Rp5.000.000 - Rp10.000.000">Rp5.000.000 - Rp10.000.000</option>
                          <option value="> Rp10.000.000">&gt; Rp10.000.000</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SEKSI 3: KONTAK WALI (OPSIONAL) */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">
                        Kontak Wali / Darurat (Opsional)
                      </span>
                      <span className="text-[10px] text-slate-500">Diisi jika tinggal bersama wali / keluarga lain</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nama Wali (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Nama wali jika ada..."
                          value={formData.parentName === formData.fatherName ? '' : formData.parentName}
                          onChange={(e) => setFormData((p) => ({ ...p, parentName: e.target.value }))}
                          onBlur={(e) => setFormData((p) => ({ ...p, parentName: toTitleCase(e.target.value) }))}
                          className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nomor WhatsApp Wali</label>
                        <input
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={formData.parentPhone === formData.fatherPhone ? '' : formData.parentPhone}
                          onChange={(e) => setFormData((p) => ({ ...p, parentPhone: e.target.value.replace(/[^0-9+]/g, '') }))}
                          className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: DOKUMEN & FINALISASI */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Unggah Berkas Dokumen Persyaratan
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Format file yang didukung: JPG, PNG, atau PDF (Maksimal 10MB per berkas). Dapat dilengkapi kemudian jika berkas belum siap.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <DocumentUploadCard
                          label="Kartu Tanda Penduduk (KTP)"
                          sublabel="Scan / foto e-KTP jelas calon mahasiswa (JPG/PNG/PDF)"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          value={formData.fileKtp}
                          onChange={(val) => setFormData((p) => ({ ...p, fileKtp: val }))}
                          onPreview={(url, title) => setPreviewModal({ url, title: `Pratinjau KTP - ${formData.fullName || 'Calon Mahasiswa'}` })}
                        />
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <DocumentUploadCard
                          label="Kartu Keluarga (KK)"
                          sublabel="Scan / foto lembar KK terbaru (JPG/PNG/PDF)"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          value={formData.fileKk}
                          onChange={(val) => setFormData((p) => ({ ...p, fileKk: val }))}
                          onPreview={(url, title) => setPreviewModal({ url, title: `Pratinjau Kartu Keluarga (KK)` })}
                        />
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <DocumentUploadCard
                          label="Ijazah / SKL / Rapor"
                          sublabel="Ijazah legalisir, Surat Keterangan Lulus, atau Rapor semester akhir (JPG/PNG/PDF)"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          value={formData.fileIjazah}
                          onChange={(val) => setFormData((p) => ({ ...p, fileIjazah: val }))}
                          onPreview={(url, title) => setPreviewModal({ url, title: `Pratinjau Ijazah / SKL` })}
                        />
                      </div>

                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <DocumentUploadCard
                          label="Pas Foto 3x4 Resmi"
                          sublabel="Foto formal terbaru berpakaian rapi latar belakang merah / biru (JPG/PNG)"
                          accept="image/jpeg,image/png,image/webp"
                          value={formData.fileFoto}
                          onChange={(val) => setFormData((p) => ({ ...p, fileFoto: val }))}
                          onPreview={(url, title) => setPreviewModal({ url, title: `Pas Foto Resmi - ${formData.fullName || 'Calon Mahasiswa'}` })}
                        />
                      </div>
                    </div>

                    {/* KHUSUS PENDAFTAR JALUR KIP-KULIAH: UPLOAD FOTO KARTU KIP */}
                    {formData.isKip && (
                      <div className="mt-4 p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/70 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                              KIP
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                                Berkas Jalur Beasiswa KIP-Kuliah
                              </h4>
                              <p className="text-[11px] text-amber-800">
                                Anda memilih jalur KIP-Kuliah. Wajib mengunggah foto kartu KIP atau bukti pendaftaran KIP-Kuliah.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-200/90 text-amber-950 border border-amber-300 shrink-0 self-start sm:self-auto">
                            Wajib Pendaftar KIP
                          </span>
                        </div>

                        <DocumentUploadCard
                          label="Foto Kartu KIP / Bukti Akun KIP-Kuliah"
                          sublabel="Foto fisik Kartu KIP, Kartu KKS, SKTM, atau tangkapan layar bukti nomor pendaftaran KIP-Kuliah Kemendikbud (JPG/PNG/PDF)"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          value={formData.fileKip || formData.fileTambahan}
                          required
                          onChange={(val) => setFormData((p) => ({ ...p, fileKip: val, fileTambahan: val }))}
                          onPreview={(url, title) => setPreviewModal({ url, title: `Foto Kartu KIP-Kuliah - ${formData.fullName || 'Calon Mahasiswa'}` })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={formData.statementAgreed}
                      onChange={(e) => setFormData((p) => ({ ...p, statementAgreed: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-[#1E3A8A] rounded-sm focus:ring-[#1E3A8A] cursor-pointer"
                    />
                    <label htmlFor="agreement" className="text-xs text-slate-700 cursor-pointer">
                      Saya menyatakan bahwa seluruh data dan dokumen yang saya isikan pada formulir pendaftaran ini adalah benar, sah, dan dapat dipertanggungjawabkan sesuai peraturan yang berlaku di Institut Teknologi Nusantara.
                    </label>
                  </div>
                </div>
              )}
                 {/* Wizard Nav Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-200">
                {/* Wizard Error Notice tepat di atas tombol Lanjutkan */}
                {wizardError && (
                  <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs font-semibold shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="flex-1">{wizardError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWizardError(null)}
                      className="text-red-500 hover:text-red-800 text-xs font-bold underline cursor-pointer shrink-0"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Draf</span>
                    </button>

                    {currentStep === 1 && !isWaveOpen && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Gelombang belum dibuka untuk jenjang {selectedJenjang || 'ini'}</span>
                      </span>
                    )}

                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={currentStep === 1 && !isWaveOpen}
                        title={
                          currentStep === 1 && !isWaveOpen
                            ? `Gelombang pendaftaran untuk jenjang ${selectedJenjang || ''} belum dibuka`
                            : undefined
                        }
                        className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          currentStep === 1 && !isWaveOpen
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60 shadow-none'
                            : 'bg-[#1E3A8A] hover:bg-blue-900 text-white cursor-pointer'
                        }`}
                      >
                        <span>Lanjutkan</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitApplication}
                        disabled={isSaving || !formData.statementAgreed}
                        className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSaving ? 'Memproses...' : 'Kirim Pendaftaran'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Upload Bukti Pembayaran */}
        {selectedPayment && (
          <ModalPortal>
            <div className="fixed inset-0 !m-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Konfirmasi Pembayaran:{' '}
                    {selectedPayment.type === 'REGISTRATION' ? 'Biaya Registrasi' : 'Biaya Daftar Ulang'}
                  </h3>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                  <span className="text-slate-600 block">Nominal yang harus dibayarkan:</span>
                  <span className="text-lg font-black text-[#1E3A8A] font-mono block">
                    Rp{selectedPayment.amount.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Tujuan: Bank BNI VA 8802 0812 7643 8553 a.n ITN PMB
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="Transfer Bank BNI">Transfer Bank BNI (Virtual Account)</option>
                      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                      <option value="Transfer Bank BCA / Lainnya">Transfer Antar Bank (BCA/BRI/Lainnya)</option>
                      <option value="Teller Bank / Kasir">Pembayaran Tunai di Kasir Kampus</option>
                    </select>
                  </div>

                  <div>
                    <DocumentUploadCard
                      label="Unggah Berkas Bukti Transfer / Resi"
                      sublabel="Pilih foto/scan slip bank atau tangkapan layar m-banking (JPG/PNG/PDF, maks. 5MB)"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      value={proofUrl}
                      onChange={(val) => setProofUrl(val)}
                      onPreview={(url, title) => setPreviewModal({ url, title: 'Pratinjau Bukti Pembayaran' })}
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isUploadingPayment || !proofUrl}
                    className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-xs"
                  >
                    {isUploadingPayment ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal Pratinjau Dokumen / Bukti Bayar */}
        {previewModal && (
          <ModalPortal>
            <div className="fixed inset-0 !m-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1E3A8A]" />
                    <span>{previewModal.title}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {previewModal.url.startsWith('data:') && (
                      <a
                        href={previewModal.url}
                        download={`${previewModal.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                      >
                        Unduh
                      </a>
                    )}
                    <button
                      onClick={() => setPreviewModal(null)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100/50 min-h-[300px]">
                  {previewModal.url.startsWith('data:image') || previewModal.url.match(/\.(jpeg|jpg|png|webp)($|\?)/i) ? (
                    <img
                      src={previewModal.url}
                      alt={previewModal.title}
                      className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm border border-slate-200"
                    />
                  ) : previewModal.url.startsWith('data:application/pdf') || previewModal.url.match(/\.pdf($|\?)/i) ? (
                    <iframe
                      src={previewModal.url}
                      title={previewModal.title}
                      className="w-full h-[70vh] rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-bold mb-3">Dokumen telah terunggah</p>
                      <a
                        href={previewModal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg"
                      >
                        Buka Dokumen
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </main>

      {/* Modal Pratinjau & Cetak Kartu Bukti Pendaftaran PMB */}
      {showPrintModal && (
        <ModalPortal>
          <div className="fixed inset-0 !m-0 z-[9999] bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-3 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible animate-in fade-in">
          {/* Action Bar (Hanya tampil di layar, tersembunyi saat dicetak) */}
          <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-3 z-30 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 border border-blue-100">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Pratinjau Kartu Tanda Bukti Pendaftaran
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Format Standar A4 • Dilengkapi Kop Surat Resmi & QR Code Validasi PMB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-60"
                title="Langsung unduh dokumen format PDF"
              >
                {isDownloadingPdf ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cetak langsung menggunakan printer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {/* Kartu Dokumen Format A4 */}
          <div
            id="bukti-pendaftaran-document-card"
            className="w-full max-w-[210mm] bg-white shadow-2xl rounded-sm border border-slate-300 print:shadow-none print:border-none print:m-0 print:max-w-none"
          >
            <BuktiPendaftaranDocument
              application={application}
              regPayment={regPayment}
              isRegistrationPaid={isRegistrationPaid}
            />
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Print Target Fallback (Jika user mencetak via browser Ctrl+P tanpa membuka modal) */}
      {!showPrintModal && (
        <div id="bukti-pendaftaran-print-fallback" className="hidden print:block">
          <BuktiPendaftaranDocument
            application={application}
            regPayment={regPayment}
            isRegistrationPaid={isRegistrationPaid}
          />
        </div>
      )}

      {/* Global Print Style Helper */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm 8mm 10mm;
              }
              body, html {
                background: #ffffff !important;
                color: #000000 !important;
                padding: 0 !important;
                margin: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              header, footer, nav, .print\\:hidden {
                display: none !important;
              }
              .print\\:block {
                display: block !important;
              }
            }
          `,
        }}
      />

      {/* Footer PMB */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1">
          <p className="font-bold text-slate-300">
            Panitia Penerimaan Mahasiswa Baru (PMB) • Institut Teknologi Nusantara (ITN)
          </p>
          <p className="text-[11px] text-slate-500">
            Kampus Utama: Jl. Boulevard Teknologi No. 1, Jakarta • Hotline: (021) 7890-1234 • WhatsApp PMB: 0812-3456-7890
          </p>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
