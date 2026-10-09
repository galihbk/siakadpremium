'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { Landmark, Plus, Pencil, Trash2, X } from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  description: string | null;
  accountNumber: string;
  accountName: string;
  balance: number;
  isActive: boolean;
}

const EMPTY_FORM = { bankName: '', description: '', accountNumber: '', accountName: '', balance: 0 };

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function RekeningPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/bank-accounts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAccounts((await res.json()).data ?? []);
      setError(null);
    } catch {
      setError('Gagal memuat data rekening.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalSaldo = accounts.filter((a) => a.isActive).reduce((sum, a) => sum + a.balance, 0);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (a: BankAccount) => {
    setEditingId(a.id);
    setForm({
      bankName: a.bankName,
      description: a.description ?? '',
      accountNumber: a.accountNumber,
      accountName: a.accountName,
      balance: a.balance,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/bank-accounts${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShowForm(false);
      await load();
    } catch {
      setError('Gagal menyimpan rekening.');
    }
  };

  const remove = async (a: BankAccount) => {
    if (!confirm(`Hapus rekening ${a.bankName} (${a.accountNumber})?`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/bank-accounts/${a.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch {
      setError('Gagal menghapus rekening.');
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Aset Keuangan</span>
            <h1 className="text-xl sm:text-2xl font-black">Rekening Bank &amp; Kas</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">Kelola rekening dan saldo operasional kampus</p>
            <div className="mt-4 bg-white/10 rounded-xl p-4 inline-block">
              <p className="text-xs text-blue-200">Total Saldo Seluruh Rekening Aktif</p>
              <p className="text-3xl font-black">{formatRp(totalSaldo)}</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#b8890f] text-slate-900 font-bold px-4 py-2.5 rounded-xl text-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Rekening
          </button>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3">{error}</div>}

        {!loading && accounts.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            Belum ada rekening. Klik &quot;Tambah Rekening&quot; untuk mulai.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{b.bankName}</p>
                    <p className="text-xs text-slate-500">{b.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(b)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Rekening</span>
                  <span className="font-mono font-bold text-slate-700">{b.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Rekening</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[60%]">{b.accountName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Saldo</span>
                  <span className="text-lg font-black text-[#1E3A8A]">{formatRp(b.balance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-[#1E3A8A] text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">{editingId ? 'Edit Rekening' : 'Tambah Rekening'}</h4>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <input required placeholder="Nama Bank *" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className={inputCls} />
              <input placeholder="Keterangan (mis. Virtual Account)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
              <input required placeholder="Nomor Rekening *" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className={inputCls} />
              <input required placeholder="Nama Rekening *" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className={inputCls} />
              <label className="block text-slate-600 font-semibold">
                Saldo (Rp)
                <input type="number" min={0} value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} className={`${inputCls} mt-1`} />
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
