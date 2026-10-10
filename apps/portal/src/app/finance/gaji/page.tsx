'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Search, Wallet, X, Loader2, Plus, Trash2 } from 'lucide-react';

interface SalaryComponentItem {
  id?: string;
  name: string;
  amount: number;
}

interface PayrollRow {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  category: 'Dosen' | 'Karyawan';
  studyProgram: string | null;
  nidn: string | null;
  isActive: boolean;
  baseSalary: number;
  honorPerSks: number;
  tunjangan: SalaryComponentItem[];
  potongan: SalaryComponentItem[];
  totalTunjangan: number;
  totalPotongan: number;
  gajiBersih: number;
  notes: string | null;
  updatedAt: string | null;
}

interface ComponentFormItem {
  key: string;
  name: string;
  amount: string; // digit-only string, formatted on display
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatThousands = (digits: string) => (digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '');

const onlyDigits = (value: string) => value.replace(/\D/g, '');

let keySeq = 0;
const nextKey = () => `c${Date.now()}_${keySeq++}`;

const toFormItems = (items: SalaryComponentItem[]): ComponentFormItem[] =>
  items.map((it) => ({ key: nextKey(), name: it.name, amount: String(it.amount || 0) }));

export default function PengaturanGajiPage() {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Dosen' | 'Karyawan'>('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<PayrollRow | null>(null);
  const [form, setForm] = useState({ baseSalary: '0', honorPerSks: '0', notes: '' });
  const [tunjanganItems, setTunjanganItems] = useState<ComponentFormItem[]>([]);
  const [potonganItems, setPotonganItems] = useState<ComponentFormItem[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const qs = q ? `?search=${encodeURIComponent(q)}` : '';
      const res = await fetch(`${getApiBaseUrl()}/finance/payroll${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(json.data ?? json);
      setError(false);
    } catch (err) {
      console.error('Gagal memuat pengaturan gaji', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.nidn ?? '').includes(q);
      const matchCategory = categoryFilter === 'Semua' || r.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [rows, search, categoryFilter]);

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<PayrollRow>(filtered, 'fullName');

  const totals = useMemo(
    () => ({
      count: rows.length,
      dosen: rows.filter((r) => r.category === 'Dosen').length,
      karyawan: rows.filter((r) => r.category === 'Karyawan').length,
      totalBase: rows.reduce((a, r) => a + r.baseSalary, 0),
    }),
    [rows],
  );

  const openEdit = (row: PayrollRow) => {
    setEditing(row);
    setForm({
      baseSalary: String(row.baseSalary || 0),
      honorPerSks: String(row.honorPerSks || 0),
      notes: row.notes || '',
    });
    setTunjanganItems(toFormItems(row.tunjangan));
    setPotonganItems(toFormItems(row.potongan));
  };

  const addItem = (list: 'tunjangan' | 'potongan') => {
    const setFn = list === 'tunjangan' ? setTunjanganItems : setPotonganItems;
    setFn((prev) => [...prev, { key: nextKey(), name: '', amount: '0' }]);
  };

  const removeItem = (list: 'tunjangan' | 'potongan', key: string) => {
    const setFn = list === 'tunjangan' ? setTunjanganItems : setPotonganItems;
    setFn((prev) => prev.filter((it) => it.key !== key));
  };

  const updateItem = (list: 'tunjangan' | 'potongan', key: string, patch: Partial<ComponentFormItem>) => {
    const setFn = list === 'tunjangan' ? setTunjanganItems : setPotonganItems;
    setFn((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/payroll/${editing.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseSalary: Number(form.baseSalary) || 0,
          honorPerSks: Number(form.honorPerSks) || 0,
          notes: form.notes || undefined,
          tunjangan: tunjanganItems
            .filter((it) => it.name.trim())
            .map((it) => ({ name: it.name.trim(), amount: Number(it.amount) || 0 })),
          potongan: potonganItems
            .filter((it) => it.name.trim())
            .map((it) => ({ name: it.name.trim(), amount: Number(it.amount) || 0 })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditing(null);
      await load(search);
    } catch (err) {
      console.error('Gagal menyimpan pengaturan gaji', err);
      alert('Gagal menyimpan pengaturan gaji. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const previewGajiBersih = useMemo(() => {
    const base = Number(form.baseSalary) || 0;
    const tunjangan = tunjanganItems.reduce((a, it) => a + (Number(it.amount) || 0), 0);
    const potongan = potonganItems.reduce((a, it) => a + (Number(it.amount) || 0), 0);
    return base + tunjangan - potongan;
  }, [form.baseSalary, tunjanganItems, potonganItems]);

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Honor &amp; Pengajaran
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Pengaturan Gaji Dosen &amp; Karyawan</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Tetapkan gaji pokok, honor per SKS, rincian tunjangan, dan potongan untuk setiap dosen dan karyawan
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3">
            Gagal memuat data gaji dari server.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Pegawai', val: totals.count, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Dosen', val: totals.dosen, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
            { label: 'Karyawan', val: totals.karyawan, cls: 'bg-amber-50 border-amber-100 text-amber-700' },
            {
              label: 'Total Gaji Pokok/Bulan',
              val: formatRupiah(totals.totalBase),
              cls: 'bg-emerald-50 border-emerald-100 text-emerald-700',
              small: true,
            },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.cls}`}>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={c.small ? 'text-lg font-black' : 'text-2xl font-black'}>{c.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, atau NIDN..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div className="flex gap-1.5">
              {(['Semua', 'Dosen', 'Karyawan'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                    categoryFilter === c ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <SortableTh<PayrollRow> label="Nama" column="fullName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh<PayrollRow> label="Kategori" column="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh<PayrollRow> label="Gaji Pokok" column="baseSalary" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<PayrollRow> label="Honor/SKS" column="honorPerSks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<PayrollRow> label="Tunjangan" column="totalTunjangan" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<PayrollRow> label="Potongan" column="totalPotongan" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<PayrollRow> label="Gaji Bersih" column="gajiBersih" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada data yang cocok.
                    </td>
                  </tr>
                )}
                {paginated.map((r) => (
                  <tr key={r.userId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 block">{r.fullName}</span>
                      <span className="text-[11px] text-slate-400">
                        {r.studyProgram ?? r.email}
                        {r.nidn ? ` · NIDN ${r.nidn}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          r.category === 'Dosen' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatRupiah(r.baseSalary)}</td>
                    <td className="px-4 py-3 text-right text-[#1E3A8A] font-semibold">
                      {r.category === 'Dosen' ? formatRupiah(r.honorPerSks) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {r.totalTunjangan > 0 ? `+${formatRupiah(r.totalTunjangan)}` : formatRupiah(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600">
                      {r.totalPotongan > 0 ? `-${formatRupiah(r.totalPotongan)}` : formatRupiah(0)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-800">{formatRupiah(r.gajiBersih)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-[#1E3A8A] bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        Atur Gaji
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              itemLabel="pegawai"
            />
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            Gaji Bersih = Gaji Pokok + Tunjangan &minus; Potongan. Honor per SKS (dosen) dihitung terpisah di menu Rekap Honor.
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-none">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#1E3A8A]" />
                <h2 className="text-sm font-bold text-slate-800">Atur Gaji — {editing.fullName}</h2>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Gaji Pokok / Bulan (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatThousands(form.baseSalary)}
                      onChange={(e) => setForm((f) => ({ ...f, baseSalary: onlyDigits(e.target.value) }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>
                {editing.category === 'Dosen' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Honor per SKS (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousands(form.honorPerSks)}
                        onChange={(e) => setForm((f) => ({ ...f, honorPerSks: onlyDigits(e.target.value) }))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tunjangan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-emerald-700">Rincian Tunjangan</label>
                  <button
                    onClick={() => addItem('tunjangan')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {tunjanganItems.length === 0 && (
                    <p className="text-[11px] text-slate-400">Belum ada tunjangan. Contoh: Tunjangan Jabatan, Transport, Makan.</p>
                  )}
                  {tunjanganItems.map((it) => (
                    <div key={it.key} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama tunjangan"
                        value={it.name}
                        onChange={(e) => updateItem('tunjangan', it.key, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <div className="relative w-36 flex-none">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatThousands(it.amount)}
                          onChange={(e) => updateItem('tunjangan', it.key, { amount: onlyDigits(e.target.value) })}
                          className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => removeItem('tunjangan', it.key)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer flex-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potongan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-rose-700">Rincian Potongan</label>
                  <button
                    onClick={() => addItem('potongan')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
                <div className="space-y-2">
                  {potonganItems.length === 0 && (
                    <p className="text-[11px] text-slate-400">Belum ada potongan. Contoh: BPJS Kesehatan, BPJS Ketenagakerjaan, PPh 21.</p>
                  )}
                  {potonganItems.map((it) => (
                    <div key={it.key} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama potongan"
                        value={it.name}
                        onChange={(e) => updateItem('potongan', it.key, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                      <div className="relative w-36 flex-none">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatThousands(it.amount)}
                          onChange={(e) => updateItem('potongan', it.key, { amount: onlyDigits(e.target.value) })}
                          className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </div>
                      <button
                        onClick={() => removeItem('potongan', it.key)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer flex-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Catatan (opsional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-slate-600">Perkiraan Gaji Bersih / Bulan</span>
                <span className="text-sm font-black text-[#1E3A8A]">{formatRupiah(previewGajiBersih)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50 flex-none">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
