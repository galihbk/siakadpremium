'use client';

import React, { useState, useEffect } from 'react';
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
  BookOpen,
  GraduationCap,
  Tag,
  X,
  Award,
} from 'lucide-react';
import {
  AdmissionRegistrationTypeItem,
  AdmissionTrackItem,
  AdmissionClassItem,
} from '@siakad/types';

export default function AdminPmbJalurPage() {
  const [activeTab, setActiveTab] = useState<'jenisPendaftaran' | 'jenisMahasiswa' | 'pilihanKelas'>('jenisPendaftaran');
  const [registrationTypes, setRegistrationTypes] = useState<AdmissionRegistrationTypeItem[]>([]);
  const [tracks, setTracks] = useState<AdmissionTrackItem[]>([]);
  const [classes, setClasses] = useState<AdmissionClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: 'jenisPendaftaran' | 'jenisMahasiswa' | 'pilihanKelas';
    item?: any;
  } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    badge: '',
    isKip: false,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const fetchData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [regTypesRes, tracksRes, classesRes] = await Promise.all([
        fetch(`${apiBase}/admissions/admin/pmb/registration-types`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/admin/pmb/tracks`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/admin/pmb/classes`, { cache: 'no-store' }),
      ]);

      if (regTypesRes.ok) {
        const json = await regTypesRes.json();
        setRegistrationTypes(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      }
      if (tracksRes.ok) {
        const json = await tracksRes.json();
        setTracks(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      }
      if (classesRes.ok) {
        const json = await classesRes.json();
        setClasses(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      }
    } catch (err: any) {
      console.error('Error fetching PMB master classifications:', err);
      setApiError(err.message || 'Gagal memuat data master dari server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = (type: 'jenisPendaftaran' | 'jenisMahasiswa' | 'pilihanKelas') => {
    setEditingItem({ type });
    setFormData({
      code: '',
      name: '',
      description: '',
      badge: type === 'jenisPendaftaran' ? 'Reguler Mandiri' : '',
      isKip: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (type: 'jenisPendaftaran' | 'jenisMahasiswa' | 'pilihanKelas', item: any) => {
    setEditingItem({ type, item });
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      badge: item.badge || '',
      isKip: item.isKip ?? false,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setDialogState({
        isOpen: true,
        title: 'Data Belum Lengkap',
        message: 'Kode dan Nama wajib diisi sebelum menyimpan data.',
        type: 'warning',
        isAlert: true,
        confirmText: 'Mengerti',
      });
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = !!editingItem?.item;
      const type = editingItem?.type || activeTab;
      const endpoint =
        type === 'jenisPendaftaran'
          ? 'registration-types'
          : type === 'jenisMahasiswa'
          ? 'tracks'
          : 'classes';
      const url = isEdit
        ? `${apiBase}/admissions/admin/pmb/${endpoint}/${editingItem.item.id}`
        : `${apiBase}/admissions/admin/pmb/${endpoint}`;
      const method = isEdit ? 'PATCH' : 'POST';

      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      };

      if (type === 'jenisPendaftaran') {
        payload.badge = formData.badge.trim() || undefined;
        payload.isKip = formData.isKip;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan data ke database.');
      }

      setModalOpen(false);
      await fetchData();
      setDialogState({
        isOpen: true,
        title: 'Data Berhasil Disimpan',
        message: 'Perubahan master data pendaftaran PMB telah berhasil disimpan.',
        type: 'success',
        isAlert: true,
        confirmText: 'Selesai',
      });
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Menyimpan Data',
        message: err.message || 'Terjadi kesalahan sistem saat menyimpan data.',
        type: 'danger',
        isAlert: true,
        confirmText: 'Tutup',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (
    type: 'jenisPendaftaran' | 'jenisMahasiswa' | 'pilihanKelas',
    id: string,
    name: string
  ) => {
    const label =
      type === 'jenisPendaftaran'
        ? 'Jenis Pendaftaran'
        : type === 'jenisMahasiswa'
        ? 'Jenis Mahasiswa'
        : 'Pilihan Kelas';

    setDialogState({
      isOpen: true,
      title: `Hapus ${label}?`,
      message: (
        <span>
          Apakah Anda yakin ingin menghapus {label.toLowerCase()}{' '}
          <strong className="text-slate-900 font-bold">&quot;{name}&quot;</strong>?
          Tindakan ini akan menghapus opsi tersebut dari sistem PMB.
        </span>
      ),
      type: 'danger',
      confirmText: 'Ya, Hapus Data',
      cancelText: 'Batal',
      isAlert: false,
      onConfirm: async () => {
        try {
          const endpoint =
            type === 'jenisPendaftaran'
              ? 'registration-types'
              : type === 'jenisMahasiswa'
              ? 'tracks'
              : 'classes';
          const res = await fetch(`${apiBase}/admissions/admin/pmb/${endpoint}/${id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.message || 'Gagal menghapus data.');
          }
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Gagal Menghapus Data',
            message: err.message || 'Terjadi kesalahan saat menghapus data.',
            type: 'danger',
            isAlert: true,
            confirmText: 'Tutup',
          });
        }
      },
    });
  };

  const getAddButtonTitle = () => {
    switch (activeTab) {
      case 'jenisPendaftaran':
        return 'Tambah Jenis Pendaftaran';
      case 'jenisMahasiswa':
        return 'Tambah Jenis Mahasiswa';
      case 'pilihanKelas':
        return 'Tambah Pilihan Kelas';
    }
  };

  return (
    <PortalLayout
      role="pmb"
      activeMenuHref="/admin/pmb/jalur"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#1E3A8A]">
                <Layers className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Penerimaan Mahasiswa Baru
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Master Jenis, Jalur & Kelas PMB
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelola Jenis Pendaftaran (KIP / Non-KIP), Jenis Mahasiswa (Reguler / Transfer), dan Pilihan Kelas yang disinkronkan langsung dengan formulir pendaftar.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1E3A8A]' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{getAddButtonTitle()}</span>
            </button>
          </div>
        </div>

        {/* 3 Tab Selector */}
        <div className="flex flex-wrap border-b border-slate-200 bg-white px-4 rounded-2xl shadow-subtle">
          <button
            onClick={() => setActiveTab('jenisPendaftaran')}
            className={`flex items-center gap-2 py-4 px-5 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'jenisPendaftaran'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Jenis Pendaftaran ({registrationTypes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('jenisMahasiswa')}
            className={`flex items-center gap-2 py-4 px-5 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'jenisMahasiswa'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Jenis Mahasiswa ({tracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pilihanKelas')}
            className={`flex items-center gap-2 py-4 px-5 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'pilihanKelas'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Pilihan Kelas ({classes.length})</span>
          </button>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Content Tables */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
              Memuat data master...
            </div>
          ) : activeTab === 'jenisPendaftaran' ? (
            /* TAB 1: JENIS PENDAFTARAN */
            registrationTypes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada data Jenis Pendaftaran. Silakan tambahkan baru.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">KODE</th>
                      <th className="py-3 px-4">NAMA JENIS PENDAFTARAN</th>
                      <th className="py-3 px-4">BADGE / LABEL</th>
                      <th className="py-3 px-4">KATEGORI KIP</th>
                      <th className="py-3 px-4">DESKRIPSI</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                      <th className="py-3 px-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrationTypes.map((rt) => (
                      <tr key={rt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{rt.code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{rt.name}</td>
                        <td className="py-3.5 px-4">
                          {rt.badge ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                              {rt.badge}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {rt.isKip ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Award className="w-3 h-3" />
                              Beasiswa KIP
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              Non-KIP (Mandiri)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{rt.description || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rt.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {rt.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {rt.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit('jenisPendaftaran', rt)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete('jenisPendaftaran', rt.id, rt.name)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === 'jenisMahasiswa' ? (
            /* TAB 2: JENIS MAHASISWA */
            tracks.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada data Jenis Mahasiswa PMB. Silakan tambahkan baru.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">KODE</th>
                      <th className="py-3 px-4">NAMA JENIS MAHASISWA</th>
                      <th className="py-3 px-4">DESKRIPSI</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                      <th className="py-3 px-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tracks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{t.code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{t.description || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {t.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {t.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit('jenisMahasiswa', t)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete('jenisMahasiswa', t.id, t.name)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* TAB 3: PILIHAN KELAS */
            classes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Belum ada pilihan kelas perkuliahan PMB. Silakan tambahkan kelas baru.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">KODE</th>
                      <th className="py-3 px-4">NAMA KELAS</th>
                      <th className="py-3 px-4">DESKRIPSI</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                      <th className="py-3 px-4 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{c.description || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {c.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {c.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit('pilihanKelas', c)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete('pilihanKelas', c.id, c.name)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

        {/* Modal Add / Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 !m-0">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem?.item ? 'Ubah' : 'Tambah'}{' '}
                  {editingItem?.type === 'jenisPendaftaran'
                    ? 'Jenis Pendaftaran'
                    : editingItem?.type === 'jenisMahasiswa'
                    ? 'Jenis Mahasiswa'
                    : 'Pilihan Kelas Kuliah'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode (Singkat & Unik)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      editingItem?.type === 'jenisPendaftaran'
                        ? 'Contoh: NON_KIP, KIPK, MITRA'
                        : editingItem?.type === 'jenisMahasiswa'
                        ? 'Contoh: REGULER, TRANSFER, RPL'
                        : 'Contoh: REGULER, KARYAWAN'
                    }
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      editingItem?.type === 'jenisPendaftaran'
                        ? 'Contoh: NON-KIP (Reguler Mandiri)'
                        : editingItem?.type === 'jenisMahasiswa'
                        ? 'Contoh: Mahasiswa Baru'
                        : 'Contoh: Kelas Reguler (Pagi)'
                    }
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                {editingItem?.type === 'jenisPendaftaran' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Badge / Label Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Beasiswa Penuh, Reguler Mandiri"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deskripsi / Keterangan
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsi singkat untuk membantu pendaftar memahami pilihan..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                {editingItem?.type === 'jenisPendaftaran' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isKip"
                      checked={formData.isKip}
                      onChange={(e) => setFormData({ ...formData, isKip: e.target.checked })}
                      className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isKip" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Jalur KIP-Kuliah / Penerima Beasiswa Pendidikan
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Aktifkan dalam formulir pendaftaran calon mahasiswa
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirm & Alert Modal */}
        <ConfirmModal
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={dialogState.onConfirm}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          isAlert={dialogState.isAlert}
        />
    </PortalLayout>
  );
}
