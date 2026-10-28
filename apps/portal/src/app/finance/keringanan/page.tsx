'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  RELIEF_STATUS_LABEL,
  RELIEF_TYPE_LABEL,
  ReliefQueueItem,
  ReliefStatus,
  formatDay,
  formatRp,
  reliefFetch,
  reliefStatusTone,
  toDateInput,
} from '@/lib/relief';
import { AlertTriangle, Check, CheckCircle2, FileText, HandCoins, RefreshCw, Search, X } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

export default function FinanceKeringananPage() {
  const [status, setStatus] = useState<'' | ReliefStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ReliefQueueItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [active, setActive] = useState<ReliefQueueItem | null>(null);
  const [form, setForm] = useState({ approvedAmount: '', approvedDueDate: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const r = await reliefFetch<{ counts: Record<string, number>; items: ReliefQueueItem[] }>(`?${params}`);
      setItems(r.items);
      setCounts(r.counts);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat pengajuan keringanan.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (r: ReliefQueueItem) => {
    setActive(r);
    setFormError(null);
    setForm({
      approvedAmount: r.type === 'POTONGAN' ? String(r.requestedAmount ?? '') : '',
      approvedDueDate: r.type === 'PENUNDAAN' ? toDateInput(r.requestedDueDate) : '',
      note: r.status === 'PENDING' ? '' : r.financeNote ?? '',
    });
  };

  const decide = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!active) return;
    setBusy(true);
    setFormError(null);
    try {
      const r = await reliefFetch<{ message: string }>(`/${active.id}/decision`, {
        method: 'POST',
        body: {
          decision,
          note: form.note,
          approvedAmount: active.type === 'POTONGAN' && form.approvedAmount ? Number(form.approvedAmount) : undefined,
          approvedDueDate: active.type === 'PENUNDAAN' && form.approvedDueDate ? form.approvedDueDate : undefined,
        },
      });
      notify(true, r.message);
      setActive(null);
      await load();
      window.dispatchEvent(new Event('siakad:relief-updated'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal memproses pengajuan.');
    } finally {
      setBusy(false);
    }
  };

  const pending = active?.status === 'PENDING';
  const invoiceNow = active?.invoice;
  const approvedAmountNum = Number(form.approvedAmount) || 0;

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        {toast && (
          <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'}`}>
            {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="max-w-sm">{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-white/10 text-[#D4A017] mb-2">
            <HandCoins className="w-3.5 h-3.5" />
            Keringanan Pembayaran
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Pengajuan Keringanan dari Mahasiswa</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-3xl">
            Tinjau pengajuan potongan, pembebasan, atau penundaan jatuh tempo. Setelah disetujui, tagihan mahasiswa otomatis menyesuaikan.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap gap-2">
              {([['PENDING', 'Menunggu'], ['APPROVED', 'Disetujui'], ['REJECTED', 'Ditolak'], ['CANCELLED', 'Dibatalkan'], ['', 'Semua']] as const).map(([k, label]) => (
                <button
                  key={k || 'all'}
                  onClick={() => setStatus(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${status === k ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {label} ({k ? counts[k] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0)})
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIM, atau nomor tagihan..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]" />
              </div>
              <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Mahasiswa</th>
                  <th className="px-4 py-3 text-left font-semibold">Tagihan</th>
                  <th className="px-4 py-3 text-left font-semibold">Pengajuan</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada pengajuan untuk filter ini.
                    </td>
                  </tr>
                )}
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 block">{r.studentName}</span>
                      <span className="text-[11px] font-mono text-slate-500">{r.nim} &bull; {r.studyProgram}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 block">{r.invoice?.paymentType}</span>
                      <span className="text-[11px] font-mono text-slate-400">{r.invoice?.invoiceNo}</span>
                      <span className="block text-[11px] text-slate-500">{formatRp(r.invoiceAmountAtRequest)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 block">{RELIEF_TYPE_LABEL[r.type]}</span>
                      <span className="text-[11px] text-slate-500">
                        {r.type === 'POTONGAN' && r.requestedAmount ? `Minta potongan ${formatRp(r.requestedAmount)}` : ''}
                        {r.type === 'PENUNDAAN' ? `Minta sampai ${formatDay(r.requestedDueDate)}` : ''}
                        {r.type === 'PEMBEBASAN' ? 'Minta dibebaskan seluruhnya' : ''}
                      </span>
                      <span className="block text-[11px] text-slate-400">{formatDay(r.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${reliefStatusTone(r.status)}`}>{RELIEF_STATUS_LABEL[r.status]}</span>
                      {r.decidedByName && r.status !== 'PENDING' && <span className="block text-[11px] text-slate-400 mt-1">oleh {r.decidedByName}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => open(r)} className="px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-[11px] cursor-pointer">
                        {r.status === 'PENDING' ? 'Tinjau' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={!!active} onClose={() => setActive(null)} title={pending ? 'Tinjau Pengajuan Keringanan' : 'Pengajuan Keringanan'} subtitle={active ? `${active.studentName} (${active.nim})` : undefined} maxWidth="2xl">
          {active && (
            <div className="space-y-4 text-xs">
              {formError && <p className="font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase">Tagihan</dt>
                  <dd className="text-slate-800">{invoiceNow?.paymentType}</dd>
                  <dd className="font-mono text-[11px] text-slate-400">{invoiceNow?.invoiceNo}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase">Nominal & jatuh tempo saat diajukan</dt>
                  <dd className="text-slate-800 font-semibold">{formatRp(active.invoiceAmountAtRequest)}</dd>
                  <dd className="text-[11px] text-slate-500">Jatuh tempo {active.invoiceDueDateAtRequest ?? '-'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase">Jenis keringanan</dt>
                  <dd className="text-slate-800 font-semibold">{RELIEF_TYPE_LABEL[active.type]}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-500 uppercase">Yang diminta</dt>
                  <dd className="text-slate-800">
                    {active.type === 'POTONGAN' && active.requestedAmount ? formatRp(active.requestedAmount) : ''}
                    {active.type === 'PENUNDAAN' ? `Jatuh tempo ${formatDay(active.requestedDueDate)}` : ''}
                    {active.type === 'PEMBEBASAN' ? 'Dibebaskan seluruhnya' : ''}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-bold text-slate-500 uppercase">Alasan mahasiswa</dt>
                  <dd className="text-slate-800 whitespace-pre-line">{active.reason}</dd>
                </div>
                {active.attachmentUrl && (
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-bold text-slate-500 uppercase">Berkas pendukung</dt>
                    <dd>
                      <a href={active.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-[#1E3A8A] hover:underline">
                        <FileText className="w-3.5 h-3.5" /> Buka berkas
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {pending ? (
                <div className="space-y-3">
                  {active.type === 'POTONGAN' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nominal potongan yang disetujui (Rp)</label>
                      <input type="number" min={1} value={form.approvedAmount} onChange={(e) => setForm({ ...form, approvedAmount: e.target.value })} className={inputCls} />
                      {approvedAmountNum > 0 && invoiceNow && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Tagihan sekarang {formatRp(invoiceNow.amount)} menjadi <b>{formatRp(Math.max(0, invoiceNow.amount - approvedAmountNum))}</b>
                          {approvedAmountNum >= invoiceNow.amount ? ' (lunas, dibebaskan)' : ''}.
                        </p>
                      )}
                    </div>
                  )}
                  {active.type === 'PEMBEBASAN' && invoiceNow && (
                    <p className="rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 px-3 py-2">
                      Bila disetujui, tagihan {formatRp(invoiceNow.amount)} dibebaskan seluruhnya dan langsung dinyatakan lunas.
                    </p>
                  )}
                  {active.type === 'PENUNDAAN' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jatuh tempo baru yang disetujui</label>
                      <input type="date" value={form.approvedDueDate} onChange={(e) => setForm({ ...form, approvedDueDate: e.target.value })} className={inputCls} />
                    </div>
                  )}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan untuk mahasiswa</label>
                    <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="Wajib diisi bila menolak." />
                  </div>
                  <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => decide('REJECTED')} disabled={busy} className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 cursor-pointer">
                      Tolak
                    </button>
                    <button type="button" onClick={() => decide('APPROVED')} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 cursor-pointer">
                      <Check className="w-3.5 h-3.5" /> Setujui
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <p>
                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${reliefStatusTone(active.status)}`}>{RELIEF_STATUS_LABEL[active.status]}</span>{' '}
                    <span className="text-slate-500">{formatDay(active.decidedAt)} {active.decidedByName ? `oleh ${active.decidedByName}` : ''}</span>
                  </p>
                  {active.status === 'APPROVED' && active.approvedAmount ? <p className="text-slate-700">Potongan disetujui: <b>{formatRp(active.approvedAmount)}</b></p> : null}
                  {active.status === 'APPROVED' && active.approvedDueDate ? <p className="text-slate-700">Jatuh tempo baru: <b>{formatDay(active.approvedDueDate)}</b></p> : null}
                  {active.financeNote && <p className="text-slate-600">Catatan: {active.financeNote}</p>}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </PortalLayout>
  );
}
