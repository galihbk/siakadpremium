'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Phone,
  Mail,
  Building,
  GraduationCap,
  FileText,
  Calendar,
} from 'lucide-react';

export default function PmbLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Nomor Registrasi atau Email wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Nomor Registrasi atau Kata Sandi yang dimasukkan salah.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('pmb_applicant_session', JSON.stringify(data.applicant));
        localStorage.setItem('pmb_applicant_token', data.token || `pmb_token_${data.applicant.registrationNumber}`);
      }

      router.push('/pmb/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk ke akun PMB. Silakan periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setIdentifier('PMB20270001');
    setPassword('Password123!');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      
      {/* Top Header Resmi Kampus */}
      <header className="bg-[#1E3A8A] text-white border-b-2 border-[#D4A017] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                  Penerimaan Mahasiswa Baru TA 2027/2028
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden md:inline text-blue-200">
              Belum punya akun pendaftaran?
            </span>
            <Link
              href="/pmb/daftar"
              className="px-3.5 py-1.5 rounded-md bg-[#D4A017] hover:bg-[#c49214] text-slate-950 font-bold transition-colors shadow-xs"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: Split Layout ala Admisi Kampus Nasional */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Sisi Kiri: Informasi Institusi & Pengumuman */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#0F2042] to-[#1E3A8A] text-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-white/10 text-amber-300 text-[11px] font-bold tracking-wider uppercase mb-4">
                Portal Admisi Mahasiswa
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                Sistem Penerimaan Mahasiswa Baru (SIPMB)
              </h2>
              <p className="text-xs text-blue-100/90 mt-2 leading-relaxed">
                Silakan masuk menggunakan Nomor Registrasi yang tertera pada bukti pendaftaran Anda atau alamat email aktif.
              </p>

              <div className="mt-6 space-y-3.5 border-t border-white/15 pt-5 text-xs text-blue-50">
                <div className="flex items-start gap-2.5">
                  <GraduationCap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Pantau pengumuman status seleksi akademik & berkas secara berkala.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Unduh dan cetak Kartu Tanda Peserta Ujian / Seleksi Masuk ITN.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Jadwal pengumuman hasil seleksi Gelombang 1 setiap hari Jumat.</span>
                </div>
              </div>
            </div>

            {/* Kotak Narahubung Bantuan */}
            <div className="mt-8 pt-5 border-t border-white/15 text-[11px] text-blue-200">
              <span className="font-bold text-white block mb-1">Pusat Layanan Informasi PMB:</span>
              <p className="flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>(021) 7890-1234 ext. 101</span>
              </p>
              <p className="flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>pmb@itn.ac.id (08.00 - 16.00 WIB)</span>
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Formulir Login Resmi */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Masuk ke Akun Pendaftar
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan data akun yang telah Anda daftarkan sebelumnya.
                </p>
              </div>

              {/* Notifikasi Error */}
              {errorMsg && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Login Gagal:</span> {errorMsg}
                  </div>
                </div>
              )}

              {/* Formulir */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor Registrasi PMB atau Email <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: PMB20270001 atau aisyah.pmb@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gunakan nomor pendaftaran resmi (format: PMB2027xxxx).
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kata Sandi <span className="text-red-600">*</span>
                    </label>
                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20PMB%20ITN,%20saya%20lupa%20kata%20sandi%20pendaftaran"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#1E3A8A] hover:underline font-semibold"
                    >
                      Lupa Kata Sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi Anda"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] cursor-pointer"
                    />
                    <span>Ingat nomor pendaftaran saya</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Akun PMB</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Akun Demo Pengujian */}
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Akun Demo: <strong>PMB20270001</strong>
                </span>
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="text-[11px] font-bold text-[#1E3A8A] hover:underline"
                >
                  Gunakan Akun Ini
                </button>
              </div>
            </div>

            {/* Tautan Bawah */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center space-y-2 text-xs text-slate-600">
              <p>
                Belum terdaftar sebagai calon mahasiswa?{' '}
                <Link
                  href="/pmb/daftar"
                  className="font-bold text-[#1E3A8A] hover:underline ml-1"
                >
                  Daftar Calon Mahasiswa Baru
                </Link>
              </p>
              <div>
                <Link
                  href="/pmb#cek-kelulusan"
                  className="text-slate-500 hover:text-slate-700 hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Cek Pengumuman Kelulusan Cepat Tanpa Login</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Resmi Kampus */}
      <footer className="bg-slate-200/80 border-t border-slate-300 py-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
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
