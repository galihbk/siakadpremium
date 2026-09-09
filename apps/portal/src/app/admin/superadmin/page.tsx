'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Building2,
  Landmark,
  GraduationCap,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Layers,
  FileText,
  Calendar,
  Award,
  UserCheck,
  CreditCard,
  BarChart3,
  Activity,
  Settings,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  BookOpen,
  CalendarDays,
  UserPlus,
  RefreshCw,
  HardDrive,
  DoorOpen,
  Sliders,
  Zap,
  Info,
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const [selectedFacultyTab, setSelectedFacultyTab] = useState<'all' | 'unggul'>('all');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // 1. 6 Summary Cards (Akademik Kampus)
  const [summaryData, setSummaryData] = useState([
    {
      title: 'Total Fakultas',
      value: '4',
      subtitle: 'Fakultas Pendidikan Terpadu',
      icon: Landmark,
      color: 'text-[#1E3A8A]',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Program Studi',
      value: '12',
      subtitle: '12 Prodi S1, D4 & D3',
      icon: GraduationCap,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Total Mahasiswa Aktif',
      value: '9.270',
      subtitle: 'Terdaftar Semester Ini',
      icon: Users,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Dosen Aktif',
      value: '296',
      subtitle: 'Dosen Tetap & Luar Biasa',
      icon: UserCheck,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
    {
      title: 'Total Pegawai',
      value: '142',
      subtitle: 'Staf & Tenaga Kependidikan',
      icon: Briefcase,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      title: 'Semester Aktif',
      value: '2026/2027 Gasal',
      subtitle: 'Minggu Perkuliahan ke-4',
      icon: Clock,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      isBadge: true,
      badgeText: 'Aktif',
    },
  ]);

  // 2. Monitoring Sistem & Integrasi Akademik
  const [overallStatus, setOverallStatus] = useState({
    isAllNormal: false,
    badgeText: '1 Layanan Memerlukan Integrasi (Feeder PDDIKTI Belum Terhubung)',
    badgeClass: 'bg-amber-50 border-amber-300 text-amber-800',
    dotClass: 'bg-amber-500 animate-pulse',
  });

  const [servicesData, setServicesData] = useState<any[]>([
    {
      name: 'Feeder PDDIKTI',
      desc: 'Web Service Neo Feeder Kemdikbud',
      status: 'Belum Terhubung',
      statusType: 'disconnected',
      responseTime: '--',
      isOnline: false,
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
      dotClass: 'bg-rose-500',
      actionUrl: '/admin/superadmin/laporan#konfigurasi',
      actionLabel: 'Konfigurasi Token WS',
    },
    {
      name: 'Database SIAKAD',
      desc: 'Master PostgreSQL Server :5434',
      status: 'Healthy',
      statusType: 'healthy',
      responseTime: '4ms',
      isOnline: true,
      badgeClass: 'bg-emerald-100 text-emerald-800',
      dotClass: 'bg-emerald-500',
    },
    {
      name: 'Cache & Sesi',
      desc: 'In-Memory State & Session Store',
      status: 'Lokal Standalone',
      statusType: 'info',
      responseTime: '1ms',
      isOnline: true,
      badgeClass: 'bg-blue-100 text-blue-800',
      dotClass: 'bg-blue-500',
    },
    {
      name: 'E-Katalog & Berkas',
      desc: 'Penyimpanan Berkas Digital',
      status: 'Siap (Lokal)',
      statusType: 'healthy',
      responseTime: '18ms',
      isOnline: true,
      badgeClass: 'bg-emerald-100 text-emerald-800',
      dotClass: 'bg-emerald-500',
    },
    {
      name: 'Antrian Worker',
      desc: 'Background Job & Sync Processor',
      status: 'Siap (Lokal)',
      statusType: 'healthy',
      responseTime: '<1ms',
      isOnline: true,
      badgeClass: 'bg-emerald-100 text-emerald-800',
      dotClass: 'bg-emerald-500',
    },
    {
      name: 'Presensi & Jadwal Engine',
      desc: 'Validasi Ruang & Jadwal Kuliah',
      status: 'Aktif (Database)',
      statusType: 'healthy',
      responseTime: '4ms',
      isOnline: true,
      badgeClass: 'bg-emerald-100 text-emerald-800',
      dotClass: 'bg-emerald-500',
    },
  ]);

  // 3. Data Fakultas Kampus dari Basis Data
  const [facultiesData, setFacultiesData] = useState<any[]>([
    {
      id: 'f-1',
      name: 'Fakultas Ilmu Komputer',
      code: 'FIK',
      dean: 'Dr. Eng. Satria Pratama, S.Kom., M.T.',
      studyProgramsCount: 4,
      studentsCount: 3150,
      lecturersCount: 102,
      accreditation: 'Unggul',
    },
    {
      id: 'f-2',
      name: 'Fakultas Teknik',
      code: 'FT',
      dean: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
      studyProgramsCount: 4,
      studentsCount: 2920,
      lecturersCount: 94,
      accreditation: 'Unggul',
    },
    {
      id: 'f-3',
      name: 'Fakultas Ekonomi & Bisnis',
      code: 'FEB',
      dean: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
      studyProgramsCount: 2,
      studentsCount: 1930,
      lecturersCount: 60,
      accreditation: 'Unggul',
    },
    {
      id: 'f-4',
      name: 'Fakultas Desain Komunikasi Visual & Seni Digital',
      code: 'FDKV',
      dean: 'Dr. Raden Mas Wibowo, M.Sn.',
      studyProgramsCount: 2,
      studentsCount: 1270,
      lecturersCount: 40,
      accreditation: 'Unggul',
    },
  ]);

  // 4. Log Aktivitas Akademik Kampus
  const [activitiesData, setActivitiesData] = useState<any[]>([
    {
      title: 'Koneksi Basis Data PostgreSQL',
      detail: 'Basis data PostgreSQL siakad_premium aktif dan terhubung pada port 5434.',
      time: 'Baru saja',
      badge: 'Database',
      color: 'bg-[#1E3A8A]',
    },
    {
      title: 'Web Service Neo Feeder PDDIKTI',
      detail: 'Koneksi ke Neo Feeder Kemdikbudristek belum dikonfigurasi. Memerlukan URL dan token institusi.',
      time: 'Baru saja',
      badge: 'PDDIKTI',
      color: 'bg-amber-600',
    },
  ]);

  // 5. KRS Stats dari Database
  const [krsData, setKrsData] = useState<any>({
    enrolledCount: 0,
    approvedCount: 0,
    validationPercentage: 0,
    pendingValidation: 0,
    notFilled: 9270,
    notFilledPercentage: 100,
    activeCourses: 10,
    activeRooms: 10,
  });

  // Quick Actions Akademik Kampus (12 Tombol ke rute riil)
  const quickActions = [
    { name: 'Profil Institusi', icon: Building2, href: '/admin/superadmin/institusi' },
    { name: 'Kelola Fakultas', icon: Landmark, href: '/admin/superadmin/fakultas' },
    { name: 'Program Studi', icon: GraduationCap, href: '/admin/superadmin/prodi' },
    { name: 'Kurikulum & MK', icon: BookOpen, href: '/admin/superadmin/mata-kuliah' },
    { name: 'Gedung & Ruang', icon: DoorOpen, href: '/admin/superadmin/gedung' },
    { name: 'Tahun Akademik', icon: Calendar, href: '/admin/superadmin/tahun-akademik' },
    { name: 'Periode Semester', icon: Clock, href: '/admin/superadmin/semester' },
    { name: 'Jadwal Kuliah', icon: CalendarDays, href: '/admin/superadmin/jadwal' },
    { name: 'Data Dosen', icon: UserCheck, href: '/admin/superadmin/dosen' },
    { name: 'Data Pegawai', icon: Briefcase, href: '/admin/superadmin/pegawai' },
    { name: 'Pelaporan PDDIKTI', icon: ShieldCheck, href: '/admin/superadmin/laporan' },
    { name: 'Biro Keuangan', icon: CreditCard, href: '/finance' },
  ];

  // Fetch real data from PostgreSQL database via API
  useEffect(() => {
    async function fetchRealData() {
      try {
        const res = await fetch(`${apiBaseUrl}/academic/superadmin-dashboard`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const d = json.data;
            if (d.summaryCards && d.summaryCards.length > 0) {
              setSummaryData((prev) =>
                prev.map((card, idx) => {
                  const incoming = d.summaryCards[idx];
                  if (incoming) {
                    return {
                      ...card,
                      value: incoming.value,
                      subtitle: incoming.subtitle,
                      badgeText: incoming.badgeText || card.badgeText,
                    };
                  }
                  return card;
                })
              );
            }

            if (d.overallSystemStatus) {
              setOverallStatus(d.overallSystemStatus);
            }

            if (d.servicesMonitoring && d.servicesMonitoring.length > 0) {
              setServicesData((prev) =>
                prev.map((srv, idx) => {
                  const incoming = d.servicesMonitoring[idx];
                  if (incoming) {
                    return {
                      ...srv,
                      status: incoming.status,
                      statusType: incoming.statusType,
                      responseTime: incoming.responseTime,
                      isOnline: incoming.isOnline,
                      badgeClass: incoming.badgeClass,
                      dotClass: incoming.dotClass,
                      actionUrl: incoming.actionUrl,
                      actionLabel: incoming.actionLabel,
                    };
                  }
                  return srv;
                })
              );
            }

            if (d.faculties && d.faculties.length > 0) {
              setFacultiesData(d.faculties);
            }

            if (d.recentActivities && d.recentActivities.length > 0) {
              setActivitiesData(d.recentActivities);
            }

            if (d.krsStats) {
              setKrsData({
                enrolledCount: d.krsStats.enrolledCount ?? 0,
                approvedCount: d.krsStats.approvedCount ?? 0,
                validationPercentage: d.krsStats.validationPercentage ?? 0,
                pendingValidation: d.krsStats.pendingValidation ?? 0,
                notFilled: d.krsStats.notFilled ?? 9270,
                notFilledPercentage: d.krsStats.notFilledPercentage ?? 100,
                activeCourses: d.krsStats.activeCourses ?? 10,
                activeRooms: d.krsStats.activeRooms ?? 10,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Gagal memuat data live superadmin dari database, menggunakan data cadangan.', err);
      }
    }

    fetchRealData();
  }, [apiBaseUrl]);

  // Sorting & Pagination State for Dashboard Faculty Table
  const [dashSortField, setDashSortField] = useState<string>('name');
  const [dashSortOrder, setDashSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dashCurrentPage, setDashCurrentPage] = useState<number>(1);
  const [dashItemsPerPage, setDashItemsPerPage] = useState<number>(4);

  const handleDashSort = (field: string) => {
    if (dashSortField === field) {
      setDashSortOrder(dashSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setDashSortField(field);
      setDashSortOrder('asc');
    }
    setDashCurrentPage(1);
  };

  useEffect(() => {
    setDashCurrentPage(1);
  }, [selectedFacultyTab]);

  const filteredFaculties = useMemo(() => {
    return selectedFacultyTab === 'unggul'
      ? facultiesData.filter((f) => f.accreditation === 'Unggul')
      : facultiesData;
  }, [facultiesData, selectedFacultyTab]);

  const sortedFaculties = useMemo(() => {
    return [...filteredFaculties].sort((a, b) => {
      let aVal: any = (a as any)[dashSortField];
      let bVal: any = (b as any)[dashSortField];
      if (typeof aVal === 'string') {
        return dashSortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number') {
        return dashSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredFaculties, dashSortField, dashSortOrder]);

  const dashTotalPages = Math.max(1, Math.ceil(sortedFaculties.length / dashItemsPerPage));
  const paginatedFaculties = useMemo(() => {
    const startIndex = (dashCurrentPage - 1) * dashItemsPerPage;
    return sortedFaculties.slice(startIndex, startIndex + dashItemsPerPage);
  }, [sortedFaculties, dashCurrentPage, dashItemsPerPage]);

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Hero Section: Pusat Kendali Akademik Kampus */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Pusat Kendali Akademik & Eksekutif Kampus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sistem Informasi Akademik (SIAKAD) Enterprise
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Institut Teknologi Nusantara &bull; Mengelola seluruh operasional perkuliahan, data mahasiswa, dosen, kurikulum, dan pelaporan PDDIKTI secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/admin/superadmin/institusi"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Building2 className="w-4 h-4 text-[#D4A017]" />
              <span>Profil Institusi</span>
            </Link>

            <a
              href="#kalender"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
            >
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              <span>Kalender Akademik</span>
            </a>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Portal BAAK</span>
            </Link>
          </div>
        </div>

        {/* 2. 6 Summary Cards (Akademik Kampus) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle hover:border-[#1E3A8A]/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 line-clamp-1">
                    {item.title}
                  </span>
                  <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {item.value}
                  </span>
                  {item.isBadge && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {item.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* 3. Monitoring Sistem & Integrasi Akademik */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1E3A8A]" />
                Monitoring Sistem & Integrasi Layanan Kampus
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kondisi operasional server database, sinkronisasi Feeder PDDIKTI, antrian data, dan modul akademik real-time
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${overallStatus.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${overallStatus.dotClass}`}></span>
              <span>{overallStatus.badgeText}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {servicesData.map((service, idx) => {
              const Icon = service.icon || Activity;
              const isDisconnected = service.isOnline === false;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isDisconnected
                      ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70 hover:border-rose-300 shadow-sm'
                      : 'border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${isDisconnected ? 'text-rose-600' : 'text-slate-500'}`} />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          service.badgeClass || (isDisconnected ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800')
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            service.dotClass || (isDisconnected ? 'bg-rose-500' : 'bg-emerald-500')
                          }`}
                        ></span>
                        {service.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{service.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{service.desc}</p>
                    </div>
                  </div>

                  <div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Respons</span>
                      <strong className={`font-semibold ${isDisconnected ? 'text-rose-700' : 'text-slate-800'}`}>
                        {service.responseTime}
                      </strong>
                    </div>

                    {service.actionUrl && (
                      <div className="mt-2 pt-1.5 border-t border-rose-200/70">
                        <Link
                          href={service.actionUrl}
                          className="text-[10px] font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center justify-between"
                        >
                          <span>{service.actionLabel || 'Konfigurasi'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Main Section: Distribusi Fakultas (2 Cols) & Status Registrasi KRS (1 Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribusi Fakultas Kampus (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#1E3A8A]" />
                    Distribusi Fakultas & Program Studi ITN
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Struktur fakultas, dekanat, sebaran mahasiswa, dosen, dan status akreditasi BAN-PT
                  </p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setSelectedFacultyTab('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedFacultyTab === 'all'
                        ? 'bg-white text-[#1E3A8A] font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Semua ({facultiesData.length})
                  </button>
                  <button
                    onClick={() => setSelectedFacultyTab('unggul')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedFacultyTab === 'unggul'
                        ? 'bg-white text-[#1E3A8A] font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Unggul ({facultiesData.filter((f) => f.accreditation === 'Unggul').length})
                  </button>
                </div>
              </div>

              {/* Table Fakultas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                      {/* Sort: Fakultas & Kode */}
                      <th
                        onClick={() => handleDashSort('name')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Klik untuk mengurutkan fakultas"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Fakultas & Kode</span>
                          {dashSortField === 'name' ? (
                            dashSortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>

                      {/* Sort: Dekan */}
                      <th
                        onClick={() => handleDashSort('dean')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Klik untuk mengurutkan dekan"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Dekan</span>
                          {dashSortField === 'dean' ? (
                            dashSortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>

                      {/* Sort: Prodi */}
                      <th
                        onClick={() => handleDashSort('studyProgramsCount')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Klik untuk mengurutkan jumlah prodi"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Prodi</span>
                          {dashSortField === 'studyProgramsCount' ? (
                            dashSortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>

                      {/* Sort: Mahasiswa */}
                      <th
                        onClick={() => handleDashSort('studentsCount')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Klik untuk mengurutkan mahasiswa"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Mahasiswa</span>
                          {dashSortField === 'studentsCount' ? (
                            dashSortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>

                      {/* Sort: Dosen */}
                      <th
                        onClick={() => handleDashSort('lecturersCount')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Klik untuk mengurutkan dosen"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Dosen</span>
                          {dashSortField === 'lecturersCount' ? (
                            dashSortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>

                      {/* Sort: Akreditasi */}
                      <th
                        onClick={() => handleDashSort('accreditation')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                        title="Klik untuk mengurutkan akreditasi"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Akreditasi</span>
                          {dashSortField === 'accreditation' ? (
                            dashSortOrder === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFaculties.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Tidak ada data fakultas
                        </td>
                      </tr>
                    ) : (
                      paginatedFaculties.map((fac) => (
                        <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">{fac.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono font-semibold">{fac.code}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 font-medium">
                            {fac.dean}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                            {fac.studyProgramsCount}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-[#1E3A8A]">
                            {fac.studentsCount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                            {fac.lecturersCount}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                fac.accreditation === 'Unggul'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {fac.accreditation}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer for Dashboard Table */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Tampilkan</span>
                  <select
                    value={dashItemsPerPage}
                    onChange={(e) => {
                      setDashItemsPerPage(Number(e.target.value));
                      setDashCurrentPage(1);
                    }}
                    className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 text-[11px] focus:outline-none"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={facultiesData.length}>Semua ({facultiesData.length})</option>
                  </select>
                  <span className="text-slate-400 ml-1 text-[11px]">
                    &bull; {Math.min(filteredFaculties.length, (dashCurrentPage - 1) * dashItemsPerPage + 1)} - {Math.min(dashCurrentPage * dashItemsPerPage, filteredFaculties.length)} dari {filteredFaculties.length} fakultas
                  </span>
                </div>

                {dashTotalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDashCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={dashCurrentPage === 1}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-0.5 text-[11px]"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Prev</span>
                    </button>

                    {Array.from({ length: dashTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setDashCurrentPage(page)}
                        className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          dashCurrentPage === page
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setDashCurrentPage((p) => Math.min(dashTotalPages, p + 1))}
                      disabled={dashCurrentPage === dashTotalPages}
                      className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-0.5 text-[11px]"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Total Sivitas Akademika: <strong>{summaryData[2]?.value} Mahasiswa &bull; {summaryData[3]?.value} Dosen</strong></span>
              <Link href="/admin/superadmin/institusi" className="font-bold text-[#1E3A8A] hover:underline flex items-center gap-1">
                <span>Lihat Profil Lengkap Kampus</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Status Registrasi & KRS Semester Gasal (1 Col) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#1E3A8A]" />
                  Status KRS Semester Gasal
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1E3A8A]">
                  2026/2027
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* KRS Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">KRS Telah Divalidasi</span>
                    <span className="text-emerald-600 font-bold">
                      {krsData.approvedCount.toLocaleString('id-ID')} ({krsData.validationPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${krsData.validationPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Menunggu Validasi Dosen PA</span>
                    <span className="text-amber-600 font-bold">
                      {krsData.pendingValidation.toLocaleString('id-ID')} ({krsData.enrolledCount > 0 ? ((krsData.pendingValidation / krsData.enrolledCount) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${krsData.enrolledCount > 0 ? (krsData.pendingValidation / krsData.enrolledCount) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Belum Mengisi KRS</span>
                    <span className="text-rose-600 font-bold">
                      {krsData.notFilled.toLocaleString('id-ID')} ({krsData.notFilledPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, krsData.notFilledPercentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Campus Academic Health */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Rata-rata IPK Kampus:</span>
                    <strong className="text-[#1E3A8A] text-sm">3.42 / 4.00</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Mata Kuliah Aktif:</span>
                    <span className="font-bold text-slate-800">{krsData.activeCourses} MK Terdaftar</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Ruang Perkuliahan:</span>
                    <span className="font-bold text-slate-800">{krsData.activeRooms} Ruangan</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Status Sinkronisasi:</span>
                    <span className="font-semibold text-emerald-700">Tersinkron PostgreSQL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Batas KRS: 15 Sep 2026</span>
              <span className="text-emerald-700 font-bold">Periode Berjalan</span>
            </div>
          </div>
        </div>

        {/* 5. 12 Quick Action Akademik Kampus */}
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Aksi Cepat Pengelolaan Akademik</h3>
            <p className="text-xs text-slate-500">Pintas navigasi ke modul-modul esensial BAAK dan administrasi kampus</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle hover:border-[#1E3A8A] hover:shadow-sm transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#1E3A8A] flex items-center justify-center transition-colors mb-2.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#1E3A8A] transition-colors leading-tight">
                    {action.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 6. Aktivitas Akademik Terbaru (Audit Log Kampus) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E3A8A]" />
                Log Aktivitas Akademik & Sistem Terbaru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail kegiatan penting BAAK, jadwal, registrasi mahasiswa, dan sinkronisasi PDDIKTI
              </p>
            </div>
            <button className="text-xs font-bold text-[#1E3A8A] hover:underline">
              Lihat Seluruh Log &rarr;
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activitiesData.map((act, idx) => (
              <div key={idx} className="relative group">
                <div
                  className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ${act.color} ring-4 ring-white`}
                ></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">
                      {act.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {act.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{act.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{act.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
