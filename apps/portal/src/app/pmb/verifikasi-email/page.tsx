'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
  LogIn,
  Home,
  ShieldCheck,
} from 'lucide-react';

function VerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'already_verified' | 'error' | 'no_token'>('loading');
  const [message, setMessage] = useState<string>('');
  const [applicant, setApplicant] = useState<{
    registrationNumber?: string;
    fullName?: string;
    email?: string;
  } | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (emailParam && !resendEmail) {
      setResendEmail(emailParam);
    }
  }, [emailParam, resendEmail]);

  useEffect(() => {
    if (!token || !emailParam) {
      setStatus('no_token');
      return;
    }

    let isMounted = true;

    async function doVerify() {
      try {
        const res = await fetch(
          `${apiBaseUrl}/admissions/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(data?.message || 'Tautan verifikasi tidak valid atau telah kedaluwarsa.');
        }

        if (data.alreadyVerified) {
          setStatus('already_verified');
          setMessage(data.message || 'Alamat email Anda sudah diverifikasi sebelumnya.');
        } else {
          setStatus('success');
          setMessage(data.message || 'Selamat, alamat email Anda berhasil diverifikasi!');
          if (data.applicant) {
            setApplicant(data.applicant);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setMessage(err.message || 'Terjadi kesalahan saat memproses verifikasi email.');
      }
    }

    doVerify();

    return () => {
      isMounted = false;
    };
  }, [token, emailParam, apiBaseUrl]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendStatus({ type: 'error', text: 'Masukkan alamat email Anda.' });
      return;
    }

    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal mengirim ulang tautan verifikasi.');
      }

      setResendStatus({
        type: 'success',
        text: data.message || 'Tautan verifikasi baru telah dikirim ke email Anda. Silakan cek inbox atau spam.',
      });
    } catch (err: any) {
      setResendStatus({
        type: 'error',
        text: err.message || 'Gagal mengirim ulang tautan verifikasi.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 text-center animate-in fade-in">
      {/* 1. LOADING STATE */}
      {status === 'loading' && (
        <div className="py-8">
          <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs animate-pulse">
            <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Memverifikasi Akun Anda...
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Mohon tunggu sebentar, kami sedang memvalidasi tautan verifikasi email Anda ke database PMB.
          </p>
        </div>
      )}

      {/* 2. SUCCESS STATE */}
      {status === 'success' && (
        <div className="py-4">
          <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Email Berhasil Diverifikasi!
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
            Selamat, akun pendaftaran Anda di <strong>STKIP MAJENANG</strong> kini telah aktif dan siap digunakan.
          </p>

          {applicant && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Nama Lengkap</span>
                <span className="font-bold text-slate-800">{applicant.fullName || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Alamat Email</span>
                <span className="font-bold text-slate-800">{applicant.email || '-'}</span>
              </div>
              {applicant.registrationNumber && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Nomor Registrasi</span>
                  <span className="font-mono font-bold text-[#1E3A8A]">{applicant.registrationNumber}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href="/pmb/login"
              className="w-full py-3 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Akun PMB</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. ALREADY VERIFIED */}
      {status === 'already_verified' && (
        <div className="py-4">
          <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-9 h-9 text-[#1E3A8A]" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Akun Sudah Terverifikasi
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
            Alamat email Anda telah diverifikasi sebelumnya. Anda dapat langsung masuk ke portal PMB STKIP MAJENANG.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href="/pmb/login"
              className="w-full py-3 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Akun PMB</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. ERROR STATE */}
      {status === 'error' && (
        <div className="py-4">
          <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="w-9 h-9 text-rose-600" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Verifikasi Gagal
          </h1>

          <p className="text-xs sm:text-sm text-rose-700 max-w-md mx-auto leading-relaxed mb-6 font-medium">
            {message || 'Tautan verifikasi tidak valid atau masa berlakunya telah habis (melebihi 24 jam).'}
          </p>

          {/* Form Kirim Ulang Tautan */}
          <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left">
            <h2 className="font-bold text-xs sm:text-sm text-slate-800 mb-1">
              Kirim Ulang Tautan Verifikasi
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Masukkan email yang Anda gunakan saat mendaftar untuk menerima tautan verifikasi baru:
            </p>

            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                  required
                />
              </div>

              {resendStatus && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    resendStatus.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {resendStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{resendStatus.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isResending}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirimkan...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Kirim Tautan Baru</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href="/pmb/daftar"
              className="w-full py-2.5 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
            >
              Daftar Akun Baru
            </Link>
            <Link
              href="/pmb"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Beranda PMB</span>
            </Link>
          </div>
        </div>
      )}

      {/* 5. NO TOKEN STATE */}
      {status === 'no_token' && (
        <div className="py-4">
          <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="w-9 h-9 text-amber-600" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Tautan Tidak Valid
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
            Parameter verifikasi tidak ditemukan. Pastikan Anda mengeklik tautan lengkap yang kami kirimkan ke email Anda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              href="/pmb/daftar"
              className="w-full py-3 px-6 rounded-lg bg-[#1E3A8A] hover:bg-[#162d6b] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span>Daftar Akun PMB</span>
            </Link>
            <Link
              href="/pmb"
              className="w-full py-3 px-6 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PmbVerifikasiEmailPage() {
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
                  Verifikasi Akun PMB 2027/2028
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
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-10 text-center">
              <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Memuat halaman verifikasi...</p>
            </div>
          }
        >
          <VerificationContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4">
          &copy; 2027/2028 PMB Institut Teknologi Nusantara. Seluruh Hak Cipta Dilindungi.
        </div>
      </footer>
    </div>
  );
}
