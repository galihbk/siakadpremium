'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, XCircle, X } from 'lucide-react';

interface AlertRequest {
  message: string;
  title?: string;
  type?: 'error' | 'warning';
  resolve: () => void;
}

let listener: ((req: AlertRequest) => void) | null = null;

/**
 * Pengganti `window.alert`: menampilkan modal pemberitahuan aplikasi. Jenis ditebak dari pesan
 * (mengandung "gagal" = galat, selain itu = peringatan), bisa diatur lewat opts.
 * Pakai: `void alertDialog('Pilih rekening bank kampus.')`.
 */
export function alertDialog(message: string, opts: { title?: string; type?: 'error' | 'warning' } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!listener) {
      if (typeof window !== 'undefined') window.alert(message);
      resolve();
      return;
    }
    listener({ message, resolve, ...opts });
  });
}

/** Dipasang sekali di layout; menampung antrean pemberitahuan dari `alertDialog`. */
export function AlertHost() {
  const [queue, setQueue] = useState<AlertRequest[]>([]);
  const [mounted, setMounted] = useState(false);
  const req = queue[0] ?? null;

  useEffect(() => {
    setMounted(true);
    listener = (r) => setQueue((q) => [...q, r]);
    return () => {
      listener = null;
    };
  }, []);

  const close = () => {
    req?.resolve();
    setQueue((q) => q.slice(1));
  };

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  if (!mounted || !req) return null;

  const type = req.type ?? (/\b(gagal|galat|error)\b/i.test(req.message) ? 'error' : 'warning');
  const isError = type === 'error';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5"
      >
        <button onClick={close} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
              isError ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            {isError ? <XCircle className="w-6 h-6 text-rose-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
          </div>
          <div className="flex-1 pt-1 space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {req.title ?? (isError ? 'Terjadi Kesalahan' : 'Perhatian')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{req.message}</p>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={close}
            autoFocus
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer ${
              isError ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#1E3A8A] hover:bg-[#172554]'
            }`}
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
