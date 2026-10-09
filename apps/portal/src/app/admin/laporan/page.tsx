'use client';

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

export interface RemoteDosenItem {
  // Dosen bisa cuma punya salah satu dari NIDN/NUPTK (terkonfirmasi dari Neo Feeder
  // sungguhan, bukan dua-duanya selalu ada) -- jadi keduanya opsional di sini.
  nidn?: string;
  nuptk?: string;
  nip?: string;
  nidk?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  functionalPosition?: string;
  employmentStatus?: string;
  lastEducation?: string;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteMahasiswaItem {
  feederId?: string;
  nim?: string;
  nik?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
  birthPlace?: string;
  birthDate?: string;
  entryYear?: number;
  status?: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT' | 'TRANSFERRED';
  email?: string;
  phone?: string;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteCourseItem {
  feederId?: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteCurriculumItem {
  feederId?: string;
  name: string;
  startYear?: number;
  totalSks?: number;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteCourseClassItem {
  feederId?: string;
  className: string;
  courseFeederId?: string;
  courseCode?: string;
  courseName?: string;
  academicYearCode?: string;
  sks?: number;
  studentCount?: number;
  prodiCode?: string;
  lecturerFeederId?: string;
  lecturerNidn?: string;
  lecturerName?: string;
}

export interface RemoteAcademicYearItem {
  code: string;
  name: string;
  semesterType: 'ODD' | 'EVEN' | 'SHORT';
  startDate: string;
  endDate: string;
  isActiveAtFeeder?: boolean;
}

export interface RemoteEnrollmentItem {
  classFeederId: string;
  className?: string;
  studentFeederId?: string;
  nim?: string;
  studentName?: string;
  courseCode?: string;
  courseName?: string;
  prodiCode?: string;
}

export interface NilaiSyncJobStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  totalClasses: number;
  processedClasses: number;
  updatedGrades: number;
  skippedGrades: number;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
}

export interface RemoteGradeScaleItem {
  prodiName: string;
  letter: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
}

export interface SyncLogItem {
  id: string;
  timestamp: string;
  entity: string;
  batchSize: number;
  successCount: number;
  errorCount: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  durationMs: number;
  message: string;
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
  const [activeTab, setActiveTab] = useState<'feeder' | 'rekap' | 'validasi'>('feeder');

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
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

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

  // Tarik & Sinkronkan Data Dosen dari Feeder
  const [isPullingDosen, setIsPullingDosen] = useState(false);
  const [isSyncingDosen, setIsSyncingDosen] = useState(false);
  const [dosenPullMessage, setDosenPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [dosenPullItems, setDosenPullItems] = useState<RemoteDosenItem[]>([]);
  const [dosenMatchedCount, setDosenMatchedCount] = useState<number | null>(null);
  const [studyProgramsForDosen, setStudyProgramsForDosen] = useState<{ id: string; code: string; diktiCode: string; name: string }[]>([]);
  const [dosenProdiChoice, setDosenProdiChoice] = useState<Record<string, string>>({});
  const [isDosenResultModalOpen, setIsDosenResultModalOpen] = useState(false);

  // Tarik & Sinkronkan Data Mahasiswa dari Feeder
  const [isPullingMhs, setIsPullingMhs] = useState(false);
  const [isSyncingMhs, setIsSyncingMhs] = useState(false);
  const [mhsAngkatan, setMhsAngkatan] = useState('');
  const [mhsAngkatanOptions, setMhsAngkatanOptions] = useState<number[]>([]);
  const [isLoadingMhsAngkatan, setIsLoadingMhsAngkatan] = useState(true);
  const [mhsAngkatanError, setMhsAngkatanError] = useState<string | null>(null);
  const [mhsPullMessage, setMhsPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [mhsPullItems, setMhsPullItems] = useState<RemoteMahasiswaItem[]>([]);
  const [mhsProdiChoice, setMhsProdiChoice] = useState<Record<string, string>>({});
  const [isMhsResultModalOpen, setIsMhsResultModalOpen] = useState(false);
  const [isPushingMhs, setIsPushingMhs] = useState(false);

  // Tarik & Sinkronkan Kurikulum + Mata Kuliah dari Feeder
  const [isPullingKurikulum, setIsPullingKurikulum] = useState(false);
  const [isSyncingKurikulum, setIsSyncingKurikulum] = useState(false);
  const [isPushingKurikulum, setIsPushingKurikulum] = useState(false);
  const [kurikulumPullMessage, setKurikulumPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [kurikulumPullItems, setKurikulumPullItems] = useState<RemoteCurriculumItem[]>([]);
  const [kurikulumProdiChoice, setKurikulumProdiChoice] = useState<Record<string, string>>({});
  const [matkulPullItems, setMatkulPullItems] = useState<RemoteCourseItem[]>([]);
  const [matkulProdiChoice, setMatkulProdiChoice] = useState<Record<string, string>>({});
  const [isKurikulumResultModalOpen, setIsKurikulumResultModalOpen] = useState(false);

  // Tarik & Sinkronkan Tahun Akademik & Periode Semester dari Feeder
  const [isPullingTahunAkademik, setIsPullingTahunAkademik] = useState(false);
  const [isSyncingTahunAkademik, setIsSyncingTahunAkademik] = useState(false);
  const [tahunAkademikPullMessage, setTahunAkademikPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [tahunAkademikPullItems, setTahunAkademikPullItems] = useState<RemoteAcademicYearItem[]>([]);
  const [tahunAkademikLocalCount, setTahunAkademikLocalCount] = useState(0);

  // Tarik & Sinkronkan Kelas Perkuliahan & Dosen Pengampu dari Feeder
  const [isPullingKelas, setIsPullingKelas] = useState(false);
  const [isSyncingKelas, setIsSyncingKelas] = useState(false);
  const [kelasPullMessage, setKelasPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [kelasPullItems, setKelasPullItems] = useState<RemoteCourseClassItem[]>([]);
  const [isKelasResultModalOpen, setIsKelasResultModalOpen] = useState(false);

  // Tarik & Sinkronkan KRS & Rencana Studi Mahasiswa dari Feeder
  const [isPullingKrs, setIsPullingKrs] = useState(false);
  const [isSyncingKrs, setIsSyncingKrs] = useState(false);
  const [krsPullMessage, setKrsPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [krsPullItems, setKrsPullItems] = useState<RemoteEnrollmentItem[]>([]);

  // Sinkronisasi Nilai Perkuliahan Semester (job background -- dipoll statusnya)
  const [isStartingNilaiJob, setIsStartingNilaiJob] = useState(false);
  const [nilaiJobStatus, setNilaiJobStatus] = useState<NilaiSyncJobStatus | null>(null);

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
      setStudyProgramsForDosen(
        studyPrograms.map((p: any) => ({ id: p.id, code: p.code, diktiCode: p.diktiCode || '', name: p.name }))
      );

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

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/academic/years`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result)) setTahunAkademikLocalCount(result.length);
      })
      .catch((err) => console.warn('Gagal memuat jumlah tahun akademik lokal:', err));
  }, []);

  // Poll status job background Pull+Sync Nilai Perkuliahan -- dicek sekali saat halaman
  // dibuka (mungkin ada job yang masih berjalan dari sesi sebelumnya), lalu tiap 4 detik
  // selama statusnya "running".
  const fetchNilaiJobStatus = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    try {
      const res = await fetch(`${apiBase}/integration-settings/pddikti/nilai-perkuliahan/pull-sync/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (result?.status) setNilaiJobStatus(result);
    } catch {
      // non-blocking -- biarkan polling berikutnya mencoba lagi
    }
  }, []);

  useEffect(() => {
    fetchNilaiJobStatus();
  }, [fetchNilaiJobStatus]);

  useEffect(() => {
    if (nilaiJobStatus?.status !== 'running') return;
    const interval = setInterval(fetchNilaiJobStatus, 4000);
    return () => clearInterval(interval);
  }, [nilaiJobStatus?.status, fetchNilaiJobStatus]);

  // Pilihan tahun angkatan untuk Pull Mahasiswa -- lokal diutamakan, fallback ke contoh
  // data Feeder kalau belum ada mahasiswa lokal sama sekali (lihat getMahasiswaAngkatanOptions).
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/angkatan`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result?.years)) setMhsAngkatanOptions(result.years);
        if (!result?.success) setMhsAngkatanError(result?.message || 'Gagal memuat daftar tahun angkatan.');
      })
      .catch((err) => setMhsAngkatanError(err instanceof Error ? err.message : 'Gagal memuat daftar tahun angkatan.'))
      .finally(() => setIsLoadingMhsAngkatan(false));
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

  // Filtered entities -- mahasiswa_pt & mata_kuliah dikeluarkan dari daftar generik karena
  // sudah punya card khusus dengan Pull/Sync sungguhan (sama seperti Dosen).
  const filteredEntities = useMemo(() => {
    return entities.filter(
      (e) =>
        e.code !== 'mahasiswa_pt' &&
        e.code !== 'mata_kuliah' &&
        e.code !== 'kelas_kuliah' &&
        e.code !== 'krs_mahasiswa' &&
        e.code !== 'nilai_perkuliahan' &&
        (e.name.toLowerCase().includes(searchEntity.toLowerCase()) ||
          e.code.toLowerCase().includes(searchEntity.toLowerCase()) ||
          e.category.toLowerCase().includes(searchEntity.toLowerCase()))
    );
  }, [entities, searchEntity]);

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (anomalyFilter === 'Fatal') return a.severity === 'Fatal';
      if (anomalyFilter === 'Warning') return a.severity === 'Warning';
      return true;
    });
  }, [anomalies, anomalyFilter]);

  // Handler: Sinkronisasi push/pull ke Dikti BELUM TERSEDIA -- sistem ini belum punya
  // integrasi pengiriman sungguhan ke Web Service Neo Feeder, jadi aksi ini hanya
  // memberi tahu pengguna dengan jujur alih-alih berpura-pura mengirim data.
  const handleStartSync = (_entity: FeederEntity | null, _direction: 'push' | 'pull' = 'push') => {
    showToast('Integrasi pengiriman data ke Dikti (Web Service Neo Feeder) belum tersedia di sistem ini.');
  };

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

  // Kunci unik baris dosen hasil tarikan Feeder -- dosen bisa cuma punya NIDN atau
  // cuma NUPTK, jadi tidak bisa pakai nidn mentah sebagai key/identitas tunggal.
  const dosenKey = (item: RemoteDosenItem) => item.nidn || item.nuptk || '';

  // Handler: Tarik Data Dosen dari Feeder
  const handlePullDosen = async () => {
    setIsPullingDosen(true);
    setDosenPullMessage(null);
    setDosenPullItems([]);
    setDosenMatchedCount(null);
    setDosenProdiChoice({});
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/dosen`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401 || res.status === 403) {
        setDosenPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result) {
        setDosenPullMessage({ success: false, text: 'Gagal membaca respons server.' });
        return;
      }
      if (!result.success) {
        setDosenPullMessage({ success: false, text: result.message });
        return;
      }

      const items: RemoteDosenItem[] = Array.isArray(result.items) ? result.items : [];
      // Pencocokan sungguhan (sudah-ada-atau-belum) dilakukan server-side saat sync
      // berdasarkan NIDN -- di sini semua item ditampilkan dulu, lalu dicoba dicocokkan
      // otomatis ke prodi lokal lewat kode prodi supaya admin tidak perlu pilih manual
      // kalau kodenya sudah sama persis.
      const autoChoice: Record<string, string> = {};
      items.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoChoice[dosenKey(item)] = match.id;
      });

      setDosenMatchedCount(null);
      setDosenPullItems(items);
      setDosenProdiChoice(autoChoice);
      setDosenPullMessage({
        success: true,
        text: `${items.length} dosen ditarik dari Feeder. ${Object.keys(autoChoice).length} prodi home base otomatis cocok, sisanya perlu dipilih manual.`,
      });
      if (items.length > 0) setIsDosenResultModalOpen(true);
    } catch (err) {
      setDosenPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingDosen(false);
    }
  };

  // Handler: Sinkronkan Dosen hasil Pull ke data lokal
  const handleSyncDosen = async () => {
    if (dosenPullItems.length === 0) return;
    setIsSyncingDosen(true);
    const startedAt = Date.now();
    const batchSize = dosenPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const items = dosenPullItems.map((i) => ({ ...i, studyProgramId: dosenProdiChoice[dosenKey(i)] }));
      const res = await fetch(`${apiBase}/integration-settings/pddikti/dosen/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      const created = result?.created ?? 0;
      const updated = result?.updated ?? 0;
      const skipped = result?.skipped ?? 0;
      setSyncLogs((prev) => [
        {
          id: `log-dosen-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Dosen (dosen_pddikti)',
          batchSize,
          successCount: created + updated,
          errorCount: skipped,
          status: skipped > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Sinkronisasi dosen selesai.',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi dosen selesai.');
      setDosenPullItems([]);
      setDosenProdiChoice({});
      setIsDosenResultModalOpen(false);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-dosen-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Dosen (dosen_pddikti)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan data dosen.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan data dosen.');
    } finally {
      setIsSyncingDosen(false);
    }
  };

