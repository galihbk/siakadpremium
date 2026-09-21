'use client';

import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export function SortableTh<T>({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className,
  align = 'left',
}: {
  label: string;
  column: keyof T;
  sortKey: keyof T;
  sortDir: 'asc' | 'desc';
  onSort: (key: keyof T) => void;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <th
      onClick={() => onSort(column)}
      className={`px-4 py-3 font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-700 transition-colors ${
        align === 'center' ? 'text-center' : 'text-left'
      } ${className || ''}`}
    >
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
        {label}
        {sortKey !== column ? (
          <ArrowUpDown className="w-3 h-3 text-slate-300" />
        ) : sortDir === 'asc' ? (
          <ArrowUp className="w-3 h-3 text-blue-600" />
        ) : (
          <ArrowDown className="w-3 h-3 text-blue-600" />
        )}
      </div>
    </th>
  );
}
