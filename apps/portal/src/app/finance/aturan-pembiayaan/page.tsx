'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import {
  Layers,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calculator,
  Tag,
  X,
  Award,
  DollarSign,
  Search,
  Filter,
  Sliders,
  ChevronRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  Eye,
  FileText,
  ShieldCheck,
  Percent,
  Check,
  Zap,
} from 'lucide-react';
import {
  FeeComponentItem,
  FeeRuleItem,
  StudentFeeAssignmentItem,
  AdmissionRegistrationTypeItem,
  AdmissionTrackItem,
  AdmissionClassItem,
  AdmissionBatchItem,
} from '@siakad/types';

export default function AdminAturanPembiayaanPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'components' | 'simulator' | 'assignments'>('rules');

  // Master Data States
  const [rules, setRules] = useState<FeeRuleItem[]>([]);
  const [components, setComponents] = useState<FeeComponentItem[]>([]);
  const [assignments, setAssignments] = useState<StudentFeeAssignmentItem[]>([]);
  const [registrationTypes, setRegistrationTypes] = useState<AdmissionRegistrationTypeItem[]>([]);
  const [tracks, setTracks] = useState<AdmissionTrackItem[]>([]);
  const [classes, setClasses] = useState<AdmissionClassItem[]>([]);
  const [batches, setBatches] = useState<AdmissionBatchItem[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('ALL');

  // Modal State: Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRuleItem | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    code: '',
    description: '',
    priority: 50,
    academicYear: '',
    isActive: true,
    registrationTypeId: '',
    trackId: '',
    classId: '',
    studyProgramId: '',
    waveId: '',
    items: {} as Record<string, { actionType: string; amountValue: number | string; notes: string }>,
  });
  const [isSavingRule, setIsSavingRule] = useState(false);

  // Modal State: Component Modal
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<FeeComponentItem | null>(null);
  const [compFormData, setCompFormData] = useState({
    code: '',
    name: '',
    defaultAmount: 0,
    category: 'SEMESTER',
    description: '',
    isActive: true,
  });
  const [isSavingComp, setIsSavingComp] = useState(false);

  // Modal State: Snapshot Detail Modal
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentFeeAssignmentItem | null>(null);

  // Simulator State
  const [simForm, setSimForm] = useState({
    registrationTypeId: '',
    trackId: '',
    classId: '',
    studyProgramId: '',
    waveId: '',
    academicYear: '2027/2028',
  });
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Dialog State (Custom Confirm & Alert)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    isAlert?: boolean;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
  });

  const apiBase = getApiBaseUrl();

  const fetchAllData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [
        rulesRes,
        compRes,
        assignRes,
        regTypeRes,
        trackRes,
        classRes,
        batchRes,
        prodiRes,
      ] = await Promise.all([
        fetch(`${apiBase}/finance/fee-rules/rules`, { cache: 'no-store' }),
        fetch(`${apiBase}/finance/fee-rules/components`, { cache: 'no-store' }),
        fetch(`${apiBase}/finance/fee-rules/assignments`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/admin/pmb/registration-types`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/admin/pmb/tracks`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/admin/pmb/classes`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/admin/pmb/batches`, { cache: 'no-store' }),
        fetch(`${apiBase}/study-programs`, { cache: 'no-store' }),
      ]);

      if (rulesRes.ok) {
        const json = await rulesRes.json();
        setRules(json.data || json || []);
      }
      if (compRes.ok) {
        const json = await compRes.json();
        setComponents(json.data || json || []);
      }
      if (assignRes.ok) {
        const json = await assignRes.json();
        setAssignments(json.data || json || []);
      }
      if (regTypeRes.ok) {
        const json = await regTypeRes.json();
        setRegistrationTypes(json.data || json || []);
      }
      if (trackRes.ok) {
        const json = await trackRes.json();
        setTracks(json.data || json || []);
      }
      if (classRes.ok) {
        const json = await classRes.json();
        setClasses(json.data || json || []);
      }
      if (batchRes.ok) {
        const json = await batchRes.json();
        setBatches(json.data || json || []);
      }
      if (prodiRes.ok) {
        const json = await prodiRes.json();
        setStudyPrograms(json.data || json || []);
      }
    } catch (err: any) {
      console.error('Error fetching fee rules data:', err);
      setApiError(err.message || 'Gagal memuat data dari server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Quick preset loader for simulator
  const loadScenario = (scenario: 'A' | 'B' | 'C' | 'D') => {
    const kip = registrationTypes.find((r) => r.code === 'KIP');
    const nonKip = registrationTypes.find((r) => r.code === 'NON_KIP');
    const mhsBaru = tracks.find((t) => t.code === 'MAHASISWA_BARU');
    const transfer = tracks.find((t) => t.code === 'TRANSFER');
    const regClass = classes.find((c) => c.code === 'REGULER');
    const karyClass = classes.find((c) => c.code === 'KARYAWAN');

    let newSim = { ...simForm };
    if (scenario === 'A') {
      newSim = {
        ...newSim,
        registrationTypeId: kip?.id || '',
        trackId: mhsBaru?.id || '',
        classId: regClass?.id || '',
      };
    } else if (scenario === 'B') {
      newSim = {
        ...newSim,
        registrationTypeId: nonKip?.id || '',
        trackId: mhsBaru?.id || '',
        classId: regClass?.id || '',
      };
    } else if (scenario === 'C') {
      newSim = {
        ...newSim,
        registrationTypeId: nonKip?.id || '',
        trackId: mhsBaru?.id || '',
        classId: karyClass?.id || '',
      };
    } else if (scenario === 'D') {
      newSim = {
        ...newSim,
        registrationTypeId: nonKip?.id || '',
        trackId: transfer?.id || '',
        classId: regClass?.id || '',
      };
    }
    setSimForm(newSim);
    executeSimulation(newSim);
  };

  const executeSimulation = async (formDataToSim = simForm) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${apiBase}/finance/fee-rules/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationTypeId: formDataToSim.registrationTypeId || null,
          trackId: formDataToSim.trackId || null,
          classId: formDataToSim.classId || null,
          studyProgramId: formDataToSim.studyProgramId || null,
          waveId: formDataToSim.waveId || null,
          academicYear: formDataToSim.academicYear || null,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setSimResult(json.data || json);
      }
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Open Add/Edit Rule Modal
  const openRuleModal = (rule?: FeeRuleItem) => {
    if (rule) {
      setEditingRule(rule);
      const itemsMap: Record<string, { actionType: string; amountValue: number | string; notes: string }> = {};
      if (rule.ruleItems) {
        for (const it of rule.ruleItems) {
          itemsMap[it.feeComponentId] = {
            actionType: it.actionType,
            amountValue: it.amountValue !== undefined && it.amountValue !== null ? it.amountValue : '',
            notes: it.notes || '',
          };
        }
      }
      setRuleFormData({
        name: rule.name,
        code: rule.code,
        description: rule.description || '',
        priority: rule.priority,
        academicYear: rule.academicYear || '',
        isActive: rule.isActive,
        registrationTypeId: rule.registrationTypeId || '',
        trackId: rule.trackId || '',
        classId: rule.classId || '',
        studyProgramId: rule.studyProgramId || '',
        waveId: rule.waveId || '',
        items: itemsMap,
      });
    } else {
      setEditingRule(null);
      // Inisialisasi item perlakuan dengan default NORMAL untuk semua komponen
      const itemsMap: Record<string, { actionType: string; amountValue: number | string; notes: string }> = {};
      for (const c of components) {
        itemsMap[c.id] = { actionType: 'NORMAL', amountValue: '', notes: '' };
      }
      setRuleFormData({
        name: '',
        code: '',
        description: '',
        priority: 50,
        academicYear: '',
        isActive: true,
        registrationTypeId: '',
        trackId: '',
        classId: '',
        studyProgramId: '',
        waveId: '',
        items: itemsMap,
      });
    }
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);
    try {
      const itemsArray = Object.entries(ruleFormData.items).map(([feeComponentId, val]) => ({
        feeComponentId,
        actionType: val.actionType,
        amountValue: val.amountValue !== '' ? Number(val.amountValue) : null,
        notes: val.notes,
      }));

      const payload = {
        name: ruleFormData.name,
        code: ruleFormData.code.toUpperCase().trim(),
        description: ruleFormData.description,
        priority: Number(ruleFormData.priority) || 10,
        academicYear: ruleFormData.academicYear || null,
        isActive: ruleFormData.isActive,
        registrationTypeId: ruleFormData.registrationTypeId || null,
        trackId: ruleFormData.trackId || null,
        classId: ruleFormData.classId || null,
        studyProgramId: ruleFormData.studyProgramId || null,
        waveId: ruleFormData.waveId || null,
        items: itemsArray,
      };

      const url = editingRule
        ? `${apiBase}/finance/fee-rules/rules/${editingRule.id}`
        : `${apiBase}/finance/fee-rules/rules`;
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan aturan pembiayaan.');
      }

      setRuleModalOpen(false);
      setDialogState({
        isOpen: true,
        title: 'Berhasil!',
        message: `Aturan pembiayaan "${ruleFormData.name}" berhasil disimpan.`,
        type: 'success',
        isAlert: true,
      });
      fetchAllData();
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem saat menyimpan aturan.',
        type: 'danger',
        isAlert: true,
      });
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = (rule: FeeRuleItem) => {
    setDialogState({
      isOpen: true,
      title: 'Hapus / Nonaktifkan Aturan',
      message: `Apakah Anda yakin ingin menonaktifkan aturan "${rule.name}"? Jika sudah memiliki penetapan mahasiswa, aturan akan dinonaktifkan demi menjaga integritas histori.`,
      type: 'warning',
      confirmText: 'Ya, Nonaktifkan',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/finance/fee-rules/rules/${rule.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus aturan pembiayaan.');
          fetchAllData();
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Kesalahan',
            message: err.message || 'Gagal menghapus aturan.',
            type: 'danger',
            isAlert: true,
          });
        }
      },
    });
  };

  // Open Add/Edit Component Modal
  const openCompModal = (comp?: FeeComponentItem) => {
    if (comp) {
      setEditingComp(comp);
      setCompFormData({
        code: comp.code,
        name: comp.name,
        defaultAmount: comp.defaultAmount,
        category: comp.category,
        description: comp.description || '',
        isActive: comp.isActive,
      });
    } else {
      setEditingComp(null);
      setCompFormData({
        code: '',
        name: '',
        defaultAmount: 500000,
        category: 'SEMESTER',
        description: '',
        isActive: true,
      });
    }
    setCompModalOpen(true);
  };

  const handleSaveComp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingComp(true);
    try {
      const payload = {
        code: compFormData.code.toUpperCase().trim(),
        name: compFormData.name,
        defaultAmount: Number(compFormData.defaultAmount) || 0,
        category: compFormData.category,
        description: compFormData.description,
        isActive: compFormData.isActive,
      };

      const url = editingComp
        ? `${apiBase}/finance/fee-rules/components/${editingComp.id}`
        : `${apiBase}/finance/fee-rules/components`;
      const method = editingComp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan komponen biaya.');
      }

      setCompModalOpen(false);
      setDialogState({
        isOpen: true,
        title: 'Berhasil!',
        message: `Komponen biaya "${compFormData.name}" berhasil disimpan.`,
        type: 'success',
        isAlert: true,
      });
      fetchAllData();
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem saat menyimpan komponen.',
        type: 'danger',
        isAlert: true,
      });
    } finally {
      setIsSavingComp(false);
    }
  };

  // Delete Component
  const handleDeleteComp = (comp: FeeComponentItem) => {
    setDialogState({
      isOpen: true,
      title: 'Hapus Komponen Biaya?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus komponen biaya perkuliahan{' '}
          <strong className="text-slate-900">&quot;{comp.name}&quot;</strong> ({comp.code})?
        </span>
      ),
      type: 'danger',
      confirmText: 'Ya, Hapus Komponen',
      cancelText: 'Batal',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/finance/fee-rules/components/${comp.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Gagal menghapus komponen biaya.');
          }
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          fetchAllData();
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: err.message || 'Terjadi kesalahan sistem saat menghapus komponen biaya.',
            type: 'danger',
            isAlert: true,
          });
        }
      },
    });
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesYear =
        academicYearFilter === 'ALL' ||
        r.academicYear === academicYearFilter ||
        (!r.academicYear && academicYearFilter === 'ALL');

      return matchesSearch && matchesYear;
    });
  }, [rules, searchQuery, academicYearFilter]);

  // Helper: Memisahkan komponen biaya perkuliahan vs registrasi pendaftaran PMB
  const isPerkuliahanComponent = (code?: string) => {
    const c = (code || '').toUpperCase();
    return !['REGISTRASI', 'FORMULIR', 'DAFTAR_ULANG', 'PENDAFTARAN'].includes(c);
  };

  const perkuliahanComponents = useMemo(() => {
    return components.filter((comp) => isPerkuliahanComponent(comp.code));
  }, [components]);

  const formatRupiah = (val?: number | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <PortalLayout role="finance" activeMenuHref="/finance/aturan-pembiayaan">
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#1E293B] to-[#0F172A] p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute right-32 bottom-0 w-64 h-64 bg-[#D4A017]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Aturan Biaya Perkuliahan &amp; Akademik
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PostgreSQL Real-Time
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Aturan Biaya Perkuliahan (SPP, UKT &amp; SKS)
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Pengaturan skema tarif perkuliahan mahasiswa aktif per semester (SPP/UKT, Biaya SKS, Biaya Praktikum, dan Ujian Semester). Aturan biaya registrasi formulir pendaftaran &amp; daftar ulang calon mahasiswa baru dikelola khusus oleh Panitia PMB.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAllData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-600 text-sm font-medium transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4A017]' : ''}`} />
                <span>Refresh</span>
              </button>
              {activeTab === 'rules' && (
                <button
                  onClick={() => openRuleModal()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold transition shadow-md shadow-blue-900/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Aturan</span>
                </button>
              )}
              {activeTab === 'components' && (
                <button
                  onClick={() => openCompModal()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-md shadow-amber-900/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Komponen</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
            <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-medium">Total Aturan Pembiayaan</p>
              <p className="text-xl font-bold text-white mt-0.5">{rules.length}</p>
            </div>
            <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-medium">Aturan Aktif</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">
                {rules.filter((r) => r.isActive).length}
              </p>
            </div>
            <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-medium">Komponen Perkuliahan</p>
              <p className="text-xl font-bold text-[#D4A017] mt-0.5">{perkuliahanComponents.length}</p>
            </div>
            <div className="bg-slate-800/60 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-medium">Penetapan Mahasiswa</p>
              <p className="text-xl font-bold text-blue-400 mt-0.5">{assignments.length}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Aturan Biaya Perkuliahan ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('components')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === 'components'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Komponen Biaya Perkuliahan ({perkuliahanComponents.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('simulator');
              if (!simResult) loadScenario('A');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simulator & Tester Tagihan</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Penetapan Mahasiswa ({assignments.length})</span>
          </button>
        </div>

        {/* TAB 1: ATURAN PEMBIAYAAN */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aturan pembiayaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Tahun Akademik:</span>
                <select
                  value={academicYearFilter}
                  onChange={(e) => setAcademicYearFilter(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">Semua Periode</option>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2027/2028">2027/2028</option>
                </select>
              </div>
            </div>

            {/* Rules Cards List */}
            {isLoading ? (
              <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-2" />
                <p className="text-sm">Memuat aturan pembiayaan dari PostgreSQL...</p>
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                <Sliders className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Tidak ada aturan pembiayaan yang cocok</p>
                <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Aturan" untuk membuat kebijakan baru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRules.map((rule) => {
                  return (
                    <div
                      key={rule.id}
                      className={`bg-white rounded-2xl border transition shadow-sm hover:shadow-md p-5 ${
                        rule.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 mt-0.5">
                            <Sliders className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">{rule.name}</h3>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                {rule.code}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                  rule.priority >= 80
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : rule.priority >= 60
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Prioritas: {rule.priority}
                              </span>
                              {rule.academicYear ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                  T.A {rule.academicYear}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                  Semua Angkatan
                                </span>
                              )}
                              {rule.isActive ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Aktif
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-medium">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-xs text-slate-500 mt-1 max-w-2xl">{rule.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end lg:self-center">
                          <button
                            onClick={() => openRuleModal(rule)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Aturan</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                            title="Hapus / Nonaktifkan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Conditions Matching Matrix */}
                      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block mb-0.5 font-medium">1. Jenis Pendaftaran</span>
                          <span className="font-semibold text-slate-800">
                            {rule.registrationType ? (
                              <span className="text-blue-700">{rule.registrationType.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Semua (KIP & NON_KIP)</span>
                            )}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block mb-0.5 font-medium">2. Jenis Mahasiswa</span>
                          <span className="font-semibold text-slate-800">
                            {rule.track ? (
                              <span className="text-indigo-700">{rule.track.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Semua (Baru & Transfer)</span>
                            )}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block mb-0.5 font-medium">3. Pilihan Kelas</span>
                          <span className="font-semibold text-slate-800">
                            {rule.admissionClass ? (
                              <span className="text-amber-700">{rule.admissionClass.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Semua (Reguler & Karyawan)</span>
                            )}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block mb-0.5 font-medium">4. Program Studi</span>
                          <span className="font-semibold text-slate-800">
                            {rule.studyProgram ? (
                              <span className="text-purple-700">{rule.studyProgram.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Semua Program Studi</span>
                            )}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block mb-0.5 font-medium">5. Gelombang</span>
                          <span className="font-semibold text-slate-800">
                            {rule.wave ? (
                              <span className="text-teal-700">{rule.wave.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Semua Gelombang</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Treatment Items Summary */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 mr-2 uppercase tracking-wide">
                          Perlakuan Komponen Biaya:
                        </span>
                        {rule.ruleItems && rule.ruleItems.length > 0 ? (
                          rule.ruleItems
                            .filter((item) => isPerkuliahanComponent(item.feeComponent?.code))
                            .map((item) => {
                            const compName = item.feeComponent?.name || item.feeComponentId;
                            const compCode = item.feeComponent?.code || '';
                            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                            let textAction = 'Normal';

                            if (item.actionType === 'BEBAS') {
                              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                              textAction = 'BEBAS (Rp 0)';
                            } else if (item.actionType === 'TARIF_KHUSUS') {
                              badgeStyle = 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
                              textAction = `Tarif Khusus: ${formatRupiah(item.amountValue)}`;
                            } else if (item.actionType === 'DISKON_PERSENTASE') {
                              badgeStyle = 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
                              textAction = `Diskon ${item.amountValue}%`;
                            } else if (item.actionType === 'DISKON_NOMINAL') {
                              badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                              textAction = `Potongan ${formatRupiah(item.amountValue)}`;
                            }

                            return (
                              <span
                                key={item.id}
                                className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1 ${badgeStyle}`}
                              >
                                <span className="font-semibold">{compCode || compName}:</span>
                                <span>{textAction}</span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">Semua komponen menggunakan tarif NORMAL standar</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MASTER KOMPONEN BIAYA */}
        {activeTab === 'components' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-bold text-amber-950">Pemisahan Wewenang Keuangan &amp; PMB</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Di Biro Keuangan hanya mengelola komponen biaya perkuliahan (SPP, UKT, SKS, Praktikum, Ujian Semester). Aturan biaya registrasi formulir &amp; daftar ulang calon mahasiswa baru dikelola khusus di modul <strong>Admin PMB</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Daftar Komponen Biaya Perkuliahan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar komponen tagihan perkuliahan mahasiswa aktif per semester.
                </p>
              </div>
              <button
                onClick={() => openCompModal()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Komponen Perkuliahan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Kode</th>
                    <th className="p-4">Nama Komponen</th>
                    <th className="p-4">Kategori Tagihan</th>
                    <th className="p-4">Tarif Standar (Default)</th>
                    <th className="p-4">Keterangan</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {perkuliahanComponents.map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono font-bold text-blue-700">{comp.code}</td>
                      <td className="p-4 font-bold text-slate-900">{comp.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {comp.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">
                        {formatRupiah(comp.defaultAmount)}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{comp.description || '-'}</td>
                      <td className="p-4 text-center">
                        {comp.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-[10px]">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold text-[10px]">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCompModal(comp)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 transition"
                            title="Edit Komponen"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteComp(comp)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Komponen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATOR & TESTER TAGIHAN */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Simulator */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                  <Calculator className="w-4 h-4" />
                  <span>Kalkulator & Simulator Profil PMB</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih kombinasi profil mahasiswa untuk menguji aturan pemenang dan breakdown nominal tagihan secara real-time.
                </p>
              </div>

              {/* Quick Scenarios Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Uji Skenario Cepat:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loadScenario('A')}
                    className="p-2.5 text-left rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 transition text-xs"
                  >
                    <span className="font-bold text-blue-900 block">Skenario A (KIP)</span>
                    <span className="text-[11px] text-blue-700">KIP + Baru + Reguler</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadScenario('B')}
                    className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs"
                  >
                    <span className="font-bold text-slate-900 block">Skenario B (Reguler)</span>
                    <span className="text-[11px] text-slate-600">NON_KIP + Baru + Reguler</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadScenario('C')}
                    className="p-2.5 text-left rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 transition text-xs"
                  >
                    <span className="font-bold text-amber-900 block">Skenario C (Karyawan)</span>
                    <span className="text-[11px] text-amber-700">NON_KIP + Baru + Karyawan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadScenario('D')}
                    className="p-2.5 text-left rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition text-xs"
                  >
                    <span className="font-bold text-purple-900 block">Skenario D (Transfer)</span>
                    <span className="text-[11px] text-purple-700">NON_KIP + Transfer + Reguler</span>
                  </button>
                </div>
              </div>

              {/* Form Selectors */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    1. Jenis Pendaftaran:
                  </label>
                  <select
                    value={simForm.registrationTypeId}
                    onChange={(e) => {
                      const next = { ...simForm, registrationTypeId: e.target.value };
                      setSimForm(next);
                      executeSimulation(next);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Pilih Jenis Pendaftaran --</option>
                    {registrationTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.code} - {rt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    2. Jenis Mahasiswa:
                  </label>
                  <select
                    value={simForm.trackId}
                    onChange={(e) => {
                      const next = { ...simForm, trackId: e.target.value };
                      setSimForm(next);
                      executeSimulation(next);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Pilih Jenis Mahasiswa --</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    3. Pilihan Kelas:
                  </label>
                  <select
                    value={simForm.classId}
                    onChange={(e) => {
                      const next = { ...simForm, classId: e.target.value };
                      setSimForm(next);
                      executeSimulation(next);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Pilih Pilihan Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    4. Program Studi (Opsional):
                  </label>
                  <select
                    value={simForm.studyProgramId}
                    onChange={(e) => {
                      const next = { ...simForm, studyProgramId: e.target.value };
                      setSimForm(next);
                      executeSimulation(next);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Semua Program Studi --</option>
                    {studyPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      5. Gelombang (Opsional):
                    </label>
                    <select
                      value={simForm.waveId}
                      onChange={(e) => {
                        const next = { ...simForm, waveId: e.target.value };
                        setSimForm(next);
                        executeSimulation(next);
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Semua Gelombang</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      6. Tahun Akademik:
                    </label>
                    <input
                      type="text"
                      value={simForm.academicYear}
                      onChange={(e) => {
                        const next = { ...simForm, academicYear: e.target.value };
                        setSimForm(next);
                        executeSimulation(next);
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => executeSimulation()}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2"
                >
                  <Zap className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>Kalkulasi Tagihan Real-Time</span>
                </button>
              </div>
            </div>

            {/* Simulation Result Card */}
            <div className="lg:col-span-7 space-y-4">
              {simResult ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                        Hasil Evaluasi Aturan Pembiayaan
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {simResult.matchedRule?.name || simResult.ruleName}
                      </h3>
                      {simResult.matchedRule && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                            {simResult.matchedRule.code}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Prioritas: <strong>{simResult.matchedRule.priority}</strong> &bull; Skor Spesifisitas:{' '}
                            <strong>{simResult.matchedRule.specificity}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white px-5 py-3 rounded-xl text-right border border-blue-900">
                      <span className="text-[10px] text-blue-300 block uppercase font-bold">Total Tagihan Akhir</span>
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        {formatRupiah(simResult.totalFinalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Tarif Normal Dasar:</span>
                      <span className="font-bold text-slate-800">{formatRupiah(simResult.totalBaseAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Potongan / Bebas:</span>
                      <span className="font-bold text-emerald-600">
                        - {formatRupiah(simResult.totalDiscount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Kewajiban Bayar:</span>
                      <span className="font-bold text-blue-700">{formatRupiah(simResult.totalFinalAmount)}</span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Rincian Perlakuan Komponen Biaya:
                    </h4>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold">
                          <tr>
                            <th className="p-3">Komponen Biaya</th>
                            <th className="p-3">Tarif Normal</th>
                            <th className="p-3">Perlakuan Rule</th>
                            <th className="p-3 text-right">Potongan</th>
                            <th className="p-3 text-right">Tagihan Akhir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {simResult.lineItems?.map((item: any) => (
                            <tr key={item.feeComponentId} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <span className="font-bold text-slate-900 block">{item.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                              </td>
                              <td className="p-3 font-mono text-slate-600">{formatRupiah(item.baseAmount)}</td>
                              <td className="p-3">
                                {item.actionType === 'BEBAS' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    BEBAS (0%)
                                  </span>
                                ) : item.actionType === 'TARIF_KHUSUS' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                    TARIF KHUSUS ({formatRupiah(item.actionValue)})
                                  </span>
                                ) : item.actionType === 'DISKON_PERSENTASE' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                    DISKON {item.actionValue}%
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                                    NORMAL (100%)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                                {item.discountAmount > 0 ? `- ${formatRupiah(item.discountAmount)}` : '-'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">
                                {formatRupiah(item.finalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                  <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Pilih opsi di sebelah kiri untuk menjalankan simulasi</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PENETAPAN MAHASISWA & HISTORI */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Riwayat Penetapan Pembiayaan Mahasiswa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Snapshot penetapan kebijakan pembiayaan mahasiswa saat dikonversi dari PMB untuk menjaga histori tetap konsisten.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Mahasiswa</th>
                    <th className="p-4">Prodi</th>
                    <th className="p-4">Kategori PMB</th>
                    <th className="p-4">Skema Pembiayaan</th>
                    <th className="p-4">Angkatan</th>
                    <th className="p-4">Ditetapkan Pada</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Belum ada penetapan mahasiswa. Calon mahasiswa yang dikonversi dari modul PMB akan otomatis tercatat di sini.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((asg) => (
                      <tr key={asg.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">
                            {asg.student?.user?.fullName || 'Mahasiswa'}
                          </span>
                          <span className="font-mono text-slate-500">{asg.student?.nim}</span>
                        </td>
                        <td className="p-4 text-slate-700">{asg.student?.studyProgram?.name || '-'}</td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold mr-1">
                              {asg.student?.registrationType?.code || 'NON_KIP'}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold mr-1">
                              {asg.student?.track?.code || 'MAHASISWA_BARU'}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold">
                              {asg.student?.admissionClass?.code || 'REGULER'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{asg.schemeName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {asg.feeRule?.code || 'SNAPSHOT_FROZEN'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-700">{asg.academicYear}</td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {new Date(asg.assignedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAssignment(asg);
                              setSnapshotModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Snapshot</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH / EDIT ATURAN PEMBIAYAAN */}
        {ruleModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
              <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    {editingRule ? 'Edit Aturan Pembiayaan' : 'Tambah Aturan Pembiayaan Baru'}
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Tentukan kriteria pencocokan PMB dan perlakuan masing-masing komponen biaya.
                  </p>
                </div>
                <button
                  onClick={() => setRuleModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Informasi Aturan */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    1. Identitas Aturan & Prioritas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Aturan *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aturan Beasiswa KIP-Kuliah"
                        value={ruleFormData.name}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Kode Aturan *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. RULE_KIP"
                        value={ruleFormData.code}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Prioritas Evaluasi *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={ruleFormData.priority}
                        onChange={(e) =>
                          setRuleFormData({ ...ruleFormData, priority: parseInt(e.target.value) || 10 })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                      <span className="text-[10px] text-slate-400">Angka lebih tinggi = lebih diprioritaskan</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Tahun Akademik (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Kosongkan jika semua tahun"
                        value={ruleFormData.academicYear}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, academicYear: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Status Aturan</label>
                      <select
                        value={ruleFormData.isActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) =>
                          setRuleFormData({ ...ruleFormData, isActive: e.target.value === 'ACTIVE' })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ACTIVE">Aktif Digunakan</option>
                        <option value="INACTIVE">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Keterangan / Deskripsi</label>
                    <textarea
                      rows={2}
                      placeholder="Penjelasan kebijakan pembiayaan ini..."
                      value={ruleFormData.description}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                {/* Kondisi Pencocokan PMB */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    2. Kondisi Pencocokan PMB (Opsional - Kosongkan jika berlaku umum)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Jenis Pendaftaran
                      </label>
                      <select
                        value={ruleFormData.registrationTypeId}
                        onChange={(e) =>
                          setRuleFormData({ ...ruleFormData, registrationTypeId: e.target.value })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Berlaku untuk Semua --</option>
                        {registrationTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.code} - {rt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Jenis Mahasiswa</label>
                      <select
                        value={ruleFormData.trackId}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, trackId: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Berlaku untuk Semua --</option>
                        {tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.code} - {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Pilihan Kelas</label>
                      <select
                        value={ruleFormData.classId}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, classId: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Berlaku untuk Semua --</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Program Studi</label>
                      <select
                        value={ruleFormData.studyProgramId}
                        onChange={(e) =>
                          setRuleFormData({ ...ruleFormData, studyProgramId: e.target.value })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Berlaku untuk Semua Prodi --</option>
                        {studyPrograms.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Gelombang PMB</label>
                      <select
                        value={ruleFormData.waveId}
                        onChange={(e) => setRuleFormData({ ...ruleFormData, waveId: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">-- Berlaku untuk Semua Gelombang --</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Perlakuan Komponen Biaya */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      3. Perlakuan Komponen Biaya (Dinamis dari Master)
                    </h4>
                    <span className="text-[11px] text-blue-600 font-semibold">
                      Total Komponen Perkuliahan: {perkuliahanComponents.length}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    {perkuliahanComponents.map((comp) => {
                      const itemState = ruleFormData.items[comp.id] || {
                        actionType: 'NORMAL',
                        amountValue: '',
                        notes: '',
                      };
                      return (
                        <div key={comp.id} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                          <div className="w-full sm:w-1/3">
                            <span className="font-bold text-slate-900 text-xs block">{comp.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              Tarif Dasar: {formatRupiah(comp.defaultAmount)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-2/3">
                            <select
                              value={itemState.actionType}
                              onChange={(e) => {
                                const newAction = e.target.value;
                                setRuleFormData({
                                  ...ruleFormData,
                                  items: {
                                    ...ruleFormData.items,
                                    [comp.id]: {
                                      ...itemState,
                                      actionType: newAction,
                                      amountValue: newAction === 'BEBAS' || newAction === 'NORMAL' ? '' : itemState.amountValue,
                                    },
                                  },
                                });
                              }}
                              className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold flex-1 min-w-[140px]"
                            >
                              <option value="NORMAL">NORMAL / BAYAR PENUH</option>
                              <option value="BEBAS">BEBAS (100% GRATIS)</option>
                              <option value="DISKON_PERSENTASE">DISKON PERSENTASE (%)</option>
                              <option value="DISKON_NOMINAL">DISKON NOMINAL (Rp)</option>
                              <option value="TARIF_KHUSUS">TARIF KHUSUS (Rp)</option>
                            </select>

                            {(itemState.actionType === 'DISKON_PERSENTASE' ||
                              itemState.actionType === 'DISKON_NOMINAL' ||
                              itemState.actionType === 'TARIF_KHUSUS') && (
                              <input
                                type="number"
                                placeholder={
                                  itemState.actionType === 'DISKON_PERSENTASE'
                                    ? 'Nilai % (e.g. 50)'
                                    : 'Nominal Rp'
                                }
                                value={itemState.amountValue}
                                onChange={(e) => {
                                  setRuleFormData({
                                    ...ruleFormData,
                                    items: {
                                      ...ruleFormData.items,
                                      [comp.id]: {
                                        ...itemState,
                                        amountValue: e.target.value,
                                      },
                                    },
                                  });
                                }}
                                className="text-xs p-2 rounded-lg border border-slate-300 w-28 font-mono"
                              />
                            )}

                            <input
                              type="text"
                              placeholder="Catatan..."
                              value={itemState.notes}
                              onChange={(e) => {
                                setRuleFormData({
                                  ...ruleFormData,
                                  items: {
                                    ...ruleFormData.items,
                                    [comp.id]: {
                                      ...itemState,
                                      notes: e.target.value,
                                    },
                                  },
                                });
                              }}
                              className="text-xs p-2 rounded-lg border border-slate-300 flex-1 min-w-[120px]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRule}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isSavingRule ? 'Menyimpan...' : 'Simpan Aturan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH / EDIT KOMPONEN BIAYA */}
        {compModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">
                    {editingComp ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya Baru'}
                  </h3>
                  <p className="text-xs text-amber-200 mt-0.5">Master komponen biaya dinamis dalam database.</p>
                </div>
                <button
                  onClick={() => setCompModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveComp} className="p-5 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kode Komponen *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPP, SKS, LAB, PRAKTIKUM"
                    value={compFormData.code}
                    onChange={(e) => setCompFormData({ ...compFormData, code: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Komponen *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sumbangan Pembinaan Pendidikan (SPP)"
                    value={compFormData.name}
                    onChange={(e) => setCompFormData({ ...compFormData, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tarif Dasar (Rp) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={compFormData.defaultAmount}
                      onChange={(e) =>
                        setCompFormData({ ...compFormData, defaultAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori Tagihan</label>
                    <select
                      value={compFormData.category}
                      onChange={(e) => setCompFormData({ ...compFormData, category: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="SEMESTER">Per Semester</option>
                      <option value="SEKALI_BAYAR">Sekali Bayar</option>
                      <option value="PER_SKS">Per SKS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Keterangan / Fungsi</label>
                  <textarea
                    rows={2}
                    placeholder="Penjelasan pembebanan komponen ini..."
                    value={compFormData.description}
                    onChange={(e) => setCompFormData({ ...compFormData, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {editingComp ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = editingComp;
                        setCompModalOpen(false);
                        handleDeleteComp(target);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Komponen</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingComp}
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 disabled:opacity-50"
                    >
                      {isSavingComp ? 'Menyimpan...' : 'Simpan Komponen'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SNAPSHOT DETAIL HISTORI */}
        {snapshotModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Snapshot Penetapan Pembiayaan</h3>
                  <p className="text-xs text-slate-300">
                    {selectedAssignment.student?.user?.fullName} ({selectedAssignment.student?.nim})
                  </p>
                </div>
                <button
                  onClick={() => setSnapshotModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block">Skema Terpilih:</span>
                    <span className="font-bold text-slate-900">{selectedAssignment.schemeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tahun Angkatan Penetapan:</span>
                    <span className="font-bold text-slate-900">{selectedAssignment.academicYear}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ditetapkan Oleh:</span>
                    <span className="font-medium text-slate-700">{selectedAssignment.assignedBy || 'Sistem'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Waktu Penetapan:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(selectedAssignment.assignedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
                    Komponen & Perlakuan yang Dibekukan (Snapshot):
                  </h4>
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold">
                        <tr>
                          <th className="p-2.5">Komponen</th>
                          <th className="p-2.5">Tarif Normal</th>
                          <th className="p-2.5">Perlakuan</th>
                          <th className="p-2.5 text-right">Final (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAssignment.snapshotData?.calculation?.lineItems?.map((li: any) => (
                          <tr key={li.feeComponentId}>
                            <td className="p-2.5 font-bold text-slate-800">{li.name}</td>
                            <td className="p-2.5 font-mono">{formatRupiah(li.baseAmount)}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {li.actionType}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(li.finalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSnapshotModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM CONFIRM & ALERT MODAL */}
        <ConfirmModal
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          isAlert={dialogState.isAlert}
          onConfirm={() => {
            if (dialogState.onConfirm) dialogState.onConfirm();
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          }}
          onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </PortalLayout>
  );
}
