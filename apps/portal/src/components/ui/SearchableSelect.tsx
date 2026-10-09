'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  /** Teks tambahan yang ikut dicari tetapi tidak ditampilkan */
  keywords?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  /** Kalau diisi, muncul opsi paling atas untuk mengosongkan pilihan (value = '') */
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const BASE_TRIGGER =
  'w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:opacity-60 disabled:cursor-not-allowed';

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyLabel,
  required,
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.keywords ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  // Daftar yang tampil: opsi kosong (kalau ada) + hasil pencarian
  const items: SelectOption[] = useMemo(
    () => (emptyLabel && !query ? [{ value: '', label: emptyLabel }, ...filtered] : filtered),
    [emptyLabel, query, filtered],
  );

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
      setActive(Math.max(0, items.findIndex((o) => o.value === value)));
      // fokus setelah dropdown ter-render
      setTimeout(() => searchRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[active]) choose(items[active].value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={BASE_TRIGGER}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Input tersembunyi supaya atribut required tetap divalidasi browser */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[12rem] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="relative border-b border-slate-100">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-8 py-2 text-xs focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {items.length === 0 ? (
              <li className="px-3.5 py-3 text-xs text-slate-400 text-center">Tidak ada hasil</li>
            ) : (
              items.map((o, i) => (
                <li
                  key={o.value || '__empty'}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o.value)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2 text-xs cursor-pointer ${
                    i === active ? 'bg-blue-50 text-[#1E3A8A]' : 'text-slate-700'
                  } ${o.value === '' ? 'italic text-slate-500' : ''}`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="w-3.5 h-3.5 shrink-0 text-[#1E3A8A]" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
