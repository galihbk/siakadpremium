'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

const SQL_INJECTION_PATTERN = /(--|\/\*|\*\/|@@|char\(|nchar\(|varchar\(|exec\(|execute\(|\b(select|union|drop|insert|update|delete|where|table|database|alter|truncate|declare|cast)\b|(\bor\b|\band\b)\s+\d+=\d+|['";`])/i;
const SCRIPT_PATTERN = /(<script|<iframe|<embed|<object|javascript:|onload=|onerror=)/i;

function detectSqlRisk(val: string): string | null {
  if (!val) return null;
  if (val.includes(';') || val.includes('--') || val.includes('/*') || val.includes('"') || val.includes('`')) {
    return 'Karakter simbol (; -- /* " `) dilarang untuk keamanan sistem.';
  }
  if (SQL_INJECTION_PATTERN.test(val)) {
    return 'Terdeteksi kata kunci atau pola SQL Injection yang tidak diizinkan.';
  }
  if (SCRIPT_PATTERN.test(val)) {
    return 'Terdeteksi kode script berbahaya (XSS).';
  }
  return null;
}

function LupaKataSandiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email');

  // Mode: 'REQUEST' | 'SENT' | 'RESET' | 'SUCCESS'
  const isResetMode = Boolean(tokenParam && emailParam);

  const [identifier, setIdentifier] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State Request Terkirim & Cooldown
  const [isSent, setIsSent] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // State Reset Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // State Anti-Spam (Math Captcha)
  const [captchaNumA, setCaptchaNumA] = useState(4);
  const [captchaNumB, setCaptchaNumB] = useState(3);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const refreshCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    setCaptchaNumA(a);
    setCaptchaNumB(b);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSent && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSent, resendCooldown]);

  const apiBaseUrl = getApiBaseUrl();

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    const risk = detectSqlRisk(val);
    if (risk) {
      setFieldError(risk);
    } else {
      setFieldError(null);
    }
  };

  // 1. Submit Request Reset Link
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot && honeypot.trim().length > 0) {
      setErrorMsg('Permintaan ditolak oleh sistem keamanan.');
      return;
    }

    const expectedResult = captchaNumA + captchaNumB;
    if (!captchaAnswer.trim() || parseInt(captchaAnswer.trim(), 10) !== expectedResult) {
      setErrorMsg('Jawaban verifikasi keamanan tidak tepat. Silakan hitung kembali.');
      refreshCaptcha();
      return;
    }

    const risk = detectSqlRisk(identifier);
    if (risk) {
      setErrorMsg(`Keamanan: ${risk}`);
      return;
    }

    if (!identifier.trim()) {
      setErrorMsg('Nomor Registrasi atau Email wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Nomor Registrasi atau Email tidak ditemukan.');
      }

      const payload = json.data !== undefined ? json.data : json;
      setTargetEmail(payload.email || identifier.trim());
      setIsSent(true);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses permintaan. Silakan coba kembali.');
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Resend Reset Link
  const handleResend = async () => {
    if (!targetEmail || isResending || resendCooldown > 0) return;
    setIsResending(true);
    setResendMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Gagal mengirim ulang tautan reset kata sandi.');
      }
      setResendMsg('Tautan baru telah dikirimkan ke email Anda.');
      setResendCooldown(60);
    } catch (err: any) {
      setResendMsg(err.message || 'Gagal mengirim ulang email.');
    } finally {
      setIsResending(false);
    }
  };

  // 3. Submit New Password (Reset Mode)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenParam,
          email: emailParam,
          newPassword: newPassword.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal mengatur ulang kata sandi. Tautan mungkin telah kedaluwarsa.');
      }

      setIsResetSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui kata sandi. Silakan ajukan permintaan baru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Header Resmi Kampus */}
      <header className="bg-[#1E3A8A] text-white border-b-2 border-[#D4A017] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pmb/login"
              className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-900 text-blue-200 hover:text-white transition-colors"
              title="Kembali ke Halaman Masuk"
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
                  Pusat Pemulihan Kata Sandi Akun PMB
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
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
      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        {/* ========================================================= */}
        {/* KONDISI 1: SUKSES RESET KATA SANDI                       */}
        {/* ========================================================= */}
        {isResetSuccess ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Kata Sandi Berhasil Diperbarui
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed mb-6">
              Kata sandi akun pendaftaran Anda telah berhasil diubah. Silakan masuk menggunakan kata sandi baru Anda.
            </p>

            <Link
              href="/pmb/login"
              className="w-full py-3.5 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Masuk ke Akun PMB</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : isResetMode ? (
          /* ========================================================= */
          /* KONDISI 2: FORMULIR INPUT KATA SANDI BARU (DARI EMAIL)   */
          /* ========================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 animate-in fade-in">
            <div className="border-b border-slate-200 pb-5 mb-5">
              <div className="w-11 h-11 bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-xl flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                Buat Kata Sandi Baru
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Akun: <strong>{emailParam}</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    maxLength={50}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={50}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Menyimpan Kata Sandi...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan Kata Sandi Baru</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : isSent ? (
          /* ========================================================= */
          /* KONDISI 3: TAUTAN RESET TELAH DIKIRIM KE EMAIL            */
          /* ========================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-blue-50 text-[#1E3A8A] border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Mail className="w-8 h-8 text-[#1E3A8A]" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Periksa Email Anda
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed mb-4">
              Tautan instruksi untuk mengatur ulang kata sandi telah dikirimkan ke:
            </p>

            <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#1E3A8A] font-mono mb-5 shadow-xs">
              {targetEmail}
            </div>

            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
              Silakan buka kotak masuk atau folder spam email Anda, lalu klik tombol di dalamnya untuk membuat kata sandi baru.
            </p>

            {resendMsg && (
              <div className="mb-5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-center gap-2 max-w-sm mx-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resendMsg}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
              <a
                href={targetEmail.includes('@gmail.com') ? 'https://mail.google.com' : 'mailto:' + targetEmail}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Buka Email Saya</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="w-full sm:w-auto py-3 px-5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin text-[#1E3A8A]' : ''}`} />
                <span>
                  {isResending
                    ? 'Mengirim...'
                    : resendCooldown > 0
                    ? `Kirim Ulang (${resendCooldown}s)`
                    : 'Kirim Ulang'}
                </span>
              </button>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-200 text-xs text-slate-500">
              <Link href="/pmb/login" className="font-bold text-[#1E3A8A] hover:underline">
                &larr; Kembali ke Halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* KONDISI 4: FORMULIR REQUEST RESET KATA SANDI              */
          /* ========================================================= */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 animate-in fade-in">
            <div className="border-b border-slate-200 pb-5 mb-5">
              <div className="w-11 h-11 bg-amber-50 text-[#D4A017] border border-amber-200 rounded-xl flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                Lupa Kata Sandi Akun PMB
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Masukkan Nomor Registrasi (format: <strong>PMB2027xxxx</strong>) atau Alamat Email aktif yang Anda daftarkan.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Honeypot Trap */}
              <div className="hidden opacity-0 absolute -top-[9999px] left-0 pointer-events-none" aria-hidden="true">
                <input
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Registrasi PMB atau Email <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PMB20270001 atau email@anda.com"
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    maxLength={100}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-xs sm:text-sm text-slate-800 focus:outline-none transition-colors ${
                      fieldError
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                        : 'border-slate-300 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]'
                    }`}
                  />
                </div>
                {fieldError && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldError}</span>
                  </p>
                )}
              </div>

              {/* Verifikasi Keamanan */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4A017]" />
                    Verifikasi Keamanan
                  </span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    title="Ganti angka verifikasi"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ganti</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-[#1E3A8A] font-black text-sm rounded-lg shadow-2xs">
                    <span>{captchaNumA}</span>
                    <span className="text-[#D4A017]">+</span>
                    <span>{captchaNumB}</span>
                    <span className="text-slate-400">=</span>
                    <span className="text-blue-600">?</span>
                  </div>

                  <input
                    type="number"
                    required
                    placeholder="Hasil angka"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E3A8A] bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || Boolean(fieldError)}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Mengirim Instruksi...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Tautan Reset Kata Sandi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200 text-center text-xs text-slate-600">
                <span>Ingat kata sandi Anda? </span>
                <Link href="/pmb/login" className="font-bold text-[#1E3A8A] hover:underline">
                  Masuk ke Akun PMB
                </Link>
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

export default function PmbLupaKataSandiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LupaKataSandiContent />
    </Suspense>
  );
}
