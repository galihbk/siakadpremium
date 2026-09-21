'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { Award, Plus, RefreshCw, Save, Trash2, Check, X, Info, ChevronDown, ChevronRight, FolderPlus, CalendarDays, Lock } from 'lucide-react';

interface GradeScaleItem {
  id: string;
  letter: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
  isActive: boolean;
}

interface GradeScaleGroup {
  id: string;
  academicYearId: string | null;
  label: string | null;
  createdAt: string;
  scales: GradeScaleItem[];
  academicYear: { id: string; name: string; semesterType: string; isActive: boolean } | null;
  isUsed: boolean;
}

interface AcademicYearOption {
  id: string;
  name: string;
  semesterLabel: string;
  isActive: boolean;
}

const emptyRow = (): Omit<GradeScaleItem, 'id'> => ({
  letter: '',
  minScore: 0,
  maxScore: 0,
  gradePoint: 0,
  isActive: true,
});

const groupLabel = (g: GradeScaleGroup) =>
  g.label || (g.academicYear ? `${g.academicYear.name}` : `Skala Nilai ${new Date(g.createdAt).toLocaleDateString('id-ID')}`);

export default function AdminSkalaNilaiPage() {
  const apiBase = getApiBaseUrl();
  const [groups, setGroups] = useState<GradeScaleGroup[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newRows, setNewRows] = useState<Record<string, Omit<GradeScaleItem, 'id'>>>({});
  const [addingGroupId, setAddingGroupId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [years, setYears] = useState<AcademicYearOption[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupYearId, setNewGroupYearId] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchGroups = async (keepExpanded = true) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/grade-scale/groups`);
      if (res.ok) {
        const json = await res.json();
        const data: GradeScaleGroup[] = Array.isArray(json.data) ? json.data : [];
        setGroups(data);
        setExpandedId((prev) => {
          if (keepExpanded && prev && data.some((g) => g.id === prev)) return prev;
          const active = data.find((g) => g.academicYear?.isActive);
          return active?.id || data[0]?.id || null;
        });
      }
    } catch (err) {
      console.warn('Gagal memuat skala nilai:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const res = await fetch(`${apiBase}/academic/years`);
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        setYears(data.map((y: any) => ({ id: y.id, name: y.name, semesterLabel: y.semesterLabel, isActive: y.isActive })));
      }
    } catch (err) {
      console.warn('Gagal memuat daftar tahun akademik:', err);
    }
  };

  useEffect(() => {
    fetchGroups(false);
    fetchYears();
  }, []);

  const getNewRow = (groupId: string) => newRows[groupId] || emptyRow();
  const setNewRow = (groupId: string, row: Omit<GradeScaleItem, 'id'>) => setNewRows((prev) => ({ ...prev, [groupId]: row }));

  const updateLocalRow = (groupId: string, id: string, field: keyof GradeScaleItem, value: any) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, scales: g.scales.map((r) => (r.id === id ? { ...r, [field]: value } : r)) } : g)),
    );
  };

  const handleSaveRow = async (row: GradeScaleItem) => {
    setSavingId(row.id);
    try {
      const res = await fetch(`${apiBase}/academic/grade-scale/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter: row.letter,
          minScore: row.minScore,
          maxScore: row.maxScore,
          gradePoint: row.gradePoint,
          isActive: row.isActive,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Skala nilai "${row.letter}" berhasil disimpan.`);
        await fetchGroups();
      } else {
        showToast(json?.message || 'Gagal menyimpan skala nilai.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteRow = async (row: GradeScaleItem) => {
    if (!confirm(`Hapus skala nilai "${row.letter}"?`)) return;
    setSavingId(row.id);
    try {
      const res = await fetch(`${apiBase}/academic/grade-scale/${row.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(json?.message || `Skala nilai "${row.letter}" dihapus.`);
        await fetchGroups();
      } else {
        showToast(json?.message || 'Gagal menghapus skala nilai.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddRow = async (groupId: string) => {
    const row = getNewRow(groupId);
    if (!row.letter.trim()) {
      showToast('Huruf mutu wajib diisi.', 'error');
      return;
    }
    setAddingGroupId(groupId);
    try {
      const res = await fetch(`${apiBase}/academic/grade-scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...row, versionId: groupId }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Skala nilai "${row.letter}" berhasil ditambahkan.`);
        setNewRow(groupId, emptyRow());
        await fetchGroups();
      } else {
        showToast(json?.message || 'Gagal menambah skala nilai.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setAddingGroupId(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupYearId) {
      showToast('Pilih tahun akademik untuk skala nilai baru.', 'error');
      return;
    }
    if (groups.some((g) => g.academicYearId === newGroupYearId)) {
      showToast('Tahun akademik ini sudah punya skala nilai.', 'error');
      return;
    }
    setCreatingGroup(true);
    try {
      const res = await fetch(`${apiBase}/academic/grade-scale/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYearId: newGroupYearId, cloneFromVersionId: expandedId || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast('Skala nilai baru berhasil dibuat.');
        setIsCreatingGroup(false);
        setNewGroupYearId('');
        setExpandedId(json.data?.id || null);
        await fetchGroups();
      } else {
        showToast(json?.message || 'Gagal membuat skala nilai baru.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (group: GradeScaleGroup) => {
    if (!confirm(`Hapus skala nilai "${groupLabel(group)}"? Semua baris di dalamnya ikut terhapus.`)) return;
    setDeletingGroupId(group.id);
    try {
      const res = await fetch(`${apiBase}/academic/grade-scale/groups/${group.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(json?.message || 'Skala nilai dihapus.');
        await fetchGroups(false);
      } else {
        showToast(json?.message || 'Gagal menghapus skala nilai.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setDeletingGroupId(null);
    }
  };

  const availableYearsForNewGroup = years.filter((y) => !groups.some((g) => g.academicYearId === y.id));

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6" />
              Skala Nilai
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Atur rentang nilai angka, huruf mutu, dan bobot IPK per tahun akademik. Skala yang terhubung ke tahun akademik aktif otomatis dipakai untuk perhitungan nilai mahasiswa.
            </p>
          </div>
          <button
            onClick={() => fetchGroups()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Segarkan
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2 text-xs text-slate-700">
          <Info className="w-4 h-4 text-[#1E3A8A] mt-0.5 shrink-0" />
          <p>
            Setiap tahun akademik bisa punya <strong>skala nilai sendiri</strong>. Skala yang terhubung ke tahun akademik yang sedang <strong>aktif</strong>{' '}
            yang dipakai untuk menghitung nilai baru. Skala yang <strong>sudah pernah dipakai</strong> untuk menghitung nilai mata kuliah otomatis terkunci
            (tidak bisa diedit/dihapus) supaya riwayat nilai yang sudah ada tetap valid.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Daftar Skala Nilai per Tahun Akademik</h2>
          <button
            onClick={() => setIsCreatingGroup((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Tambah Skala Nilai Baru
          </button>
        </div>

        {isCreatingGroup && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-subtle p-4 flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Tahun Akademik
              </label>
              <select
                value={newGroupYearId}
                onChange={(e) => setNewGroupYearId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Pilih tahun akademik...</option>
                {availableYearsForNewGroup.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.semesterLabel} {y.isActive ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Baris skala akan disalin dari skala nilai yang sedang terbuka sebagai titik awal, lalu bisa diedit bebas.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsCreatingGroup(false);
                  setNewGroupYearId('');
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {creatingGroup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                Simpan
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-16 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#1E3A8A]" />
            <p className="text-xs">Memuat skala nilai...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-16 flex flex-col items-center justify-center text-slate-400">
            <Award className="w-8 h-8 mb-2 text-slate-300" />
            <p className="text-xs">Belum ada skala nilai. Tambah skala nilai baru untuk mulai.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const isOpen = expandedId === g.id;
              const isActiveYear = !!g.academicYear?.isActive;
              const locked = g.isUsed;
              const rows = g.scales;
              const newRow = getNewRow(g.id);

              return (
                <div key={g.id} className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : g.id)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <span className="text-sm font-bold text-slate-900">{groupLabel(g)}</span>
                      {isActiveYear && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Tahun Aktif
                        </span>
                      )}
                      {locked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          <Lock className="w-3 h-3" />
                          Terkunci (sudah dipakai)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">{rows.length} baris</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Huruf Mutu</th>
                              <th className="py-3 px-4 text-center">Nilai Minimum</th>
                              <th className="py-3 px-4 text-center">Nilai Maksimum</th>
                              <th className="py-3 px-4 text-center">Bobot IPK</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              {!locked && <th className="py-3 px-4 text-right">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rows
                              .slice()
                              .sort((a, b) => b.minScore - a.minScore)
                              .map((row) =>
                                locked ? (
                                  <tr key={row.id} className="bg-slate-50/40">
                                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{row.letter}</td>
                                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{row.minScore}</td>
                                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{row.maxScore}</td>
                                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{row.gradePoint}</td>
                                    <td className="py-2.5 px-4 text-center">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                          row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                      >
                                        {row.isActive ? 'Aktif' : 'Nonaktif'}
                                      </span>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2.5 px-4">
                                      <input
                                        type="text"
                                        value={row.letter}
                                        onChange={(e) => updateLocalRow(g.id, row.id, 'letter', e.target.value.toUpperCase())}
                                        className="w-20 text-center px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                                      />
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={row.minScore}
                                        onChange={(e) => updateLocalRow(g.id, row.id, 'minScore', Number(e.target.value))}
                                        className="w-24 text-center px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                                      />
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={row.maxScore}
                                        onChange={(e) => updateLocalRow(g.id, row.id, 'maxScore', Number(e.target.value))}
                                        className="w-24 text-center px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                                      />
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={row.gradePoint}
                                        onChange={(e) => updateLocalRow(g.id, row.id, 'gradePoint', Number(e.target.value))}
                                        className="w-20 text-center px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                                      />
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <button
                                        onClick={() => updateLocalRow(g.id, row.id, 'isActive', !row.isActive)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                          row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                      >
                                        {row.isActive ? 'Aktif' : 'Nonaktif'}
                                      </button>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleSaveRow(row)}
                                          disabled={savingId === row.id}
                                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] disabled:opacity-50"
                                          title="Simpan"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRow(row)}
                                          disabled={savingId === row.id}
                                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-50"
                                          title="Hapus"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ),
                              )}

                            {!locked && (
                              <tr className="bg-slate-50/50">
                                <td className="py-2.5 px-4">
                                  <input
                                    type="text"
                                    value={newRow.letter}
                                    onChange={(e) => setNewRow(g.id, { ...newRow, letter: e.target.value.toUpperCase() })}
                                    placeholder="A"
                                    className="w-20 text-center px-2 py-1.5 rounded-lg border border-dashed border-slate-300 font-mono font-bold"
                                  />
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={newRow.minScore}
                                    onChange={(e) => setNewRow(g.id, { ...newRow, minScore: Number(e.target.value) })}
                                    className="w-24 text-center px-2 py-1.5 rounded-lg border border-dashed border-slate-300 font-mono"
                                  />
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={newRow.maxScore}
                                    onChange={(e) => setNewRow(g.id, { ...newRow, maxScore: Number(e.target.value) })}
                                    className="w-24 text-center px-2 py-1.5 rounded-lg border border-dashed border-slate-300 font-mono"
                                  />
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={newRow.gradePoint}
                                    onChange={(e) => setNewRow(g.id, { ...newRow, gradePoint: Number(e.target.value) })}
                                    className="w-20 text-center px-2 py-1.5 rounded-lg border border-dashed border-slate-300 font-mono"
                                  />
                                </td>
                                <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    onClick={() => handleAddRow(g.id)}
                                    disabled={addingGroupId === g.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold disabled:opacity-50"
                                  >
                                    {addingGroupId === g.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                    Tambah
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {!locked && !isActiveYear && (
                        <div className="p-3 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => handleDeleteGroup(g)}
                            disabled={deletingGroupId === g.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus Skala Nilai Ini
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
