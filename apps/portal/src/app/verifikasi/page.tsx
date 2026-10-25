'use client';

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface VerifyResult {
  valid: boolean;
  campus?: string;
  documentType?: string;
  number?: string | null;
  holder?: string;
  identifier?: string | null;
  issuedAt?: string | null;
  message?: string;
}

/** Halaman publik: hasil pemindaian QR pada surat, KTM, dan kartu PMB. Tanpa login, data minimum. */
export default function VerifikasiPage() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const type = q.get('type') || '';
    const code = q.get('code') || '';
    fetch(`${getApiBaseUrl()}/verify?type=${encodeURIComponent(type)}&code=${encodeURIComponent(code)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setResult((j?.data ?? j) as VerifyResult))
      .catch(() => setError('Tidak dapat menghubungi server validasi. Coba lagi beberapa saat.'));
  }, []);

  const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#1E3A8A] text-white px-6 py-4">
          <p className="text-[11px] uppercase tracking-widest text-blue-200 font-bold">Validasi Dokumen</p>
          <p className="text-base font-extrabold">{result?.campus || 'SIAKAD'}</p>
        </div>
        <div className="p-6 space-y-4">
          {!result && !error && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Memeriksa dokumen...
            </p>
          )}
          {error && <p className="text-sm text-rose-700">{error}</p>}
          {result && (
            <>
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${result.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                {result.valid ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-600 shrink-0" />}
                <div>
                  <p className={`font-extrabold text-sm ${result.valid ? 'text-emerald-800' : 'text-rose-800'}`}>{result.valid ? 'Dokumen VALID' : 'Dokumen TIDAK VALID'}</p>
                  <p className={`text-xs mt-0.5 ${result.valid ? 'text-emerald-700' : 'text-rose-700'}`}>{result.message}</p>
                </div>
              </div>
              {result.documentType && (
                <dl className="text-sm divide-y divide-slate-100">
                  {[
                    ['Jenis dokumen', result.documentType],
                    ['Nomor', result.number || '-'],
                    ['Atas nama', result.holder || '-'],
                    ['Keterangan', result.identifier || '-'],
                    ['Tanggal terbit', fmtDate(result.issuedAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-semibold text-slate-900 text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="text-[11px] text-slate-400">Demi privasi, nama dan nomor induk ditampilkan sebagian. Cocokkan dengan dokumen fisik yang Anda terima.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
