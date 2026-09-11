'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

import { saveAuthSession, getAuthSession, getRoleRedirectPath } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const apiBaseUrl = getApiBaseUrl();

  // Kalo sudah login, langsung arahkan ke dashboard sesuai role
  useEffect(() => {
    const { token, user } = getAuthSession();
    if (token && user?.role) {
      const targetPath = getRoleRedirectPath(user.role);
      router.replace(targetPath);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!res.ok || !resData?.data) {
        throw new Error(resData?.message || 'Email atau password yang Anda masukkan salah.');
      }

      const { accessToken, user } = resData.data;

      // Simpan session & token
      saveAuthSession(accessToken, user);

      // Arahkan otomatis ke halaman sesuai role aktual dari backend atau spesifik LP3M / PMB
      let targetPath = getRoleRedirectPath(user.role);
      if (user.email === 'lp3m@itn.ac.id' || user.email === 'p3m@itn.ac.id') {
        targetPath = '/admin/p3m';
      }
      if (user.email === 'admin.pmb@itn.ac.id' || user.email === 'pmb@itn.ac.id' || user.role === 'ADMIN_PMB') {
        targetPath = '/admin/pmb';
      }
      router.push(targetPath);
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan saat memproses login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Back Link */}
        <div className="mb-6 flex justify-center">
          <a
            href={process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Website Utama Kampus</span>
          </a>
        </div>

        {/* Brand Logo & Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#1E3A8A] border-2 border-[#D4A017] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            ITN
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Portal SIAKAD Premium
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sistem Informasi Akademik Terpadu Institut Teknologi Nusantara
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-slate-200/90">
          
          {/* Error Alert */}
          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 animate-ping"></span>
              <span className="font-semibold">{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Kampus atau Akun Resmi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="nama@itn.ac.id"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4A017]" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                Pilih Akun Demo (Klik untuk isi cepat):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'admin.pmb@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-950 text-xs font-bold text-left transition-all cursor-pointer col-span-2 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <span className="block font-bold">📋 Admin PMB (Penerimaan Mahasiswa Baru)</span>
                    <span className="text-[10px] text-amber-700 font-normal">admin.pmb@itn.ac.id</span>
                  </div>
                  <span className="text-[10px] bg-[#D4A017] text-slate-950 px-2 py-0.5 rounded-md font-extrabold">Akun PMB</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'lp3m@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#1E3A8A] text-xs font-bold text-left transition-all cursor-pointer col-span-2 flex items-center justify-between"
                >
                  <div>
                    <span className="block font-bold">🔬 Pengelola Riset & LP3M</span>
                    <span className="text-[10px] text-blue-700 font-normal">lp3m@itn.ac.id</span>
                  </div>
                  <span className="text-[10px] bg-[#1E3A8A] text-white px-2 py-0.5 rounded-md font-semibold">Demo LP3M</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'keuangan@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-bold text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold">💰 Biro Keuangan</span>
                  <span className="text-[10px] text-amber-700 font-normal">keuangan@itn.ac.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'admin@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold">🏛️ Admin BAAK</span>
                  <span className="text-[10px] text-slate-500 font-normal">admin@itn.ac.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'student@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold">🎓 Mahasiswa</span>
                  <span className="text-[10px] text-slate-500 font-normal">student@itn.ac.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'lecturer@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold">👨‍🏫 Dosen</span>
                  <span className="text-[10px] text-slate-500 font-normal">lecturer@itn.ac.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'superadmin@itn.ac.id');
                    setValue('password', 'Password123!');
                  }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left transition-all cursor-pointer col-span-2"
                >
                  <span className="block font-bold">⚡ Super Admin</span>
                  <span className="text-[10px] text-slate-500 font-normal">superadmin@itn.ac.id</span>
                </button>
              </div>
            </div>
          </form>

        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Koneksi aman terenkripsi SSL 256-bit &bull; SSO ITN</span>
        </div>

        {/* PMB Register Shortcut */}
        <div className="mt-4 pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
          <span>Calon Mahasiswa Baru? </span>
          <Link
            href="/pmb/daftar"
            className="font-bold text-[#1E3A8A] hover:underline"
          >
            Register Akun PMB Online Disini &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
