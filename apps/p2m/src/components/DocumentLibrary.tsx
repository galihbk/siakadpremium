'use client';

import React, { useMemo, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import type { PublicDocument } from '@/lib/data';

export function DocumentLibrary({ documents }: { documents: PublicDocument[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [counts, setCounts] = useState<Record<string, number>>({});

  const categories = useMemo(() => ['Semua', ...Array.from(new Set(documents.map((d) => d.category)))], [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter(
      (d) =>
        (category === 'Semua' || d.category === category) &&
        (!q || d.title.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q)),
    );
  }, [documents, query, category]);

  const download = async (d: PublicDocument) => {
    if (!d.fileUrl) return;
    // Hitung unduhan (best effort) lalu buka berkas.
    fetch(`${getApiBaseUrl()}/p2m/documents/${d.id}/download`, { method: 'POST' })
      .then((r) => r.json())
      .then((j) => {
        const n = (j?.data ?? j)?.downloadsCount;
        if (typeof n === 'number') setCounts((c) => ({ ...c, [d.id]: n }));
      })
      .catch(() => undefined);
    window.open(d.fileUrl, '_blank', 'noopener');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, kode, atau deskripsi dokumen..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                category === c ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1E3A8A]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-200 rounded-2xl">
          {documents.length === 0 ? 'Belum ada dokumen mutu yang dipublikasikan.' : 'Tidak ada dokumen yang cocok dengan pencarian.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[#B45309] uppercase tracking-wide">{d.category}</p>
                <h3 className="font-bold text-slate-900 leading-snug mt-0.5">{d.title}</h3>
                {d.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>}
                <p className="text-[11px] text-slate-400 mt-2">
                  <span className="font-mono">{d.code}</span> · {d.version} · {d.fileType} · {d.fileSize} · TA {d.academicYear}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-slate-400">{counts[d.id] ?? d.downloadsCount} unduhan</span>
                  {d.fileUrl ? (
                    <button
                      onClick={() => void download(d)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Berkas belum diunggah</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
