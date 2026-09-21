import { useState, useMemo, useEffect } from 'react';

export function useSortedPagination<T>(data: T[], initialSortKey: keyof T, pageSize = 10) {
  const [sortKey, setSortKey] = useState<keyof T>(initialSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va ?? '').localeCompare(String(vb ?? ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Depend on data.length (not the array reference) -- callers often pass a freshly
  // filtered array on every render, and resetting on identity would snap back to page 1
  // on every click (setPage triggers a re-render -> new filtered array -> "changed" data).
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, sortKey, sortDir]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return {
    sorted,
    paginated,
    sortKey,
    sortDir,
    handleSort,
    page: currentPage,
    setPage,
    totalPages,
    pageSize,
  };
}
