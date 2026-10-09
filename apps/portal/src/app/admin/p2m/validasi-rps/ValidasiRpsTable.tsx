'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Check, X, Eye, SlidersHorizontal } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Modal } from '@/components/ui/Modal';

export interface RpsRow {
  id: string;
  courseClassId: string;
  courseCode: string;
  courseName: string;
  studyProgram: string;
  className: string;
  lecturerName: string;
  rpsCode: string | null;
  p2mStatus: string;
  p2mNote: string | null;
  p2mValidatedAt: string | null;
  p2mValidatedBy: string | null;
  updatedAt: string;
}

interface RpsDetail extends RpsRow {
  weeks: { weekNumber: number; indicator: string | null; topic: string; method: string | null; duration: string | null; studentExperience: string | null; assessmentWeight: string | null }[];
  description: string | null;
  graduateLearningOutcomes: string | null;
  learningOutcomes: string | null;
  subCpmk: string | null;
  studyMaterials: string | null;
  teachingMethods: string | null;
  studentExperience: string | null;
  assessmentCriteria: string | null;
  references: string | null;
  supportingReferences: string | null;
  learningMedia: string | null;
  coordinatorName: string | null;
  headOfProdiName: string | null;
  preparedDate: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  BELUM_DIAJUKAN: 'bg-slate-100 text-slate-500',
  DIAJUKAN: 'bg-amber-100 text-amber-700',
  DISAHKAN: 'bg-emerald-100 text-emerald-700',
  PERLU_REVISI: 'bg-rose-100 text-rose-700',
};

const STATUS_LABEL: Record<string, string> = {
  BELUM_DIAJUKAN: 'Belum Diajukan',
  DIAJUKAN: 'Menunggu Validasi',
  DISAHKAN: 'Disahkan',
  PERLU_REVISI: 'Perlu Revisi',
};

