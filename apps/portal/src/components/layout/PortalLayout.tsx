'use client';

import { useChatSocket } from '@/lib/useChatSocket';
import { CampusLogo } from '@/components/common/CampusLogo';
import React, { useState, useEffect, useCallback } from 'react';
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
import { useUnreadUpdates } from '@/lib/updates/useUnreadUpdates';
import { DOCS_ENABLED, MOBILE_SUBSCRIPTION_ENABLED, isDocsPath, isMobileSubscriptionPath } from '@/lib/features';
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
  DoorOpen,
  Key,
  Layers,
  Settings,
  PenTool,
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
  Megaphone,
  MessageCircle,
  AlertTriangle,
  FileCheck2,
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
  ReceiptText,
  Sunrise,
  RefreshCw,
  Network,
  Target,
  Smartphone,
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'lecturer' | 'admin' | 'superadmin' | 'finance' | 'lp3m' | 'p2m' | 'prodi' | 'sdm' | 'pmb';
  userName?: string;
  userIdText?: string;
  activeMenuHref?: string;
}

export function PortalLayout({ children, role, userName, userIdText, activeMenuHref }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount: unreadUpdates } = useUnreadUpdates();
  const [chatUnread, setChatUnread] = useState(0);
  // Lencana Layanan Surat (BAAK): permohonan surat yang menunggu diproses
  const [letterPending, setLetterPending] = useState(0);
  // Lencana Tugas Akhir/Skripsi (BAAK): proposal baru & pendaftar seminar/ujian yang menunggu tindakan
  const [thesisPending, setThesisPending] = useState(0);
  // Lencana Kegiatan Lapangan (BAAK): pendaftaran PLP/KKN/KP/Magang yang menunggu persetujuan
  const [fieldPending, setFieldPending] = useState(0);
  // Lencana Keringanan Pembayaran (Keuangan): pengajuan mahasiswa yang menunggu keputusan
  const [reliefPending, setReliefPending] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Menu Capaian OBE hanya tampil bila kampus ini memakai OBE (API OBE dikonfigurasi di server).
  const [obeEnabled, setObeEnabled] = useState(false);
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile>(FALLBACK_INSTITUTION_PROFILE);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<
    'student' | 'lecturer' | 'admin' | 'superadmin' | 'finance' | 'lp3m' | 'p2m' | 'prodi' | 'sdm' | 'pmb'
  >(role);
  // Lencana Live Chat PMB: jumlah pesan pendaftar yang belum dibaca panitia (hanya untuk peran PMB).
  // Diperbarui real-time murni lewat WebSocket (tanpa polling); saat tersambung ulang diambil lagi lewat sinyal resync.
  const loadChatUnread = useCallback(() => {
    fetch(`${getApiBaseUrl()}/admissions/admin/pmb/chat/unread`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (typeof d?.unread === 'number') setChatUnread(d.unread);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (effectiveRole !== 'student') return;
    const { token } = getAuthSession();
    fetch(`${getApiBaseUrl()}/students/me/obe/enabled`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setObeEnabled(Boolean((j?.data ?? j)?.enabled)))
      .catch(() => undefined);
  }, [effectiveRole]);

  useEffect(() => {
    if (effectiveRole === 'pmb') loadChatUnread();
  }, [effectiveRole, loadChatUnread]);

  useChatSocket({
    token: effectiveRole === 'pmb' ? getAuthSession().token : null,
    onSignal: (signal) => {
      if (signal.type !== 'status') loadChatUnread();
    },
  });

  // Diambil saat halaman dibuka/berpindah, saat tab kembali aktif, dan setelah BAAK memproses surat (tanpa polling berkala)
  const loadLetterPending = useCallback(() => {
    const { token } = getAuthSession();
    fetch(`${getApiBaseUrl()}/letters/pending-count`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (typeof d?.pending === 'number') setLetterPending(d.pending);
      })
      .catch(() => undefined);
  }, []);

  const loadThesisPending = useCallback(() => {
    const { token } = getAuthSession();
    fetch(`${getApiBaseUrl()}/thesis/admin/pending-count`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (typeof d?.pending === 'number') setThesisPending(d.pending);
      })
      .catch(() => undefined);
    fetch(`${getApiBaseUrl()}/field-activities/admin/pending-count`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (typeof d?.pending === 'number') setFieldPending(d.pending);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (effectiveRole !== 'admin') return;
    loadThesisPending();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadThesisPending();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('siakad:thesis-updated', loadThesisPending);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('siakad:thesis-updated', loadThesisPending);
    };
  }, [effectiveRole, pathname, loadThesisPending]);

  const loadReliefPending = useCallback(() => {
    const { token } = getAuthSession();
    fetch(`${getApiBaseUrl()}/finance/relief-requests/pending-count`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (typeof d?.pending === 'number') setReliefPending(d.pending);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (effectiveRole !== 'finance') return;
    loadReliefPending();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadReliefPending();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('siakad:relief-updated', loadReliefPending);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('siakad:relief-updated', loadReliefPending);
    };
  }, [effectiveRole, pathname, loadReliefPending]);

  useEffect(() => {
    if (effectiveRole !== 'admin') return;
    loadLetterPending();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadLetterPending();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('siakad:letters-updated', loadLetterPending);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('siakad:letters-updated', loadLetterPending);
    };
  }, [effectiveRole, pathname, loadLetterPending]);

  // ---- Notifikasi (lonceng): diambil saat halaman dibuka/berpindah, tab aktif lagi, atau setelah aksi (tanpa polling berkala)
  type NotifItem = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ unread: number; items: NotifItem[] }>({ unread: 0, items: [] });
  const notifRef = React.useRef<HTMLDivElement>(null);
  const authHeader = useCallback((): Record<string, string> => {
    const { token } = getAuthSession();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const loadNotifs = useCallback(() => {
    fetch(`${getApiBaseUrl()}/notifications?limit=20`, { cache: 'no-store', headers: authHeader() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (d && Array.isArray(d.items)) setNotifs({ unread: d.unread ?? 0, items: d.items });
      })
      .catch(() => undefined);
  }, [authHeader]);
  useEffect(() => {
    loadNotifs();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadNotifs();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('siakad:notif-refresh', loadNotifs);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('siakad:notif-refresh', loadNotifs);
    };
  }, [pathname, loadNotifs]);
  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifOpen]);
  const markNotifs = async (ids?: string[]) => {
    await fetch(`${getApiBaseUrl()}/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ ids }),
    }).catch(() => undefined);
    loadNotifs();
  };
  const timeAgo = (iso: string) => {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'baru saja';
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
  };

  // ---- Wajib ganti kata sandi awal (mis. tanggal lahir mahasiswa baru)
  const [mustChangePw, setMustChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/auth/password-status`, { cache: 'no-store', headers: authHeader() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (d?.mustChangePassword) setMustChangePw(true);
      })
      .catch(() => undefined);
  }, [authHeader]);
  const submitPassword = async () => {
    setPwError('');
    if (pwForm.next.length < 8) return setPwError('Password baru minimal 8 karakter.');
    if (pwForm.next !== pwForm.confirm) return setPwError('Konfirmasi password tidak sama.');
    setPwBusy(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error((Array.isArray(j?.message) ? j.message.join(', ') : j?.message) || 'Gagal mengganti password.');
      setMustChangePw(false);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Gagal mengganti password.');
    } finally {
      setPwBusy(false);
    }
  };

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
      // Di layar mobile sidebar selalu overlay (menutupi konten), jadi defaultnya tertutup
      // terlepas dari preferensi tersimpan dari sesi desktop -- preferensi "terbuka" itu
      // cuma relevan untuk layout push-content di layar lebar (lg+).
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
        return;
      }
      const saved = localStorage.getItem('siakad_sidebar_open');
      if (saved !== null) {
        setSidebarOpen(saved === 'true');
      }
    }
  }, []);

  useEffect(() => {
    const load = () => getInstitutionProfile().then(setInstitutionProfile);
    load();
    // Profil institusi diubah di halaman Profil Institusi -> muat ulang tanpa perlu refresh halaman.
    window.addEventListener('siakad:institution-updated', load);
    return () => window.removeEventListener('siakad:institution-updated', load);
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
    if (role === 'p2m' || user.email === 'p2m@itn.ac.id' || pathname.startsWith('/admin/p2m')) {
      computedRole = 'p2m';
    }
    if (role === 'prodi' || user.email === 'prodi@itn.ac.id' || pathname.startsWith('/admin/prodi')) {
      computedRole = 'prodi';
    }
    if (role === 'sdm' || user.email === 'sdm@itn.ac.id' || pathname.startsWith('/admin/sdm')) {
      computedRole = 'sdm';
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
      title: 'PERKULIAHAN',
      items: [
        { name: 'Rencana Studi (KRS)', href: '/student/krs', icon: FileText },
        { name: 'Jadwal Kuliah', href: '/student/jadwal', icon: Calendar },
        { name: 'Presensi & Kehadiran', href: '/student/presensi', icon: UserCheck },
      ],
    },
    {
      title: 'UJIAN & HASIL STUDI',
      items: [
        { name: 'Jadwal Ujian (UTS/UAS)', href: '/student/ujian', icon: CalendarDays },
        { name: 'Hasil Studi (KHS)', href: '/student/khs', icon: Award },
        { name: 'Transkrip Sementara', href: '/student/transkrip', icon: ScrollText },
      ],
    },
    ...(obeEnabled
      ? [
          {
            title: 'CAPAIAN PEMBELAJARAN',
            items: [{ name: 'Capaian OBE (CPL)', href: '/student/capaian-obe', icon: Target }],
          },
        ]
      : []),
    {
      title: 'TUGAS AKHIR & KELULUSAN',
      items: [
        { name: 'Tugas Akhir / Skripsi', href: '/student/skripsi', icon: GraduationCap },
        { name: 'Kegiatan Lapangan', href: '/student/kegiatan-lapangan', icon: Briefcase },
        { name: 'Yudisium & Kelulusan', href: '/student/yudisium', icon: Award },
      ],
    },
    {
      title: 'LAYANAN',
      items: [{ name: 'Layanan Surat', href: '/student/surat', icon: Mail }],
    },
    {
      title: 'KEUANGAN',
      items: [{ name: 'Tagihan & Pembayaran', href: '/student/keuangan', icon: CreditCard }],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/student/dokumentasi', icon: BookOpen }],
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
        { name: 'Jadwal Ujian & Pengawasan', href: '/lecturer/ujian', icon: CalendarDays },
        { name: 'Absensi Perkuliahan', href: '/lecturer/absensi', icon: ClipboardCheck },
        { name: 'Kontrak Kuliah', href: '/lecturer/kontrak', icon: FileSignature },
        { name: 'Rencana Pembelajaran (RPS)', href: '/lecturer/rps', icon: UploadCloud },
        { name: 'Input Nilai Semester', href: '/lecturer/nilai', icon: Award },
      ],
    },
    {
      title: 'BIMBINGAN',
      items: [
        { name: 'Mahasiswa Bimbingan PA', href: '/lecturer/bimbingan', icon: Users },
        { name: 'Bimbingan Skripsi', href: '/lecturer/skripsi', icon: GraduationCap },
        { name: 'Persetujuan Surat', href: '/lecturer/surat', icon: Mail },
      ],
    },
    {
      title: 'PENELITIAN & PENGABDIAN (P3M)',
      items: [
        { name: 'Laporan Penelitian & PkM', href: '/lecturer/p3m', icon: FlaskConical },
      ],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/lecturer/dokumentasi', icon: BookOpen }],
    },
  ];

  const adminNavGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Dashboard BAAK', href: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'DATA INDUK',
      items: [
        { name: 'Data Mahasiswa', href: '/admin/mahasiswa', icon: Users },
        { name: 'Data Dosen', href: '/admin/dosen', icon: UserCheck },
      ],
    },
    {
      title: 'KURIKULUM',
      items: [
        { name: 'Kurikulum & Mata Kuliah', href: '/admin/kurikulum', icon: BookOpen },
        { name: 'Master Kurikulum', href: '/admin/master-kurikulum', icon: Layers },
      ],
    },
    {
      title: 'PENJADWALAN',
      items: [
        { name: 'Tahun Akademik', href: '/admin/tahun-akademik', icon: Calendar },
        { name: 'Gedung', href: '/admin/gedung', icon: Building2 },
        { name: 'Ruang', href: '/admin/ruang', icon: DoorOpen },
        { name: 'Jadwal Kelas', href: '/admin/jadwal', icon: CalendarDays },
        { name: 'Jadwal Ujian (UTS/UAS)', href: '/admin/jadwal-ujian', icon: CalendarDays },
      ],
    },
    {
      title: 'PERKULIAHAN',
      items: [
        { name: 'KRS', href: '/admin/krs', icon: FileText },
        { name: 'Tugas Akhir / Skripsi', href: '/admin/skripsi', icon: GraduationCap },
        { name: 'Kegiatan Lapangan', href: '/admin/kegiatan-lapangan', icon: Briefcase },
        { name: 'Yudisium & Kelulusan', href: '/admin/yudisium', icon: Award },
        { name: 'Presensi', href: '/admin/presensi', icon: UserCheck },
        { name: 'Nilai', href: '/admin/nilai', icon: Award },
        { name: 'Skala Nilai', href: '/admin/skala-nilai', icon: Award },
        { name: 'Komponen Penilaian', href: '/admin/komponen-penilaian', icon: Award },
      ],
    },
    {
      title: 'LAYANAN MAHASISWA',
      items: [{ name: 'Layanan Surat', href: '/admin/surat', icon: Mail }],
    },
    {
      title: 'PUBLIKASI',
      items: [{ name: 'Berita & Pengumuman', href: '/admin/berita', icon: Megaphone }],
    },
    {
      title: 'PELAPORAN & INTEGRASI',
      items: [
        { name: 'Pelaporan PDDIKTI', href: '/admin/laporan', icon: ShieldCheck },
        { name: 'Sinkronisasi Feeder', href: '/admin/laporan/sinkronisasi-feeder', icon: RefreshCw },
      ],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/admin/dokumentasi', icon: BookOpen }],
    },
    {
      title: 'PENGATURAN',
      items: [{ name: 'Pengaturan', href: '/admin/pengaturan', icon: Settings }],
    },
  ];

  const superAdminNavGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Dashboard', href: '/admin/superadmin', icon: LayoutDashboard },
        { name: 'Monitoring Server', href: '/admin/superadmin/monitoring', icon: Activity },
        { name: 'Analitik Kunjungan Web', href: '/admin/superadmin/analitik', icon: BarChart3 },
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
        { name: 'Integrasi OBE', href: '/admin/superadmin/integrasi-obe', icon: Network },
        { name: 'Langganan Mobile App', href: '/admin/superadmin/langganan-mobile', icon: Smartphone },
        { name: 'Aturan Tanda Tangan', href: '/admin/superadmin/tanda-tangan', icon: PenTool },
        { name: 'Pengaturan Sistem', href: '/admin/superadmin/pengaturan', icon: Settings },
      ],
    },
    {
      title: 'BANTUAN',
      items: [
        { name: 'Updates', href: '/admin/superadmin/updates', icon: Megaphone },
        { name: 'Dokumentasi', href: '/admin/superadmin/dokumentasi', icon: BookOpen },
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
        { name: 'Keringanan Pembayaran', href: '/finance/keringanan', icon: Wallet },
        { name: 'Riwayat Pembayaran', href: '/finance/riwayat', icon: Clock },
        { name: 'Aturan Biaya Perkuliahan', href: '/finance/aturan-pembiayaan', icon: BookOpen },
      ],
    },
    {
      title: 'HONOR & PENGAJARAN',
      items: [
        { name: 'Rekapitulasi Mengajar', href: '/finance/rekap-mengajar', icon: Clock },
        { name: 'Pengaturan Gaji', href: '/finance/gaji', icon: Wallet },
        { name: 'Tarif Honor per Jenjang', href: '/finance/tarif-honor-jenjang', icon: GraduationCap },
        { name: 'Tarif Uang Transport', href: '/finance/tarif-transport', icon: Sunrise },
        { name: 'Rekap Honor', href: '/finance/rekap-honor', icon: ReceiptText },
      ],
    },
    {
      title: 'KAS & ANGGARAN',
      items: [
        { name: 'Rekening Bank & Kas', href: '/finance/rekening', icon: Landmark },
        { name: 'Realisasi Anggaran Kampus', href: '/finance/anggaran', icon: TrendingUp },
      ],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/finance/dokumentasi', icon: BookOpen }],
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
      title: 'INFORMASI',
      items: [{ name: 'Berita & Pengumuman', href: '/admin/p3m/berita', icon: Megaphone }],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/admin/p3m/dokumentasi', icon: BookOpen }],
    },
    {
      title: 'AKUN & SISTEM',
      items: [
        { name: 'Logout', href: '#logout', icon: LogOut, isLogout: true },
      ],
    },
  ];

  const p2mNavGroups = [
    {
      title: 'MENU UTAMA P2M',
      items: [
        { name: 'Dashboard P2M', href: '/admin/p2m', icon: LayoutDashboard },
      ],
    },
    {
      title: 'PENJAMINAN MUTU',
      items: [
        { name: 'Standar Mutu', href: '/admin/p2m/standar-mutu', icon: Award },
        { name: 'Audit Mutu Internal', href: '/admin/p2m/audit-mutu', icon: ClipboardCheck },
        { name: 'Validasi RPS', href: '/admin/p2m/validasi-rps', icon: FileCheck2 },
        { name: 'Tindak Lanjut Audit', href: '/admin/p2m/tindak-lanjut', icon: AlertTriangle },
      ],
    },
    {
      title: 'REGULASI & DOKUMEN',
      items: [{ name: 'Dokumen Mutu', href: '/admin/p2m/dokumen', icon: FileText }],
    },
    {
      title: 'INFORMASI',
      items: [{ name: 'Berita & Pengumuman', href: '/admin/p2m/berita', icon: Megaphone }],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/admin/p2m/dokumentasi', icon: BookOpen }],
    },
    {
      title: 'AKUN & SISTEM',
      items: [
        { name: 'Logout', href: '#logout', icon: LogOut, isLogout: true },
      ],
    },
  ];

  const prodiNavGroups = [
    {
      title: 'MENU UTAMA PRODI',
      items: [
        { name: 'Dashboard Prodi', href: '/admin/prodi', icon: LayoutDashboard },
      ],
    },
    {
      title: 'DATA PROGRAM STUDI',
      items: [
        { name: 'Data Mahasiswa', href: '/admin/prodi/mahasiswa', icon: Users },
        { name: 'Data Dosen', href: '/admin/prodi/dosen', icon: UserCheck },
      ],
    },
    {
      title: 'KURIKULUM & PERKULIAHAN',
      items: [
        { name: 'Mata Kuliah', href: '/admin/prodi/mata-kuliah', icon: BookOpen },
        { name: 'Jadwal & Kelas', href: '/admin/prodi/jadwal', icon: CalendarDays },
      ],
    },
    {
      title: 'TUGAS AKHIR & KELULUSAN',
      items: [
        { name: 'Tugas Akhir / Skripsi', href: '/admin/prodi/tugas-akhir', icon: GraduationCap },
        { name: 'Yudisium & Kelulusan', href: '/admin/prodi/yudisium', icon: Award },
      ],
    },
    {
      title: 'INFORMASI',
      items: [{ name: 'Berita & Pengumuman', href: '/admin/prodi/berita', icon: Megaphone }],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/admin/prodi/dokumentasi', icon: BookOpen }],
    },
    {
      title: 'AKUN & SISTEM',
      items: [
        { name: 'Logout', href: '#logout', icon: LogOut, isLogout: true },
      ],
    },
  ];

  const sdmNavGroups = [
    {
      title: 'MENU UTAMA SDM',
      items: [
        { name: 'Dashboard SDM', href: '/admin/sdm', icon: LayoutDashboard },
      ],
    },
    {
      title: 'KEPEGAWAIAN',
      items: [
        { name: 'Data Pegawai', href: '/admin/sdm/pegawai', icon: Briefcase },
        { name: 'Status Dosen', href: '/admin/sdm/status-dosen', icon: UserCheck },
        { name: 'Pengaturan Shift', href: '/admin/sdm/shift', icon: Clock },
        { name: 'Rekap Absensi', href: '/admin/sdm/rekap-absensi', icon: ClipboardCheck },
      ],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/admin/sdm/dokumentasi', icon: BookOpen }],
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
      title: 'MENU UTAMA',
      items: [{ name: 'Dashboard PMB', href: '/admin/pmb', icon: LayoutDashboard }],
    },
    {
      title: 'PENGATURAN PMB',
      items: [
        { name: 'Gelombang Pendaftaran', href: '/admin/pmb/gelombang', icon: CalendarDays },
        { name: 'Jalur, Jenis & Kelas', href: '/admin/pmb/jalur', icon: Layers },
      ],
    },
    {
      title: 'PROSES SELEKSI',
      items: [
        { name: 'Data Calon Mahasiswa', href: '/admin/pmb/pendaftar', icon: Users },
        { name: 'Verifikasi Berkas', href: '/admin/pmb/verifikasi', icon: CheckCircle2 },
        { name: 'Kelulusan & Registrasi', href: '/admin/pmb/kelulusan', icon: GraduationCap },
      ],
    },
    {
      title: 'KEUANGAN & KEMITRAAN',
      items: [
        { name: 'Pembayaran & Keuangan', href: '/admin/pmb/biaya', icon: CreditCard },
        { name: 'Data Affiliate', href: '/admin/pmb/affiliate', icon: Share2 },
      ],
    },
    {
      title: 'KOMUNIKASI',
      items: [{ name: 'Live Chat', href: '/admin/pmb/live-chat', icon: MessageCircle }],
    },
    {
      title: 'LAPORAN',
      items: [{ name: 'Rekapitulasi PMB', href: '/admin/pmb/statistik', icon: BarChart3 }],
    },
    {
      title: 'INFORMASI',
      items: [{ name: 'Berita & Pengumuman', href: '/admin/pmb/berita', icon: Megaphone }],
    },
    {
      title: 'BANTUAN',
      items: [{ name: 'Panduan Penggunaan', href: '/admin/pmb/dokumentasi', icon: BookOpen }],
    },
    {
      title: 'AKUN & SISTEM',
      items: [{ name: 'Logout', href: '#logout', icon: LogOut, isLogout: true }],
    },
  ];

  const allNavGroups =
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
              : effectiveRole === 'p2m'
                ? p2mNavGroups
                : effectiveRole === 'prodi'
                  ? prodiNavGroups
                  : effectiveRole === 'sdm'
                    ? sdmNavGroups
                    : effectiveRole === 'pmb'
                      ? pmbNavGroups
                      : adminNavGroups;

  // Menu dokumentasi disembunyikan selama DOCS_ENABLED=false (mode demo), dan menu Langganan Mobile App selama
  // MOBILE_SUBSCRIPTION_ENABLED=false (menu sementara); grup yang jadi kosong ikut dibuang.
  const navGroups =
    DOCS_ENABLED && MOBILE_SUBSCRIPTION_ENABLED
      ? allNavGroups
      : allNavGroups
          .map((g) => ({
            ...g,
            items: g.items.filter(
              (i) => (DOCS_ENABLED || !isDocsPath(i.href)) && (MOBILE_SUBSCRIPTION_ENABLED || !isMobileSubscriptionPath(i.href)),
            ),
          }))
          .filter((g) => g.items.length > 0);

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
              : effectiveRole === 'p2m'
                ? 'Penjaminan Mutu (P2M)'
                : effectiveRole === 'prodi'
                  ? 'Admin Program Studi'
                  : effectiveRole === 'sdm'
                    ? 'Biro SDM & Kepegawaian'
                    : effectiveRole === 'pmb'
                      ? 'Panitia PMB (Admissions)'
                      : 'Administrator BAAK';

  const defaultNameByRole =
    effectiveRole === 'student'
      ? 'Mahasiswa'
      : effectiveRole === 'lecturer'
        ? 'Dosen Pengajar'
        : effectiveRole === 'superadmin'
          ? 'Super Administrator'
          : effectiveRole === 'finance'
            ? 'Biro Keuangan'
            : effectiveRole === 'lp3m'
              ? 'Pengelola / Reviewer LP3M'
              : effectiveRole === 'p2m'
                ? 'Pengelola Penjaminan Mutu'
                : effectiveRole === 'prodi'
                  ? 'Admin Program Studi'
                  : effectiveRole === 'sdm'
                    ? 'Biro SDM & Kepegawaian'
                    : effectiveRole === 'pmb'
                      ? 'Panitia PMB'
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
        : effectiveRole === 'p2m'
          ? 'Pengelola Penjaminan Mutu'
          : effectiveRole === 'prodi'
            ? 'Admin Program Studi'
            : effectiveRole === 'sdm'
              ? 'Biro SDM & Kepegawaian'
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
              <CampusLogo
                url={institutionProfile.logoUrl}
                initials={institutionProfile.logoInitials}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 border border-[#D4A017] flex items-center justify-center text-white font-black text-base shadow-sm shrink-0"
              />
              <div>
                <span className="text-sm font-extrabold text-white tracking-wide block">
                  SIAKAD NEXTVERSA
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
                    '/admin/p2m',
                    '/admin/prodi',
                    '/admin/sdm',
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
                      <span className="flex-1">{item.name}</span>
                      {item.href === '/admin/pmb/live-chat' && chatUnread > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                          {chatUnread}
                        </span>
                      )}
                      {item.href === '/admin/skripsi' && thesisPending > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                          {thesisPending}
                        </span>
                      )}
                      {item.href === '/admin/kegiatan-lapangan' && fieldPending > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                          {fieldPending}
                        </span>
                      )}
                      {item.href === '/finance/keringanan' && reliefPending > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                          {reliefPending}
                        </span>
                      )}
                      {item.href === '/admin/surat' && letterPending > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                          {letterPending}
                        </span>
                      )}
                      {item.href === '/admin/superadmin/updates' && unreadUpdates > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                          {unreadUpdates}
                        </span>
                      )}
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
                {institutionProfile.campusName}{institutionProfile.activeAcademicYear ? ` \u2022 TA ${institutionProfile.activeAcademicYear}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Periode Badge */}
            {institutionProfile.activeAcademicYear && (
              <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Semester {institutionProfile.activeSemester} {institutionProfile.activeAcademicYear}</span>
              </div>
            )}

            {/* Notification */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="p-2 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-xl relative transition-colors cursor-pointer"
                title="Notifikasi"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {notifs.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                    {notifs.unread > 99 ? '99+' : notifs.unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-800">Notifikasi</span>
                    {notifs.unread > 0 && (
                      <button onClick={() => markNotifs()} className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer">
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifs.items.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-400">Belum ada notifikasi.</p>}
                    {notifs.items.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.readAt) void markNotifs([n.id]);
                          setNotifOpen(false);
                          if (n.link) router.push(n.link);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer ${n.readAt ? '' : 'bg-blue-50/50'}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.readAt && <span className="w-2 h-2 rounded-full bg-[#D4A017] mt-1.5 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            {n.body && <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-3">{n.body}</p>}
                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wajib ganti kata sandi awal: jendela ini tidak bisa ditutup sampai password diganti */}
            {mustChangePw && (
              <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Ganti Password Anda</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Anda masih memakai password awal yang diberikan sistem. Demi keamanan akun, ganti dengan password baru sebelum melanjutkan.
                    </p>
                  </div>
                  {pwError && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{pwError}</p>}
                  {(
                    [
                      ['current', 'Password saat ini (password awal)'],
                      ['next', 'Password baru (minimal 8 karakter)'],
                      ['confirm', 'Ulangi password baru'],
                    ] as const
                  ).map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{label}</label>
                      <input
                        type="password"
                        value={pwForm[k]}
                        onChange={(e) => setPwForm({ ...pwForm, [k]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <button onClick={handleLogout} className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                      Keluar
                    </button>
                    <button
                      disabled={pwBusy || !pwForm.current || !pwForm.next || !pwForm.confirm}
                      onClick={submitPassword}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer"
                    >
                      {pwBusy ? 'Menyimpan...' : 'Simpan Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                          : effectiveRole === 'p2m'
                            ? 'Ketua Penjaminan Mutu'
                            : effectiveRole === 'prodi'
                              ? 'Admin Program Studi'
                              : effectiveRole === 'sdm'
                                ? 'Biro SDM'
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
                                  : effectiveRole === 'p2m'
                                    ? 'P2M'
                                    : effectiveRole === 'prodi'
                                      ? 'Admin Prodi'
                                      : effectiveRole === 'sdm'
                                        ? 'Biro SDM'
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
