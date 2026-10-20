'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Teks tampil saat nilai tersimpan belum ada di daftar pilihan (mis. daftar masih dimuat). */
  fallbackLabel?: string;
}

/** Pilihan (select) dengan kotak pencarian -- untuk daftar panjang seperti provinsi, kota, kecamatan, dan desa. */
export function SearchSelect({ value, options, onChange, placeholder = '-- Pilih --', searchPlaceholder = 'Cari…', disabled, fallbackLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  const shown = selected?.label || fallbackLabel || '';

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${shown ? 'text-slate-800' : 'text-slate-400'}`}>{shown || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {value && (
              <li>
                <button type="button" onClick={() => choose('')} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer">
                  {placeholder}
                </button>
              </li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => choose(o.value)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-blue-50 cursor-pointer ${
                    o.value === value ? 'bg-blue-50 text-[#1E3A8A] font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-3 text-[11px] text-slate-400">Tidak ada hasil untuk &ldquo;{query}&rdquo;.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
