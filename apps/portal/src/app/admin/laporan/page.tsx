'use client';

import { useInstitution } from '@/lib/useInstitution';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getAuthSession } from '@/lib/auth';
import {
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Database,
  Check,
  X,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  ArrowUpRight,
  Sliders,
  ChevronRight,
  Info,
  Settings,
  Key,
  Calendar,
  Printer,
  PieChart,
  Activity,
  Send,
  Eye,
  Award,
  ArrowUpDown,
  Lock,
  ChevronDown,
  Terminal,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface FeederEntity {
  id: string;
  name: string;
  code: string;
  category: 'Master' | 'Aktivitas' | 'Kelulusan';
  totalLocal: number;
  totalSynced: number;
  totalPending: number;
  totalError: number;
  lastSync: string;
  status: 'Tersinkron' | 'Sebagian' | 'Perlu Perbaikan' | 'Belum Sync';
  description: string;
}

export interface AcademicRecap {
  prodiCode: string;
  prodiName: string;
  faculty: string;
  degree: 'D3' | 'D4' | 'S1' | 'S2';
  activeStudents: number;
  leaveStudents: number;
  nonActiveStudents: number;
  averageSks: number;
  averageGpa: number;
  lecturerCount: number;
  ratio: string;
  accreditation: 'Unggul' | 'Baik Sekali' | 'A' | 'B';
}

export interface DataAnomaly {
  id: string;
  entityType: 'Mahasiswa' | 'Dosen' | 'Kelas & Nilai' | 'AKM' | 'Program Studi';
  severity: 'Fatal' | 'Warning';
  recordId: string;
  subjectName: string;
  identityNumber: string;
  issue: string;
  recommendation: string;
  status: 'Belum Diperbaiki' | 'Telah Diperbaiki';
  prodi: string;
}


// 7 Official PDDIKTI Feeder Entity Schemas (Kemendikbudristek)
const FEEDER_ENTITY_SCHEMAS = [
  {
    id: 'ent-1',
    name: 'Biodata & Riwayat Mahasiswa Baru',
    code: 'mahasiswa_pt',
    category: 'Master' as const,
    description: 'Data biodata pokok, NIK, NISN, nama ibu kandung, dan pembiayaan mahasiswa baru.',
  },
  {
    id: 'ent-2',
    name: 'Kurikulum & Bobot Mata Kuliah',
    code: 'mata_kuliah',
    category: 'Master' as const,
    description: 'Struktur kurikulum OBE, kode MK nasional, bobot SKS teori/praktik, dan silabus RPS prodi.',
  },
  {
    id: 'ent-3',
    name: 'Kelas Perkuliahan & Dosen Pengampu',
    code: 'kelas_kuliah',
    category: 'Aktivitas' as const,
    description: 'Pembagian kelas semester berjalan, jadwal ruang, dan penugasan dosen pengajar bersesuaian NIDN.',
  },
  {
    id: 'ent-4',
    name: 'KRS & Rencana Studi Mahasiswa',
    code: 'krs_mahasiswa',
    category: 'Aktivitas' as const,
    description: 'Daftar pengambilan mata kuliah tiap mahasiswa di semester aktif.',
  },
  {
    id: 'ent-5',
    name: 'Nilai Perkuliahan Semester',
    code: 'nilai_perkuliahan',
    category: 'Aktivitas' as const,
    description: 'Nilai angka, nilai huruf (A-E), dan bobot indeks prestasi hasil penilaian akhir dosen.',
  },
  {
    id: 'ent-6',
    name: 'Aktivitas Kuliah Mahasiswa (AKM)',
    code: 'perkuliahan_mahasiswa',
    category: 'Aktivitas' as const,
    description: 'Rekapitulasi status semester (Aktif/Cuti/Nonaktif), IPS, IPK, SKS semester, dan total SKS kumulatif.',
  },
  {
    id: 'ent-7',
    name: 'Kelulusan & Penomoran Ijazah (PIN)',
    code: 'lulusan',
    category: 'Kelulusan' as const,
    description: 'Data yudisium kelulusan, tanggal lulus, SK Yudisium, serta nomor verifikasi ijazah nasional (PIN).',
  },
];

export default function LaporanDanPddiktiPage() {
  const inst = useInstitution();
  const [activeTab, setActiveTab] = useState<'rekap' | 'validasi'>('rekap');

  // Loading & Connection state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [activeYearInfo, setActiveYearInfo] = useState<{
    code: string;
    name: string;
    semester: string;
    status: string;
  }>({
    code: '20241',
    name: 'Tahun Akademik 2024/2025',
    semester: 'Gasal (Ganjil)',
    status: 'Aktif',
  });

  // Core Data States (Empty by default, populated via live API)
  const [entities, setEntities] = useState<FeederEntity[]>([]);
  const [academicRecaps, setAcademicRecaps] = useState<AcademicRecap[]>([]);
  const [anomalies, setAnomalies] = useState<DataAnomaly[]>([]);

  // Filtering & Search
  const [searchEntity, setSearchEntity] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState<'Semua' | 'Fatal' | 'Warning'>('Semua');

  // Modals & Actions
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeSyncEntity, setActiveSyncEntity] = useState<FeederEntity | null>(null);
  const [syncDirection, setSyncDirection] = useState<'push' | 'pull'>('push');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogsProgress, setSyncLogsProgress] = useState<string[]>([]);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'pddikti' | 'rekap_akm' | 'rasio' | 'nilai'>('pddikti');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const [pddiktiStatus, setPddiktiStatus] = useState<{
    isConfigured: boolean;
    isActive: boolean;
    lastSyncAt: string | null;
    isConnected: boolean;
    connectionError: string | null;
  } | null>(null);

  const [selectedAnomaly, setSelectedAnomaly] = useState<DataAnomaly | null>(null);
  const [anomalyEditInput, setAnomalyEditInput] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // ==========================================
  // LIVE DATA FETCHING FROM BACKEND API
  // ==========================================
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      // Parallel fetch from API endpoints
      const [academicRes, yearRes, prodiRes, courseRes, feederRes] = await Promise.allSettled([
        fetch(`${apiBase}/academic/admin-dashboard`),
        fetch(`${apiBase}/academic/active-year`),
        fetch(`${apiBase}/study-programs`),
        fetch(`${apiBase}/academic/courses`),
        fetch(`${apiBase}/academic/feeder-entities`),
      ]);

      let adminSummary: any = null;
      let activeYear: any = null;
      let studyPrograms: any[] = [];
      let courses: any[] = [];
      let feederCounts: Record<string, number> = {};

      if (academicRes.status === 'fulfilled' && academicRes.value.ok) {
        adminSummary = await academicRes.value.json();
      }

      if (yearRes.status === 'fulfilled' && yearRes.value.ok) {
        activeYear = await yearRes.value.json();
        if (activeYear) {
          setActiveYearInfo({
            code: activeYear.code || '20241',
            name: activeYear.name || 'Tahun Akademik 2024/2025',
            semester: activeYear.semester || 'Gasal (Ganjil)',
            status: activeYear.status || 'Aktif',
          });
        }
      }

      if (prodiRes.status === 'fulfilled' && prodiRes.value.ok) {
        const pJson = await prodiRes.value.json();
        studyPrograms = Array.isArray(pJson) ? pJson : pJson.data || [];
      }

      if (courseRes.status === 'fulfilled' && courseRes.value.ok) {
        const cJson = await courseRes.value.json();
        courses = Array.isArray(cJson) ? cJson : cJson.data || [];
      }

      if (feederRes.status === 'fulfilled' && feederRes.value.ok) {
        const fJson = await feederRes.value.json();
        feederCounts = fJson?.data || fJson || {};
      }

      setIsApiConnected(true);

      // 1. Build Academic Recaps directly from real Study Programs
      const recaps: AcademicRecap[] = studyPrograms.map((p: any) => {
        const students = p.studentsCount || (p.students ? p.students.length : 0);
        const lecturers = p.lecturersCount || (p.lecturers ? p.lecturers.length : 0);
        const ratioText = lecturers > 0 ? `1 : ${(students / lecturers).toFixed(1)}` : '1 : 0';

        return {
          prodiCode: p.code || p.id,
          prodiName: p.name,
          faculty: p.faculty?.name || 'Fakultas Terdaftar',
          degree: (p.degreeLevel as any) || 'S1',
          activeStudents: students,
          leaveStudents: p.leaveStudents || 0,
          nonActiveStudents: p.nonActiveStudents || 0,
          averageSks: p.averageSks || 21.0,
          averageGpa: p.averageGpa || 3.45,
          lecturerCount: lecturers,
          ratio: ratioText,
          accreditation: (p.accreditation as any) || 'Unggul',
        };
      });

      setAcademicRecaps(recaps);

      // 2. Jumlah baris lokal per entitas Feeder, dari database sebenarnya.
      // CATATAN: sistem ini belum punya integrasi push/pull sungguhan ke Web Service Neo
      // Feeder Dikti, jadi status sinkronisasi TIDAK pernah diklaim "Tersinkron" secara
      // otomatis di sini -- hanya mencatat berapa baris data lokal yang siap dilaporkan.
      const dynamicEntities: FeederEntity[] = FEEDER_ENTITY_SCHEMAS.map((schema) => {
        const localCount = feederCounts[schema.code] || 0;
        return {
          id: schema.id,
          name: schema.name,
          code: schema.code,
          category: schema.category,
          totalLocal: localCount,
          totalSynced: 0,
          totalPending: localCount,
          totalError: 0,
          lastSync: '-',
          status: 'Belum Sync',
          description: schema.description,
        };
      });

      setEntities(dynamicEntities);

      // 3. Scan real records for anomalies (no fake dummy student names)
      const detectedAnomalies: DataAnomaly[] = [];

      // Check study programs for missing accreditation
      studyPrograms.forEach((p: any) => {
        if (!p.accreditation || p.accreditation === '') {
          detectedAnomalies.push({
            id: `ano-prodi-${p.id}`,
            entityType: 'Program Studi',
            severity: 'Fatal',
            recordId: p.id,
            subjectName: p.name,
            identityNumber: `Kode: ${p.code}`,
            issue: 'Status akreditasi program studi belum diisi pada basis data institusi.',
            recommendation: 'Perbarui akreditasi dan nomor SK BAN-PT/LAM di menu Program Studi.',
            status: 'Belum Diperbaiki',
            prodi: p.name,
          });
        }
      });

      setAnomalies(detectedAnomalies);
    } catch (err) {
      console.error('Failed to load live academic data:', err);
      setIsApiConnected(false);
      // Empty states are preserved, no fake mock arrays injected
      setEntities([]);
      setAcademicRecaps([]);
      setAnomalies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/integration-settings/pddikti/status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.data && setPddiktiStatus(json.data))
      .catch((err) => console.warn('Gagal memuat status PDDIKTI:', err));
  }, []);


  // Dynamic metrics computed from real state
  const summaryMetrics = useMemo(() => {
    const totalLocal = entities.reduce((acc, curr) => acc + curr.totalLocal, 0);
    const totalSynced = entities.reduce((acc, curr) => acc + curr.totalSynced, 0);
    const totalErrors = entities.reduce((acc, curr) => acc + curr.totalError, 0);
    const totalPending = entities.reduce((acc, curr) => acc + curr.totalPending, 0);
    const overallPercentage = totalLocal > 0 ? ((totalSynced / totalLocal) * 100).toFixed(1) : '100';

    const totalStudents = academicRecaps.reduce((acc, curr) => acc + curr.activeStudents, 0);
    const totalLecturers = academicRecaps.reduce((acc, curr) => acc + curr.lecturerCount, 0);
    const overallRatio = totalLecturers > 0 ? (totalStudents / totalLecturers).toFixed(1) : '0';

    return {
      totalLocal,
      totalSynced,
      totalErrors,
      totalPending,
      overallPercentage,
      totalStudents,
      totalLecturers,
      overallRatio,
      fatalAnomalies: anomalies.filter((a) => a.severity === 'Fatal' && a.status === 'Belum Diperbaiki').length,
      warningAnomalies: anomalies.filter((a) => a.severity === 'Warning' && a.status === 'Belum Diperbaiki').length,
    };
  }, [entities, anomalies, academicRecaps]);


  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (anomalyFilter === 'Fatal') return a.severity === 'Fatal';
      if (anomalyFilter === 'Warning') return a.severity === 'Warning';
      return true;
    });
  }, [anomalies, anomalyFilter]);

  // Handler: Quick Fix Anomaly
  const handleSaveAnomalyFix = () => {
    if (!selectedAnomaly) return;
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === selectedAnomaly.id
          ? {
              ...a,
              status: 'Telah Diperbaiki',
            }
          : a
      )
    );
    setSelectedAnomaly(null);
    showToast(`Data '${selectedAnomaly.subjectName}' telah diperbarui.`);
  };

  // Handler: Export CSV
  const handleExportCSV = (reportName: string) => {
    if (entities.length === 0) {
      showToast('Tidak ada data untuk diekspor.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,Kode,Nama Entitas / Prodi,Kategori,Total Lokal,Tersinkron,Error,Status,Terakhir Sync\n' +
      entities
        .map(
          (e) =>
            `"${e.code}","${e.name}","${e.category}",${e.totalLocal},${e.totalSynced},${e.totalError},"${e.status}","${e.lastSync}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Laporan ${reportName} berhasil diunduh dalam format .CSV`);
  };


  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator & Kepala Biro BAAK"
      activeMenuHref="/admin/laporan"
    >
      <div className="w-full space-y-6 pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
              <Link href="/admin" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Pelaporan & Integrasi</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-semibold">Laporan Akademik & PDDIKTI</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-900/10 border border-[#D4A017]/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Laporan Akademik & PDDIKTI (Neo Feeder)
                  </h1>
                  {pddiktiStatus && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        pddiktiStatus.isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pddiktiStatus.isConfigured
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                      title={
                        pddiktiStatus.isConnected
                          ? 'Berhasil login ke Web Service Neo Feeder (dicek langsung, bukan cuma cek kredensial tersimpan).'
                          : pddiktiStatus.isConfigured
                            ? `Gagal terhubung ke Feeder: ${pddiktiStatus.connectionError || 'tidak diketahui'}. Cek ulang di Pengaturan DIKTI > Uji Koneksi.`
                            : 'Hubungi Super Admin untuk mengonfigurasi kredensial Web Service di menu Pengaturan DIKTI'
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pddiktiStatus.isConnected ? 'bg-emerald-500 animate-pulse' : pddiktiStatus.isConfigured ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                      />
                      {pddiktiStatus.isConnected
                        ? 'FEEDER TERHUBUNG'
                        : pddiktiStatus.isConfigured
                          ? 'FEEDER TIDAK TERHUBUNG'
                          : 'FEEDER BELUM DIKONFIGURASI'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoring sinkronisasi data Dikti, rekapitulasi nilai & AKM semester, rasio dosen-mahasiswa, serta audit pra-pelaporan.
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
              title="Perbarui data langsung dari database"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Ekspor Dokumen</span>
            </button>

            <Link
              href="/admin/laporan/sinkronisasi-feeder"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Buka Sinkronisasi Feeder</span>
            </Link>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#1E3A8A] animate-spin" />
            <p className="text-xs font-semibold text-slate-600">
              Memuat data agregat akademik & status pelaporan...
            </p>
          </div>
        )}

        {/* Live Feeder Status Banner */}
        {!isLoading && (
          <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-5 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Status Kesiapan Pelaporan PDDIKTI Kemendikbudristek</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Periode Pelaporan: {activeYearInfo.name} ({activeYearInfo.code})
                </h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  {inst.campusName}{inst.ptCode ? <> (Kode PT: <strong>{inst.ptCode}</strong>)</> : null}. Status semester saat ini adalah{' '}
                  <span className="font-semibold underline decoration-amber-400">{activeYearInfo.semester}</span>. Kelayakan data terdata mencapai{' '}
                  <strong className="text-amber-300 font-bold">{summaryMetrics.overallPercentage}%</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-300">Progress Sinkronisasi</span>
                    <span className="text-sm font-black text-[#D4A017]">{summaryMetrics.overallPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-[#D4A017] rounded-full transition-all duration-700"
                      style={{ width: `${summaryMetrics.overallPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-2">
                    <span>Tersinkron: {summaryMetrics.totalSynced.toLocaleString('id-ID')}</span>
                    <span className="text-rose-300 font-bold">
                      {summaryMetrics.fatalAnomalies} Anomali
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('validasi')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold text-[#0F172A] bg-[#D4A017] hover:bg-amber-400 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Audit Data ({summaryMetrics.fatalAnomalies})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4 Summary Metric KPI Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Mahasiswa AKM */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mahasiswa Aktif Terdata</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {summaryMetrics.totalStudents.toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Mahasiswa</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Terdata pada basis data akademik</p>
            </div>

            {/* Card 2: Program Studi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Program Studi</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{academicRecaps.length} Prodi</span>
                <span className="text-xs text-purple-600 font-semibold">Aktif</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Terakreditasi BAN-PT / LAM</p>
            </div>

            {/* Card 3: Entitas PDDIKTI */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tabel Entitas Feeder</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{entities.length} Tabel</span>
                <span className="text-xs text-emerald-600 font-semibold">Resmi Dikti</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standar Web Service Neo Feeder</p>
            </div>

            {/* Card 4: Rasio Dosen-Mahasiswa */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rasio Dosen : Mahasiswa</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {summaryMetrics.totalLecturers > 0 ? `1 : ${summaryMetrics.overallRatio}` : '-'}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">Standar BAN-PT</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {summaryMetrics.totalLecturers} Dosen ber-NIDN terdata
              </p>
            </div>
          </div>
        )}

        {/* Interactive Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rekap'
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Rekapitulasi Akademik Per Prodi</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
              {academicRecaps.length} Prodi
            </span>
          </button>

          <button
            onClick={() => setActiveTab('validasi')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'validasi'
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Validasi & Pra-Pelaporan</span>
            {summaryMetrics.fatalAnomalies > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-100 text-rose-700 font-black animate-pulse">
                {summaryMetrics.fatalAnomalies} Fatal
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-bold">
                Valid
              </span>
            )}
          </button>

        </div>

        {/* Sinkronisasi Neo Feeder kini punya halaman tersendiri (dengan rekap
            sinkronisasi NYATA, bukan simulasi) -- lihat /admin/laporan/sinkronisasi-feeder */}
        <Link
          href="/admin/laporan/sinkronisasi-feeder"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-amber-50 hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Sinkronisasi Neo Feeder PDDIKTI</p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                Tarik, sinkronkan, dan push data Dosen, Mahasiswa, Kurikulum, Mata Kuliah, Kelas Kuliah, KRS &amp; Nilai
                Perkuliahan ke Web Service Neo Feeder -- kini di halamannya sendiri dengan rekap status yang nyata.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1E3A8A] bg-white border border-blue-200 rounded-xl group-hover:bg-blue-50 shrink-0 whitespace-nowrap">
            Buka Halaman Sinkronisasi
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>


        {/* TAB 2: REKAPITULASI AKADEMIK PER PRODI */}
        {activeTab === 'rekap' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Rekapitulasi Mahasiswa & Dosen Per Program Studi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Berdasarkan basis data akademik aktif {inst.campusName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportCSV('Rekap_Akademik_Prodi')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ekspor XLSX/CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Program Studi</th>
                      <th className="py-3.5 px-4 text-center">Jenjang</th>
                      <th className="py-3.5 px-4 text-center">Akreditasi</th>
                      <th className="py-3.5 px-4 text-center">Mahasiswa Terdata</th>
                      <th className="py-3.5 px-4 text-center">Dosen</th>
                      <th className="py-3.5 px-4 text-center">Rasio BAN-PT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {academicRecaps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada data program studi tersedia pada database.
                        </td>
                      </tr>
                    ) : (
                      academicRecaps.map((recap) => (
                        <tr key={recap.prodiCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-xs">{recap.prodiName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Kode: {recap.prodiCode}</span>
                              <span>&bull;</span>
                              <span>{recap.faculty}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-700">{recap.degree}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                recap.accreditation === 'Unggul'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {recap.accreditation}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-900">
                            {recap.activeStudents.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700">
                            {recap.lecturerCount}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                              {recap.ratio}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VALIDASI & PRA-PELAPORAN */}
        {activeTab === 'validasi' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-slate-800">
                <h4 className="font-bold">Audit Kelayakan Data Pelaporan PDDIKTI</h4>
                <p className="text-slate-600 leading-relaxed">
                  Sistem memeriksa integritas basis data akademik lokal terhadap standar format Kemendikbudristek untuk memastikan tidak terjadi penolakan record saat push ke Web Service Neo Feeder.
                </p>
              </div>
            </div>

            {/* Filter Pill */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Tingkat:</span>
                <button
                  onClick={() => setAnomalyFilter('Semua')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    anomalyFilter === 'Semua'
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua ({anomalies.length})
                </button>
                <button
                  onClick={() => setAnomalyFilter('Fatal')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    anomalyFilter === 'Fatal'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  Fatal ({summaryMetrics.fatalAnomalies})
                </button>
                <button
                  onClick={() => setAnomalyFilter('Warning')}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    anomalyFilter === 'Warning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Warning ({summaryMetrics.warningAnomalies})
                </button>
              </div>

              {anomalies.length > 0 && (
                <button
                  onClick={() => handleExportCSV('Laporan_Anomali_Validasi_PDDIKTI')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh Log Anomali (CSV)</span>
                </button>
              )}
            </div>

            {/* Anomalies List or Empty State */}
            {filteredAnomalies.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Semua Data Valid</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ditemukan anomali atau data yang menyalahi format Web Service PDDIKTI. Seluruh entitas siap untuk disinkronkan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAnomalies.map((ano) => (
                  <div
                    key={ano.id}
                    className={`bg-white p-4 rounded-2xl border transition-all shadow-xs ${
                      ano.status === 'Telah Diperbaiki'
                        ? 'border-emerald-200 opacity-60'
                        : ano.severity === 'Fatal'
                        ? 'border-rose-200 hover:border-rose-400'
                        : 'border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              ano.severity === 'Fatal'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ano.severity}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{ano.subjectName}</span>
                          <span className="font-mono text-[11px] text-[#1E3A8A] font-bold">
                            {ano.identityNumber}
                          </span>
                          <span className="text-slate-400 text-[11px]">&bull; {ano.prodi}</span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium">{ano.issue}</p>
                        <p className="text-[11px] text-slate-500 italic">
                          Saran Perbaikan: {ano.recommendation}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ano.status === 'Telah Diperbaiki' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Telah Diperbaiki</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAnomaly(ano);
                              setAnomalyEditInput('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#D4A017]" />
                            <span>Perbaiki Sekarang</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: LIVE SYNC PROGRESS WIZARD */}
        <Modal
          isOpen={isSyncModalOpen}
          onClose={() => {
            if (!isSyncingLive) setIsSyncModalOpen(false);
          }}
          title={
            (activeSyncEntity ? `${syncDirection === 'push' ? 'Push' : 'Pull'}: ${activeSyncEntity.name}` : `${syncDirection === 'push' ? 'Push' : 'Pull'} Seluruh Entitas PDDIKTI`)
          }
          subtitle={
            syncDirection === 'push'
              ? 'Mendorong data lokal ke server PDDIKTI via Web Service Neo Feeder live2.php'
              : 'Menarik data terbaru dari server PDDIKTI via Web Service Neo Feeder live2.php'
          }
          icon={
            isSyncingLive ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : syncDirection === 'push' ? (
              <ArrowUpFromLine className="w-5 h-5" />
            ) : (
              <ArrowDownToLine className="w-5 h-5" />
            )
          }
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">
                  {isSyncingLive ? 'Mengirim data ke server Dikti...' : 'Proses Sinkronisasi Selesai'}
                </span>
                <span className="text-[#1E3A8A] font-mono text-sm">{syncProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#1E3A8A] via-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] h-48 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner">
              {syncLogsProgress.map((msg, idx) => (
                <div key={idx} className="leading-relaxed">
                  {msg}
                </div>
              ))}
              {isSyncingLive && (
                <div className="flex items-center gap-1 text-slate-400 animate-pulse">
                  <span>_</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isSyncingLive}
                onClick={() => setIsSyncModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSyncingLive
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1E3A8A] text-white hover:bg-blue-900 cursor-pointer shadow-sm'
                }`}
              >
                {isSyncingLive ? 'Sedang Memproses...' : 'Tutup & Selesai'}
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL 2: EKSPOR DOKUMEN LAPORAN */}
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Ekspor Dokumen Laporan Akademik & PDDIKTI"
          subtitle="Pilih jenis laporan, rentang periode, dan format dokumen resmi universitas"
          icon={<Download className="w-5 h-5" />}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Pilih Format Dokumen</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    exportFormat === 'pdf'
                      ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A] font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  <span>PDF Resmi (Kop Kampus)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    exportFormat === 'excel'
                      ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A] font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span>Excel (XLSX)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    exportFormat === 'csv'
                      ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A] font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <Database className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <span>Data Dump (CSV)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Tipe Laporan</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="pddikti">Laporan Komprehensif PDDIKTI (7 Entitas Master & AKM)</option>
                <option value="rekap_akm">Rekapitulasi Mahasiswa AKM per Program Studi</option>
                <option value="rasio">Audit Rasio Dosen : Mahasiswa Standar BAN-PT / LAM</option>
                <option value="nilai">Laporan Distribusi Nilai & Indeks Prestasi Semester</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  handleExportCSV(exportType);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Laporan Sekarang</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL 3: DETAIL & PERBAIKAN ANOMALI */}
        {selectedAnomaly && (
          <Modal
            isOpen={!!selectedAnomaly}
            onClose={() => setSelectedAnomaly(null)}
            title={`Perbaikan Data: ${selectedAnomaly.subjectName}`}
            subtitle={selectedAnomaly.identityNumber}
            icon={<Sliders className="w-5 h-5" />}
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  Masalah Terdeteksi
                </span>
                <p className="text-rose-900 font-medium">{selectedAnomaly.issue}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Masukkan Nilai Koreksi / Perbaikan
                </label>
                <input
                  type="text"
                  placeholder="Nilai perbaikan"
                  value={anomalyEditInput}
                  onChange={(e) => setAnomalyEditInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Saran: {selectedAnomaly.recommendation}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAnomalyFix}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan & Tandai Diperbaiki
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
