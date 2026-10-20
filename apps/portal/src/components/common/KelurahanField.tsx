'use client';

import React, { useState } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

/**
 * Kelurahan/Desa: pilih dari daftar API (bisa dicari) atau ketik manual bila tidak ada di daftar.
 * Mode manual otomatis dipakai bila daftar kosong (kecamatan belum dipilih / API tidak terjangkau)
 * atau bila nilai tersimpan tidak ada di daftar.
 */
export function KelurahanField({
  value,
  villages,
  loading,
  onChange,
  inputClassName,
}: {
  value: string;
  villages: string[];
  loading?: boolean;
  onChange: (v: string) => void;
  inputClassName: string;
}) {
  const [manual, setManual] = useState(false);
  const inList = !value || villages.some((v) => v.toLowerCase() === value.toLowerCase());
  const useManual = manual || villages.length === 0 || !inList;

  return (
    <div>
      {useManual ? (
        <input
          className={inputClassName}
          value={value}
          placeholder={loading ? 'Memuat daftar...' : 'Ketik nama kelurahan/desa'}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="mt-1">
          <SearchableSelect
            value={villages.find((v) => v.toLowerCase() === value.toLowerCase()) || ''}
            onChange={onChange}
            options={villages.map((v) => ({ value: v, label: v }))}
            placeholder="-- Pilih Kelurahan/Desa --"
            searchPlaceholder="Cari kelurahan/desa..."
          />
        </div>
      )}
      {villages.length > 0 && (
        <button
          type="button"
          onClick={() => setManual(!useManual)}
          className="mt-1 text-[11px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
        >
          {useManual ? 'Pilih dari daftar' : 'Tidak ada di daftar? Ketik manual'}
        </button>
      )}
      {villages.length === 0 && !loading && (
        <p className="mt-1 text-[11px] text-slate-400">Pilih kecamatan untuk memuat daftar, atau ketik manual.</p>
      )}
    </div>
  );
}