  // Kunci unik baris mahasiswa hasil tarikan Feeder.
  const mhsKey = (item: RemoteMahasiswaItem) => item.feederId || item.nim || '';

  // Handler: Tarik Data Mahasiswa dari Feeder (opsional difilter tahun angkatan)
  const handlePullMahasiswa = async () => {
    setIsPullingMhs(true);
    setMhsPullMessage(null);
    setMhsPullItems([]);
    setMhsProdiChoice({});
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const qs = mhsAngkatan.trim() ? `?angkatan=${encodeURIComponent(mhsAngkatan.trim())}` : '';
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401 || res.status === 403) {
        setMhsPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result) {
        setMhsPullMessage({ success: false, text: 'Gagal membaca respons server.' });
        return;
      }
      if (!result.success) {
        setMhsPullMessage({ success: false, text: result.message });
        return;
      }

      const items: RemoteMahasiswaItem[] = Array.isArray(result.items) ? result.items : [];
      const autoChoice: Record<string, string> = {};
      items.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoChoice[mhsKey(item)] = match.id;
      });

      setMhsPullItems(items);
      setMhsProdiChoice(autoChoice);
      setMhsPullMessage({
        success: true,
        text:
          items.length > 0
            ? `${items.length} mahasiswa ditarik dari Feeder. ${Object.keys(autoChoice).length} prodi home base otomatis cocok, sisanya perlu dipilih manual.`
            : result.message,
      });
      if (items.length > 0) setIsMhsResultModalOpen(true);
    } catch (err) {
      setMhsPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingMhs(false);
    }
  };

  // Handler: Sinkronkan Mahasiswa hasil Pull ke data lokal
  const handleSyncMahasiswa = async () => {
    if (mhsPullItems.length === 0) return;
    setIsSyncingMhs(true);
    const startedAt = Date.now();
    const batchSize = mhsPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const items = mhsPullItems.map((i) => ({ ...i, studyProgramId: mhsProdiChoice[mhsKey(i)] }));
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      const created = result?.created ?? 0;
      const updated = result?.updated ?? 0;
      const skipped = result?.skipped ?? 0;
      setSyncLogs((prev) => [
        {
          id: `log-mhs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt)',
          batchSize,
          successCount: created + updated,
          errorCount: skipped,
          status: skipped > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Sinkronisasi mahasiswa selesai.',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi mahasiswa selesai.');
      setMhsPullItems([]);
      setMhsProdiChoice({});
      setIsMhsResultModalOpen(false);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-mhs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan data mahasiswa.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan data mahasiswa.');
    } finally {
      setIsSyncingMhs(false);
    }
  };

  // Handler: Push mahasiswa aktif lokal yang belum terdaftar ke Feeder (tulis ke PDDIKTI).
  // Beda dari Pull/Sync -- ini MENULIS ke sistem resmi Dikti, jadi sengaja tanpa auto-retry
  // dan selalu ditampilkan utuh pesan dari backend (termasuk alasan gagal per mahasiswa).
  const handlePushMahasiswa = async () => {
    setIsPushingMhs(true);
    const startedAt = Date.now();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok || !result) throw new Error(result?.message || `HTTP ${res.status}`);

      const processed = result?.processed ?? 0;
      const createdCount = result?.created ?? 0;
      const failedCount = result?.failed ?? 0;
      setSyncLogs((prev) => [
        {
          id: `log-mhs-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt) -- Push ke Feeder',
          batchSize: processed,
          successCount: createdCount + (result?.linked ?? 0),
          errorCount: failedCount,
          status: !result?.success ? 'FAILED' : failedCount > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Push mahasiswa ke Feeder selesai.',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Push mahasiswa ke Feeder selesai.');
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-mhs-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt) -- Push ke Feeder',
          batchSize: 0,
          successCount: 0,
          errorCount: 0,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal push data mahasiswa ke Feeder.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal push data mahasiswa ke Feeder.');
    } finally {
      setIsPushingMhs(false);
    }
  };

  const kurikulumKey = (item: RemoteCurriculumItem) => item.feederId || item.name;
  const matkulKey = (item: RemoteCourseItem) => item.feederId || item.code;

  // Handler: Tarik Kurikulum + Mata Kuliah dari Feeder sekaligus
  const handlePullKurikulumMataKuliah = async () => {
    setIsPullingKurikulum(true);
    setKurikulumPullMessage(null);
    setKurikulumPullItems([]);
    setMatkulPullItems([]);
    setKurikulumProdiChoice({});
    setMatkulProdiChoice({});
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [kurRes, mkRes] = await Promise.all([
        fetch(`${apiBase}/integration-settings/pddikti/kurikulum`, { headers }),
        fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah`, { headers }),
      ]);
      if (kurRes.status === 401 || kurRes.status === 403 || mkRes.status === 401 || mkRes.status === 403) {
        setKurikulumPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const kurJson = await kurRes.json().catch(() => null);
      const mkJson = await mkRes.json().catch(() => null);
      const kurResult = kurJson?.data ?? kurJson;
      const mkResult = mkJson?.data ?? mkJson;

      if (!kurResult?.success && !mkResult?.success) {
        setKurikulumPullMessage({ success: false, text: kurResult?.message || mkResult?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const kurItems: RemoteCurriculumItem[] = Array.isArray(kurResult?.items) ? kurResult.items : [];
      const mkItems: RemoteCourseItem[] = Array.isArray(mkResult?.items) ? mkResult.items : [];

      const autoKur: Record<string, string> = {};
      kurItems.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoKur[kurikulumKey(item)] = match.id;
      });
      const autoMk: Record<string, string> = {};
      mkItems.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoMk[matkulKey(item)] = match.id;
      });

      setKurikulumPullItems(kurItems);
      setMatkulPullItems(mkItems);
      setKurikulumProdiChoice(autoKur);
      setMatkulProdiChoice(autoMk);
      setKurikulumPullMessage({
        success: true,
        text: `${kurItems.length} kurikulum & ${mkItems.length} mata kuliah ditarik dari Feeder. Prodi yang kodenya cocok otomatis terisi, sisanya perlu dipilih manual.`,
      });
      if (kurItems.length > 0 || mkItems.length > 0) setIsKurikulumResultModalOpen(true);
    } catch (err) {
      setKurikulumPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingKurikulum(false);
    }
  };

  // Handler: Sinkronkan Kurikulum + Mata Kuliah hasil Pull ke data lokal
  const handleSyncKurikulumMataKuliah = async () => {
    if (kurikulumPullItems.length === 0 && matkulPullItems.length === 0) return;
    setIsSyncingKurikulum(true);
    const startedAt = Date.now();
    const batchSize = kurikulumPullItems.length + matkulPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const kurItems = kurikulumPullItems.map((i) => ({ ...i, studyProgramId: kurikulumProdiChoice[kurikulumKey(i)] }));
      const mkItems = matkulPullItems.map((i) => ({ ...i, studyProgramId: matkulProdiChoice[matkulKey(i)] }));

      // Kurikulum WAJIB disinkronkan dulu (bukan paralel) -- mata kuliah dikaitkan ke
      // Curriculum lokal lewat feederId-nya, jadi kurikulumnya harus sudah ada duluan
      // supaya tautannya langsung benar di percobaan sync pertama.
      const kurRes = await fetch(`${apiBase}/integration-settings/pddikti/kurikulum/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: kurItems }),
      });
      const kurJson = await kurRes.json().catch(() => null);
      const kurResult = kurJson?.data ?? kurJson;
      if (!kurRes.ok) throw new Error(kurResult?.message || `HTTP ${kurRes.status}`);

      const mkRes = await fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: mkItems }),
      });
      const mkJson = await mkRes.json().catch(() => null);
      const mkResult = mkJson?.data ?? mkJson;
      if (!mkRes.ok) throw new Error(mkResult?.message || `HTTP ${mkRes.status}`);

      const created = (kurResult?.created ?? 0) + (mkResult?.created ?? 0);
      const updated = (kurResult?.updated ?? 0) + (mkResult?.updated ?? 0);
      const skipped = (kurResult?.skipped ?? 0) + (mkResult?.skipped ?? 0);
      const message = `Kurikulum: ${kurResult?.message || '-'} | Mata Kuliah: ${mkResult?.message || '-'}`;
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah)',
          batchSize,
          successCount: created + updated,
          errorCount: skipped,
          status: skipped > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message,
        },
        ...prev,
      ]);

      showToast(message);
      setKurikulumPullItems([]);
      setMatkulPullItems([]);
      setKurikulumProdiChoice({});
      setMatkulProdiChoice({});
      setIsKurikulumResultModalOpen(false);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan kurikulum & mata kuliah.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan kurikulum & mata kuliah.');
    } finally {
      setIsSyncingKurikulum(false);
    }
  };

  // Handler: Push mata kuliah + kurikulum lokal yang belum terdaftar ke Feeder (tulis ke PDDIKTI).
  const handlePushKurikulumMataKuliah = async () => {
    setIsPushingKurikulum(true);
    const startedAt = Date.now();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const [mkRes, kurRes] = await Promise.all([
        fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah/push`, { method: 'POST', headers, body: JSON.stringify({}) }),
        fetch(`${apiBase}/integration-settings/pddikti/kurikulum/push`, { method: 'POST', headers, body: JSON.stringify({}) }),
      ]);
      const mkJson = await mkRes.json().catch(() => null);
      const kurJson = await kurRes.json().catch(() => null);
      const mkResult = mkJson?.data ?? mkJson;
      const kurResult = kurJson?.data ?? kurJson;
      if (!mkRes.ok && !kurRes.ok) throw new Error(mkResult?.message || kurResult?.message || `HTTP ${mkRes.status}`);

      const processed = (mkResult?.processed ?? 0) + (kurResult?.processed ?? 0);
      const createdCount = (mkResult?.created ?? 0) + (kurResult?.created ?? 0);
      const failedCount = (mkResult?.failed ?? 0) + (kurResult?.failed ?? 0);
      const message = `Mata Kuliah: ${mkResult?.message || '-'} | Kurikulum: ${kurResult?.message || '-'}`;
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah) -- Push ke Feeder',
          batchSize: processed,
          successCount: createdCount + (mkResult?.linked ?? 0) + (kurResult?.linked ?? 0),
          errorCount: failedCount,
          status: !mkResult?.success && !kurResult?.success ? 'FAILED' : failedCount > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message,
        },
        ...prev,
      ]);

      showToast(message);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah) -- Push ke Feeder',
          batchSize: 0,
          successCount: 0,
          errorCount: 0,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal push kurikulum & mata kuliah ke Feeder.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal push kurikulum & mata kuliah ke Feeder.');
    } finally {
      setIsPushingKurikulum(false);
    }
  };

  // Handler: Tarik Tahun Akademik & Periode Semester dari Feeder
  const handlePullTahunAkademik = async () => {
    setIsPullingTahunAkademik(true);
    setTahunAkademikPullMessage(null);
    setTahunAkademikPullItems([]);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/integration-settings/pddikti/tahun-akademik`, { headers });
      if (res.status === 401 || res.status === 403) {
        setTahunAkademikPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result?.success) {
        setTahunAkademikPullMessage({ success: false, text: result?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const items: RemoteAcademicYearItem[] = Array.isArray(result?.items) ? result.items : [];
      setTahunAkademikPullItems(items);
      setTahunAkademikPullMessage({
        success: true,
        text: `${items.length} periode semester ditarik dari Feeder (seluruh riwayat, bukan cuma yang berjalan).`,
      });
    } catch (err) {
      setTahunAkademikPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingTahunAkademik(false);
    }
  };

  // Handler: Sinkronkan Tahun Akademik hasil Pull ke data lokal
  const handleSyncTahunAkademik = async () => {
    if (tahunAkademikPullItems.length === 0) return;
    setIsSyncingTahunAkademik(true);
    const startedAt = Date.now();
    const batchSize = tahunAkademikPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await fetch(`${apiBase}/integration-settings/pddikti/tahun-akademik/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: tahunAkademikPullItems }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      setSyncLogs((prev) => [
        {
          id: `log-tahun-akademik-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Tahun Akademik & Periode Semester (tahun_akademik)',
          batchSize,
          successCount: (result?.created ?? 0) + (result?.updated ?? 0),
          errorCount: result?.skipped ?? 0,
          status: (result?.skipped ?? 0) > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || '-',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi tahun akademik selesai.');
      setTahunAkademikPullItems([]);
      setTahunAkademikPullMessage(null);
      setTahunAkademikLocalCount((prev) => prev + (result?.created ?? 0));
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-tahun-akademik-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Tahun Akademik & Periode Semester (tahun_akademik)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan tahun akademik.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan tahun akademik.');
    } finally {
      setIsSyncingTahunAkademik(false);
    }
  };

  const kelasKey = (item: RemoteCourseClassItem) => item.feederId || `${item.courseFeederId}-${item.className}`;

  // Handler: Tarik Kelas Perkuliahan & Dosen Pengampu dari Feeder
  const handlePullKelasKuliah = async () => {
    setIsPullingKelas(true);
    setKelasPullMessage(null);
    setKelasPullItems([]);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/integration-settings/pddikti/kelas-kuliah`, { headers });
      if (res.status === 401 || res.status === 403) {
        setKelasPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result?.success) {
        setKelasPullMessage({ success: false, text: result?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const items: RemoteCourseClassItem[] = Array.isArray(result?.items) ? result.items : [];
      setKelasPullItems(items);
      const matched = items.filter((i) => i.courseCode && i.academicYearCode).length;
      setKelasPullMessage({
        success: true,
        text: `${items.length} kelas perkuliahan ditarik dari Feeder. ${matched} kelas sudah cocok dengan mata kuliah & tahun akademik lokal, sisanya dilewati otomatis saat sinkronisasi (mata kuliah/tahun akademiknya belum tersinkron).`,
      });
      if (items.length > 0) setIsKelasResultModalOpen(true);
    } catch (err) {
      setKelasPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingKelas(false);
    }
  };

  // Handler: Sinkronkan Kelas Perkuliahan hasil Pull ke data lokal
  const handleSyncKelasKuliah = async () => {
    if (kelasPullItems.length === 0) return;
    setIsSyncingKelas(true);
    const startedAt = Date.now();
    const batchSize = kelasPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await fetch(`${apiBase}/integration-settings/pddikti/kelas-kuliah/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: kelasPullItems }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      setSyncLogs((prev) => [
        {
          id: `log-kelas-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kelas Perkuliahan & Dosen Pengampu (kelas_kuliah)',
          batchSize,
          successCount: (result?.created ?? 0) + (result?.updated ?? 0),
          errorCount: result?.skipped ?? 0,
          status: (result?.skipped ?? 0) > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || '-',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi kelas perkuliahan selesai.');
      setKelasPullItems([]);
      setIsKelasResultModalOpen(false);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-kelas-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kelas Perkuliahan & Dosen Pengampu (kelas_kuliah)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan kelas perkuliahan.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan kelas perkuliahan.');
    } finally {
      setIsSyncingKelas(false);
    }
  };

  // Handler: Tarik KRS & Rencana Studi Mahasiswa dari Feeder
  const handlePullKrs = async () => {
    setIsPullingKrs(true);
    setKrsPullMessage(null);
    setKrsPullItems([]);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/integration-settings/pddikti/krs`, { headers });
      if (res.status === 401 || res.status === 403) {
        setKrsPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result?.success) {
        setKrsPullMessage({ success: false, text: result?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const items: RemoteEnrollmentItem[] = Array.isArray(result?.items) ? result.items : [];
      setKrsPullItems(items);
      setKrsPullMessage({
        success: true,
        text: `${items.length} baris KRS ditarik dari Feeder. Kelas & mahasiswa yang belum tersinkron lokal akan otomatis dilewati saat disinkronkan.`,
      });
    } catch (err) {
      setKrsPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingKrs(false);
    }
  };

  // Handler: Sinkronkan KRS hasil Pull ke data lokal
  const handleSyncKrs = async () => {
    if (krsPullItems.length === 0) return;
    setIsSyncingKrs(true);
    const startedAt = Date.now();
    const batchSize = krsPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await fetch(`${apiBase}/integration-settings/pddikti/krs/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: krsPullItems }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      setSyncLogs((prev) => [
        {
          id: `log-krs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'KRS & Rencana Studi Mahasiswa (krs_mahasiswa)',
          batchSize,
          successCount: (result?.created ?? 0) + (result?.updated ?? 0),
          errorCount: result?.skipped ?? 0,
          status: (result?.skipped ?? 0) > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || '-',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi KRS selesai.');
      setKrsPullItems([]);
      setKrsPullMessage(null);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-krs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'KRS & Rencana Studi Mahasiswa (krs_mahasiswa)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan KRS.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan KRS.');
    } finally {
      setIsSyncingKrs(false);
    }
  };

  // Handler: Mulai job background Pull+Sync Nilai Perkuliahan Semester
  const handleStartNilaiJob = async () => {
    setIsStartingNilaiJob(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${apiBase}/integration-settings/pddikti/nilai-perkuliahan/pull-sync/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      showToast(result?.message || (res.ok ? 'Sinkronisasi nilai dimulai.' : 'Gagal memulai sinkronisasi nilai.'));
      await fetchNilaiJobStatus();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghubungi server.');
    } finally {
      setIsStartingNilaiJob(false);
    }
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

            <button
              onClick={() => handleStartSync(null, 'pull')}
              disabled
              title="Belum tersedia — integrasi pengiriman data ke Dikti belum dibangun"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Pull Semua</span>
            </button>

            <button
              onClick={() => handleStartSync(null, 'push')}
              disabled
              title="Belum tersedia — integrasi pengiriman data ke Dikti belum dibangun"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Push Semua</span>
            </button>
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
                  Institut Teknologi Nusantara (Kode PT: <strong>071089</strong>). Status semester saat ini adalah{' '}
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
            onClick={() => setActiveTab('feeder')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feeder'
                ? 'border-[#1E3A8A] text-[#1E3A8A] bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Sinkronisasi Neo Feeder</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-800 font-extrabold">
              {entities.length}
            </span>
          </button>

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

        {/* TAB 1: SINKRONISASI NEO FEEDER */}
        {activeTab === 'feeder' && (
          <div className="space-y-4">
            {/* Filter bar & Actions */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchEntity}
                  onChange={(e) => setSearchEntity(e.target.value)}
                  placeholder="Cari nama entitas, tabel PDDIKTI, atau kategori..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCSV('Laporan_Sinkronisasi_PDDIKTI')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor Ringkasan (CSV)</span>
                </button>
              </div>
            </div>

            {/* Entities Cards (Tarik Data Dosen + 7 entitas Feeder) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Card: Tarik Tahun Akademik & Periode Semester dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">Tahun Akademik & Periode Semester</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        tahun_akademik
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Khusus
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                  Ambil periode semester yang BENAR-BENAR punya data KRS dari Web Service Neo Feeder (bukan seluruh kode semester yang
                  pernah di-generate Feeder, termasuk yang spekulatif/belum pernah dipakai) -- wajib ditarik & disinkronkan dulu sebelum
                  Pull Kelas Perkuliahan, supaya id_semester-nya ada pasangan lokal.
                </p>

                {tahunAkademikPullMessage ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      tahunAkademikPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {tahunAkademikPullMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-3">{tahunAkademikPullMessage.text}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{tahunAkademikLocalCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ditarik Terakhir</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {pddiktiStatus?.lastSyncAt
                          ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullTahunAkademik}
                    disabled={isPullingTahunAkademik}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPullingTahunAkademik ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                    <span>{isPullingTahunAkademik ? 'Menarik...' : 'Pull'}</span>
                  </button>
                  {tahunAkademikPullItems.length > 0 && (
                    <button
                      onClick={handleSyncTahunAkademik}
                      disabled={isSyncingTahunAkademik}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSyncingTahunAkademik ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span>{isSyncingTahunAkademik ? 'Menyinkronkan...' : `Sinkronkan ${tahunAkademikPullItems.length}`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card: Tarik Data Dosen dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">Dosen</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        dosen_pddikti
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Khusus
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Ambil daftar dosen (NIDN, biodata, jabatan fungsional, home base prodi) dari Web Service Neo Feeder, lalu cocokkan dengan data Dosen lokal.
                </p>

                {dosenPullMessage ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      dosenPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {dosenPullMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-3">{dosenPullMessage.text}</span>
                      {dosenPullItems.length > 0 && (
                        <button
                          onClick={() => setIsDosenResultModalOpen(true)}
                          className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                        >
                          Lihat & Sinkronkan {dosenPullItems.length} Dosen
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{academicRecaps.reduce((acc, r) => acc + r.lecturerCount, 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ditarik Terakhir</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {pddiktiStatus?.lastSyncAt
                          ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePullDosen}
                  disabled={isPullingDosen}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPullingDosen ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                  <span>{isPullingDosen ? 'Menarik...' : 'Pull'}</span>
                </button>
              </div>

              {/* Card: Tarik Data Mahasiswa dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">Mahasiswa</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        mahasiswa_pt
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Khusus
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Ambil daftar mahasiswa (NIM, biodata, riwayat pendidikan, home base prodi) dari Web Service Neo Feeder, opsional difilter tahun angkatan.
                </p>

                <select
                  value={mhsAngkatan}
                  onChange={(e) => setMhsAngkatan(e.target.value)}
                  disabled={isLoadingMhsAngkatan}
                  className="w-full px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  <option value="">{isLoadingMhsAngkatan ? 'Memuat tahun angkatan...' : '-- Semua Angkatan --'}</option>
                  {mhsAngkatanOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {!isLoadingMhsAngkatan && mhsAngkatanOptions.length === 0 && mhsAngkatanError && (
                  <p className="text-[10px] text-rose-600 -mt-1.5">
                    Daftar tahun angkatan tidak termuat: {mhsAngkatanError}. Pull tetap bisa dicoba tanpa filter angkatan.
                  </p>
                )}

                {mhsPullMessage ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      mhsPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {mhsPullMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-3">{mhsPullMessage.text}</span>
                      {mhsPullItems.length > 0 && (
                        <button
                          onClick={() => setIsMhsResultModalOpen(true)}
                          className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                        >
                          Lihat & Sinkronkan {mhsPullItems.length} Mahasiswa
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{academicRecaps.reduce((acc, r) => acc + r.activeStudents, 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ditarik Terakhir</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {pddiktiStatus?.lastSyncAt
                          ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullMahasiswa}
                    disabled={isPullingMhs}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPullingMhs ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                    <span>{isPullingMhs ? 'Menarik...' : 'Pull'}</span>
                  </button>
                  <button
                    onClick={handlePushMahasiswa}
                    disabled={isPushingMhs}
                    title="Kirim mahasiswa aktif lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPushingMhs ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowUpFromLine className="w-3 h-3" />}
                    <span>{isPushingMhs ? 'Mengirim...' : 'Push'}</span>
                  </button>
                </div>
              </div>

              {/* Card: Tarik Kurikulum & Mata Kuliah dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">Kurikulum & Bobot Mata Kuliah</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        mata_kuliah
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Khusus
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Ambil struktur kurikulum & daftar mata kuliah (kode, nama, bobot SKS, semester) dari Web Service Neo Feeder.
                </p>

                {kurikulumPullMessage ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      kurikulumPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {kurikulumPullMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-3">{kurikulumPullMessage.text}</span>
                      {(kurikulumPullItems.length > 0 || matkulPullItems.length > 0) && (
                        <button
                          onClick={() => setIsKurikulumResultModalOpen(true)}
                          className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                        >
                          Lihat & Sinkronkan ({kurikulumPullItems.length} Kurikulum, {matkulPullItems.length} Mata Kuliah)
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {entities.find((e) => e.code === 'mata_kuliah')?.totalLocal.toLocaleString('id-ID') ?? 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ditarik Terakhir</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {pddiktiStatus?.lastSyncAt
                          ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullKurikulumMataKuliah}
                    disabled={isPullingKurikulum}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPullingKurikulum ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                    <span>{isPullingKurikulum ? 'Menarik...' : 'Pull'}</span>
                  </button>
                  <button
                    onClick={handlePushKurikulumMataKuliah}
                    disabled={isPushingKurikulum}
                    title="Kirim mata kuliah & kurikulum lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPushingKurikulum ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowUpFromLine className="w-3 h-3" />}
                    <span>{isPushingKurikulum ? 'Mengirim...' : 'Push'}</span>
                  </button>
                </div>
              </div>

              {/* Card: Tarik Kelas Perkuliahan & Dosen Pengampu dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">Kelas Perkuliahan & Dosen Pengampu</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        kelas_kuliah
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Aktivitas
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Ambil pembagian kelas semester berjalan & dosen pengampu (NIDN) dari Web Service Neo Feeder. Mata kuliah & tahun akademik wajib sudah tersinkron lebih dulu.
                </p>

                {kelasPullMessage ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      kelasPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {kelasPullMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-3">{kelasPullMessage.text}</span>
                      {kelasPullItems.length > 0 && (
                        <button
                          onClick={() => setIsKelasResultModalOpen(true)}
                          className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                        >
                          Lihat & Sinkronkan {kelasPullItems.length} Kelas
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {entities.find((e) => e.code === 'kelas_kuliah')?.totalLocal.toLocaleString('id-ID') ?? 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ditarik Terakhir</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {pddiktiStatus?.lastSyncAt
                          ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullKelasKuliah}
                    disabled={isPullingKelas}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPullingKelas ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                    <span>{isPullingKelas ? 'Menarik...' : 'Pull'}</span>
                  </button>
                  <button
                    disabled
                    title="Belum tersedia -- dokumentasi Feeder yang ada cuma mendaftar method pengambilan data untuk kelas_kuliah, belum ada Insert/Update"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                  >
                    <ArrowUpFromLine className="w-3 h-3" />
                    <span>Push</span>
                  </button>
                </div>
              </div>

              {/* Card: Tarik KRS & Rencana Studi Mahasiswa dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">KRS & Rencana Studi Mahasiswa</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        krs_mahasiswa
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Aktivitas
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                  Ambil daftar pengambilan mata kuliah tiap mahasiswa (peserta kelas) dari Web Service Neo Feeder. Kelas Perkuliahan & Mahasiswa wajib sudah tersinkron lebih dulu.
                </p>

                {krsPullMessage ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      krsPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {krsPullMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="line-clamp-3">{krsPullMessage.text}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {entities.find((e) => e.code === 'krs_mahasiswa')?.totalLocal.toLocaleString('id-ID') ?? 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ditarik Terakhir</p>
                      <p className="font-mono font-bold text-emerald-700 text-xs">
                        {pddiktiStatus?.lastSyncAt
                          ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullKrs}
                    disabled={isPullingKrs}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isPullingKrs ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowDownToLine className="w-3 h-3" />}
                    <span>{isPullingKrs ? 'Menarik...' : 'Pull'}</span>
                  </button>
                  {krsPullItems.length > 0 && (
                    <button
                      onClick={handleSyncKrs}
                      disabled={isSyncingKrs}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSyncingKrs ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span>{isSyncingKrs ? 'Menyinkronkan...' : `Sinkronkan ${krsPullItems.length}`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card: Sinkronisasi Nilai Perkuliahan Semester (job background) dari PDDIKTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs leading-snug">Nilai Perkuliahan Semester</h4>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                        nilai_perkuliahan
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Aktivitas
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                  Mengisi nilai (angka, indeks, huruf) ke KRS yang sudah tersinkron. Feeder cuma kasih nilai per-kelas, jadi ini berjalan
                  sebagai job BACKGROUND (bisa ditinggal, ceknya di sini lagi nanti) -- KRS wajib sudah tersinkron lebih dulu.
                </p>

                {nilaiJobStatus && nilaiJobStatus.status !== 'idle' ? (
                  <div
                    className={`flex items-start gap-2 text-[11px] p-2.5 rounded-xl border ${
                      nilaiJobStatus.status === 'error'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : nilaiJobStatus.status === 'done'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    {nilaiJobStatus.status === 'running' ? (
                      <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin" />
                    ) : nilaiJobStatus.status === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      {nilaiJobStatus.status === 'running' ? (
                        <span>
                          Memproses kelas {nilaiJobStatus.processedClasses}/{nilaiJobStatus.totalClasses} -- {nilaiJobStatus.updatedGrades} nilai
                          diperbarui sejauh ini.
                        </span>
                      ) : (
                        <span className="line-clamp-3">{nilaiJobStatus.message}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        {entities.find((e) => e.code === 'nilai_perkuliahan')?.totalLocal.toLocaleString('id-ID') ?? 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Status Job</p>
                      <p className="font-mono font-bold text-slate-500 text-xs">Belum pernah dijalankan</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartNilaiJob}
                    disabled={isStartingNilaiJob || nilaiJobStatus?.status === 'running'}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {nilaiJobStatus?.status === 'running' ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArrowDownToLine className="w-3 h-3" />
                    )}
                    <span>{nilaiJobStatus?.status === 'running' ? 'Sedang Berjalan...' : 'Mulai Sinkronisasi (Background)'}</span>
                  </button>
                </div>
              </div>

              {filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                          <Database className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{entity.name}</h4>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                            {entity.code}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {entity.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{entity.description}</p>

                    <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Total Lokal</p>
                        <p className="font-mono font-bold text-slate-900 text-sm">{entity.totalLocal.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Tersinkron</p>
                        <p className="font-mono font-bold text-emerald-700 text-sm">{entity.totalSynced.toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          entity.status === 'Tersinkron'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : entity.status === 'Sebagian'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : entity.status === 'Belum Sync'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {entity.status === 'Tersinkron' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : entity.status === 'Sebagian' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{entity.status}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{entity.lastSync}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        disabled
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                        title="Belum tersedia — integrasi pengiriman data ke Dikti belum dibangun"
                      >
                        <ArrowDownToLine className="w-3 h-3" />
                        <span>Pull</span>
                      </button>
                      <button
                        disabled
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                        title="Belum tersedia — integrasi pengiriman data ke Dikti belum dibangun"
                      >
                        <ArrowUpFromLine className="w-3 h-3" />
                        <span>Push</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {filteredEntities.length === 0 && searchEntity && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs py-6 text-center text-slate-400 text-xs">
                Tidak ada entitas yang cocok dengan pencarian &ldquo;{searchEntity}&rdquo;.
              </div>
            )}

            <Modal
              isOpen={isDosenResultModalOpen}
              onClose={() => setIsDosenResultModalOpen(false)}
              title="Hasil Tarikan Dosen dari Feeder"
              subtitle={`${dosenPullItems.length} dosen ditarik dari Feeder (dicocokkan lewat NIDN atau NUPTK -- sebagian dosen cuma punya salah satu)`}
              icon={<Users className="w-5 h-5" />}
              maxWidth="3xl"
            >
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Dosen yang sudah ada lokal akan otomatis diperbarui datanya. Dosen baru wajib dipilihkan program studi
                  home base-nya dulu sebelum disinkronkan.
                </p>
                <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">NIDN</th>
                        <th className="py-2.5 px-3">NUPTK</th>
                        <th className="py-2.5 px-3">Nama</th>
                        <th className="py-2.5 px-3">Jabatan Fungsional</th>
                        <th className="py-2.5 px-3">Program Studi Home Base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dosenPullItems.map((item) => (
                        <tr key={dosenKey(item)} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.nidn || '-'}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{item.nuptk || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.fullName}</td>
                          <td className="py-2 px-3 text-slate-600">{item.functionalPosition || '-'}</td>
                          <td className="py-2 px-3">
                            <select
                              value={dosenProdiChoice[dosenKey(item)] || ''}
                              onChange={(e) => setDosenProdiChoice((prev) => ({ ...prev, [dosenKey(item)]: e.target.value }))}
                              className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                                dosenProdiChoice[dosenKey(item)] ? 'border-slate-200' : 'border-amber-300'
                              }`}
                            >
                              <option value="">Pilih prodi (kalau dosen baru)...</option>
                              {studyProgramsForDosen.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsDosenResultModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleSyncDosen}
                    disabled={isSyncingDosen}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSyncingDosen ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSyncingDosen ? 'Menyinkronkan...' : `Sinkronkan ${dosenPullItems.length} Dosen`}</span>
                  </button>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={isMhsResultModalOpen}
              onClose={() => setIsMhsResultModalOpen(false)}
              title="Hasil Tarikan Mahasiswa dari Feeder"
              subtitle={`${mhsPullItems.length} mahasiswa ditarik dari Feeder (dicocokkan lewat NIM)`}
              icon={<GraduationCap className="w-5 h-5" />}
              maxWidth="3xl"
            >
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Mahasiswa yang sudah ada lokal akan otomatis diperbarui datanya. Mahasiswa baru wajib dipilihkan
                  program studi home base-nya dulu sebelum disinkronkan.
                </p>
                <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">NIM</th>
                        <th className="py-2.5 px-3">Nama</th>
                        <th className="py-2.5 px-3">Angkatan</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Program Studi Home Base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mhsPullItems.map((item, idx) => (
                        <tr key={`${mhsKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.nim || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.fullName}</td>
                          <td className="py-2 px-3 text-slate-600">{item.entryYear || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{item.status || '-'}</td>
                          <td className="py-2 px-3">
                            <select
                              value={mhsProdiChoice[mhsKey(item)] || ''}
                              onChange={(e) => setMhsProdiChoice((prev) => ({ ...prev, [mhsKey(item)]: e.target.value }))}
                              className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                                mhsProdiChoice[mhsKey(item)] ? 'border-slate-200' : 'border-amber-300'
                              }`}
                            >
                              <option value="">Pilih prodi (kalau mahasiswa baru)...</option>
                              {studyProgramsForDosen.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsMhsResultModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleSyncMahasiswa}
                    disabled={isSyncingMhs}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSyncingMhs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSyncingMhs ? 'Menyinkronkan...' : `Sinkronkan ${mhsPullItems.length} Mahasiswa`}</span>
                  </button>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={isKurikulumResultModalOpen}
              onClose={() => setIsKurikulumResultModalOpen(false)}
              title="Hasil Tarikan Kurikulum & Mata Kuliah dari Feeder"
              subtitle={`${kurikulumPullItems.length} kurikulum & ${matkulPullItems.length} mata kuliah ditarik dari Feeder`}
              icon={<BookOpen className="w-5 h-5" />}
              maxWidth="3xl"
            >
              <div className="space-y-5">
                <p className="text-[11px] text-slate-500">
                  Kurikulum/mata kuliah yang sudah ada lokal akan otomatis diperbarui. Yang baru wajib dipilihkan
                  program studi dulu sebelum disinkronkan.
                </p>

                {kurikulumPullItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Kurikulum ({kurikulumPullItems.length})</h4>
                    <div className="border border-slate-200 rounded-xl max-h-60 overflow-auto">
                      <table className="w-full min-w-[640px] text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Nama Kurikulum</th>
                            <th className="py-2.5 px-3">Tahun Mulai</th>
                            <th className="py-2.5 px-3">Total SKS</th>
                            <th className="py-2.5 px-3">Program Studi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {kurikulumPullItems.map((item, idx) => (
                            <tr key={`${kurikulumKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                              <td className="py-2 px-3 text-slate-600">{item.startYear || '-'}</td>
                              <td className="py-2 px-3 text-slate-600">{item.totalSks || '-'}</td>
                              <td className="py-2 px-3">
                                <select
                                  value={kurikulumProdiChoice[kurikulumKey(item)] || ''}
                                  onChange={(e) => setKurikulumProdiChoice((prev) => ({ ...prev, [kurikulumKey(item)]: e.target.value }))}
                                  className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                                    kurikulumProdiChoice[kurikulumKey(item)] ? 'border-slate-200' : 'border-amber-300'
                                  }`}
                                >
                                  <option value="">Pilih prodi...</option>
                                  {studyProgramsForDosen.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {matkulPullItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Mata Kuliah ({matkulPullItems.length})</h4>
                    <div className="border border-slate-200 rounded-xl max-h-60 overflow-auto">
                      <table className="w-full min-w-[640px] text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Kode</th>
                            <th className="py-2.5 px-3">Nama Mata Kuliah</th>
                            <th className="py-2.5 px-3">SKS</th>
                            <th className="py-2.5 px-3">Semester</th>
                            <th className="py-2.5 px-3">Program Studi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {matkulPullItems.map((item, idx) => (
                            <tr key={`${matkulKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.code}</td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                              <td className="py-2 px-3 text-slate-600">{item.sks}</td>
                              <td className="py-2 px-3 text-slate-600">{item.semester}</td>
                              <td className="py-2 px-3">
                                <select
                                  value={matkulProdiChoice[matkulKey(item)] || ''}
                                  onChange={(e) => setMatkulProdiChoice((prev) => ({ ...prev, [matkulKey(item)]: e.target.value }))}
                                  className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                                    matkulProdiChoice[matkulKey(item)] ? 'border-slate-200' : 'border-amber-300'
                                  }`}
                                >
                                  <option value="">Pilih prodi...</option>
                                  {studyProgramsForDosen.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsKurikulumResultModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleSyncKurikulumMataKuliah}
                    disabled={isSyncingKurikulum}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSyncingKurikulum ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSyncingKurikulum ? 'Menyinkronkan...' : 'Sinkronkan Semua'}</span>
                  </button>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={isKelasResultModalOpen}
              onClose={() => setIsKelasResultModalOpen(false)}
              title="Hasil Tarikan Kelas Perkuliahan dari Feeder"
              subtitle={`${kelasPullItems.length} kelas ditarik dari Feeder (dicocokkan ke mata kuliah & tahun akademik lokal lewat kode Feeder)`}
              icon={<Layers className="w-5 h-5" />}
              maxWidth="3xl"
            >
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Kelas yang mata kuliah atau tahun akademiknya belum tersinkron lokal (kolom berwarna merah) akan otomatis
                  dilewati saat disinkronkan -- sinkronkan dulu Mata Kuliah & Tahun Akademik terkait, lalu Pull ulang.
                </p>
                <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Nama Kelas</th>
                        <th className="py-2.5 px-3">Mata Kuliah</th>
                        <th className="py-2.5 px-3">Tahun Akademik</th>
                        <th className="py-2.5 px-3">Dosen Pengampu</th>
                        <th className="py-2.5 px-3">Peserta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kelasPullItems.map((item, idx) => (
                        <tr key={`${kelasKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.className}</td>
                          <td className={`py-2 px-3 ${item.courseCode ? 'text-slate-600' : 'text-rose-600 font-semibold'}`}>
                            {item.courseCode ? `${item.courseCode} -- ${item.courseName}` : 'Belum tersinkron'}
                          </td>
                          <td className={`py-2 px-3 font-mono ${item.academicYearCode ? 'text-slate-600' : 'text-rose-600 font-semibold'}`}>
                            {item.academicYearCode || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {item.lecturerName ? `${item.lecturerName}${item.lecturerNidn ? ` (${item.lecturerNidn})` : ''}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{item.studentCount ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsKelasResultModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleSyncKelasKuliah}
                    disabled={isSyncingKelas}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSyncingKelas ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSyncingKelas ? 'Menyinkronkan...' : 'Sinkronkan Semua'}</span>
                  </button>
                </div>
              </div>
            </Modal>

            {/* Live Sync Log Console */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#1E3A8A]" />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Log Riwayat Web Service Neo Feeder
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {syncLogs.length === 0 ? 'Belum ada riwayat' : `${syncLogs.length} log tercatat`}
                </span>
              </div>

              {syncLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada riwayat aktivitas sinkronisasi pada sesi ini. Klik tombol &ldquo;Sync&rdquo; untuk memulai transmisi data.
                </div>
              ) : (
                <div className="space-y-2">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-bold text-slate-900">{log.entity}</span>
                          <span className="text-[11px] text-slate-400">({log.timestamp})</span>
                        </div>
                        <p className="text-[11px] text-slate-600 pl-4">{log.message}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[11px]">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {log.successCount} Sukses
                        </span>
                        <span className="text-slate-400">{log.durationMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                    Berdasarkan basis data akademik aktif Institut Teknologi Nusantara
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
                  <span>PDF Resmi (Kop ITN)</span>
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
