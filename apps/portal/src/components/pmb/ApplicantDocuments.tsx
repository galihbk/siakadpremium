'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

const DOCS: Array<{ key: string; label: string }> = [
  { key: 'fileFoto', label: 'Pas Foto' },
  { key: 'fileKtp', label: 'KTP' },
  { key: 'fileKk', label: 'Kartu Keluarga' },
  { key: 'fileIjazah', label: 'Ijazah / SKL' },
  { key: 'fileKip', label: 'KIP-Kuliah' },
  { key: 'fileTambahan', label: 'Berkas Tambahan' },
];

function isPdf(url: string) {
  if (url.startsWith('data:application/pdf')) return true;
  try {
    return /\.pdf(\?|$)/i.test(decodeURIComponent(url).split('&expires')[0]);
  } catch {
    return false;
  }
}

/**
 * Tombol untuk membuka berkas yang diunggah pendaftar (pas foto, KTP, KK, ijazah, KIP, tambahan) langsung dari halaman panitia.
 * `flags` (dari daftar pendaftar) menandai berkas yang ada; tautan segar baru diambil saat berkas dibuka.
 */
export function ApplicantDocuments({ applicantId, flags }: { applicantId: string; flags?: Record<string, boolean> }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);

  const open = async (key: string, label: string) => {
    setError(null);
    setLoadingKey(key);
    try {
      const res = await fetch(`${getApiBaseUrl()}/admissions/applicants/${applicantId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal mengambil berkas dari server.');
      const json = await res.json();
      const detail = json.data ?? json;
      const url: string | null = detail?.documents?.[key] ?? null;
      if (!url) throw new Error(`${label} belum diunggah.`);
      setPreview({ title: label, url });
    } catch (err: any) {
      setError(err?.message || 'Berkas tidak dapat dibuka.');
    } finally {
      setLoadingKey(null);
    }
  };

  // Belum satu pun berkas dikirim pendaftar: beri tahu panitia (jangan menampilkan deretan tombol kosong)
  if (flags && !DOCS.some((d) => flags[d.key])) {
    return (
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
        <FileText className="w-3 h-3" /> Pendaftar belum mengirimkan berkas.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {DOCS.map((d) => {
          const exists = flags ? !!flags[d.key] : true;
          if (!exists) {
            if (d.key === 'fileKip' || d.key === 'fileTambahan') return null; // berkas opsional: tak perlu ditampilkan bila tidak ada
            return (
              <span key={d.key} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-dashed border-slate-200">
                <FileText className="w-3 h-3" /> {d.label} (belum ada)
              </span>
            );
          }
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => open(d.key, d.label)}
              disabled={loadingKey === d.key}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200 hover:bg-blue-100 font-semibold cursor-pointer disabled:opacity-60"
              title={`Lihat ${d.label}`}
            >
              {loadingKey === d.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} {d.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}

      {preview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4" onClick={() => setPreview(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">{preview.title}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Buka Tab Baru
                  </a>
                  <button onClick={() => setPreview(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Tutup">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                {isPdf(preview.url) ? (
                  <iframe src={preview.url} title={preview.title} className="w-full h-[70vh] rounded-lg border-0" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt={preview.title} className="max-h-[70vh] w-auto object-contain rounded-lg" />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
