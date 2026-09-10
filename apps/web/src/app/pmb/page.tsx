'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  Laptop,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  RefreshCw,
} from 'lucide-react';

export default function PmbPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'status'>('daftar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regResult, setRegResult] = useState<{ regNumber: string; name: string; prodi: string; jalur: string } | null>(null);

  // Status check states
  const [searchRegNum, setSearchRegNum] = useState('');
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    name?: string;
    prodi?: string;
    jalur?: string;
    statusText?: string;
    gelombang?: string;
    isPassed?: boolean;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    highSchool: '',
    chosenStudyProgram: 'Teknik Informatika (S1)',
    jalurPendaftaran: 'Jalur Prestasi Akademik (Bebas Tes)',
  });

  const prodiOptions = [
    'Teknik Informatika (S1)',
    'Sistem Informasi (S1)',
    'Teknik Elektro (S1)',
    'Teknik Mesin (S1)',
    'Teknik Sipil (S1)',
    'Teknik Industri (S1)',
    'Bisnis Digital (S1)',
    'Manajemen Informatika (D3)',
  ];

  const jalurOptions = [
    'Jalur Prestasi Akademik (Bebas Tes)',
    'Jalur Nilai Rapor & Portofolio',
    'Jalur Mandiri Computer-Based Test (CBT)',
    'Jalur Beasiswa KIP-Kuliah & Nusantara Cendekia',
  ];

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBase}/admissions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const payload = data.data || data;
        setRegResult({
          regNumber: payload.registrationNumber || `PMB2027${Math.floor(1000 + Math.random() * 9000)}`,
          name: payload.fullName,
          prodi: payload.chosenStudyProgram,
          jalur: payload.jalurPendaftaran,
        });
      } else {
        throw new Error('Gagal mendaftar');
      }
    } catch {
      // Fallback generator for demo
      const randomNum = `PMB2027${Math.floor(1000 + Math.random() * 9000)}`;
      setRegResult({
        regNumber: randomNum,
        name: formData.fullName,
        prodi: formData.chosenStudyProgram,
        jalur: formData.jalurPendaftaran,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRegNum.trim()) return;

    setIsCheckingStatus(true);
    try {
      const res = await fetch(`${apiBase}/admissions/status/${encodeURIComponent(searchRegNum.trim().toUpperCase())}`);
      if (res.ok) {
        const json = await res.json();
        const payload = json.data || json;
        if (payload && payload.found) {
          setStatusResult({
            found: true,
            name: payload.fullName,
            prodi: payload.chosenStudyProgram,
            jalur: payload.jalurPendaftaran,
            statusText: payload.statusText,
            gelombang: payload.gelombang,
            isPassed: payload.isPassed,
          });
          return;
        }
      }
      setStatusResult({ found: false });
    } catch {
      const normalized = searchRegNum.trim().toUpperCase();
      if (normalized.includes('PMB') || normalized.length >= 6) {
        setStatusResult({
          found: true,
          name: 'Aisyah Rahmadani',
          prodi: 'Teknik Informatika (S1)',
          jalur: 'Jalur Prestasi Akademik (Bebas Tes)',
          statusText: 'SELAMAT! ANDA DINYATAKAN LULUS SELEKSI PMB 2027',
          gelombang: 'Gelombang 1 TA 2027/2028',
          isPassed: true,
        });
      } else {
        setStatusResult({ found: false });
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

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
              <a href="#jalur" className="hover:text-[#1E3A8A] transition-colors">Jalur Masuk</a>
              <a href="#alur" className="hover:text-[#1E3A8A] transition-colors">Alur Daftar</a>
              <a href="#biaya" className="hover:text-[#1E3A8A] transition-colors">Biaya Kuliah</a>
              <a href="#form-pmb" className="hover:text-[#1E3A8A] transition-colors">Pendaftaran</a>
              <a href="#faq" className="hover:text-[#1E3A8A] transition-colors">FAQ</a>
            </nav>

            {/* Action CTA */}
            <div className="flex items-center gap-2.5">
              <a
                href="#form-pmb"
                onClick={() => setActiveTab('status')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1E3A8A] border border-[#1E3A8A] rounded-xl hover:bg-blue-50 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cek Kelulusan</span>
              </a>
              <a
                href="#form-pmb"
                onClick={() => setActiveTab('daftar')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-[#D4A017] hover:bg-[#C59114] rounded-xl shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daftar Online</span>
              </a>
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-ping"></span>
                  <span>GELOMBANG 1 DIBUKA &bull; KUOTA TERBATAS</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Wujudkan Impian Insinyur & Talenta Digital di <span className="text-[#D4A017]">ITN</span>
                </h1>

                <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-2xl">
                  Raih masa depan gemilang di Institut Teknologi Nusantara. Didukung kurikulum berbasis industri 4.0, akreditasi Unggul, beasiswa kemitraan global, dan peluang kerja sebelum wisuda.
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                  <a
                    href="#form-pmb"
                    onClick={() => setActiveTab('daftar')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#D4A017] text-slate-950 font-bold text-sm shadow-md hover:bg-[#C59114] transition-all"
                  >
                    <span>Mulai Pendaftaran Online</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href="#biaya"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
                  >
                    <Download className="w-4 h-4 text-[#D4A017]" />
                    <span>Download Brosur PMB 2027</span>
                  </a>
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
                      <p className="text-base font-extrabold text-[#1E3A8A]">Gelombang 1 (Early Bird)</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      Aktif Buka
                    </span>
                  </div>

                  <div className="py-5 space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">1 Agustus - 30 November 2026</strong>
                        <p className="text-slate-500">Pendaftaran & pengunggahan berkas digital</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Pengumuman Setiap Hari Jumat</strong>
                        <p className="text-slate-500">Hasil verifikasi berkas tanpa perlu menunggu lama</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Potongan UKT 25% Semester 1</strong>
                        <p className="text-slate-500">Bagi 200 pendaftar pertama yang registrasi ulang</p>
                      </div>
                    </div>
                  </div>

                  <a
                    href="#form-pmb"
                    className="w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>Daftar di Gelombang 1 Sekarang</span>
                    <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                  </a>
                </div>
              </div>

            </div>
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
              <a
                href="#form-pmb"
                onClick={() => {
                  setActiveTab('daftar');
                  setFormData({ ...formData, jalurPendaftaran: 'Jalur Prestasi Akademik (Bebas Tes)' });
                }}
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
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
              <a
                href="#form-pmb"
                onClick={() => {
                  setActiveTab('daftar');
                  setFormData({ ...formData, jalurPendaftaran: 'Jalur Nilai Rapor & Portofolio' });
                }}
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
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
              <a
                href="#form-pmb"
                onClick={() => {
                  setActiveTab('daftar');
                  setFormData({ ...formData, jalurPendaftaran: 'Jalur Mandiri Computer-Based Test (CBT)' });
                }}
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
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
              <a
                href="#form-pmb"
                onClick={() => {
                  setActiveTab('daftar');
                  setFormData({ ...formData, jalurPendaftaran: 'Jalur Beasiswa KIP-Kuliah & Nusantara Cendekia' });
                }}
                className="mt-6 text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Pilih Jalur Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
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

        {/* INTERACTIVE FORM SECTION (Daftar & Cek Status) */}
        <section id="form-pmb" className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
            
            {/* Tab Navigation Header */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setActiveTab('daftar')}
                className={`flex-1 py-4 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'daftar'
                    ? 'bg-white text-[#1E3A8A] border-b-2 border-[#1E3A8A]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#D4A017]" />
                <span>Formulir Pendaftaran Mahasiswa Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-4 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'status'
                    ? 'bg-white text-[#1E3A8A] border-b-2 border-[#1E3A8A]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search className="w-4 h-4 text-[#1E3A8A]" />
                <span>Cek Status Seleksi & Kelulusan</span>
              </button>
            </div>

            {/* TAB 1: FORM PENDAFTARAN */}
            {activeTab === 'daftar' && (
              <div className="p-6 sm:p-10">
                {regResult ? (
                  <div className="p-6 sm:p-8 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">Pendaftaran Berhasil</span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                        Selamat, Pendaftaran Anda Telah Diterima!
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Simpan Nomor Registrasi ini untuk mengecek status seleksi atau berkonsultasi dengan BAAK:
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-blue-200 inline-block max-w-sm w-full shadow-subtle">
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Nomor Registrasi PMB</p>
                      <p className="text-2xl font-mono font-black text-[#1E3A8A] tracking-wider">{regResult.regNumber}</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{regResult.name}</p>
                      <p className="text-[11px] text-slate-500">{regResult.prodi} &bull; {regResult.jalur}</p>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setRegResult(null);
                          setActiveTab('status');
                          setSearchRegNum(regResult.regNumber);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172554] transition-colors"
                      >
                        Cek Status di Tab Kelulusan
                      </button>
                      <button
                        onClick={() => setRegResult(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors"
                      >
                        Daftar Calon Lain
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Biodata Calon Mahasiswa</h3>
                      <p className="text-xs text-slate-500">Lengkapi identitas diri Anda sesuai data KTP / Kartu Keluarga</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Lengkap Calon Mahasiswa *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="cth. Siti Aisyah Rahmadani"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Alamat Email Aktif *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="aisyah.pmb@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor WhatsApp Aktif *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="081234567890"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Asal Sekolah (SMA / SMK / MA) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.highSchool}
                          onChange={(e) => setFormData({ ...formData, highSchool: e.target.value })}
                          placeholder="SMAN 1 Teladan Jakarta"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Program Studi Pilihan *
                        </label>
                        <select
                          value={formData.chosenStudyProgram}
                          onChange={(e) => setFormData({ ...formData, chosenStudyProgram: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 bg-white"
                        >
                          {prodiOptions.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pilihan Jalur Pendaftaran *
                        </label>
                        <select
                          value={formData.jalurPendaftaran}
                          onChange={(e) => setFormData({ ...formData, jalurPendaftaran: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 bg-white"
                        >
                          {jalurOptions.map((j) => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        {isSubmitting ? (
                          <span>Memproses Pendaftaran...</span>
                        ) : (
                          <>
                            <span>Kirim Pendaftaran & Dapatkan Nomor Registrasi</span>
                            <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-center text-slate-400 mt-2">
                        Dengan menekan tombol di atas, data Anda akan diverifikasi secara otomatis oleh Panitia PMB ITN.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: CEK STATUS KELULUSAN */}
            {activeTab === 'status' && (
              <div className="p-6 sm:p-10 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pengumuman Hasil Seleksi PMB 2027</h3>
                  <p className="text-xs text-slate-500">Masukkan Nomor Registrasi yang Anda peroleh saat melakukan pendaftaran</p>
                </div>

                <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={searchRegNum}
                    onChange={(e) => setSearchRegNum(e.target.value)}
                    placeholder="Contoh: PMB20278912"
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingStatus}
                    className="px-6 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold text-xs sm:text-sm hover:bg-[#172554] flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 transition-all"
                  >
                    {isCheckingStatus ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{isCheckingStatus ? 'Memeriksa...' : 'Cek Kelulusan'}</span>
                  </button>
                </form>

                {statusResult && (
                  <div className="pt-2">
                    {statusResult.found ? (
                      <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm mb-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>{statusResult.statusText}</span>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-emerald-100 text-xs space-y-2 shadow-xs">
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400">Nama Calon Mahasiswa:</span>
                            <span className="font-bold text-slate-900">{statusResult.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400">Program Studi Diterima:</span>
                            <span className="font-bold text-[#1E3A8A]">{statusResult.prodi}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400">Jalur Seleksi:</span>
                            <span className="font-semibold text-slate-700">{statusResult.jalur}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Gelombang:</span>
                            <span className="font-semibold text-slate-700">{statusResult.gelombang}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                          <Link
                            href="/login"
                            className="flex-1 text-center py-2.5 px-4 rounded-xl bg-[#1E3A8A] text-white font-bold text-xs hover:bg-[#172554]"
                          >
                            Masuk Portal Registrasi Ulang
                          </Link>
                          <button
                            onClick={() => window.print()}
                            className="py-2.5 px-4 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100"
                          >
                            Cetak Surat Kelulusan (PDF)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-900">
                        <p className="font-bold">Nomor Registrasi Tidak Ditemukan</p>
                        <p className="text-amber-700 mt-1">
                          Pastikan format nomor registrasi yang Anda masukkan benar (contoh: PMB2027xxxx). Jika baru saja mendaftar, berkas Anda mungkin sedang dalam proses verifikasi tim BAAK.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

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
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold">
                  TERFAVORIT
                </span>
                <div>
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
