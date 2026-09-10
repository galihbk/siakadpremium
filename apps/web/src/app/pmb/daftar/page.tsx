'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  FileCheck,
  GraduationCap,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  School,
  User,
  AlertCircle,
  Printer,
} from 'lucide-react';

export default function PmbDaftarPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regResult, setRegResult] = useState<{
    regNumber: string;
    name: string;
    prodi: string;
    jalur: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    highSchool: '',
    chosenStudyProgram: 'Teknik Informatika (S1)',
    jalurPendaftaran: 'Jalur Prestasi Akademik (Bebas Tes)',
    password: 'Password123!',
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
    {
      id: 'Jalur Prestasi Akademik (Bebas Tes)',
      label: 'Jalur Prestasi Akademik (Bebas Tes)',
      desc: 'Berdasarkan nilai rapor semester 1-5 minimal rata-rata 80.00 / juara lomba.',
    },
    {
      id: 'Jalur Nilai Rapor & Portofolio',
      label: 'Jalur Nilai Rapor & Portofolio',
      desc: 'Seleksi berkas nilai rapor semester 1 sampai 5 minimal 78.00.',
    },
    {
      id: 'Jalur CBT Mandiri Daring',
      label: 'Jalur CBT Mandiri Daring',
      desc: 'Ujian Computer-Based Test online fleksibel dari rumah.',
    },
    {
      id: 'Jalur Beasiswa KIP-Kuliah & Prestasi',
      label: 'Jalur Beasiswa KIP-Kuliah & Prestasi',
      desc: 'Pembebasan biaya kuliah 100% bagi siswa berprestasi berkendala finansial.',
    },
  ];

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleFillDemo = () => {
    setFormData({
      fullName: 'Rizky Firmansyah Pratama',
      email: `rizky.pmb${Math.floor(Math.random() * 900 + 100)}@gmail.com`,
      phone: '081298765432',
      highSchool: 'SMAN 8 Jakarta',
      chosenStudyProgram: 'Teknik Informatika (S1)',
      jalurPendaftaran: 'Jalur Prestasi Akademik (Bebas Tes)',
      password: 'Password123!',
    });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      setErrorMsg('Harap lengkapi semua kolom biodata yang bertanda bintang (*).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data) {
        throw new Error(data?.message || 'Gagal mengirim formulir pendaftaran.');
      }

      const regNum = data.registrationNumber || `PMB2027${Math.floor(Math.random() * 9000 + 1000)}`;

      if (typeof window !== 'undefined') {
        const applicantSession = {
          id: data.id || `app-${Date.now()}`,
          registrationNumber: regNum,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          highSchool: formData.highSchool,
          chosenStudyProgram: formData.chosenStudyProgram,
          jalurPendaftaran: formData.jalurPendaftaran,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('pmb_applicant_session', JSON.stringify(applicantSession));
        localStorage.setItem('pmb_applicant_token', `pmb_token_${regNum}`);
      }

      setRegResult({
        regNumber: regNum,
        name: formData.fullName,
        prodi: formData.chosenStudyProgram,
        jalur: formData.jalurPendaftaran,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses pendaftaran. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReg = () => {
    if (regResult?.regNumber && typeof window !== 'undefined') {
      navigator.clipboard.writeText(regResult.regNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      
      {/* Top Header Resmi Kampus */}
      <header className="bg-[#1E3A8A] text-white border-b-2 border-[#D4A017] shadow-sm">
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
                  Formulir Pendaftaran Mahasiswa Baru 2027/2028
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-blue-200">
              Sudah pernah mendaftar?
            </span>
            <Link
              href="/pmb/login"
              className="px-3 py-1.5 rounded-md bg-white text-[#1E3A8A] font-bold hover:bg-blue-50 transition-colors shadow-xs"
            >
              Masuk Akun PMB
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        
        {regResult ? (
          /* ================= TANDA BUKTI PENDAFTARAN RESMI ================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 animate-in fade-in">
            <div className="text-center pb-6 border-b border-slate-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Pendaftaran Anda Berhasil Diterima
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Data calon mahasiswa telah tercatat di Panitia Penerimaan Mahasiswa Baru ITN.
              </p>
            </div>

            {/* Kotak Nomor Registrasi */}
            <div className="my-6 p-5 sm:p-6 bg-blue-50/80 border border-blue-200 rounded-xl text-center max-w-md mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] block mb-1">
                Nomor Registrasi Resmi
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-black text-[#1E3A8A] font-mono tracking-wider">
                  {regResult.regNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReg}
                  title="Salin Nomor Registrasi"
                  className="p-1.5 rounded bg-white border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Harap simpan nomor registrasi ini. Anda dapat menggunakannya bersama kata sandi untuk masuk ke akun portal pendaftar.
              </p>
            </div>

            {/* Ringkasan Calon Mahasiswa */}
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 max-w-md mx-auto text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-bold text-slate-900">{regResult.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program Studi Pilihan:</span>
                <span className="font-bold text-[#1E3A8A]">{regResult.prodi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jalur Pendaftaran:</span>
                <span className="font-semibold text-slate-700">{regResult.jalur}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Awal:</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                  Menunggu Verifikasi Berkas
                </span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => router.push('/pmb/dashboard')}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Buka Dashboard Pendaftar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto py-3 px-5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= FORMULIR PENDAFTARAN RESMI ================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10">
            
            {/* Header Form */}
            <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Formulir Penerimaan Mahasiswa Baru
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tahun Akademik 2027/2028 • Institut Teknologi Nusantara
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-semibold text-[#1E3A8A] hover:underline self-start sm:self-auto bg-blue-50 px-3 py-1.5 rounded border border-blue-200 cursor-pointer"
              >
                Isi Data Pengujian Otomatis
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Bagian 1: Identitas Diri */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4A017]" />
                  1. Identitas Calon Mahasiswa
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap (Sesuai Ijazah / KTP) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Farhan Alamsyah"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email Aktif <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor WhatsApp Aktif <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="0812xxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Asal Sekolah (SMA / SMK / MA) <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: SMAN 1 Jakarta"
                        value={formData.highSchool}
                        onChange={(e) => setFormData({ ...formData, highSchool: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Pilihan Program Studi & Jalur Seleksi */}
              <div className="pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#D4A017]" />
                  2. Pilihan Program Studi & Jalur Seleksi
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilihan Program Studi <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.chosenStudyProgram}
                      onChange={(e) => setFormData({ ...formData, chosenStudyProgram: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] bg-white cursor-pointer"
                    >
                      {prodiOptions.map((prodi) => (
                        <option key={prodi} value={prodi}>
                          {prodi}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Pilihan Jalur Masuk Seleksi <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {jalurOptions.map((jalur) => {
                        const isSelected = formData.jalurPendaftaran === jalur.id;
                        return (
                          <div
                            key={jalur.id}
                            onClick={() => setFormData({ ...formData, jalurPendaftaran: jalur.id })}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/70 border-[#1E3A8A]'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                                    : 'border-slate-400'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-slate-900">{jalur.label}</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  {jalur.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Kata Sandi Akun Pendaftaran */}
              <div className="pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D4A017]" />
                  3. Kata Sandi Akun Pendaftaran
                </h2>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buat Kata Sandi Akun PMB <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gunakan minimal 6 karakter. Kata sandi ini digunakan untuk masuk kembali ke akun PMB Anda.
                  </p>
                </div>
              </div>

              {/* Tombol Submit */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Memproses Pendaftaran...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Pendaftaran & Dapatkan Nomor Registrasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-2">
                  Dengan mendaftar, Anda menyatakan bahwa data yang diisikan adalah benar dan valid.
                </p>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Footer Resmi Kampus */}
      <footer className="bg-slate-200/80 border-t border-slate-300 py-4 text-center text-xs text-slate-600">
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
