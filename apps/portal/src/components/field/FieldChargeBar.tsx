'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FieldCategory, fieldFetch, formatRupiah } from '@/lib/fieldActivity';
import { CheckCircle2, AlertTriangle, Receipt, X } from 'lucide-react';

interface Summary {
  feeAmount: number;
  feeLabel: string;
  notBilled: number;
  unpaid: number;
  verifying: number;
  paid: number;
}

/** Ringkasan biaya khusus satu jenis + tombol menerbitkan tagihan bagi yang berhak ditagih tetapi belum punya tagihan. */
export function FieldChargeBar({ category }: { category: FieldCategory }) {
  const [s, setS] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    fieldFetch<Summary>(`/admin/charges?categoryId=${category.id}`)
      .then(setS)
      .catch(() => setS(null));
  }, [category.id]);

  useEffect(() => {
    load();
    window.addEventListener('siakad:thesis-updated', load);
    return () => window.removeEventListener('siakad:thesis-updated', load);
  }, [load]);

  const issue = async () => {
    setBusy(true);
    try {
      const r = await fieldFetch<{ message: string }>('/admin/charges/issue', { method: 'POST', body: { categoryId: category.id } });
      setToast({ ok: true, text: r.message });
      load();
      window.dispatchEvent(new Event('siakad:thesis-updated'));
    } catch (err) {
      setToast({ ok: false, text: err instanceof Error ? err.message : 'Gagal menerbitkan tagihan.' });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 4500);
    }
  };

  if (!s || s.feeAmount <= 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'}`}>
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="max-w-sm">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <span className="inline-flex items-center gap-2 font-bold text-amber-900">
        <Receipt className="w-4 h-4" /> {s.feeLabel}: {formatRupiah(s.feeAmount)}
      </span>
      <span className="text-slate-700">
        <b>{s.paid}</b> lunas &bull; <b>{s.verifying}</b> menunggu verifikasi &bull; <b>{s.unpaid}</b> belum bayar &bull; <b>{s.notBilled}</b> belum ditagih
      </span>
      <span className="text-slate-500">
        Tagihan terbit otomatis saat mata kuliahnya masuk KRS mahasiswa. Pembimbing dan kelompok baru dapat ditetapkan setelah lunas (diverifikasi Biro Keuangan).
      </span>
      {s.notBilled > 0 && (
        <button
          onClick={issue}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold rounded-xl cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5" /> {busy ? 'Menerbitkan...' : `Terbitkan ${s.notBilled} Tagihan`}
        </button>
      )}
    </div>
  );
}
