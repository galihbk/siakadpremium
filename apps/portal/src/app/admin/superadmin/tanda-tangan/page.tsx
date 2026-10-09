'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { PenTool, RefreshCw, Save, Plus, Trash2, X, Info } from 'lucide-react';

type SignerRole = 'DOSEN_PA' | 'KAPRODI' | 'DEKAN' | 'WAKIL_REKTOR_AKADEMIK' | 'REKTOR';

interface RoleOption {
  role: SignerRole;
  label: string;
}

interface RuleRow {
  id: string;
  documentCode: string;
  documentLabel: string;
  signer1Role: SignerRole;
  signer1Label: string | null;
  signer2Role: SignerRole | null;
  signer2Label: string | null;
  notes: string | null;
}

const emptyForm = {
  documentCode: '',
  documentLabel: '',
  signer1Role: 'DOSEN_PA' as SignerRole,
  signer1Label: '',
  signer2Role: '' as SignerRole | '',
  signer2Label: '',
  notes: '',
};

export default function TandaTanganPage() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [editing, setEditing] = useState<RuleRow | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, roleRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/document-signatures/rules`),
        fetch(`${getApiBaseUrl()}/document-signatures/roles`),
      ]);
      if (rRes.ok) setRules((await rRes.json()).data ?? []);
      if (roleRes.ok) setRoles((await roleRes.json()).data ?? []);
    } catch (err) {
      console.error('Gagal memuat aturan tanda tangan:', err);
      showToast('Gagal memuat data dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleLabel = (role: SignerRole | null) => roles.find((r) => r.role === role)?.label ?? role ?? '-';

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsAddOpen(true);
  };

  const openEdit = (rule: RuleRow) => {
    setEditing(rule);
    setForm({
      documentCode: rule.documentCode,
      documentLabel: rule.documentLabel,
      signer1Role: rule.signer1Role,
      signer1Label: rule.signer1Label ?? '',
      signer2Role: rule.signer2Role ?? '',
      signer2Label: rule.signer2Label ?? '',
      notes: rule.notes ?? '',
    });
    setIsAddOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/document-signatures/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentCode: form.documentCode,
          documentLabel: form.documentLabel,
          signer1Role: form.signer1Role,
          signer1Label: form.signer1Label || undefined,
          signer2Role: form.signer2Role || null,
          signer2Label: form.signer2Label || undefined,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast(`Aturan tanda tangan "${form.documentLabel}" berhasil disimpan.`);
      setIsAddOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan aturan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rule: RuleRow) => {
    if (!confirm(`Hapus aturan tanda tangan untuk "${rule.documentLabel}"?`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/document-signatures/rules/${rule.documentCode}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast('Aturan tanda tangan berhasil dihapus.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus aturan.');
    }
  };

  const inputCls = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <PenTool className="w-3.5 h-3.5" />
              Konfigurasi Dokumen
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Aturan Tanda Tangan Dokumen</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Tentukan siapa yang menandatangani tiap jenis dokumen resmi (KRS, KHS, surat, dst.) — Dosen PA, Kaprodi, Dekan, atau pimpinan
              institusi. Nama ditarik otomatis dari data mahasiswa/prodi/fakultas saat dokumen dicetak.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold border border-white/20 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              Tambah Jenis Dokumen
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-bold">Beberapa peran hanya terisi kalau datanya sudah ada.</p>
            <p className="mt-0.5">
              Kaprodi diambil dari data Ketua Program Studi di menu Program Studi, dan Dekan dari data Fakultas. Kalau belum diisi di sana,
              dokumen akan menampilkan jabatan tanpa nama sampai datanya dilengkapi.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Kode</th>
                  <th className="px-4 py-3 text-left font-semibold">Jenis Dokumen</th>
                  <th className="px-4 py-3 text-left font-semibold">Penandatangan 1</th>
                  <th className="px-4 py-3 text-left font-semibold">Penandatangan 2</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && rules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Belum ada aturan tanda tangan.</td>
                  </tr>
                )}
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-[#1E3A8A]">{rule.documentCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{rule.documentLabel}</td>
                    <td className="px-4 py-3 text-slate-600">{rule.signer1Label || roleLabel(rule.signer1Role)}</td>
                    <td className="px-4 py-3 text-slate-600">{rule.signer2Role ? (rule.signer2Label || roleLabel(rule.signer2Role)) : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(rule)} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-semibold text-[11px] cursor-pointer">
                          Edit
                        </button>
                        <button onClick={() => remove(rule)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" title="Hapus">
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

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">{toast}</div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <h4 className="font-bold text-slate-900 text-sm">{editing ? `Edit Aturan: ${editing.documentCode}` : 'Tambah Jenis Dokumen'}</h4>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Dokumen *</label>
                  <input
                    required
                    disabled={Boolean(editing)}
                    value={form.documentCode}
                    onChange={(e) => setForm({ ...form, documentCode: e.target.value.toUpperCase() })}
                    placeholder="mis. KRS"
                    className={`${inputCls} font-mono disabled:bg-slate-100 disabled:text-slate-400`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Dokumen *</label>
                  <input required value={form.documentLabel} onChange={(e) => setForm({ ...form, documentLabel: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penandatangan 1 *</label>
                  <select value={form.signer1Role} onChange={(e) => setForm({ ...form, signer1Role: e.target.value as SignerRole })} className={`${inputCls} bg-white`}>
                    {roles.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Label Jabatan (opsional)</label>
                  <input value={form.signer1Label} onChange={(e) => setForm({ ...form, signer1Label: e.target.value })} placeholder="Kosongkan untuk label baku" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penandatangan 2 (opsional)</label>
                  <select value={form.signer2Role} onChange={(e) => setForm({ ...form, signer2Role: e.target.value as SignerRole | '' })} className={`${inputCls} bg-white`}>
                    <option value="">Tidak ada</option>
                    {roles.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Label Jabatan (opsional)</label>
                  <input
                    value={form.signer2Label}
                    onChange={(e) => setForm({ ...form, signer2Label: e.target.value })}
                    disabled={!form.signer2Role}
                    placeholder="Kosongkan untuk label baku"
                    className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (opsional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] disabled:opacity-60 rounded-xl cursor-pointer flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </PortalLayout>
  );
}
