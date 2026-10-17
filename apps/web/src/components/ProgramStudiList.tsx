'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ChevronRight } from 'lucide-react';

export interface ProdiCard {
  code: string;
  name: string;
  faculty: string;
  level: string;
  accreditation: string;
  degreeTitle: string | null;
  students: number;
}

const LEVEL_LABEL: Record<string, string> = {
  D3: 'Diploma 3 (D3)',
  D4: 'Sarjana Terapan (D4)',
  S1: 'Sarjana (S1)',
  S2: 'Magister (S2)',
  S3: 'Doktor (S3)',
  PROFESI: 'Profesi',
};

export function ProgramStudiList({ items, failed }: { items: ProdiCard[]; failed: boolean }) {
  const levels = useMemo(() => Array.from(new Set(items.map((i) => i.level))), [items]);
  const [level, setLevel] = useState<string>('ALL');
  const filtered = level === 'ALL' ? items : items.filter((i) => i.level === level);

  return (
    <section id="prodi" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
              Pilihan Studi
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Program Studi</h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Seluruh program studi aktif beserta jenjang dan akreditasinya. Pilih satu untuk melihat visi, misi, dan kurikulumnya.
            </p>
          </div>

          {levels.length > 1 && (
            <div className="flex flex-wrap bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              {['ALL', ...levels].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    level === l ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l === 'ALL' ? 'Semua Program' : (LEVEL_LABEL[l] ?? l)}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-300 rounded-2xl bg-white">
            {failed ? 'Data program studi sementara tidak dapat dimuat.' : 'Belum ada program studi yang dipublikasikan.'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <Link
              key={item.code}
              href={`/program-studi/${item.code}`}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-[#1E3A8A]/40 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200/80">
                    Jenjang {item.level}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    <span>{item.accreditation}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-3">{item.faculty}</p>
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.degreeTitle ? `Gelar ${item.degreeTitle} · ` : ''}
                  {item.students.toLocaleString('id-ID')} mahasiswa
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1E3A8A]">
                <span>Kurikulum & Visi Misi</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
