'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface BudgetItem {
  id: string;
  category: string;
  academicYear: string;
  allocated: number;
  spent: number;
}

const EMPTY_FORM = { category: '', allocated: 0, spent: 0 };

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function AnggaranPage() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/budget-items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((await res.json()).data ?? []);
      setError(null);
    } catch {
      setError('Gagal memuat data anggaran.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = {
    alokasi: items.reduce((a, d) => a + d.allocated, 0),
    realisasi: items.reduce((a, d) => a + d.spent, 0),
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (d: BudgetItem) => {
    setEditingId(d.id);
    setForm({ category: d.category, allocated: d.allocated, spent: d.spent });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/budget-items${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShowForm(false);
      await load();
    } catch {
      setError('Gagal menyimpan anggaran.');
    }
  };

  const remove = async (d: BudgetItem) => {
    if (!confirm(`Hapus kategori "${d.category}"?`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/budget-items/${d.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch {
      setError('Gagal menghapus anggaran.');
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Anggaran Kampus</span>
            <h1 className="text-xl sm:text-2xl font-black">Realisasi Anggaran Kampus</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">Monitoring realisasi anggaran per kategori tahun ajaran berjalan</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#b8890f] text-slate-900 font-bold px-4 py-2.5 rounded-xl text-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Alokasi', val: formatRp(total.alokasi), color: 'text-blue-700' },
            { label: 'Realisasi', val: formatRp(total.realisasi), color: 'text-emerald-700' },
            { label: 'Sisa Anggaran', val: formatRp(total.alokasi - total.realisasi), color: 'text-amber-700' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={`text-xl font-black ${c.color}`}>{c.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Realisasi Per Kategori</h2>
          </div>
          <div className="p-5 space-y-5">
            {!loading && items.length === 0 && !error && (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada anggaran. Klik &quot;Tambah Kategori&quot; untuk mulai.</p>
            )}
            {items.map((d) => {
              const pct = d.allocated > 0 ? Math.round((d.spent / d.allocated) * 100) : 0;
              return (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-sm font-semibold text-slate-700">{d.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${pct > 90 ? 'text-red-600' : pct > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}%</span>
                      <button onClick={() => openEdit(d)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(d)} className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Realisasi: {formatRp(d.spent)}</span>
                    <span>Alokasi: {formatRp(d.allocated)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-[#1E3A8A] text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">{editingId ? 'Edit Kategori Anggaran' : 'Tambah Kategori Anggaran'}</h4>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <input required placeholder="Nama Kategori *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} />
              <label className="block text-slate-600 font-semibold">
                Alokasi (Rp)
                <input type="number" min={0} value={form.allocated} onChange={(e) => setForm({ ...form, allocated: Number(e.target.value) })} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-slate-600 font-semibold">
                Realisasi (Rp)
                <input type="number" min={0} value={form.spent} onChange={(e) => setForm({ ...form, spent: Number(e.target.value) })} className={`${inputCls} mt-1`} />
              </label>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl cursor-pointer">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </PortalLayout>
  );
}
