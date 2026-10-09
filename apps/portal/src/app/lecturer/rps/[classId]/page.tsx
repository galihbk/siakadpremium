'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import {
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  Save,
  Target,
  BookOpen,
  GraduationCap,
  Library,
  CalendarRange,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

const P2M_STATUS_LABEL: Record<string, string> = {
  BELUM_DIAJUKAN: 'Belum Diajukan',
  DIAJUKAN: 'Menunggu Validasi P2M',
  DISAHKAN: 'Disahkan P2M',
  PERLU_REVISI: 'Perlu Revisi',
};

const P2M_STATUS_STYLE: Record<string, string> = {
  BELUM_DIAJUKAN: 'bg-white/10 text-blue-100 border border-white/20',
  DIAJUKAN: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
  DISAHKAN: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
  PERLU_REVISI: 'bg-rose-500/20 text-rose-200 border border-rose-400/40',
};

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if ((user as any)?.lecturerId) headers['x-lecturer-id'] = (user as any).lecturerId;
  return headers;
}

interface WeekPlan {
  weekNumber: number;
  indicator: string;
  topic: string;
  method: string;
  duration: string;
  studentExperience: string;
  assessmentWeight: string;
}

const DEFAULT_WEEKS: WeekPlan[] = Array.from({ length: 16 }, (_, i) => {
  const week = i + 1;
  if (week === 8) {
    return {
      weekNumber: 8,
      indicator: 'Evaluasi Tengah Semester (UTS)',
      topic: 'Materi pertemuan 1 s.d. 7',
      method: 'Tes Tertulis / Penugasan',
      duration: '2 x 50 menit',
      studentExperience: 'Mengerjakan soal evaluasi UTS',
      assessmentWeight: 'Bobot UTS',
    };
  }
  if (week === 16) {
    return {
      weekNumber: 16,
      indicator: 'Evaluasi Akhir Semester (UAS)',
      topic: 'Materi pertemuan 9 s.d. 15',
      method: 'Ujian Akhir / Presentasi Proyek',
      duration: '2 x 50 menit',
      studentExperience: 'Mengerjakan UAS / gelar karya tugas',
      assessmentWeight: 'Bobot UAS',
    };
  }
  if (week === 1) {
    return {
      weekNumber: 1,
      indicator: 'Memahami orientasi perkuliahan & kontrak belajar',
      topic: 'Kontrak belajar, RPS, tata tertib, dan pengantar',
      method: 'Kuliah Interaktif & Diskusi',
      duration: '2 x 50 menit',
      studentExperience: 'Menelaah silabus dan membentuk kelompok',
      assessmentWeight: '',
    };
  }
  return {
    weekNumber: week,
    indicator: '',
    topic: '',
    method: 'Diskusi & Praktik',
    duration: '2 x 50 menit',
    studentExperience: '',
    assessmentWeight: '',
  };
});

const emptyForm = {
  rpsCode: '',
  description: '',
  graduateLearningOutcomes: '',
  learningOutcomes: '',
  subCpmk: '',
  studyMaterials: '',
  teachingMethods: '',
  studentExperience: '',
  assessmentCriteria: '',
  references: '',
  supportingReferences: '',
  learningMedia: '',
  coordinatorName: '',
  headOfProdiName: '',
  preparedDate: new Date().toISOString().slice(0, 10),
  isPublished: false,
};

