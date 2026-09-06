'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Calendar,
  CreditCard,
  Users,
  BookOpen,
  Award,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'lecturer' | 'admin';
  userName: string;
  userIdText: string;
}

export function PortalLayout({ children, role, userName, userIdText }: PortalLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentNav = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Kartu Rencana Studi (KRS)', href: '/student#krs', icon: FileText },
    { name: 'Jadwal Kuliah', href: '/student#jadwal', icon: Calendar },
    { name: 'Kartu Hasil Studi (KHS)', href: '/student#khs', icon: Award },
    { name: 'Tagihan & Keuangan', href: '/student#keuangan', icon: CreditCard },
  ];

  const lecturerNav = [
    { name: 'Dashboard Dosen', href: '/lecturer', icon: LayoutDashboard },
    { name: 'Jadwal Mengajar', href: '/lecturer#jadwal', icon: Calendar },
    { name: 'Mahasiswa Bimbingan', href: '/lecturer#bimbingan', icon: Users },
    { name: 'Input Nilai Semester', href: '/lecturer#nilai', icon: Award },
  ];

  const adminNav = [
    { name: 'Dashboard BAAK', href: '/admin', icon: LayoutDashboard },
    { name: 'Data Mahasiswa', href: '/admin#mahasiswa', icon: Users },
    { name: 'Data Dosen', href: '/admin#dosen', icon: UserCheck },
    { name: 'Kurikulum & Mata Kuliah', href: '/admin#kurikulum', icon: BookOpen },
    { name: 'Pelaporan PDDIKTI', href: '/admin#pddikti', icon: ShieldCheck },
  ];

  const navItems = role === 'student' ? studentNav : role === 'lecturer' ? lecturerNav : adminNav;

  const roleLabel =
    role === 'student'
      ? 'Portal Mahasiswa'
      : role === 'lecturer'
        ? 'Portal Dosen'
        : 'Portal Administrator BAAK';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0A0F1D]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1E3A8A] border border-[#D4A017] text-white flex items-center justify-center font-bold text-sm">
                ITN
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  SIAKAD PREMIUM
                </span>
                <span className="text-[10px] text-blue-400 font-medium tracking-wide">
                  {roleLabel}
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Switcher Pills (Convenient for Review) */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
              Beralih Tampilan Demo:
            </p>
            <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-medium">
              <Link
                href="/student"
                className={`py-1.5 rounded-md transition-colors ${
                  role === 'student' ? 'bg-[#1E3A8A] text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                Mahasiswa
              </Link>
              <Link
                href="/lecturer"
                className={`py-1.5 rounded-md transition-colors ${
                  role === 'lecturer' ? 'bg-[#1E3A8A] text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                Dosen
              </Link>
              <Link
                href="/admin"
                className={`py-1.5 rounded-md transition-colors ${
                  role === 'admin' ? 'bg-[#1E3A8A] text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                BAAK
              </Link>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4A017]' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card Bottom */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0F1D]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#1E3A8A] border border-[#D4A017] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userIdText}</p>
              </div>
            </div>
            <Link
              href="/login"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                {roleLabel}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Institut Teknologi Nusantara &bull; TA 2026/2027 Gasal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Periode Badge */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Semester Gasal 2026/2027</span>
            </div>

            {/* Notification */}
            <button className="p-2 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-xl relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4A017] rounded-full"></span>
            </button>

            {/* Website Home Link */}
            <a
              href="http://localhost:3000"
              className="text-xs font-semibold text-[#1E3A8A] hover:underline px-2 hidden sm:block"
            >
              Website Kampus &rarr;
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