function authHeaders(): Record<string, string> {
  const { token } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function RichTextDisplay({ html, emptyText = '-' }: { html: string | null; emptyText?: string }) {
  if (!html || !html.replace(/<[^>]*>/g, '').trim()) {
    return <p className="text-slate-400 italic">{emptyText}</p>;
  }
  return (
    <div
      className="text-slate-700 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#1E3A8A] [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ValidasiRpsTable({ initialRps }: { initialRps: RpsRow[] }) {
  const apiBase = getApiBaseUrl();
  const [rpsList, setRpsList] = useState<RpsRow[]>(initialRps);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [detail, setDetail] = useState<RpsDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'Semua') params.set('status', statusFilter);
      const res = await fetch(`${apiBase}/p2m/rps?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setRpsList(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat daftar RPS:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (row: RpsRow) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setShowRevisionInput(false);
    setRevisionNote('');
    try {
      const res = await fetch(`${apiBase}/p2m/rps/${row.id}`);
      const json = await res.json().catch(() => null);
      if (res.ok) {
        setDetail(json.data || json);
      } else {
        showToast(json?.message || 'Gagal memuat detail RPS.', 'error');
        setIsDetailOpen(false);
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleValidate = async (status: 'DISAHKAN' | 'PERLU_REVISI') => {
    if (!detail) return;
    if (status === 'PERLU_REVISI' && !revisionNote.trim()) {
      showToast('Catatan revisi wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/p2m/rps/${detail.id}/validate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ status, note: revisionNote }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(json?.message || 'RPS berhasil diproses.');
        setIsDetailOpen(false);
        await fetchList();
      } else {
        showToast(json?.message || 'Gagal memproses validasi RPS.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = rpsList.filter((r) => {
    if (statusFilter !== 'Semua' && r.p2mStatus !== statusFilter) return false;
    return (
      r.courseName.toLowerCase().includes(search.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      r.lecturerName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeFilterCount = statusFilter !== 'Semua' ? 1 : 0;

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<RpsRow>(filtered, 'updatedAt', 10, 'desc');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">P2M</span>
          <h1 className="text-xl sm:text-2xl font-black">Validasi RPS</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Tinjau dan sahkan Rencana Pembelajaran Semester yang diajukan dosen
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Menunggu Validasi</p>
          <p className="text-xl font-black text-white">{rpsList.filter((r) => r.p2mStatus === 'DIAJUKAN').length} RPS</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata kuliah atau dosen..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={fetchList}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<RpsRow> label="Mata Kuliah" column="courseName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<RpsRow> label="Kelas" column="className" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<RpsRow> label="Dosen" column="lecturerName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status</th>
                <SortableTh<RpsRow> label="Diperbarui" column="updatedAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada RPS yang diajukan dosen untuk divalidasi.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.courseName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.courseCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.className}</td>
                    <td className="px-4 py-3 text-slate-600">{r.lecturerName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[r.p2mStatus] || 'bg-slate-100 text-slate-500'}`}>
                        {STATUS_LABEL[r.p2mStatus] || r.p2mStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetail(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Tinjau
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="RPS" />
        )}
      </div>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Validasi RPS"
        subtitle="Persempit daftar berdasarkan status validasi"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            >
              <option value="Semua">Semua (kecuali belum diajukan)</option>
              <option value="DIAJUKAN">Menunggu Validasi</option>
              <option value="DISAHKAN">Disahkan</option>
              <option value="PERLU_REVISI">Perlu Revisi</option>
            </select>
          </div>
          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Terapkan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={detail ? `RPS: ${detail.courseName}` : 'Tinjau RPS'}
        subtitle={detail ? `${detail.className} • Diajukan oleh ${detail.lecturerName}` : undefined}
        maxWidth="3xl"
      >
        {isDetailLoading || !detail ? (
          <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Memuat detail RPS...
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {detail.p2mStatus === 'PERLU_REVISI' && detail.p2mNote && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                <p className="font-bold mb-0.5">Catatan Revisi Sebelumnya:</p>
                <p>{detail.p2mNote}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <p className="text-slate-400">Kode RPS</p>
                <p className="font-semibold text-slate-700">{detail.rpsCode || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Koordinator MK</p>
                <p className="font-semibold text-slate-700">{detail.coordinatorName || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Kaprodi</p>
                <p className="font-semibold text-slate-700">{detail.headOfProdiName || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Tgl. Penyusunan</p>
                <p className="font-semibold text-slate-700">
                  {detail.preparedDate ? new Date(detail.preparedDate).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 border-t border-slate-100 pt-4">
              <div>
                <p className="font-bold text-slate-700 mb-1">CPL-Prodi</p>
                <RichTextDisplay html={detail.graduateLearningOutcomes} />
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">CPMK</p>
                <RichTextDisplay html={detail.learningOutcomes} />
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">Sub-CPMK</p>
                <RichTextDisplay html={detail.subCpmk} />
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">Deskripsi Mata Kuliah</p>
                <RichTextDisplay html={detail.description} />
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">Bahan Kajian</p>
                <RichTextDisplay html={detail.studyMaterials} />
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">Metode Pembelajaran</p>
                <RichTextDisplay html={detail.teachingMethods} />
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">Pustaka Utama</p>
                <RichTextDisplay html={detail.references} />
              </div>

              {detail.weeks.length > 0 && (
                <div>
                  <p className="font-bold text-slate-700 mb-1.5">Rencana Mingguan ({detail.weeks.length} pertemuan)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold text-center">
                          <th className="p-1.5 border border-slate-200">Minggu</th>
                          <th className="p-1.5 border border-slate-200">Kemampuan Akhir</th>
                          <th className="p-1.5 border border-slate-200">Materi</th>
                          <th className="p-1.5 border border-slate-200">Metode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.weeks.map((w) => (
                          <tr key={w.weekNumber}>
                            <td className="p-1.5 border border-slate-200 text-center font-bold">{w.weekNumber}</td>
                            <td className="p-1.5 border border-slate-200">{w.indicator || '-'}</td>
                            <td className="p-1.5 border border-slate-200">{w.topic || '-'}</td>
                            <td className="p-1.5 border border-slate-200">{w.method || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {detail.p2mStatus === 'DIAJUKAN' && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {showRevisionInput && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Revisi untuk Dosen</label>
                    <textarea
                      rows={3}
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      placeholder="Jelaskan bagian yang perlu diperbaiki..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                )}
                <div className="flex items-center justify-end gap-2.5">
                  {showRevisionInput ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowRevisionInput(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleValidate('PERLU_REVISI')}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        Kirim Catatan Revisi
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowRevisionInput(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Minta Revisi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleValidate('DISAHKAN')}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                      >
                        {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Sahkan RPS
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
