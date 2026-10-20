'use client';

import React from 'react';

/**
 * Isian nominal rupiah: tampil dengan pemisah ribuan (1.500.000) dan awalan "Rp", nilainya tetap angka.
 * Pakai `className` untuk gaya kotak isian (padding kiri otomatis ditambah untuk awalan "Rp").
 */
export function RupiahInput({
  value,
  onChange,
  className = '',
  placeholder,
  required,
  disabled,
}: {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const num = typeof value === 'string' ? Number(value.replace(/\D/g, '')) : Number(value ?? 0);
  const shown = Number.isFinite(num) && num > 0 ? num.toLocaleString('id-ID') : '';
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        required={required}
        disabled={disabled}
        value={shown}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        className={`${className} !pl-9`}
      />
    </div>
  );
}
