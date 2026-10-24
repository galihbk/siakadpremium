'use client';

import React, { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Unggah satu berkas PDF (maks. 10 MB) ke penyimpanan privat; mengembalikan tautan berkas lewat onChange. */
export function FileUploadField({
  value,
  onChange,
  folder = 'documents',
  accept = 'application/pdf',
  hint = 'PDF, maksimal 10 MB',
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (file.size > MAX_BYTES) {
      setError(`Ukuran berkas ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas 10 MB.`);
      return;
    }
    if (accept === 'application/pdf' && file.type !== 'application/pdf') {
      setError('Berkas harus berformat PDF.');
      return;
    }
    setBusy(true);
    try {
      const { token } = getAuthSession();
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${getApiBaseUrl()}/storage/upload?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const json = await res.json().catch(() => null);
      const uploaded = json?.data?.data || json?.data;
      if (!res.ok || !uploaded?.url) throw new Error(json?.message || 'Gagal mengunggah berkas.');
      setName(file.name);
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah berkas.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-sm">
          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
          <a href={value} target="_blank" rel="noreferrer" className="flex-1 truncate text-emerald-800 font-semibold underline">
            {name || 'Berkas terunggah'}
          </a>
          <button type="button" disabled={disabled || busy} onClick={() => inputRef.current?.click()} className="text-xs font-bold text-[#1E3A8A] cursor-pointer">
            Ganti
          </button>
          <button type="button" disabled={disabled || busy} onClick={() => { setName(''); onChange(''); }} className="text-rose-600 cursor-pointer" title="Hapus berkas">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] text-sm font-semibold disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? 'Mengunggah...' : `Pilih berkas (${hint})`}
        </button>
      )}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
