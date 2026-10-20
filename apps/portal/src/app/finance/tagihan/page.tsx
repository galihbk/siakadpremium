'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { FileText, Search, Download, Plus, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RupiahInput } from '@/components/ui/RupiahInput';

interface StudentOption {
  id: string;
  nim: string;
  name: string;
  studyProgram: string;
  currentSemester: number;
}

interface FeeComponentOption {
  id: string;
  code: string;
  name: string;
  defaultAmount: number;
  category: string;
  isActive: boolean;
}

const CUSTOM_TYPE = '__custom__';
const CATEGORY_LABEL: Record<string, string> = { SEMESTER: 'per semester', PER_SKS: 'per SKS', SEKALI_BAYAR: 'sekali bayar' };

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  semester: number;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  dueDate?: string;
  status: 'LUNAS' | 'MENUNGGU VERIFIKASI' | 'TERTUNDA';
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function TagihanPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Terbitkan tagihan manual
  const [createOpen, setCreateOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [components, setComponents] = useState<FeeComponentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ nim: '', semester: 1, type: '', customType: '', amount: 0, notes: '' });
  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4500);
  };

  const openCreate = async () => {
    setForm({ nim: '', semester: 1, type: '', customType: '', amount: 0, notes: '' });
    setCreateOpen(true);
    // Jenis tagihan = komponen biaya dari menu Aturan Biaya Perkuliahan (tarif dasar ikut terisi otomatis)
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/fee-rules/components`);
      if (res.ok) {
        const json = await res.json();
        const list = json?.data ?? json;
        if (Array.isArray(list)) setComponents(list.filter((c: FeeComponentOption) => c.isActive !== false));
      }
    } catch {
      // daftar komponen tidak termuat; pengguna masih bisa memakai "Lainnya"
    }
    if (students.length === 0) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/students/list`);
        if (res.ok) {
          const json = await res.json();
          const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          setStudents(
            rows.map((r: any) => ({
              id: r.id,
              nim: r.nim,
              name: r.name,
              studyProgram: r.studyProgram,
              currentSemester: r.currentSemester || 1,
            })),
          );
        }
      } catch {
        showToast('Gagal memuat daftar mahasiswa.', false);
      }
    }
  };

  const selectedStudent = students.find((x) => x.nim === form.nim);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToast('Pilih mahasiswa terlebih dahulu.', false);
      return;
    }
    if (form.amount <= 0) {
      showToast('Nominal tagihan harus lebih dari 0.', false);
      return;
    }
    const comp = components.find((c) => c.id === form.type);
    const paymentType = form.type === CUSTOM_TYPE ? form.customType.trim() : comp?.name || '';
    if (!paymentType) {
      showToast('Pilih jenis tagihan.', false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: selectedStudent.nim,
          studentName: selectedStudent.name,
          studyProgram: selectedStudent.studyProgram,
          semester: Number(form.semester),
          paymentType,
          amount: form.amount,
          notes: form.notes,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(Array.isArray(json?.message) ? json.message.join(', ') : json?.message || 'Gagal menerbitkan tagihan.');
      const invoiceNo = json?.data?.data?.invoiceNo ?? json?.data?.invoiceNo ?? '';
      showToast(`Tagihan ${invoiceNo} untuk ${selectedStudent.name} berhasil diterbitkan.`.replace('  ', ' '));
      setCreateOpen(false);
      await fetchInvoices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menerbitkan tagihan.', false);
    } finally {
      setSaving(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions`);
      if (res.ok) {
        const json = await res.json();
        const trxs = json.data?.transactions;
        if (Array.isArray(trxs)) {
          setInvoices(trxs);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat daftar tagihan dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filtered = invoices.filter((d) => {
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'LUNAS' && d.status === 'LUNAS') ||
      (filter === 'MENUNGGU' && (d.status === 'MENUNGGU VERIFIKASI' || (d.status as string) === 'MENUNGGU_VERIFIKASI')) ||
      (filter === 'TERTUNDA' && d.status === 'TERTUNDA');

    const matchSearch =
      d.nim.includes(search) ||
      d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      d.studyProgram.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
                Manajemen Tagihan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Daftar Tagihan Mahasiswa</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Kelola tagihan SPP/UKT seluruh mahasiswa aktif secara terintegrasi
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <p className="text-xs text-blue-200">Total Tagihan Terbit</p>
            <p className="text-xl font-black text-white">{invoices.length} Tagihan</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari NIM, nama, no invoice..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="ALL">Semua Status</option>
                <option value="LUNAS">Lunas</option>
                <option value="MENUNGGU">Menunggu Verifikasi</option>
                <option value="TERTUNDA">Tertunda / Belum Bayar</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchInvoices}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Tagihan
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Ekspor
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['No Invoice', 'NIM', 'Nama Mahasiswa', 'Prodi', 'Sem', 'Jenis Tagihan', 'Jumlah', 'Jatuh Tempo', 'Status'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-slate-500 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Memuat data tagihan perkuliahan...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada tagihan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.invoiceNo}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{d.nim}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{d.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{d.studyProgram}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{d.semester}</td>
                      <td className="px-4 py-3 text-slate-600">{d.paymentType}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{formatRp(d.amount)}</td>
                      <td className="px-4 py-3 text-slate-500">{d.dueDate || '20 Sep 2026'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : d.status === 'MENUNGGU VERIFIKASI' || (d.status as string) === 'MENUNGGU_VERIFIKASI'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {(d.status as string) === 'MENUNGGU_VERIFIKASI' || d.status === 'MENUNGGU VERIFIKASI'
                            ? 'MENUNGGU VERIFIKASI'
                            : d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Buat Tagihan Mahasiswa">
        <form onSubmit={submitCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Mahasiswa *</label>
            <SearchableSelect
              value={form.nim}
              onChange={(nim) => {
                const st = students.find((x) => x.nim === nim);
                setForm({ ...form, nim, semester: st?.currentSemester ?? form.semester });
              }}
              options={students.map((x) => ({ value: x.nim, label: `${x.nim} - ${x.name}`, keywords: x.studyProgram }))}
              placeholder={students.length === 0 ? 'Belum ada data mahasiswa' : 'Cari NIM atau nama mahasiswa...'}
              searchPlaceholder="Ketik NIM atau nama..."
            />
            {selectedStudent && <p className="mt-1 text-[11px] text-slate-500">{selectedStudent.studyProgram}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Jenis Tagihan</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const c = components.find((x) => x.id === e.target.value);
                  setForm({ ...form, type: e.target.value, amount: c ? c.defaultAmount : form.amount });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
              >
                <option value="">-- Pilih komponen biaya --</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={CUSTOM_TYPE}>Lainnya (isi sendiri)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Semester</label>
              <input
                type="number"
                min={1}
                max={14}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
              />
            </div>
          </div>

          {form.type === CUSTOM_TYPE && (
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Tagihan *</label>
              <input
                value={form.customType}
                onChange={(e) => setForm({ ...form, customType: e.target.value })}
                placeholder="Contoh: Denda keterlambatan KRS"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Nominal *</label>
            <RupiahInput
              required
              value={form.amount}
              onChange={(n) => setForm({ ...form, amount: n })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
            />
            {(() => {
              const c = components.find((x) => x.id === form.type);
              return c ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Tarif dasar komponen ini: Rp {c.defaultAmount.toLocaleString('id-ID')} ({CATEGORY_LABEL[c.category] || c.category}). Nominal bisa disesuaikan.
                </p>
              ) : null;
            })()}
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Catatan / Keterangan</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan untuk mahasiswa..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
            />
          </div>

          <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
            Nomor invoice dibuat otomatis dan tagihan langsung muncul di akun mahasiswa.
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl disabled:opacity-60 cursor-pointer">
              {saving ? 'Menerbitkan...' : 'Terbitkan Tagihan'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] max-w-sm px-4 py-3 rounded-xl text-sm font-semibold shadow-lg text-white ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.text}
        </div>
      )}
    </PortalLayout>
  );
}
