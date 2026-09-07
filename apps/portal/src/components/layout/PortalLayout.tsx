'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuthSession, clearAuthSession, getPortalRoleFromBackend, isRouteAllowedForRole, getRoleRedirectPath, AuthUser } from '@/lib/auth';
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
  ChevronLeft,
  ShieldCheck,
  UserCheck,
  Globe,
  Sliders,
  Eye,
  BarChart3,
  Activity,
  TrendingUp,
  Building2,
  Key,
  Layers,
  Settings,
  Database,
  ListOrdered,
  Clock,
  Mail,
  MessageSquare,
  HardDrive,
  Code2,
  Share2,
  Cpu,
  ScrollText,
  User,
  Lock,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Landmark,
  DoorOpen,
  Briefcase,
  UserPlus,
  CalendarDays,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'lecturer' | 'admin' | 'superadmin';
  userName: string;
  userIdText: string;
}

export function PortalLayout({ children, role, userName, userIdText }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<'student' | 'lecturer' | 'admin' | 'superadmin'>(role);
  const [isVerifying, setIsVerifying] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('siakad_sidebar_open', String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('siakad_sidebar_open');
      if (saved !== null) {
        setSidebarOpen(saved === 'true');
      } else if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const { token, user } = getAuthSession();

    // 1. Kalo belum login: KELUARKAN dan arahkan ke /login
    if (!token || !user) {
      router.replace('/login');
      return;
    }

    setCurrentUser(user);
    const computedRole = getPortalRoleFromBackend(user.role);
    setEffectiveRole(computedRole);

    // 2. Kalo sudah login: Pastikan rute yang diakses sesuai dengan rolenya
    const isAllowed = isRouteAllowedForRole(pathname, user.role);
    if (!isAllowed) {
      const target = getRoleRedirectPath(user.role);
      router.replace(target);
      return;
    }

    setIsVerifying(false);
  }, [pathname, router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const studentNavGroups = [
    {
      title: 'MENU UTAMA',
      items: [{ name: 'Dashboard', href: '/student', icon: LayoutDashboard }],
    },
    {
      title: 'AKADEMIK & STUDI',
      items: [
        { name: 'Rencana Studi (KRS)', href: '/student#krs', icon: FileText },
        { name: 'Jadwal Kuliah', href: '/student#jadwal', icon: Calendar },
        { name: 'Hasil Studi (KHS)', href: '/student#khs', icon: Award },
      ],
    },
    {
      title: 'KEUANGAN',
      items: [{ name: 'Tagihan & Pembayaran', href: '/student#keuangan', icon: CreditCard }],
    },
  ];

  const lecturerNavGroups = [
    {
      title: 'MENU UTAMA',
      items: [{ name: 'Dashboard Dosen', href: '/lecturer', icon: LayoutDashboard }],
    },
    {
      title: 'PENGAJARAN & NILAI',
      items: [
        { name: 'Jadwal Mengajar', href: '/lecturer#jadwal', icon: Calendar },
        { name: 'Input Nilai Semester', href: '/lecturer#nilai', icon: Award },
      ],
    },
    {
      title: 'BIMBINGAN',
      items: [{ name: 'Mahasiswa Bimbingan PA', href: '/lecturer#bimbingan', icon: Users }],
    },
  ];

  const adminNavGroups = [
    {
      title: 'ADMINISTRASI AKADEMIK',
      items: [
        { name: 'Dashboard BAAK', href: '/admin', icon: LayoutDashboard },
        { name: 'Data Mahasiswa', href: '/admin#mahasiswa', icon: Users },
        { name: 'Data Dosen', href: '/admin#dosen', icon: UserCheck },
        { name: 'Kurikulum & Mata Kuliah', href: '/admin#kurikulum', icon: BookOpen },
      ],
    },
    {
      title: 'PELAPORAN & INTEGRASI',
      items: [{ name: 'Pelaporan PDDIKTI', href: '/admin#pddikti', icon: ShieldCheck }],
    },
  ];

  const superAdminNavGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Dashboard', href: '/admin/superadmin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { name: 'Profil Institusi', href: '/admin/superadmin/institusi', icon: Building2 },
        { name: 'Fakultas', href: '/admin/superadmin/fakultas', icon: Landmark },
        { name: 'Program Studi', href: '/admin/superadmin/prodi', icon: GraduationCap },
        { name: 'Kurikulum', href: '/admin/superadmin/kurikulum', icon: FileText },
        { name: 'Mata Kuliah', href: '/admin/superadmin/mata-kuliah', icon: BookOpen },
        { name: 'Gedung', href: '/admin/superadmin/gedung', icon: Building2 },
        { name: 'Ruang', href: '/admin/superadmin/ruang', icon: DoorOpen },
        { name: 'Kalender Akademik', href: '/admin/superadmin/kalender', icon: CalendarDays },
      ],
    },
    {
      title: 'AKADEMIK',
      items: [
        { name: 'Tahun Akademik', href: '/admin/superadmin/tahun-akademik', icon: Calendar },
        { name: 'Semester', href: '/admin/superadmin/semester', icon: Clock },
        { name: 'Jadwal', href: '/admin/superadmin#jadwal', icon: CalendarDays },
        { name: 'KRS', href: '/admin/superadmin#krs', icon: FileText },
        { name: 'Nilai', href: '/admin/superadmin#nilai', icon: Award },
        { name: 'Presensi', href: '/admin/superadmin#presensi', icon: UserCheck },
      ],
    },
    {
      title: 'PENGGUNA',
      items: [
        { name: 'Mahasiswa', href: '/admin/superadmin#mahasiswa', icon: Users },
        { name: 'Dosen', href: '/admin/superadmin#dosen', icon: UserCheck },
        { name: 'Pegawai', href: '/admin/superadmin#pegawai', icon: Briefcase },
        { name: 'User', href: '/admin/superadmin#users', icon: User },
        { name: 'Role & Permission', href: '/admin/superadmin#roles', icon: ShieldCheck },
      ],
    },
    {
      title: 'PMB',
      items: [
        { name: 'Gelombang', href: '/admin/superadmin#pmb-gelombang', icon: Layers },
        { name: 'Jalur', href: '/admin/superadmin#pmb-jalur', icon: Sliders },
        { name: 'Pendaftar', href: '/admin/superadmin#pmb-pendaftar', icon: UserPlus },
      ],
    },
    {
      title: 'KEUANGAN',
      items: [
        { name: 'Tagihan & Pembayaran', href: '/admin/superadmin#keuangan', icon: CreditCard },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
        { name: 'Laporan Akademik & PDDIKTI', href: '/admin/superadmin#laporan', icon: BarChart3 },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        { name: 'Monitoring Sistem', href: '/admin/superadmin#monitoring', icon: Activity },
      ],
    },
    {
      title: 'PENGATURAN SISTEM',
      items: [
        { name: 'Pengaturan Sistem', href: '/admin/superadmin#pengaturan', icon: Settings },
        { name: 'Logout', href: '#logout', icon: LogOut, isLogout: true },
      ],
    },
  ];

  const navGroups =
    effectiveRole === 'student'
      ? studentNavGroups
      : effectiveRole === 'lecturer'
        ? lecturerNavGroups
        : effectiveRole === 'superadmin'
          ? superAdminNavGroups
          : adminNavGroups;

  const roleLabel =
    effectiveRole === 'student'
      ? 'Portal Mahasiswa'
      : effectiveRole === 'lecturer'
        ? 'Portal Dosen'
        : effectiveRole === 'superadmin'
          ? 'Super Administrator'
          : 'Administrator BAAK';

  const displayName = currentUser?.fullName || userName;
  const displayId =
    currentUser?.email ||
    userIdText ||
    (effectiveRole === 'superadmin'
      ? 'Super Administrator (Platform)'
      : effectiveRole === 'admin'
        ? 'Biro BAAK Pusat'
        : effectiveRole === 'lecturer'
          ? 'Dosen Pengajar'
          : 'Mahasiswa Aktif');

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-9 h-9 rounded-full border-2 border-slate-700 border-t-[#D4A017] animate-spin mb-3"></div>
        <p className="text-white font-medium text-xs tracking-wide">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on Viewport with toggle) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {/* Logo & Platform Info */}
          <div className="p-5 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 border border-[#D4A017] flex items-center justify-center text-white font-black text-base shadow-sm">
                ITN
              </div>
              <div>
                <span className="text-sm font-extrabold text-white tracking-wide block">
                  SIAKAD PREMIUM
                </span>
                <span className="text-[10px] text-[#D4A017] font-semibold tracking-wider uppercase block">
                  {effectiveRole === 'superadmin' ? 'Super Administrator' : roleLabel}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links Grouped Automatically by Category */}
          <nav className="p-3.5 space-y-3.5">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 pt-1">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  if ((item as any).isLogout) {
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setSidebarOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all cursor-pointer text-left"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{item.name}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#1E3A8A] text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4A017]' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Card Bottom */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0F1D] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#1E3A8A] border border-[#D4A017] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {displayName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayId}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Smooth offset transition) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
          <div className="flex items-center gap-3">
            {/* Single Toggle Button (Icon Only, No Text) */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
              title={sidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-slate-600" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-[#1E3A8A]" />
              )}
            </button>

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

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
