'use client';

import React, { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type DialogType = 'danger' | 'warning' | 'info' | 'success' | 'error';

interface BaseOpts {
  title?: string;
  confirmText?: string;
}

type DialogRequest =
  | ({ kind: 'confirm'; message: string; type?: DialogType; resolve: (ok: boolean) => void } & BaseOpts)
  | ({ kind: 'alert'; message: string; type?: DialogType; resolve: () => void } & BaseOpts)
  | ({ kind: 'prompt'; message: string; defaultValue?: string; resolve: (value: string | null) => void } & BaseOpts);

let listener: ((req: DialogRequest) => void) | null = null;

/**
 * Pengganti `window.confirm`: menampilkan modal konfirmasi aplikasi dan mengembalikan Promise<boolean>.
 * Pakai: `if (!(await confirmDialog('Hapus data ini?'))) return;`
 * Jenis (merah "Hapus" / kuning "Ya, Lanjutkan") ditebak dari kata "hapus" pada pesan, bisa diatur lewat opts.
 */
export function confirmDialog(
  message: string,
  opts: BaseOpts & { type?: DialogType } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
      return;
    }
    listener({ kind: 'confirm', message, resolve, ...opts });
  });
}

/**
 * Pengganti `window.alert`: modal pemberitahuan dengan satu tombol. Jenis dan judul ditebak dari pesan
 * (mengandung "gagal" = galat, selain itu = peringatan), bisa diatur lewat opts.
 * Pakai: `void alertDialog('Nama wajib diisi.')` atau `await alertDialog(...)` bila perlu menunggu ditutup.
 */
export function alertDialog(message: string, opts: BaseOpts & { type?: DialogType } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!listener) {
      if (typeof window !== 'undefined') window.alert(message);
      resolve();
      return;
    }
    listener({ kind: 'alert', message, resolve, ...opts });
  });
}

/** Pengganti `window.prompt`: modal dengan satu kolom isian. Mengembalikan teks, atau null bila dibatalkan. */
export function promptDialog(message: string, opts: BaseOpts & { defaultValue?: string } = {}): Promise<string | null> {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(typeof window !== 'undefined' ? window.prompt(message, opts.defaultValue ?? '') : null);
      return;
    }
    listener({ kind: 'prompt', message, resolve, ...opts });
  });
}

const ALERT_TITLE: Record<DialogType, string> = {
  error: 'Terjadi Kesalahan',
  warning: 'Perhatian',
  success: 'Berhasil',
  info: 'Informasi',
  danger: 'Perhatian',
};

/** Dipasang sekali di layout; menampung antrean dialog dari `confirmDialog`, `alertDialog`, dan `promptDialog`. */
export function ConfirmHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const req = queue[0] ?? null;

  useEffect(() => {
    listener = (r) => setQueue((q) => [...q, r]);
    return () => {
      listener = null;
    };
  }, []);

  // Isian prompt dimulai dari nilai bawaan setiap kali dialog prompt baru tampil
  useEffect(() => {
    if (req?.kind === 'prompt') setPromptValue(req.defaultValue ?? '');
  }, [req]);

  const finish = (result?: boolean | string | null) => {
    if (!req) return;
    if (req.kind === 'confirm') req.resolve(!!result);
    else if (req.kind === 'prompt') req.resolve(typeof result === 'string' ? result : null);
    else req.resolve();
    setQueue((q) => q.slice(1));
  };

  if (!req) return null;

  if (req.kind === 'alert') {
    const type: DialogType = req.type ?? (/\b(gagal|galat|error)\b/i.test(req.message) ? 'error' : 'warning');
    return (
      <ConfirmModal
        isOpen
        isAlert
        onClose={() => finish()}
        onConfirm={() => finish()}
        title={req.title ?? ALERT_TITLE[type]}
        message={<span className="whitespace-pre-line">{req.message}</span>}
        confirmText={req.confirmText}
        type={type}
      />
    );
  }

  if (req.kind === 'prompt') {
    return (
      <ConfirmModal
        isOpen
        onClose={() => finish(null)}
        onConfirm={() => finish(promptValue)}
        title={req.title ?? 'Masukkan Data'}
        message={
          <div className="space-y-2">
            <p className="whitespace-pre-line">{req.message}</p>
            <input
              autoFocus
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finish(promptValue);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>
        }
        confirmText={req.confirmText ?? 'Simpan'}
        type="info"
      />
    );
  }

  const isDelete = /\b(hapus|menghapus)\b/i.test(req.message);
  const type = req.type ?? (isDelete ? 'danger' : 'warning');

  return (
    <ConfirmModal
      isOpen
      onClose={() => finish(false)}
      onConfirm={() => finish(true)}
      title={req.title ?? (isDelete ? 'Konfirmasi Penghapusan' : 'Konfirmasi')}
      message={<span className="whitespace-pre-line">{req.message}</span>}
      confirmText={req.confirmText ?? (isDelete ? 'Hapus' : 'Ya, Lanjutkan')}
      type={type}
    />
  );
}
