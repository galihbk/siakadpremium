'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, ArrowRight, Shield, GraduationCap, UserCheck, ArrowLeft, CheckCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'lecturer' | 'admin'>('student');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'mahasiswa@itn.ac.id',
      password: 'Password123!',
    },
  });

  const handleRoleChange = (role: 'student' | 'lecturer' | 'admin') => {
    setSelectedRole(role);
    if (role === 'student') {
      setValue('email', 'mahasiswa@itn.ac.id');
    } else if (role === 'lecturer') {
      setValue('email', 'dosen@itn.ac.id');
    } else {
      setValue('email', 'admin@itn.ac.id');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (selectedRole === 'student') router.push('/student');
      else if (selectedRole === 'lecturer') router.push('/lecturer');
      else router.push('/admin');
    }, 600);
  };

  const quickLogin = (role: 'student' | 'lecturer' | 'admin') => {
    handleRoleChange(role);
    if (role === 'student') router.push('/student');
    else if (role === 'lecturer') router.push('/lecturer');
    else router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Back Link to Landing Page */}
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Website Utama Kampus</span>
          </Link>
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
          
          {/* Role Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pilih Akses Masuk:
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'student'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 mb-1" />
                <span>Mahasiswa</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('lecturer')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'lecturer'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 mb-1" />
                <span>Dosen</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 mb-1" />
                <span>BAAK / Admin</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedRole === 'student' ? 'NIM atau Email Kampus' : 'NIDN atau Email Resmi'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                  placeholder="nama@itn.ac.id"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <a href="#" className="text-xs font-medium text-[#1E3A8A] hover:underline">
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] focus:outline-none transition-all"
            >
              {isLoading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Akses Demo Cepat (1-Klik):
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => quickLogin('student')}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 flex items-center justify-between border border-blue-200/60"
              >
                <span>Masuk sebagai <strong>Mahasiswa</strong></span>
                <span className="text-[10px] text-slate-500">NIM: 2311501001 &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('lecturer')}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-between border border-emerald-200/60"
              >
                <span>Masuk sebagai <strong>Dosen PA</strong></span>
                <span className="text-[10px] text-slate-500">NIDN: 0412088501 &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 flex items-center justify-between border border-purple-200/60"
              >
                <span>Masuk sebagai <strong>Admin BAAK</strong></span>
                <span className="text-[10px] text-slate-500">Administrator &rarr;</span>
              </button>
            </div>
          </div>

        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Koneksi aman terenkripsi SSL 256-bit &bull; SSO ITN</span>
        </div>

      </div>
    </div>
  );
}
