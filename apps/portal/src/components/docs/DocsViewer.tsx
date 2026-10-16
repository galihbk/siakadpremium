'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Check, Copy, Info, Lightbulb, Printer, Search } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { DOCS_ENABLED } from '@/lib/features';

type PortalRole = React.ComponentProps<typeof PortalLayout>['role'];
import type { DocBlock, DocSection } from '@/lib/docs/types';

const NOTE_STYLE = {
  info: { box: 'bg-blue-50 border-blue-200 text-blue-900', icon: Info, label: 'Catatan' },
  warn: { box: 'bg-amber-50 border-amber-200 text-amber-900', icon: AlertTriangle, label: 'Perhatian' },
  tip: { box: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: Lightbulb, label: 'Tips' },
} as const;

function CodeBlock({ text, lang }: { text: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia */
    }
  };
  return (
    <div className="relative group rounded-xl bg-slate-900 text-slate-100 overflow-hidden print:bg-slate-100 print:text-slate-900">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800 text-[10px] uppercase tracking-wider text-slate-400 print:hidden">
        <span>{lang ?? 'teks'}</span>
        <button onClick={copy} className="inline-flex items-center gap-1 hover:text-white cursor-pointer">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <pre className="p-4 text-xs leading-relaxed overflow-x-auto font-mono whitespace-pre">{text}</pre>
    </div>
  );
}

function Block({ b }: { b: DocBlock }) {
  switch (b.t) {
    case 'p':
      return <p className="text-sm text-slate-700 leading-relaxed">{b.text}</p>;
    case 'h3':
      return <h3 className="text-sm font-extrabold text-[#1E3A8A] pt-2">{b.text}</h3>;
    case 'ul':
      return (
        <ul className="space-y-1.5 text-sm text-slate-700 leading-relaxed">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#D4A017] shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="space-y-2 text-sm text-slate-700 leading-relaxed">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {b.head.map((h) => (
                  <th key={h} className="py-2.5 px-3 font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {b.rows.map((r, i) => (
                <tr key={i} className="align-top">
                  {r.map((c, j) => (
                    <td key={j} className={`py-2.5 px-3 leading-relaxed ${j === 0 ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'note': {
      const s = NOTE_STYLE[b.kind];
      return (
        <div className={`flex gap-3 rounded-xl border p-4 text-sm ${s.box}`}>
          <s.icon className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-bold">{b.title ?? s.label}</p>
            <p className="mt-0.5">{b.text}</p>
          </div>
        </div>
      );
    }
    case 'code':
      return <CodeBlock text={b.text} lang={b.lang} />;
  }
}

/** Teks polos satu bagian, untuk pencarian. */
function plain(sec: DocSection): string {
  const parts: string[] = [sec.title, sec.summary];
  for (const b of sec.blocks) {
    if (b.t === 'p' || b.t === 'h3' || b.t === 'code') parts.push(b.text);
    else if (b.t === 'note') parts.push(b.title ?? '', b.text);
    else if (b.t === 'ul' || b.t === 'ol') parts.push(...b.items);
    else if (b.t === 'table') parts.push(...b.head, ...b.rows.flat());
  }
  return parts.join(' ').toLowerCase();
}

interface DocsViewerProps {
  docs: DocSection[];
  role: PortalRole;
  title: string;
  subtitle: string;
  version: string;
  userName?: string;
  userIdText?: string;
}

/** Penampil dokumentasi (daftar isi tetap + pencarian + cetak) yang dipakai semua peran. */
export function DocsViewer({ docs, role, title, subtitle, version, userName = '', userIdText = '' }: DocsViewerProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(docs[0]?.id ?? '');
  // Konten dan daftar isi punya area gulir sendiri (lihat catatan layout di bawah).
  const contentRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => (q ? docs.filter((s) => plain(s).includes(q)) : docs), [q, docs]);
  const groups = useMemo(() => {
    const map = new Map<string, DocSection[]>();
    for (const s of sections) map.set(s.group, [...(map.get(s.group) ?? []), s]);
    return Array.from(map.entries());
  }, [sections]);

  // Tandai bagian yang sedang terlihat pada daftar isi.
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root: window.matchMedia('(min-width: 1024px)').matches ? contentRef.current : null, rootMargin: '0px 0px -70% 0px' },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  if (!DOCS_ENABLED) {
    return (
      <PortalLayout role={role} userName={userName} userIdText={userIdText}>
        <div className="max-w-xl mx-auto mt-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h1 className="text-lg font-black text-slate-800">Dokumentasi belum tersedia</h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Halaman ini ditutup sementara selama sistem berjalan dalam mode demo.
          </p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout role={role} userName={userName} userIdText={userIdText}>
      {/*
        Layout: PortalLayout membungkus halaman dalam <main overflow-auto>, sehingga `position: sticky`
        tidak pernah menempel (main bukan elemen yang digulir). Maka di layar lebar halaman ini diberi
        tinggi tetap sebesar sisa layar, dan daftar isi + konten masing-masing punya gulir sendiri --
        daftar isi otomatis selalu terlihat.
      */}
      <div className="space-y-6 pb-6 lg:pb-0 lg:space-y-0 lg:gap-5 lg:flex lg:flex-col lg:h-[calc(100vh-8.5rem)] print:h-auto">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-5 sm:p-6 text-white shadow-sm print:hidden lg:shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h1>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  {subtitle} Versi {version}.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak / PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[17rem_1fr] gap-6 items-start lg:flex-1 lg:min-h-0 print:block">
          {/* Daftar isi */}
          <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 print:hidden lg:h-full lg:flex lg:flex-col lg:min-h-0">
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari dokumentasi..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <nav className="space-y-4 max-h-[50vh] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto pr-1">
              {groups.length === 0 && <p className="text-xs text-slate-400">Tidak ada hasil.</p>}
              {groups.map(([group, items]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{group}</p>
                  <ul className="space-y-0.5">
                    {items.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            active === s.id ? 'bg-[#1E3A8A] text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Isi */}
          <div ref={contentRef} className="space-y-6 min-w-0 lg:h-full lg:overflow-y-auto lg:pr-2 print:h-auto print:overflow-visible">
            {q && (
              <p className="text-xs text-slate-500 print:hidden">
                {sections.length} bagian cocok dengan &ldquo;{query}&rdquo;.
              </p>
            )}
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 scroll-mt-2 break-inside-avoid-page">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#B45309]">{s.group}</p>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">{s.title}</h2>
                <p className="text-sm text-slate-500 mt-1 mb-5">{s.summary}</p>
                <div className="space-y-4">
                  {s.blocks.map((b, i) => (
                    <Block key={i} b={b} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
