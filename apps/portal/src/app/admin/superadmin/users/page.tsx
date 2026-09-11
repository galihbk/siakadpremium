'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  KeyRound,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Copy,
  Check,
  Building2,
  GraduationCap,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Calendar,
  Lock,
  Sparkles,
  LayoutGrid,
  List,
  Info,
} from 'lucide-react';

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role:
    | 'SUPER_ADMIN'
    | 'ADMIN_BAAK'
    | 'ADMIN_PMB'
    | 'ADMIN_KEUANGAN'
    | 'ADMIN_LP3M'
    | 'LP3M'
    | 'LECTURER'
    | 'STUDENT'
    | 'STAFF';
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  studentInfo?: {
    nim: string;
    prodi?: string;
    semester?: number;
  } | null;
  lecturerInfo?: {
    nidn: string;
    nip?: string;
    prodi?: string;
    gelar?: string;
  } | null;
}

export interface UserStats {
  total: number;
  superadmin: number;
  adminBaak: number;
  adminKeuangan: number;
  adminLp3m: number;
  lecturers: number;
  students: number;
  staff: number;
  active: number;
  inactive: number;
}

const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: any;
    desc: string;
  }
> = {
  SUPER_ADMIN: {
    label: 'Super Administrator',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: ShieldAlert,
    desc: 'Akses penuh ke seluruh modul, konfigurasi, dan database sistem.',
  },
  ADMIN_BAAK: {
    label: 'Admin BAAK',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: ShieldCheck,
    desc: 'Pengelolaan akademik, kurikulum, KRS, jadwal, dan mahasiswa.',
  },
  ADMIN_PMB: {
    label: 'Admin PMB',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: ShieldCheck,
    desc: 'Pengelolaan pendaftaran calon mahasiswa baru, verifikasi berkas, CBT, dan kelulusan.',
  },
  ADMIN_KEUANGAN: {
    label: 'Admin Keuangan',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: ShieldCheck,
    desc: 'Pengelolaan tagihan perkuliahan, pembayaran, dan dispensasi.',
  },
  ADMIN_LP3M: {
    label: 'Admin LP3M',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: Shield,
    desc: 'Pengelolaan riset dosen, hibah, pengabdian masyarakat, dan borang.',
  },
  LP3M: {
    label: 'Reviewer / Staf LP3M',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    icon: Shield,
    desc: 'Verifikator dan penilai usulan proposal riset & PkM LP3M.',
  },
  LECTURER: {
    label: 'Dosen Pengajar',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: GraduationCap,
    desc: 'Akses portal dosen, pengisian nilai, absensi, dan bimbingan KRS.',
  },
  STUDENT: {
    label: 'Mahasiswa',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: Users,
    desc: 'Akses portal mahasiswa, rencana studi (KRS), KHS, dan perkuliahan.',
  },
  STAFF: {
    label: 'Staf Administrasi',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: Briefcase,
    desc: 'Staf umum fakultas dan layanan operasional kampus.',
  },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    superadmin: 0,
    adminBaak: 0,
    adminKeuangan: 0,
    adminLp3m: 0,
    lecturers: 0,
    students: 0,
    staff: 0,
    active: 0,
    inactive: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof UserItem>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'LECTURER' as UserItem['role'],
    password: 'Password123!',
    isActive: true,
  });

  const [resetPasswordValue, setResetPasswordValue] = useState('Password123!');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/users`);
      if (!res.ok) throw new Error('Gagal mengambil data pengguna dari server.');
      const json = await res.json();
      const payload = json.data || json;
      const userList = Array.isArray(payload) ? payload : (payload.data || payload.users || []);
      const userStats = payload.stats || json.stats;
      setUsers(userList);
      if (userStats) {
        setStats(userStats);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal terhubung ke server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.studentInfo?.nim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lecturerInfo?.nidn?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'Semua' || u.role === roleFilter;

      const matchStatus =
        statusFilter === 'Semua' ||
        (statusFilter === 'Aktif' && u.isActive) ||
        (statusFilter === 'Nonaktif' && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const handleSort = (field: keyof UserItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast('Nama Lengkap dan Email wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          password: formData.password || 'Password123!',
          isActive: formData.isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal menambahkan akun pengguna.');
      }

      showToast(`Akun pengguna ${formData.fullName} berhasil dibuat.`);
      setIsAddModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        role: 'LECTURER',
        password: 'Password123!',
        isActive: true,
      });
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit User Handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memperbarui akun.');
      }

      showToast(`Profil pengguna ${formData.fullName} berhasil diperbarui.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status Handler
  const handleToggleStatus = async (user: UserItem) => {
    try {
      const res = await fetch(`${apiBase}/users/${user.id}/toggle-status`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengubah status.');

      showToast(json.message);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mereset kata sandi.');

      showToast(`Kata sandi untuk ${resettingUser.fullName} berhasil direset!`);
      setResettingUser(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal menghapus pengguna.');

      showToast(`Akun pengguna ${deletingUser.fullName} berhasil dihapus.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Lengkap', 'Email', 'Peran', 'Status', 'Tanggal Dibuat'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.fullName}"`,
      u.email,
      u.role,
      u.isActive ? 'Aktif' : 'Nonaktif',
      new Date(u.createdAt).toLocaleString('id-ID'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Pengguna_SIAKAD_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd + '!';
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
    >
      <div className="space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30'
                : 'bg-rose-950/90 text-rose-100 border-rose-500/30'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 md:p-8 text-white shadow-xl border border-blue-800/40">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 tracking-wider uppercase">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Pusat Kendali Pengguna & Hak Akses</span>
                <span className="text-blue-500">•</span>
                <span className="text-amber-300 font-medium">Enterprise Security System</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Manajemen Akun Pengguna
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Kelola seluruh akun sivitas akademika ITN, penugasan hak akses role-based, pengaturan status login, dan
                kebijakan keamanan kata sandi secara terpusat.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-sm font-semibold text-white shadow-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span>Ekspor CSV</span>
              </button>
              <button
                onClick={() => {
                  setFormData({
                    fullName: '',
                    email: '',
                    role: 'LECTURER',
                    password: 'Password123!',
                    isActive: true,
                  });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 border border-blue-400/30"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Pengguna Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Pengguna */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</span>
              <p className="text-xs text-slate-500 mt-1">Akun terdaftar dalam sistem</p>
            </div>
          </div>

          {/* Card 2: Administrator Pusat */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Admin Pusat</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.superadmin + stats.adminBaak + stats.adminKeuangan + stats.adminLp3m}
              </span>
              <p className="text-xs text-purple-600 font-medium mt-1">
                {stats.superadmin} Super, {stats.adminBaak} BAAK, {stats.adminLp3m} LP3M
              </p>
            </div>
          </div>

          {/* Card 3: Dosen */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Akun Dosen</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.lecturers}</span>
              <p className="text-xs text-slate-500 mt-1">Dosen Pengajar & Pembimbing</p>
            </div>
          </div>

          {/* Card 4: Mahasiswa */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Akun Mahasiswa</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{stats.students}</span>
              <p className="text-xs text-slate-500 mt-1">Mahasiswa Aktif Terdaftar</p>
            </div>
          </div>

          {/* Card 5: Status Akun */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Status Akun</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{stats.active}</span>
              <span className="text-xs text-slate-500">Aktif</span>
              <span className="text-slate-300">/</span>
              <span className="text-base font-bold text-rose-500">{stats.inactive}</span>
              <span className="text-xs text-slate-500">Nonaktif</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari berdasarkan Nama Lengkap, Email, NIM, atau NIDN..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Peran:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Semua">Semua Peran ({stats.total})</option>
                  <option value="SUPER_ADMIN">Super Admin ({stats.superadmin})</option>
                  <option value="ADMIN_BAAK">Admin BAAK ({stats.adminBaak})</option>
                  <option value="ADMIN_KEUANGAN">Admin Keuangan ({stats.adminKeuangan})</option>
                  <option value="ADMIN_LP3M">Admin LP3M ({stats.adminLp3m})</option>
                  <option value="LP3M">Reviewer LP3M</option>
                  <option value="LECTURER">Dosen ({stats.lecturers})</option>
                  <option value="STUDENT">Mahasiswa ({stats.students})</option>
                  <option value="STAFF">Staf ({stats.staff})</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Hanya Aktif</option>
                  <option value="Nonaktif">Ditangguhkan / Nonaktif</option>
                </select>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Tabel"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Grid Kartu"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-800">{filteredUsers.length}</span> dari{' '}
              <span className="font-semibold text-slate-800">{users.length}</span> total akun pengguna
              {roleFilter !== 'Semua' && (
                <span className="ml-1 text-blue-600 font-medium">• Filter Peran: {ROLE_CONFIG[roleFilter]?.label || roleFilter}</span>
              )}
              {statusFilter !== 'Semua' && (
                <span className="ml-1 text-blue-600 font-medium">• Status: {statusFilter}</span>
              )}
            </div>
            {(roleFilter !== 'Semua' || statusFilter !== 'Semua' || searchQuery) && (
              <button
                onClick={() => {
                  setRoleFilter('Semua');
                  setStatusFilter('Semua');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        </div>

        {/* Content Section: Table or Grid */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Memuat Data Pengguna...</h3>
            <p className="text-xs text-slate-500 mt-1">Sinkronisasi data akun pengguna aktif.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak Ada Data Pengguna Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ada pengguna yang cocok dengan kriteria pencarian & filter saat ini. Cobalah mengatur ulang kata
              kunci atau filter peran.
            </p>
            <button
              onClick={() => {
                setRoleFilter('Semua');
                setStatusFilter('Semua');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
            >
              Hapus Filter
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* =================== TABLE VIEW =================== */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th
                      onClick={() => handleSort('fullName')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Pengguna & Akun</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('email')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Email & Kontak</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('role')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Peran (Role)</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Keterangan Akademik</th>
                    <th
                      onClick={() => handleSort('isActive')}
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Status</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('createdAt')}
                      className="py-3.5 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Terdaftar</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center w-40">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user, idx) => {
                    const roleCfg = ROLE_CONFIG[user.role] || {
                      label: user.role,
                      color: 'text-slate-700',
                      bgColor: 'bg-slate-100',
                      borderColor: 'border-slate-200',
                      icon: Shield,
                    };
                    const RoleIcon = roleCfg.icon;

                    return (
                      <tr key={user.id} className="hover:bg-blue-50/40 transition-colors group">
                        {/* Index */}
                        <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>

                        {/* Name & Avatar */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200/80 shadow-xs">
                                {user.fullName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                  user.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>{user.fullName}</span>
                                {user.role === 'SUPER_ADMIN' && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">
                                    Root
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>ID: {user.id.slice(0, 8)}...</span>
                                <button
                                  onClick={() => copyToClipboard(user.id, user.id)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title="Salin ID Pengguna"
                                >
                                  {copiedId === user.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{user.email}</span>
                            <button
                              onClick={() => copyToClipboard(user.email, user.email)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 ml-1"
                              title="Salin Email"
                            >
                              {copiedId === user.email ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleCfg.bgColor} ${roleCfg.color} ${roleCfg.borderColor}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{roleCfg.label}</span>
                          </span>
                        </td>

                        {/* Academic Info */}
                        <td className="py-4 px-4">
                          {user.studentInfo ? (
                            <div className="text-xs">
                              <div className="font-bold text-slate-800">
                                NIM: <span className="font-mono text-cyan-700">{user.studentInfo.nim}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                                {user.studentInfo.prodi || 'Program Studi Terdaftar'}
                              </div>
                            </div>
                          ) : user.lecturerInfo ? (
                            <div className="text-xs">
                              <div className="font-bold text-slate-800">
                                NIDN: <span className="font-mono text-amber-700">{user.lecturerInfo.nidn}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                                {user.lecturerInfo.prodi || 'Dosen Tetap ITN'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Akun Sistem / Staf</span>
                          )}
                        </td>

                        {/* Active Toggle Status */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              user.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                user.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Detail */}
                            <button
                              onClick={() => setViewingUser(user)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Lihat Rincian Akun"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setFormData({
                                  fullName: user.fullName,
                                  email: user.email,
                                  role: user.role,
                                  password: '',
                                  isActive: user.isActive,
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit Profil & Peran"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResettingUser(user);
                                setResetPasswordValue('Password123!');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Reset Kata Sandi"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span>Baris per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-400">|</span>
                <span>
                  Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{' '}
                  <span className="font-bold text-slate-900">{totalPages}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =================== GRID CARD VIEW =================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedUsers.map((user) => {
              const roleCfg = ROLE_CONFIG[user.role] || {
                label: user.role,
                color: 'text-slate-700',
                bgColor: 'bg-slate-100',
                borderColor: 'border-slate-200',
                icon: Shield,
              };
              const RoleIcon = roleCfg.icon;

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Role badge & status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleCfg.bgColor} ${roleCfg.color} ${roleCfg.borderColor}`}
                      >
                        <RoleIcon className="w-3 h-3 shrink-0" />
                        <span>{roleCfg.label}</span>
                      </span>

                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 font-black flex items-center justify-center text-base border border-slate-200 shrink-0">
                        {user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {user.fullName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{user.email}</span>
                        </p>
                        {user.studentInfo && (
                          <p className="text-[11px] text-cyan-700 font-semibold mt-1">
                            NIM: {user.studentInfo.nim} • {user.studentInfo.prodi}
                          </p>
                        )}
                        {user.lecturerInfo && (
                          <p className="text-[11px] text-amber-700 font-semibold mt-1">
                            NIDN: {user.lecturerInfo.nidn} • {user.lecturerInfo.prodi}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Dibuat: {new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
                      <span className="font-mono">ID: {user.id.slice(0, 6)}...</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setViewingUser(user)}
                      className="py-1.5 px-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-1"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setFormData({
                          fullName: user.fullName,
                          email: user.email,
                          role: user.role,
                          password: '',
                          isActive: user.isActive,
                        });
                      }}
                      className="py-1.5 px-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 transition-all flex items-center justify-center gap-1"
                      title="Edit Akun"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setResettingUser(user);
                        setResetPasswordValue('Password123!');
                      }}
                      className="py-1.5 px-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-purple-50 hover:text-purple-600 transition-all flex items-center justify-center gap-1"
                      title="Reset Kata Sandi"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Sandi</span>
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="py-1.5 px-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-1"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== MODAL: TAMBAH PENGGUNA BARU ===================== */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => !isSubmitting && setIsAddModalOpen(false)}
          title="Tambah Pengguna Baru"
          subtitle="Buat kredensial akun sivitas akademika baru dan tentukan hak akses peran sistem."
          icon={<UserPlus className="w-6 h-6 text-blue-600" />}
          size="lg"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="cth. Prof. Dr. Ir. Budi Santoso, M.T."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email Resmi <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cth. budi.santoso@itn.ac.id"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Email ini digunakan sebagai username login akun pengguna.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Peran Pengguna (Role) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white font-medium"
              >
                <option value="SUPER_ADMIN">SUPER ADMINISTRATOR (Akses Penuh Sistem & Konfigurasi)</option>
                <option value="ADMIN_BAAK">ADMIN BAAK (Biro Administrasi Akademik & Kemahasiswaan)</option>
                <option value="ADMIN_KEUANGAN">ADMIN KEUANGAN (Biro Keuangan & Tagihan SPP)</option>
                <option value="ADMIN_LP3M">ADMIN LP3M (Lembaga Penelitian & Pengabdian Masyarakat)</option>
                <option value="LP3M">REVIEWER LP3M (Penilai Usulan Proposal Riset/PkM)</option>
                <option value="LECTURER">DOSEN (Dosen Pengajar & Dosen Pembimbing Akademik)</option>
                <option value="STUDENT">MAHASISWA (Portal Akademik Mahasiswa)</option>
                <option value="STAFF">STAFF (Tenaga Kependidikan & Tata Usaha)</option>
              </select>
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{ROLE_CONFIG[formData.role]?.desc}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi Awal <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, password: generatePassword() })}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Buat Sandi Acak</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default: Password123! (Pengguna dapat menggantinya saat login).</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="add-is-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="add-is-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Aktifkan akun ini segera setelah dibuat (Status Aktif)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Simpan Pengguna</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* ===================== MODAL: EDIT PENGGUNA ===================== */}
        <Modal
          isOpen={!!editingUser}
          onClose={() => !isSubmitting && setEditingUser(null)}
          title="Edit Data Pengguna"
          subtitle={`Perbarui data akun dan peran untuk "${editingUser?.fullName}"`}
          icon={<Edit3 className="w-6 h-6 text-amber-600" />}
          size="lg"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email Resmi <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Peran Pengguna (Role) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white font-medium"
              >
                <option value="SUPER_ADMIN">SUPER ADMINISTRATOR (Akses Penuh Sistem)</option>
                <option value="ADMIN_BAAK">ADMIN BAAK (Biro Administrasi Akademik)</option>
                <option value="ADMIN_KEUANGAN">ADMIN KEUANGAN (Keuangan & SPP)</option>
                <option value="ADMIN_LP3M">ADMIN LP3M (Penelitian & PkM)</option>
                <option value="LP3M">REVIEWER LP3M (Reviewer Usulan)</option>
                <option value="LECTURER">DOSEN (Pengajar & Dosen PA)</option>
                <option value="STUDENT">MAHASISWA (Portal Mahasiswa)</option>
                <option value="STAFF">STAFF (Tenaga Kependidikan)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="edit-is-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Akun Aktif (Beri tanda centang agar pengguna dapat masuk ke sistem)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* ===================== MODAL: RESET PASSWORD ===================== */}
        <Modal
          isOpen={!!resettingUser}
          onClose={() => !isSubmitting && setResettingUser(null)}
          title="Reset Kata Sandi"
          subtitle={`Atur ulang kata sandi login untuk pengguna "${resettingUser?.fullName}"`}
          icon={<KeyRound className="w-6 h-6 text-purple-600" />}
          size="md"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200/80 text-xs text-purple-900 space-y-1">
              <p className="font-bold">Informasi Akun:</p>
              <p>Email: <span className="font-mono font-semibold">{resettingUser?.email}</span></p>
              <p>Peran: <span className="font-semibold">{ROLE_CONFIG[resettingUser?.role || '']?.label}</span></p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setResetPasswordValue(generatePassword())}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Acak</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetPasswordValue, 'modal-pwd')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Salin Sandi"
                >
                  {copiedId === 'modal-pwd' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Kata sandi akan dienkripsi dengan bcrypt hash pada basis data secara aman.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Perbarui Kata Sandi</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* ===================== MODAL: DETAIL PENGGUNA ===================== */}
        <Modal
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title="Rincian Profil Pengguna"
          subtitle="Informasi lengkap akun sivitas akademika dan relasi data sistem."
          icon={<Eye className="w-6 h-6 text-blue-600" />}
          size="lg"
        >
          {viewingUser && (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-tr from-slate-50 to-blue-50 border border-blue-100">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-blue-200 text-blue-700 font-black flex items-center justify-center text-xl shrink-0">
                  {viewingUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{viewingUser.fullName}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        ROLE_CONFIG[viewingUser.role]?.bgColor
                      } ${ROLE_CONFIG[viewingUser.role]?.color} ${ROLE_CONFIG[viewingUser.role]?.borderColor}`}
                    >
                      {ROLE_CONFIG[viewingUser.role]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingUser.email}</span>
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    User ID (UUID)
                  </span>
                  <div className="font-mono text-slate-800 font-bold mt-1 break-all select-all flex items-center justify-between">
                    <span>{viewingUser.id}</span>
                    <button
                      onClick={() => copyToClipboard(viewingUser.id, 'detail-id')}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                      title="Salin ID"
                    >
                      {copiedId === 'detail-id' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Status Akun
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        viewingUser.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-bold text-slate-800">
                      {viewingUser.isActive ? 'Aktif & Dapat Login' : 'Ditangguhkan / Nonaktif'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Tanggal Pendaftaran
                  </span>
                  <div className="font-bold text-slate-800 mt-1">
                    {new Date(viewingUser.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                    Pembaruan Terakhir
                  </span>
                  <div className="font-bold text-slate-800 mt-1">
                    {new Date(viewingUser.updatedAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Linked Profile Info if any */}
              {viewingUser.studentInfo && (
                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-900 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span>Terhubung dengan Data Mahasiswa</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-500">NIM:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{viewingUser.studentInfo.nim}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Program Studi:</span>{' '}
                      <span className="font-bold text-slate-900">{viewingUser.studentInfo.prodi || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewingUser.lecturerInfo && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>Terhubung dengan Data Dosen</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-500">NIDN:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{viewingUser.lecturerInfo.nidn}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Program Studi:</span>{' '}
                      <span className="font-bold text-slate-900">{viewingUser.lecturerInfo.prodi || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewingUser(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-all"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ===================== MODAL: KONFIRMASI HAPUS ===================== */}
        <Modal
          isOpen={!!deletingUser}
          onClose={() => !isSubmitting && setDeletingUser(null)}
          title="Konfirmasi Hapus Pengguna"
          subtitle="Tindakan ini tidak dapat dibatalkan dan akan menghapus akun secara permanen."
          icon={<Trash2 className="w-6 h-6 text-rose-600" />}
          size="md"
        >
          {deletingUser && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Peringatan Keamanan Sistem</span>
                </p>
                <p>
                  Apakah Anda yakin ingin menghapus akun pengguna berikut dari sistem?
                </p>
                <div className="p-3 bg-white rounded-lg border border-rose-200 font-medium">
                  <p className="font-bold text-slate-900">{deletingUser.fullName}</p>
                  <p className="text-slate-500 text-[11px]">{deletingUser.email} • Role: {deletingUser.role}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Ya, Hapus Pengguna</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PortalLayout>
  );
}
