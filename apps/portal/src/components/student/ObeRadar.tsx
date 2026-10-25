'use client';

import React from 'react';

export interface RadarAxis {
  label: string;
  /** Capaian 0-100; null = belum ada nilai (digambar di pusat, bukan 0). */
  value: number | null;
}

interface Props {
  axes: RadarAxis[];
  target: number;
  size?: number;
}

const RINGS = [25, 50, 75, 100];

/**
 * Jaring laba-laba capaian CPL: satu sumbu per CPL, garis putus-putus untuk target, area biru untuk capaian mahasiswa.
 * Tanpa pustaka grafik. Dengan kurang dari tiga CPL yang terukur, bentuknya tidak bermakna, jadi pemanggil memakai daftar.
 */
export function ObeRadar({ axes, target, size = 340 }: Props) {
  const n = axes.length;
  const c = size / 2;
  const radius = size / 2 - 58;
  const point = (i: number, pct: number): [number, number] => {
    const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
    const r = (Math.max(0, Math.min(100, pct)) / 100) * radius;
    return [c + r * Math.cos(angle), c + r * Math.sin(angle)];
  };
  const polygon = (values: (number | null)[]) => values.map((v, i) => point(i, v ?? 0).join(',')).join(' ');
  const labelAnchor = (i: number): 'start' | 'middle' | 'end' => {
    const x = point(i, 100)[0];
    return Math.abs(x - c) < 4 ? 'middle' : x > c ? 'start' : 'end';
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Jaring laba-laba capaian CPL" className="w-full h-auto max-w-[420px] mx-auto">
      {RINGS.map((ring) => (
        <polygon key={ring} points={polygon(axes.map(() => ring))} fill="none" stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}
      <polygon points={polygon(axes.map(() => target))} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" />
      <polygon points={polygon(axes.map((a) => a.value))} fill="rgba(30,58,138,0.18)" stroke="#1E3A8A" strokeWidth={2} />
      {axes.map((a, i) => {
        if (a.value === null) return null;
        const [x, y] = point(i, a.value);
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#1E3A8A" />;
      })}
      {RINGS.map((ring) => (
        <text key={ring} x={c + 3} y={c - (ring / 100) * radius - 2} fontSize={8} fill="#94a3b8">
          {ring}
        </text>
      ))}
      {axes.map((a, i) => {
        const [x, y] = point(i, 118);
        return (
          <text key={i} x={x} y={y} fontSize={10.5} fontWeight={700} fill="#334155" textAnchor={labelAnchor(i)} dominantBaseline="middle">
            {a.label}
            <tspan x={x} dy={12} fontSize={9.5} fontWeight={500} fill={a.value === null ? '#94a3b8' : a.value >= target ? '#047857' : '#be123c'}>
              {a.value === null ? 'belum ada nilai' : a.value.toFixed(1)}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
