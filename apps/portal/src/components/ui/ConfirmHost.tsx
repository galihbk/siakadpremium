'use client';

import React, { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface ConfirmRequest {
  message: string;
  title?: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  resolve: (ok: boolean) => void;
}

let listener: ((req: ConfirmRequest) => void) | null = null;

/**
 * Pengganti `window.confirm`: menampilkan modal konfirmasi aplikasi dan mengembalikan Promise<boolean>.
 * Pakai: `if (!(await confirmDialog('Hapus data ini?'))) return;`
 * Jenis (merah "Hapus" / kuning "Ya, Lanjutkan") ditebak dari kata "hapus" pada pesan, bisa diatur lewat opts.
 */
export function confirmDialog(
  message: string,
  opts: { title?: string; confirmText?: string; type?: ConfirmRequest['type'] } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
      return;
    }
    listener({ message, resolve, ...opts });
  });
}

/** Dipasang sekali di layout; menampung antrean permintaan konfirmasi dari `confirmDialog`. */
export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    listener = (r) => setReq(r);
    return () => {
      listener = null;
    };
  }, []);

  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };

  const isDelete = !!req && /\b(hapus|menghapus)\b/i.test(req.message);
  const type = req?.type ?? (isDelete ? 'danger' : 'warning');

  return (
    <ConfirmModal
      isOpen={!!req}
      onClose={() => close(false)}
      onConfirm={() => close(true)}
      title={req?.title ?? (isDelete ? 'Konfirmasi Penghapusan' : 'Konfirmasi')}
      message={<span className="whitespace-pre-line">{req?.message}</span>}
      confirmText={req?.confirmText ?? (isDelete ? 'Hapus' : 'Ya, Lanjutkan')}
      type={type}
    />
  );
}
