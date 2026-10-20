'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { CampusLogo } from '@/components/common/CampusLogo';
import { useInstitution } from '@/lib/useInstitution';
import { getApiBaseUrl } from '@/lib/api';

function messageOf(json: any, fallback: string) {
  const m = json?.message;
  return Array.isArray(m) ? m.join(', ') : m || fallback;
}

function LupaKataSandiForm() {
  const params = useSearchParams();
  const token = params.get('token');
  const profile = useInstitution();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const call = async (path: string, body: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 429) {
        const secs = Number(json?.retryAfter) || 0;
        const wait = secs > 0 ? (secs < 60 ? `${secs} detik` : `${Math.ceil(secs / 60)} menit`) : 'beberapa saat';
        throw new Error(`Terlalu banyak percobaan. Silakan coba lagi dalam ${wait}.`);
      }
      if (!res.ok) throw new Error(messageOf(json, 'Permintaan gagal. Silakan coba lagi.'));
      setDone(json?.data?.message ?? json?.message ?? 'Berhasil.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permintaan gagal. Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return setError('Isi NIM, NIDN, atau email Anda.');
    void call('forgot-password', { identifier: identifier.trim() });
  };

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Kata sandi baru minimal 8 karakter.');
    if (password !== confirm) return setError('Konfirmasi kata sandi tidak sama.');
    void call('reset-password', { token, password });
  };

  const inputCls =
    'block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Masuk
          </Link>
        </div>

        <div className="text-center">
          <CampusLogo
            url={profile.logoUrl}
            initials={profile.logoInitials}
            className="mx-auto w-14 h-14 rounded-full bg-[#1E3A8A] border-2 border-[#D4A017] flex items-center justify-center text-white font-extrabold text-xl shadow-md"
          />
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            {token ? 'Buat Kata Sandi Baru' : 'Lupa Kata Sandi'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {token
              ? 'Masukkan kata sandi baru untuk akun portal Anda.'
              : 'Masukkan NIM, NIDN, atau email Anda. Kami kirim tautan atur ulang ke email akun.'}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-8">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm text-slate-700 leading-relaxed">{done}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs shadow-md"
              >
                Ke Halaman Masuk
              </Link>
            </div>
          ) : token ? (
            <form onSubmit={submitReset} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ulangi Kata Sandi Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {busy ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitRequest} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIM / NIDN / Email Kampus</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: 270010016 atau nama@email.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {busy ? 'Mengirim...' : 'Kirim Tautan Atur Ulang'}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Tautan dikirim ke email yang terdaftar di akun Anda dan berlaku 1 jam. Bila email sudah tidak aktif, hubungi BAAK.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LupaKataSandiPage() {
  return (
    <Suspense fallback={null}>
      <LupaKataSandiForm />
    </Suspense>
  );
}
