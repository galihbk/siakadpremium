'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { confirmDialog } from '@/components/ui/ConfirmHost';
import { FieldCategory, fieldFetch } from '@/lib/fieldActivity';
import { Check, CheckCircle2, AlertTriangle, Building2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean;
  registrationCount: number;
}

const emptyForm = { name: '', address: '', contactName: '', contactPhone: '', notes: '' };

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

/** Daftar mitra tempat kegiatan untuk satu jenis (dikelola BAAK); mahasiswa memilihnya saat mendaftar. */
export function FieldPartnersPanel({ category }: { category: FieldCategory }) {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<Partner | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 4500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fieldFetch<{ items: Partner[] }>(`/admin/partners?categoryId=${category.id}`);
      setItems(r.items);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat mitra.');
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing('new');
    setForm(emptyForm);
    setFormError(null);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ name: p.name, address: p.address ?? '', contactName: p.contactName ?? '', contactPhone: p.contactPhone ?? '', notes: p.notes ?? '' });
    setFormError(null);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    try {
      const r =
        editing === 'new'
          ? await fieldFetch<{ message: string }>('/admin/partners', { method: 'POST', body: { ...form, categoryId: category.id } })
          : await fieldFetch<{ message: string }>(`/admin/partners/${editing.id}`, { method: 'PUT', body: form });
      notify(true, r.message);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan mitra.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: Partner) => {
    try {
      await fieldFetch(`/admin/partners/${p.id}`, { method: 'PUT', body: { name: p.name, address: p.address, contactName: p.contactName, contactPhone: p.contactPhone, notes: p.notes, isActive: !p.isActive } });
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal mengubah status mitra.');
    }
  };

  const remove = async (p: Partner) => {
    if (!(await confirmDialog(`Hapus mitra ${p.name}?`))) return;
    try {
      const r = await fieldFetch<{ message: string }>(`/admin/partners/${p.id}`, { method: 'DELETE' });
      notify(true, r.message);
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menghapus mitra.');
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'}`}>
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="max-w-sm">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600 max-w-2xl">
            Mitra {category.name} yang dapat dipilih mahasiswa saat mendaftar.{' '}
            {category.allowOwnPartner
              ? 'Mahasiswa juga boleh mengisi mitra lain di luar daftar ini.'
              : 'Mahasiswa hanya dapat memilih dari daftar ini; pastikan daftarnya sudah terisi sebelum pendaftaran dibuka.'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
            </button>
            <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Tambah Mitra
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mitra</th>
                <th className="px-4 py-3 text-left font-semibold">Kontak</th>
                <th className="px-4 py-3 text-left font-semibold">Dipilih</th>
                <th className="px-4 py-3 text-left font-semibold">Aktif</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Belum ada mitra untuk {category.name}. Klik &quot;Tambah Mitra&quot; untuk memulai.
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/70 align-top ${p.isActive ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 inline-flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {p.name}
                    </span>
                    {p.address && <span className="block text-[11px] text-slate-500">{p.address}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.contactName || p.contactPhone ? (
                      <>
                        {p.contactName && <span className="block">{p.contactName}</span>}
                        {p.contactPhone && <span className="block text-[11px] text-slate-400">{p.contactPhone}</span>}
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.registrationCount} pendaftaran</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.isActive}
                      onClick={() => toggleActive(p)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" style={{ transform: `translateX(${p.isActive ? 18 : 2}px)` }} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-[11px] cursor-pointer">
                      <Pencil className="w-3 h-3" /> Ubah
                    </button>
                    <button onClick={() => remove(p)} className="ml-1.5 inline-flex items-center px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Hapus mitra">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? `Tambah Mitra ${category.name}` : 'Ubah Mitra'} subtitle="Mitra tempat mahasiswa melaksanakan kegiatan">
        <div className="space-y-3 text-xs">
          {formError && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama mitra *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Contoh: SD Negeri 1 Majenang" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama kontak</label>
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Telepon kontak</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan (opsional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Batal
            </button>
            <button type="button" onClick={save} disabled={busy || !form.name.trim()} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
