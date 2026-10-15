'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthSession } from '@/lib/auth';

export type SortDir = 'asc' | 'desc';

interface UseServerTableOptions {
  /** Path di bawah API base, mis. `integration-settings/pddikti/krs/table`. */
  endpoint: string;
  defaultSortKey: string;
  defaultSortDir?: SortDir;
  defaultPageSize?: number;
  /** Parameter query tambahan (mis. filter). Mengubahnya memuat ulang tabel dari halaman 1. */
  params?: Record<string, string>;
}

interface TableResponse<T, E> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  extra: E;
}

/**
 * Tabel dengan pagination, pencarian, dan urutan yang dihitung di server -- browser hanya
 * menerima satu halaman per request, bukan seluruh ribuan baris. Pencarian di-debounce dan
 * request lama dibatalkan kalau parameter berubah lagi sebelum selesai.
 */
export function useServerTable<T, E = Record<string, unknown>>({
  endpoint,
  defaultSortKey,
  defaultSortDir = 'asc',
  defaultPageSize = 50,
  params: extraParams,
}: UseServerTableOptions) {
  const extraParamsKey = JSON.stringify(extraParams || {});
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [extra, setExtra] = useState<E>({} as E);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce pencarian supaya tidak menembak API tiap ketukan.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch((prev) => {
        if (prev !== searchInput.trim()) setPage(1);
        return searchInput.trim();
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortKey,
      sortDir,
    });
    if (search) params.set('search', search);
    for (const [k, v] of Object.entries(JSON.parse(extraParamsKey) as Record<string, string>)) {
      if (v) params.set(k, v);
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);

    fetch(`${apiBase}/${endpoint}?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        const result = (json?.data ?? json) as Partial<TableResponse<T, E>> & Record<string, any>;
        const { items: rows, total: count, page: _p, pageSize: _s, ...rest } = result;
        setItems(Array.isArray(rows) ? (rows as T[]) : []);
        setTotal(typeof count === 'number' ? count : 0);
        setExtra(rest as unknown as E);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data tabel.');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [endpoint, page, pageSize, search, sortKey, sortDir, reloadToken, extraParamsKey]);

  // Filter berubah -> kembali ke halaman 1.
  useEffect(() => {
    setPage(1);
  }, [extraParamsKey]);

  const toggleSort = useCallback(
    (key: string) => {
      setPage(1);
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return {
    items,
    total,
    extra,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
    searchInput,
    setSearchInput,
    sortKey,
    sortDir,
    toggleSort,
    setPage,
    setPageSize,
    isLoading,
    error,
    reload,
  };
}
