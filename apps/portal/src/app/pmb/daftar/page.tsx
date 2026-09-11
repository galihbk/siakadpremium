'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Tag,
  User,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

// Deteksi Karakter & Pola SQL Injection serta Script Berbahaya
const SQL_INJECTION_PATTERN = /(--|\/\*|\*\/|@@|char\(|nchar\(|varchar\(|exec\(|execute\(|\b(select|union|drop|insert|update|delete|where|table|database|alter|truncate|declare|cast)\b|(\bor\b|\band\b)\s+\d+=\d+|['";`])/i;
const SCRIPT_PATTERN = /(<script|<iframe|<embed|<object|javascript:|onload=|onerror=)/i;

function detectSqlRisk(val: string, allowApostrophe = false): string | null {
  if (!val) return null;
  const testVal = allowApostrophe ? val.replace(/'/g, '') : val;
  if (val.includes(';') || val.includes('--') || val.includes('/*') || val.includes('"') || val.includes('`')) {
    return 'Karakter simbol (; -- /* " `) dilarang untuk keamanan sistem.';
  }
  if (SQL_INJECTION_PATTERN.test(testVal)) {
    return 'Terdeteksi kata kunci atau pola SQL Injection yang tidak diizinkan.';
  }
  if (SCRIPT_PATTERN.test(val)) {
    return 'Terdeteksi kode script berbahaya (XSS).';
  }
  return null;
}

export default function PmbDaftarPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State Verifikasi Email & Cooldown 60 Detik
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Form State & Validasi Keamanan
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    affiliateCode: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // State Anti-Spam (Math Captcha & Honeypot)
  const [captchaNumA, setCaptchaNumA] = useState(5);
  const [captchaNumB, setCaptchaNumB] = useState(3);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const refreshCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 2; // 2..9
    const b = Math.floor(Math.random() * 8) + 1; // 1..8
    setCaptchaNumA(a);
    setCaptchaNumB(b);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Timer Countdown Cooldown 60 Detik untuk Kirim Ulang Link
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerificationSent && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVerificationSent, resendCooldown]);

  const apiBaseUrl = getApiBaseUrl();

  // Membaca parameter affiliate/ref dari URL jika calon pendaftar membuka link referral
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('affiliate');
      if (ref) {
        const sanitizedRef = ref.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        setFormData((prev) => ({ ...prev, affiliateCode: sanitizedRef }));
      }
    }
  }, []);

  // Handler Input dengan Sanitasi & Validasi SQL Injection Real-time
  const handleFullNameChange = (val: string) => {
    setFormData((prev) => ({ ...prev, fullName: val }));
    const risk = detectSqlRisk(val, true);
    if (risk) {
      setFieldErrors((prev) => ({ ...prev, fullName: risk }));
    } else if (val && !/^[a-zA-Z\s.,']*$/.test(val)) {
      setFieldErrors((prev) => ({ ...prev, fullName: 'Nama hanya boleh mengandung huruf, spasi, titik, koma, dan petik satu.' }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.fullName;
        return next;
      });
    }
  };

  const handleEmailChange = (val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    const risk = detectSqlRisk(val, false);
    if (risk) {
      setFieldErrors((prev) => ({ ...prev, email: risk }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const risk = detectSqlRisk(val, false);
    if (risk) {
      setFieldErrors((prev) => ({ ...prev, phone: risk }));
    } else if (val && !/^[0-9+\s-]*$/.test(val)) {
      setFieldErrors((prev) => ({ ...prev, phone: 'Nomor WhatsApp hanya boleh berisi angka, tanda plus (+), atau tanda hubung (-).' }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const handleAffiliateChange = (val: string) => {
    const upper = val.toUpperCase();
    setFormData((prev) => ({ ...prev, affiliateCode: upper }));
    const risk = detectSqlRisk(upper, false);
    if (risk) {
      setFieldErrors((prev) => ({ ...prev, affiliateCode: risk }));
    } else if (upper && !/^[A-Z0-9_-]*$/.test(upper)) {
      setFieldErrors((prev) => ({ ...prev, affiliateCode: 'Kode referral hanya boleh berupa karakter alfanumerik (A-Z, 0-9).' }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.affiliateCode;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-Spam Bot Honeypot Check
    if (honeypot && honeypot.trim().length > 0) {
      setErrorMsg('Pendaftaran ditolak oleh sistem keamanan.');
      return;
    }

    // 2. Anti-Spam Math Challenge Verification
    const expectedResult = captchaNumA + captchaNumB;
    if (!captchaAnswer.trim() || parseInt(captchaAnswer.trim(), 10) !== expectedResult) {
      setErrorMsg('Jawaban verifikasi keamanan tidak benar. Silakan periksa hasil penjumlahan dan coba lagi.');
      refreshCaptcha();
      return;
    }

    // 3. Validasi Anti-SQL Injection & Sanitasi
    const fullNameRisk = detectSqlRisk(formData.fullName, true);
    if (fullNameRisk) {
      setErrorMsg(`Keamanan: Nama Lengkap ${fullNameRisk}`);
      return;
    }

    const emailRisk = detectSqlRisk(formData.email, false);
    if (emailRisk) {
      setErrorMsg(`Keamanan: Alamat Email ${emailRisk}`);
      return;
    }

    const phoneRisk = detectSqlRisk(formData.phone, false);
    if (phoneRisk) {
      setErrorMsg(`Keamanan: Nomor WhatsApp ${phoneRisk}`);
      return;
    }

    if (formData.affiliateCode) {
      const affRisk = detectSqlRisk(formData.affiliateCode, false);
      if (affRisk) {
        setErrorMsg(`Keamanan: Kode Affiliate ${affRisk}`);
        return;
      }
    }

    // 4. Validasi Format Isian Wajib
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMsg('Harap lengkapi nama lengkap, email aktif, dan nomor WhatsApp.');
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      setErrorMsg('Format alamat email tidak valid (contoh: nama@domain.com).');
      return;
    }

    if (!/^\+?[0-9\s\-]{8,18}$/.test(formData.phone.trim())) {
      setErrorMsg('Nomor WhatsApp harus berupa nomor valid (minimal 8 digit angka).');
      return;
    }

    if (!formData.password) {
      setErrorMsg('Kata sandi akun wajib dibuat.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Kata sandi akun minimal terdiri dari 6 karakter.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi yang dibuat.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          affiliateCode: formData.affiliateCode.trim().toUpperCase() || undefined,
          honeypot: honeypot.trim(),
          highSchool: '-',
          chosenStudyProgram: 'Belum Dipilih',
          jalurPendaftaran: 'Belum Dipilih',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data) {
        throw new Error(data?.message || 'Gagal mendaftarkan akun calon mahasiswa.');
      }

      setRegisteredEmail(formData.email.trim().toLowerCase());
      setIsVerificationSent(true);
      setResendCooldown(60); // Inisiasi cooldown 60 detik
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses registrasi akun. Silakan coba kembali.');
      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail || isResending || resendCooldown > 0) return;
    setIsResending(true);
    setResendMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mengirim ulang link verifikasi.');
      }
      setResendMsg(data?.message || 'Tautan verifikasi baru telah dikirim ke email Anda.');
      setResendCooldown(60); // Reset timer cooldown 1 menit
    } catch (err: any) {
      setResendMsg(err.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">

      {/* Top Header Resmi Kampus */}
      <header className="bg-[#1E3A8A] text-white border-b-2 border-[#D4A017] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                  Pendaftaran Akun Baru PMB 2027/2028
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-blue-200">
              Sudah punya akun?
            </span>
            <Link
              href="/pmb/login"
              className="px-3.5 py-1.5 rounded-lg bg-white text-[#1E3A8A] font-bold hover:bg-blue-50 transition-colors shadow-xs"
            >
              Masuk Akun PMB
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {isVerificationSent ? (
          /* ================= LAYAR VERIFIKASI EMAIL ================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-blue-50 text-[#1E3A8A] border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Mail className="w-8 h-8 text-[#1E3A8A]" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Verifikasi Email Anda
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-4">
              Tautan verifikasi akun telah kami kirimkan ke alamat email:
            </p>

            {/* Kotak Alamat Email */}
            <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#1E3A8A] font-mono mb-5 shadow-xs">
              {registeredEmail}
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
              Silakan periksa kotak masuk (inbox) atau folder <strong>Spam / Promosi</strong> email Anda, lalu klik tautan di dalamnya untuk mengaktifkan akun Anda.
            </p>

            {resendMsg && (
              <div className="mb-5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-center gap-2 max-w-md mx-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resendMsg}</span>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <a
                href={registeredEmail.includes('@gmail.com') ? 'https://mail.google.com' : 'mailto:' + registeredEmail}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Buka Email Saya</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || resendCooldown > 0}
                className="w-full sm:w-auto py-3 px-5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin text-[#1E3A8A]' : ''}`} />
                <span>
                  {isResending
                    ? 'Mengirim...'
                    : resendCooldown > 0
                    ? `Kirim Ulang (${resendCooldown}s)`
                    : 'Kirim Ulang Link'}
                </span>
              </button>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-200 text-xs text-slate-500">
              <span>Sudah mengklik tautan di email? </span>
              <Link href="/pmb/login" className="font-bold text-[#1E3A8A] hover:underline ml-1">
                Masuk ke Akun PMB &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* ================= FORMULIR DAFTAR AKUN ================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">

            {/* Header Form */}
            <div className="border-b border-slate-200 pb-5 mb-5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Registrasi Akun PMB Baru
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tahun Akademik 2027/2028 • Institut Teknologi Nusantara
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Honeypot Bot Trap (Tak terlihat oleh manusia) */}
              <div className="hidden opacity-0 absolute -top-[9999px] left-0 pointer-events-none" aria-hidden="true">
                <label htmlFor="website_check_pmb">Website Security Check</label>
                <input
                  id="website_check_pmb"
                  type="text"
                  name="website_check_pmb"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Bagian 1: Data Diri Calon Mahasiswa */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4A017]" />
                  1. Data Diri Calon Mahasiswa
                </h2>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap (Sesuai Ijazah / KTP) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Farhan Alamsyah"
                      value={formData.fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      maxLength={120}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm text-slate-800 focus:outline-none transition-colors ${fieldErrors.fullName
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                        : 'border-slate-300 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]'
                        }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                          onChange={(e) => handleEmailChange(e.target.value)}
                          maxLength={100}
                          className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs sm:text-sm text-slate-800 focus:outline-none transition-colors ${fieldErrors.email
                            ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                            : 'border-slate-300 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]'
                            }`}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.email}</span>
                        </p>
                      )}
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
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          maxLength={20}
                          className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs sm:text-sm text-slate-800 focus:outline-none transition-colors ${fieldErrors.phone
                            ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                            : 'border-slate-300 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]'
                            }`}
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{fieldErrors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Affiliate / Referral <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Contoh: MITRA2027 atau ITNPROMO"
                        value={formData.affiliateCode}
                        onChange={(e) => handleAffiliateChange(e.target.value)}
                        maxLength={25}
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg border text-xs sm:text-sm text-slate-800 uppercase focus:outline-none transition-colors ${fieldErrors.affiliateCode
                          ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                          : 'border-slate-300 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]'
                          }`}
                      />
                    </div>
                    {fieldErrors.affiliateCode && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.affiliateCode}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bagian 2: Kata Sandi Akun Pendaftaran */}
              <div className="pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D4A017]" />
                  2. Kata Sandi Akun Pendaftaran
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Buat Kata Sandi Akun PMB <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimal 6 karakter"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        maxLength={50}
                        className="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ulangi Kata Sandi <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Ulangi kata sandi"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        maxLength={50}
                        className="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title={showConfirmPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Kata sandi ini akan digunakan untuk masuk ke akun Anda.
                </p>
              </div>

              {/* Bagian 3: Verifikasi Keamanan */}
              <div className="pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] border-b border-slate-100 pb-2 mb-3.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                  3. Verifikasi Keamanan
                </h2>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-slate-700">
                        Berapa hasil penjumlahan:
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-[#1E3A8A] font-black text-sm rounded-lg shadow-2xs">
                        <span>{captchaNumA}</span>
                        <span className="text-[#D4A017]">+</span>
                        <span>{captchaNumB}</span>
                        <span className="text-slate-400">=</span>
                        <span className="text-blue-600">?</span>
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="Ganti angka verifikasi"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-full sm:w-44">
                      <input
                        type="number"
                        required
                        placeholder="Jawaban angka"
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] bg-white font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Hitung hasil angka di atas untuk memastikan pendaftaran dilakukan oleh pendaftar asli.
                  </p>
                </div>
              </div>

              {/* Tombol Submit */}
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(fieldErrors).length > 0}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Memproses Pendaftaran Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Akun Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-2">
                  Dengan mendaftar, Anda menyatakan bahwa data akun yang diisikan adalah benar dan valid.
                </p>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Footer Resmi Kampus */}
      <footer className="bg-slate-200/80 border-t border-slate-300 py-4 text-center text-xs text-slate-600">
        <div className="max-w-5xl mx-auto px-4">
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
