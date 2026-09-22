'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  getAuthSession,
  clearAuthSession,
  getPortalRoleFromBackend,
  isRouteAllowedForRole,
  getRoleRedirectPath,
  AuthUser,
} from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { getInstitutionProfile, FALLBACK_INSTITUTION_PROFILE, type InstitutionProfile } from '@/lib/institution';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Calendar,
  CreditCard,
  Users,
  BookOpen,
  Award,
  FlaskConical,
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
  Briefcase,
  UserPlus,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Wallet,
  Hash,
  ClipboardCheck,
  FileSignature,
  UploadCloud,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'lecturer' | 'admin' | 'superadmin' | 'finance' | 'lp3m' | 'pmb';
  userName?: string;
  userIdText?: string;
  activeMenuHref?: string;
}

export function PortalLayout({ children, role, userName, userIdText, activeMenuHref }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile>(FALLBACK_INSTITUTION_PROFILE);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<
    'student' | 'lecturer' | 'admin' | 'superadmin' | 'finance' | 'lp3m' | 'pmb'
  >(role);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  // Edit Profile Modal State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('siakad_sidebar_open', String(next));
      }
      return next;
    });
  };

  const syncCurrentUser = () => {
    const { user } = getAuthSession();
    if (user) {
      setCurrentUser(user);
    }
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
    getInstitutionProfile().then(setInstitutionProfile);
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

  // Listen for local storage profile updates & custom siakad_profile_updated event
  useEffect(() => {
    window.addEventListener('storage', syncCurrentUser);
    window.addEventListener('siakad_profile_updated', syncCurrentUser);
    return () => {
      window.removeEventListener('storage', syncCurrentUser);
      window.removeEventListener('siakad_profile_updated', syncCurrentUser);
    };
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const { token, user } = getAuthSession();

    // 1. Kalo belum login: KELUARKAN dan arahkan ke /login
    if (!token || !user) {
      setIsVerifying(false);
      setIsAuthorized(false);
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
      return;
    }

    setCurrentUser(user);
    let computedRole = getPortalRoleFromBackend(user.role, user.email);
    if (role === 'lp3m' || user.email === 'lp3m@itn.ac.id' || pathname.startsWith('/admin/p3m')) {
      computedRole = 'lp3m';
    }
    setEffectiveRole(computedRole);

    // 2. Kalo sudah login: Pastikan rute yang diakses sesuai dengan rolenya
    const isAllowed = isRouteAllowedForRole(pathname, user.role);
    if (!isAllowed) {
      const target = getRoleRedirectPath(user.role);
      setIsAuthorized(false);
      setIsVerifying(false);
      if (typeof window !== 'undefined' && target !== pathname) {
        window.location.replace(target);
      }
      return;
    }

    setIsAuthorized(true);
    setIsVerifying(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) return;

    setIsSavingProfile(true);
    try {
      const { user } = getAuthSession();
      const updatedUser: AuthUser = {
        ...(user || {
          id: 'user-' + Date.now(),
          email: displayId.includes('@') ? displayId : 'admin.pmb@itn.ac.id',
          role: 'ADMIN_PMB',
        }),
        fullName: editFullName.trim(),
        avatarUrl: editAvatarUrl.trim() || null,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('siakad_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('siakad_profile_updated'));
      }
      setCurrentUser(updatedUser);

      try {
        const apiBase = getApiBaseUrl();
        await fetch(`${apiBase}/auth/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': updatedUser.id,
          },
          body: JSON.stringify({
            fullName: updatedUser.fullName,
            avatarUrl: updatedUser.avatarUrl,
          }),
        });
      } catch {
        // local state update is sufficient if backend is in dev mode
      }

      setProfileSuccessMsg('Profil berhasil diperbarui!');
      setTimeout(() => {
        setEditProfileModalOpen(false);
        setProfileSuccessMsg('');
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const studentNavGroups = [
    {
      title: 'MENU UTAMA',
      items: [
        { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
        { name: 'Profil', href: '/student/profil', icon: User },
      ],
    },
    {
      title: 'AKADEMIK & STUDI',
      items: [
        { name: 'Rencana Studi (KRS)', href: '/student/krs', icon: FileText },
        { name: 'Jadwal Kuliah', href: '/student/jadwal', icon: Calendar },
        { name: 'Hasil Studi (KHS)', href: '/student/khs', icon: Award },
        { name: 'Layanan Surat', href: '/student/surat', icon: Mail },
      ],
    },
    {
      title: 'KEUANGAN',
      items: [{ name: 'Tagihan & Pembayaran', href: '/student/keuangan', icon: CreditCard }],
    },
  ];

  const lecturerNavGroups = [
    {
      title: 'MENU UTAMA',
      items: [
        { name: 'Dashboard Dosen', href: '/lecturer', icon: LayoutDashboard },
        { name: 'Profil', href: '/lecturer/profil', icon: User },
      ],
    },
    {
      title: 'PENGAJARAN & NILAI',
      items: [
        { name: 'Jadwal Mengajar', href: '/lecturer/jadwal', icon: Calendar },
        { name: 'Absensi Perkuliahan', href: '/lecturer/absensi', icon: ClipboardCheck },
        { name: 'Kontrak Kuliah', href: '/lecturer/kontrak', icon: FileSignature },
        { name: 'Upload RPS', href: '/lecturer/rps', icon: UploadCloud },
        { name: 'Input Nilai Semester', href: '/lecturer/nilai', icon: Award },
      ],
    },
    {
      title: 'BIMBINGAN',
      items: [{ name: 'Mahasiswa Bimbingan PA', href: '/lecturer/bimbingan', icon: Users }],
    },
    {
      title: 'PENELITIAN & PENGABDIAN (P3M)',
      items: [
        { name: 'Laporan Penelitian & PkM', href: '/lecturer/p3m', icon: FlaskConical },
      ],
    },
  ];

  const adminNavGroups = [
    {
      title: 'DASHBOARD',
      items: [{ name: 'Dashboard BAAK', href: '/admin', icon: LayoutDashboard }],
    },
    {
      title: 'ADMINISTRASI AKADEMIK',
      items: [
        { name: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: Users },
        { name: 'Data Dosen', href: '/admin/dosen', icon: UserCheck },
        { name: 'Kurikulum & Mata Kuliah', href: '/admin/kurikulum', icon: BookOpen },
        { name: 'Master Kurikulum', href: '/admin/master-kurikulum', icon: Layers },
        { name: 'Tahun Akademik', href: '/admin/tahun-akademik', icon: Calendar },
        { name: 'Jadwal', href: '/admin/jadwal', icon: CalendarDays },
        { name: 'KRS', href: '/admin/krs', icon: FileText },
        { name: 'Nilai', href: '/admin/nilai', icon: Award },
        { name: 'Skala Nilai', href: '/admin/skala-nilai', icon: Award },
        { name: 'Presensi', href: '/admin/presensi', icon: UserCheck },
      ],
    },
    {
      title: 'PELAPORAN & INTEGRASI',
      items: [
        { name: 'Pelaporan PDDIKTI', href: '/admin/laporan', icon: ShieldCheck },
      ],
    },
  ];

  const superAdminNavGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Dashboard', href: '/admin/superadmin', icon: LayoutDashboard },
        { name: 'Monitoring Server', href: '/admin/superadmin/monitoring', icon: Activity },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { name: 'Profil Institusi', href: '/admin/superadmin/institusi', icon: Building2 },
        { name: 'Fakultas', href: '/admin/superadmin/fakultas', icon: Landmark },
        { name: 'Program Studi', href: '/admin/superadmin/prodi', icon: GraduationCap },
        { name: 'Kalender Akademik', href: '/admin/superadmin/kalender', icon: CalendarDays },
      ],
    },
    {
      title: 'PENGGUNA',
      items: [
        { name: 'Mahasiswa', href: '/admin/superadmin/mahasiswa', icon: Users },
        { name: 'Dosen', href: '/admin/superadmin/dosen', icon: UserCheck },
        { name: 'Pegawai', href: '/admin/superadmin/pegawai', icon: Briefcase },
        { name: 'User', href: '/admin/superadmin/users', icon: User },
      ],
    },
    {
      title: 'PENGATURAN SISTEM',
      items: [
        { name: 'Format NIM', href: '/admin/superadmin/format-nim', icon: Hash },
        { name: 'Pengaturan Bank', href: '/admin/superadmin/pengaturan-bank', icon: Landmark },
        { name: 'Pengaturan DIKTI', href: '/admin/superadmin/pengaturan-dikti', icon: ShieldCheck },
        { name: 'Pengaturan Sistem', href: '/admin/superadmin/pengaturan', icon: Settings },
        { name: 'Logout', href: '#logout', icon: LogOut, isLogout: true },
      ],
    },
  ];

  const financeNavGroups = [
    {
      title: 'MENU UTAMA',
      items: [
        { name: 'Dashboard Keuangan', href: '/finance', icon: LayoutDashboard },
      ],
    },
    {
      title: 'PENERIMAAN & TAGIHAN',
      items: [
        { name: 'Penerimaan SPP & UKT', href: '/finance/penerimaan', icon: CreditCard },
        { name: 'Daftar Tagihan Mahasiswa', href: '/finance/tagihan', icon: FileText },
        { name: 'Verifikasi Pembayaran', href: '/finance/verifikasi', icon: ShieldCheck },
        { name: 'Aturan Biaya Perkuliahan', href: '/finance/aturan-pembiayaan', icon: BookOpen },
      ],
    },
    {
      title: 'KAS & ANGGARAN',
      items: [
        { name: 'Rekening Bank & Kas', href: '/finance/rekening', icon: Landmark },
        { name: 'Realisasi Anggaran Kampus', href: '/finance/anggaran', icon: TrendingUp },
      ],
    },
  ];

  const lp3mNavGroups = [
    {
      title: 'MENU UTAMA LP3M',
      items: [
        { name: 'Dashboard LP3M', href: '/admin/p3m', icon: LayoutDashboard },
      ],
    },
    {
      title: 'TRI DHARMA & RISET',
      items: [
        { name: 'Laporan Penelitian', href: '/admin/p3m/penelitian', icon: BookOpen },
        { name: 'Pengabdian (PkM)', href: '/admin/p3m/pengabdian', icon: Users },
        { name: 'Sentra HAKI & Paten', href: '/admin/p3m/haki', icon: Award },
      ],
    },
    {
      title: 'REGULASI & DOKUMEN',
      items: [
        { name: 'Bank Dokumen Panduan', href: '/admin/p3m/dokumen', icon: FileText },
        { name: 'Rekap Borang Akreditasi', href: '/admin/p3m/borang', icon: BarChart3 },
      ],
    },
    {
      title: 'AKUN & SISTEM',
      items: [
        { name: 'Logout', href: '#logout', icon: LogOut, isLogout: true },
      ],
    },
  ];

  const pmbNavGroups = [
    {
      title: 'MENU UTAMA PMB',
      items: [
        { name: 'Dashboard PMB', href: '/admin/pmb', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SELEKSI & PENDAFTARAN',
      items: [
        { name: 'Gelombang Pendaftaran', href: '/admin/pmb/gelombang', icon: CalendarDays },
        { name: 'Jalur, Jenis & Kelas', href: '/admin/pmb/jalur', icon: Layers },
        { name: 'Data Calon Mahasiswa', href: '/admin/pmb/pendaftar', icon: Users },
        { name: 'Verifikasi Berkas', href: '/admin/pmb/verifikasi', icon: CheckCircle2 },
        { name: 'Kelulusan & Registrasi', href: '/admin/pmb/kelulusan', icon: GraduationCap },
        { name: 'Pembayaran & Keuangan', href: '/admin/pmb/biaya', icon: CreditCard },
        { name: 'Data Affiliate', href: '/admin/pmb/affiliate', icon: Share2 },
      ],
    },
    {
      title: 'LAPORAN & STATISTIK',
      items: [
        { name: 'Rekapitulasi PMB', href: '/admin/pmb/statistik', icon: BarChart3 },
      ],
    },
    {
      title: 'AKUN & SISTEM',
      items: [
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
          : effectiveRole === 'finance'
            ? financeNavGroups
            : effectiveRole === 'lp3m'
              ? lp3mNavGroups
              : effectiveRole === 'pmb'
                ? pmbNavGroups
                : adminNavGroups;

  const roleLabel =
    effectiveRole === 'student'
      ? 'Portal Mahasiswa'
      : effectiveRole === 'lecturer'
        ? 'Portal Dosen'
        : effectiveRole === 'superadmin'
          ? 'Super Administrator'
          : effectiveRole === 'finance'
            ? 'Biro Keuangan (Finance)'
            : effectiveRole === 'lp3m'
              ? 'Lembaga Penelitian & Pengabdian (LP3M)'
              : effectiveRole === 'pmb'
                ? 'Panitia PMB (Admissions)'
                : 'Administrator BAAK';

  const defaultNameByRole =
    effectiveRole === 'student'
      ? 'Mahasiswa ITN'
      : effectiveRole === 'lecturer'
        ? 'Dosen Pengajar ITN'
        : effectiveRole === 'superadmin'
          ? 'Super Administrator'
          : effectiveRole === 'finance'
            ? 'Biro Keuangan'
            : effectiveRole === 'lp3m'
              ? 'Pengelola / Reviewer LP3M'
              : effectiveRole === 'pmb'
                ? 'Panitia PMB ITN'
                : 'Administrator BAAK';

  const displayName = currentUser?.fullName || userName || defaultNameByRole;
  const displayAvatar = currentUser?.avatarUrl;
  const displayId =
    currentUser?.email ||
    userIdText ||
    (effectiveRole === 'superadmin'
      ? 'Super Administrator (Platform)'
      : effectiveRole === 'lp3m'
        ? 'Pengelola / Reviewer LP3M'
        : effectiveRole === 'pmb'
          ? 'Panitia Penerimaan Mahasiswa Baru'
          : effectiveRole === 'finance'
            ? 'Biro Keuangan Kampus'
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

  // Jika user tidak memiliki akses, tampilkan layar kosong saat redirect berlangsung
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-9 h-9 rounded-full border-2 border-slate-700 border-t-rose-500 animate-spin mb-3"></div>
        <p className="text-white font-medium text-xs tracking-wide mb-6">Mengalihkan halaman...</p>
        <button
          onClick={() => {
            clearAuthSession();
            window.location.replace('/login');
          }}
          className="text-[11px] text-slate-500 hover:text-rose-400 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Keluar / Ganti Akun
        </button>
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
                  {effectiveRole === 'lp3m' ? 'Lembaga Penelitian & Pengabdian' : effectiveRole === 'superadmin' ? 'Super Administrator' : roleLabel}
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
                  const isDashboardRoute = [
                    '/student',
                    '/lecturer',
                    '/admin',
                    '/admin/superadmin',
                    '/finance',
                    '/admin/p3m',
                    '/admin/pmb',
                  ].includes(item.href);

                  const isActive = activeMenuHref
                    ? item.href === activeMenuHref
                    : item.href === pathname
                      ? true
                      : !isDashboardRoute &&
                        item.href !== '/' &&
                        !item.href.includes('?') &&
                        !item.href.includes('#') &&
                        pathname.startsWith(item.href + '/');

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
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4A017]' : 'text-slate-400'}`}
                      />
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
            <button
              type="button"
              onClick={() => {
                if (effectiveRole === 'student') {
                  router.push('/student/profil');
                } else if (effectiveRole === 'lecturer') {
                  router.push('/lecturer/profil');
                } else {
                  setEditFullName(currentUser?.fullName || displayName);
                  setEditAvatarUrl(currentUser?.avatarUrl || '');
                  setProfileSuccessMsg('');
                  setEditProfileModalOpen(true);
                }
              }}
              className="flex items-center gap-2.5 overflow-hidden group hover:opacity-90 transition-opacity text-left cursor-pointer"
              title="Lihat & Edit Profil"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1E3A8A] border border-[#D4A017] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate group-hover:text-[#D4A017] transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{displayId}</p>
              </div>
            </button>
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
        {/* Header / Navbar */}
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
                {institutionProfile.campusName} &bull; TA {institutionProfile.activeAcademicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Periode Badge */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Semester {institutionProfile.activeSemester} {institutionProfile.activeAcademicYear}</span>
            </div>

            {/* Notification */}
            <button className="p-2 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-xl relative transition-colors" title="Notifikasi">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4A017] rounded-full"></span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* User Profile Button in Navbar with Photo & Name */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/90 hover:border-slate-300 transition-all cursor-pointer group bg-white shadow-2xs"
                aria-expanded={profileDropdownOpen}
                aria-label="Menu Profil"
              >
                {/* Photo / Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#1E3A8A] to-blue-600 border-2 border-[#D4A017] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-2 ring-blue-50">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Name & Role on Desktop */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#1E3A8A] transition-colors line-clamp-1 max-w-[120px] md:max-w-[160px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none">
                    {effectiveRole === 'student'
                      ? 'Mahasiswa'
                      : effectiveRole === 'lecturer'
                        ? 'Dosen'
                        : effectiveRole === 'lp3m'
                          ? 'Ketua LP3M & Reviewer'
                          : effectiveRole === 'superadmin'
                            ? 'Super Admin'
                            : effectiveRole === 'finance'
                              ? 'Biro Keuangan'
                              : effectiveRole === 'pmb'
                                ? 'Panitia PMB'
                                : 'Admin BAAK'}
                  </span>
                </div>

                {/* Dropdown Chevron */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-[#1E3A8A]' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown User Info */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1E3A8A] border-2 border-[#D4A017] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {displayAvatar ? (
                          <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{displayId}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A]">
                          {effectiveRole === 'student'
                            ? 'Mahasiswa Aktif'
                            : effectiveRole === 'finance'
                              ? 'Biro Keuangan'
                              : effectiveRole === 'pmb'
                                ? 'Panitia PMB'
                                : effectiveRole === 'lp3m'
                                  ? 'LP3M'
                                  : effectiveRole === 'superadmin'
                                    ? 'Super Admin'
                                    : 'Admin BAAK'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="px-2 py-1.5 space-y-1">
                    {effectiveRole === 'student' || effectiveRole === 'lecturer' ? (
                      <Link
                        href={effectiveRole === 'student' ? '/student/profil' : '/lecturer/profil'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50/70 rounded-xl transition-all"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Lihat & Ganti Profil</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setEditFullName(currentUser?.fullName || displayName);
                          setEditAvatarUrl(currentUser?.avatarUrl || '');
                          setProfileSuccessMsg('');
                          setEditProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50/70 rounded-xl transition-all text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Lihat & Ganti Profil</span>
                      </button>
                    )}

                    {(effectiveRole === 'student' || effectiveRole === 'lecturer') && (
                      <Link
                        href={effectiveRole === 'student' ? '/student/profil#keamanan' : '/lecturer/profil#keamanan'}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50/70 rounded-xl transition-all"
                      >
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Ganti Password</span>
                      </Link>
                    )}

                    <a
                      href="http://localhost:3000"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50/70 rounded-xl transition-all"
                    >
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>Website Kampus</span>
                    </a>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-1" />

                  {/* Logout Action */}
                  <div className="px-2">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Keluar / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1 overflow-auto">{children}</main>
      </div>

      {/* Modal Edit Profil Pengguna */}
      {editProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pengaturan Profil Pengguna</h3>
                <p className="text-xs text-slate-500">Perbarui identitas profil yang tampil di sistem</p>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {/* Avatar Preview */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1E3A8A] border-2 border-[#D4A017] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                  {editAvatarUrl.trim() ? (
                    <img
                      src={editAvatarUrl.trim()}
                      alt={editFullName || displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    (editFullName || displayName).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {editFullName || displayName}
                  </span>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A]">
                    {effectiveRole === 'pmb' ? 'Panitia PMB' : roleLabel}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun (Identitas)
                </label>
                <input
                  type="text"
                  disabled
                  value={displayId}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Foto Avatar (Opsional)
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika ingin menggunakan inisial nama otomatis.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || !editFullName.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
