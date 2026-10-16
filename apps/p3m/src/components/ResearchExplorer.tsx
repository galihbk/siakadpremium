'use client';

import React, { useMemo, useState } from 'react';
import { FlaskConical, HeartHandshake, Search, Users } from 'lucide-react';
import type { PublicResearch } from '@/lib/data';

export function ResearchExplorer({ items, years }: { items: PublicResearch[]; years: number[] }) {
  const [type, setType] = useState<'Semua' | 'Penelitian' | 'Pengabdian'>('Semua');
  const [year, setYear] = useState<number | 'Semua'>('Semua');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (r) =>
        (type === 'Semua' || r.type === type) &&
        (year === 'Semua' || r.year === year) &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.leader.toLowerCase().includes(q) ||
          r.focusArea.toLowerCase().includes(q) ||
          r.faculty.toLowerCase().includes(q)),
    );
  }, [items, type, year, query]);

  const pill = (active: boolean) =>
    `px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
      active ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1E3A8A]'
    }`;

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul, peneliti, bidang fokus, atau fakultas..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Semua', 'Penelitian', 'Pengabdian'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={pill(type === t)}>
              {t}
            </button>
          ))}
          <select
            value={String(year)}
            onChange={(e) => setYear(e.target.value === 'Semua' ? 'Semua' : Number(e.target.value))}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="Semua">Semua tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-200 rounded-2xl bg-white">
          {items.length === 0 ? 'Belum ada kegiatan yang dipublikasikan.' : 'Tidak ada kegiatan yang cocok dengan pencarian.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <article key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    r.type === 'Penelitian' ? 'bg-blue-50 text-[#1E3A8A]' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {r.type === 'Penelitian' ? <FlaskConical className="w-3 h-3" /> : <HeartHandshake className="w-3 h-3" />}
                  {r.type}
                </span>
                <span className="text-[11px] text-slate-400">{r.year}</span>
                <span className="text-[11px] text-slate-400 truncate">· {r.scheme}</span>
              </div>
              <h3 className="font-bold text-slate-900 leading-snug">{r.title}</h3>
              <p className="text-xs text-[#B45309] font-semibold mt-1.5">{r.focusArea}</p>
              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {r.leader} · {r.membersCount} anggota
                </p>
                <p>
                  {r.faculty}
                  {r.studyProgram ? ` · ${r.studyProgram}` : ''}
                </p>
                {r.mitraSasaran && <p>Mitra/sasaran: {r.mitraSasaran}</p>}
                {r.targetOutput && <p>Luaran: {r.targetOutput}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
