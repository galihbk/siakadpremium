'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface KabupatenItem {
  id: string;
  name: string;
}

interface BirthPlaceSelectProps {
  value: string;
  onChange: (value: string) => void;
  /** Kelas untuk tombol pemicu (disamakan dengan input lain di form). */
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bDki\b/g, 'DKI')
    .replace(/\bDi\b/g, 'DI');
}

/** "KABUPATEN CILACAP" -> "Cilacap", "KOTA BANDUNG" -> "Bandung" (bentuk umum Tempat Lahir di Feeder). */
function plainName(name: string) {
  return toTitleCase(name.replace(/^(KABUPATEN|KAB\.?|KOTA)\s+/i, '').trim());
}

let cache: KabupatenItem[] | null = null;

/**
 * Pilihan Tempat Lahir dari daftar seluruh kabupaten/kota Indonesia
 * (/data/kabupaten-kota.json) dengan pencarian. Nilai yang tersimpan berupa nama tanpa
 * awalan "Kabupaten"/"Kota" (mis. "Cilacap"). Nilai lama yang tidak ada di daftar tetap
 * ditampilkan agar data mahasiswa tidak hilang saat disimpan ulang.
 */
export function BirthPlaceSelect({ value, onChange, className, disabled, placeholder }: BirthPlaceSelectProps) {
  const [items, setItems] = useState<KabupatenItem[]>(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetch('/data/kabupaten-kota.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: KabupatenItem[]) => {
        cache = Array.isArray(data) ? data : [];
        if (!cancelled) setItems(cache);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tutup saat klik di luar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // fokus ke kolom cari begitu daftar terbuka
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const options = useMemo(() => {
    const names = Array.from(new Set(items.map((i) => plainName(i.name))));
    return names.sort((a, b) => a.localeCompare(b, 'id'));
  }, [items]);

  const current = (value || '').trim();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // yang diawali kata kunci didahulukan, lalu yang mengandung
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    // jaga item aktif tetap terlihat saat navigasi keyboard
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const label =
    current ||
    placeholder ||
    (loading ? 'Memuat daftar kabupaten/kota...' : failed ? 'Daftar tidak termuat' : '-- Pilih Kabupaten / Kota --');

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${className || ''} flex items-center justify-between gap-2 text-left cursor-pointer`}
      >
        <span className={current ? '' : 'text-slate-400'}>{label}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Cari kabupaten / kota..."
              className="flex-1 text-sm outline-none bg-transparent"
              aria-label="Cari kabupaten atau kota"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <ul ref={listRef} role="listbox" className="max-h-60 overflow-auto py-1">
            {current && !options.some((o) => o.toLowerCase() === current.toLowerCase()) && !query && (
              <li
                role="option"
                aria-selected
                className="px-3 py-2 text-sm bg-blue-50 text-[#1E3A8A] font-semibold cursor-default"
              >
                {current} <span className="text-[11px] font-normal text-slate-500">(nilai tersimpan)</span>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-slate-400 text-center">Tidak ditemukan.</li>
            ) : (
              filtered.map((o, i) => {
                const isSelected = o.toLowerCase() === current.toLowerCase();
                return (
                  <li
                    key={o}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(o)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      i === active ? 'bg-slate-100' : ''
                    } ${isSelected ? 'font-bold text-[#1E3A8A]' : 'text-slate-800'}`}
                  >
                    {o}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