const TABS = [
  { key: 'cpl', label: 'CPL & CPMK', icon: Target },
  { key: 'materi', label: 'Deskripsi & Bahan Kajian', icon: BookOpen },
  { key: 'metode', label: 'Metode & Penilaian', icon: GraduationCap },
  { key: 'pustaka', label: 'Pustaka & Media', icon: Library },
  { key: 'mingguan', label: 'Rencana Mingguan', icon: CalendarRange },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function LecturerRpsFormPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const apiBase = getApiBaseUrl();

  const [activeTab, setActiveTab] = useState<TabKey>('cpl');
  const [courseName, setCourseName] = useState('');
  const [className, setClassName] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [weeks, setWeeks] = useState<WeekPlan[]>(DEFAULT_WEEKS);
  const [p2mStatus, setP2mStatus] = useState<string>('BELUM_DIAJUKAN');
  const [p2mNote, setP2mNote] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadContract = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const contractRes = await fetch(`${apiBase}/lecturers/classes/${classId}/contract`, { headers: authHeaders() });

      if (contractRes.ok) {
        const json = await contractRes.json();
        const data = json.data || json;
        setCourseName(data.courseName || '');
        setClassName(data.className || '');
        const c = data.contract;
        if (c) {
          setFormData({
            rpsCode: c.rpsCode || '',
            description: c.description || '',
            graduateLearningOutcomes: c.graduateLearningOutcomes || '',
            learningOutcomes: c.learningOutcomes || '',
            subCpmk: c.subCpmk || '',
            studyMaterials: c.studyMaterials || '',
            teachingMethods: c.teachingMethods || '',
            studentExperience: c.studentExperience || '',
            assessmentCriteria: c.assessmentCriteria || '',
            references: c.references || '',
            supportingReferences: c.supportingReferences || '',
            learningMedia: c.learningMedia || '',
            coordinatorName: c.coordinatorName || '',
            headOfProdiName: c.headOfProdiName || '',
            preparedDate: c.preparedDate ? c.preparedDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            isPublished: Boolean(c.isPublished),
          });
          setP2mStatus(c.p2mStatus || 'BELUM_DIAJUKAN');
          setP2mNote(c.p2mNote || null);
          if (Array.isArray(c.weeks) && c.weeks.length > 0) {
            setWeeks(
              c.weeks.map((w: any) => ({
                weekNumber: w.weekNumber,
                indicator: w.indicator || '',
                topic: w.topic || '',
                method: w.method || '',
                duration: w.duration || '2 x 50 menit',
                studentExperience: w.studentExperience || '',
                assessmentWeight: w.assessmentWeight || '',
              })),
            );
          }
        }
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const updateWeek = (idx: number, field: keyof WeekPlan, value: string | number) => {
    setWeeks((prev) => prev.map((w, i) => (i === idx ? { ...w, [field]: value } : w)));
  };

  const addWeek = () => {
    const nextNumber = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1;
    setWeeks((prev) => [
      ...prev,
      { weekNumber: nextNumber, indicator: '', topic: '', method: 'Diskusi & Praktik', duration: '2 x 50 menit', studentExperience: '', assessmentWeight: '' },
    ]);
  };

  const removeWeek = (idx: number) => {
    if (!confirm('Hapus baris pertemuan ini?')) return;
    setWeeks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (publish: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/contract`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...formData, isPublished: publish, weeks }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        setFormData((prev) => ({ ...prev, isPublished: publish }));
        if (publish) {
          setP2mStatus('DIAJUKAN');
          setP2mNote(null);
        }
        showToast(
          publish ? 'RPS berhasil disimpan & diajukan untuk divalidasi P2M.' : 'RPS berhasil disimpan sebagai draf.',
        );
      } else {
        showToast(json?.message || 'Gagal menyimpan RPS.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6 pb-16">
        <button
          onClick={() => router.push('/lecturer/rps')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Kelas
        </button>

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{courseName || 'Rencana Pembelajaran Semester'}</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">{className} &middot; Format Standar SN-Dikti / MBKM</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold w-fit ${P2M_STATUS_STYLE[p2mStatus]}`}>
            {P2M_STATUS_LABEL[p2mStatus] || p2mStatus}
          </span>
        </div>

        {!isLoading && p2mStatus === 'PERLU_REVISI' && p2mNote && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-700">Catatan Revisi dari P2M:</p>
              <p className="text-xs text-rose-600 mt-0.5">{p2mNote}</p>
              <p className="text-[11px] text-rose-500 mt-1">
                Perbaiki RPS sesuai catatan di atas, lalu klik &quot;Simpan &amp; Publikasikan&quot; untuk mengajukan ulang validasi.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A] mb-2" />
            <p className="text-sm">Memuat data RPS...</p>
          </div>
        ) : (
          <>
            {/* Identitas RPS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">1. Identitas Dokumen RPS</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode / Nomor Dokumen RPS</label>
                  <input
                    type="text"
                    placeholder="e.g. RPS-PGSD-014"
                    value={formData.rpsCode}
                    onChange={(e) => setFormData({ ...formData, rpsCode: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Penyusunan</label>
                  <input
                    type="date"
                    value={formData.preparedDate}
                    onChange={(e) => setFormData({ ...formData, preparedDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Koordinator Bidang / Rumpun MK</label>
                  <input
                    type="text"
                    placeholder="Nama koordinator (opsional)"
                    value={formData.coordinatorName}
                    onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ketua Program Studi (Kaprodi)</label>
                  <input
                    type="text"
                    placeholder="Nama Ketua Program Studi"
                    value={formData.headOfProdiName}
                    onChange={(e) => setFormData({ ...formData, headOfProdiName: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex overflow-x-auto border-b border-slate-100">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                        activeTab === t.key ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {activeTab === 'cpl' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CPL-Prodi (Capaian Pembelajaran Lulusan yang Dibebankan pada MK)
                      </label>
                      <RichTextEditor
                        placeholder="Contoh: CPL 1 (Sikap): Bertaqwa kepada Tuhan Yang Maha Esa... CPL 2 (Keterampilan Umum): Mampu menerapkan pemikiran logis, kritis, sistematis..."
                        value={formData.graduateLearningOutcomes}
                        onChange={(html) => setFormData({ ...formData, graduateLearningOutcomes: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CPMK (Capaian Pembelajaran Mata Kuliah)</label>
                      <RichTextEditor
                        placeholder="Contoh: CPMK 1: Mahasiswa mampu menganalisis konsep dasar... CPMK 2: Mahasiswa mampu merancang modul ajar..."
                        value={formData.learningOutcomes}
                        onChange={(html) => setFormData({ ...formData, learningOutcomes: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sub-CPMK (Kemampuan Akhir Tiap Tahapan Belajar)</label>
                      <RichTextEditor
                        placeholder="Contoh: Sub-CPMK 1.1: Mampu menjelaskan hakikat dan pengertian... Sub-CPMK 2.1: Mampu menyusun indikator capaian..."
                        value={formData.subCpmk}
                        onChange={(html) => setFormData({ ...formData, subCpmk: html })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'materi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat Mata Kuliah</label>
                      <RichTextEditor
                        placeholder="Ringkasan ruang lingkup isi mata kuliah, relevansinya, serta target akhir pembelajaran..."
                        value={formData.description}
                        onChange={(html) => setFormData({ ...formData, description: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bahan Kajian / Pokok Bahasan (Materi Pembelajaran)</label>
                      <RichTextEditor
                        placeholder="Daftar pokok bahasan, modul, atau topik pembelajaran..."
                        value={formData.studyMaterials}
                        onChange={(html) => setFormData({ ...formData, studyMaterials: html })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'metode' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bentuk & Metode Pembelajaran</label>
                      <RichTextEditor
                        placeholder="Contoh: Kuliah interaktif, Diskusi Kelompok, Problem-Based Learning (PBL), Case Method, Project-Based Learning (PjBL)."
                        value={formData.teachingMethods}
                        onChange={(html) => setFormData({ ...formData, teachingMethods: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pengalaman Belajar Mahasiswa (Tugas)</label>
                      <RichTextEditor
                        placeholder="Contoh: Mahasiswa menyusun kajian kritis artikel ilmiah, merancang modul ajar, mempresentasikan hasil."
                        value={formData.studentExperience}
                        onChange={(html) => setFormData({ ...formData, studentExperience: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kriteria & Bentuk Penilaian (Asesmen)</label>
                      <RichTextEditor
                        placeholder="Contoh: Rubrik penilaian presentasi, tes tertulis UTS/UAS, keaktifan diskusi kelas."
                        value={formData.assessmentCriteria}
                        onChange={(html) => setFormData({ ...formData, assessmentCriteria: html })}
                      />
                    </div>
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500">
                        Bobot nilai angka (Tugas/UTS/UAS/Kehadiran) diatur di menu{' '}
                        <button
                          type="button"
                          onClick={() => router.push(`/lecturer/kontrak/${classId}`)}
                          className="text-[#1E3A8A] font-semibold hover:underline cursor-pointer"
                        >
                          Kontrak Kuliah
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'pustaka' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pustaka Utama (Buku Teks & Rujukan Utama)</label>
                      <RichTextEditor
                        placeholder="Contoh: 1. Penulis, A. (Tahun). Judul Buku. Penerbit."
                        value={formData.references}
                        onChange={(html) => setFormData({ ...formData, references: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pustaka Pendukung (Jurnal, Artikel, Publikasi)</label>
                      <RichTextEditor
                        placeholder="Daftar artikel jurnal, prosiding, atau referensi penunjang terkini..."
                        value={formData.supportingReferences}
                        onChange={(html) => setFormData({ ...formData, supportingReferences: html })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Media & Perangkat Pembelajaran</label>
                      <RichTextEditor
                        placeholder="Contoh: Perangkat Lunak: LMS SIAKAD, Google Classroom, Zoom. Perangkat Keras: Laptop, LCD Proyektor."
                        value={formData.learningMedia}
                        onChange={(html) => setFormData({ ...formData, learningMedia: html })}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'mingguan' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h6 className="text-xs font-bold text-slate-800">Matriks Rencana Pembelajaran Mingguan (1 - 16)</h6>
                        <p className="text-[11px] text-slate-500">
                          Rincian tahapan belajar, materi, metode, alokasi waktu, dan penilaian per minggu pertemuan.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addWeek}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1E3A8A]/30 text-[#1E3A8A] text-[11px] font-bold hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Pertemuan
                      </button>
                    </div>

                    <div className="overflow-x-auto -mx-5 px-5">
                      <table className="w-full text-[11px] border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold text-center">
                            <th className="p-2 border border-slate-200 w-14">Minggu</th>
                            <th className="p-2 border border-slate-200 w-48">Sub-CPMK / Kemampuan Akhir</th>
                            <th className="p-2 border border-slate-200 w-44">Bahan Kajian / Materi</th>
                            <th className="p-2 border border-slate-200 w-36">Bentuk & Metode</th>
                            <th className="p-2 border border-slate-200 w-24">Waktu</th>
                            <th className="p-2 border border-slate-200 w-40">Pengalaman Belajar</th>
                            <th className="p-2 border border-slate-200 w-32">Kriteria & Bobot</th>
                            <th className="p-2 border border-slate-200 w-10">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeks.map((w, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-200 p-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={32}
                                  value={w.weekNumber}
                                  onChange={(e) => updateWeek(idx, 'weekNumber', Number(e.target.value))}
                                  className="w-full text-center font-bold p-1 rounded border border-slate-200 text-xs"
                                />
                              </td>
                              <td className="border border-slate-200 p-1">
                                <textarea
                                  rows={2}
                                  value={w.indicator}
                                  onChange={(e) => updateWeek(idx, 'indicator', e.target.value)}
                                  placeholder="Kemampuan akhir..."
                                  className="w-full p-1 rounded border border-slate-200 text-xs"
                                />
                              </td>
                              <td className="border border-slate-200 p-1">
                                <textarea
                                  rows={2}
                                  value={w.topic}
                                  onChange={(e) => updateWeek(idx, 'topic', e.target.value)}
                                  placeholder="Materi / topik..."
                                  className="w-full p-1 rounded border border-slate-200 text-xs"
                                />
                              </td>
                              <td className="border border-slate-200 p-1">
                                <input
                                  type="text"
                                  value={w.method}
                                  onChange={(e) => updateWeek(idx, 'method', e.target.value)}
                                  placeholder="Kuliah / Diskusi"
                                  className="w-full p-1 rounded border border-slate-200 text-xs"
                                />
                              </td>
                              <td className="border border-slate-200 p-1">
                                <input
                                  type="text"
                                  value={w.duration}
                                  onChange={(e) => updateWeek(idx, 'duration', e.target.value)}
                                  className="w-full p-1 rounded border border-slate-200 text-xs text-center"
                                />
                              </td>
                              <td className="border border-slate-200 p-1">
                                <textarea
                                  rows={2}
                                  value={w.studentExperience}
                                  onChange={(e) => updateWeek(idx, 'studentExperience', e.target.value)}
                                  placeholder="Aktivitas..."
                                  className="w-full p-1 rounded border border-slate-200 text-xs"
                                />
                              </td>
                              <td className="border border-slate-200 p-1">
                                <input
                                  type="text"
                                  value={w.assessmentWeight}
                                  onChange={(e) => updateWeek(idx, 'assessmentWeight', e.target.value)}
                                  placeholder="Kriteria / Bobot"
                                  className="w-full p-1 rounded border border-slate-200 text-xs"
                                />
                              </td>
                              <td className="border border-slate-200 p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeWeek(idx)}
                                  title="Hapus pertemuan"
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Sebagai Draf
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Simpan & Publikasikan
              </button>
            </div>
          </>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
