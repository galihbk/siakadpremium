'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { ProdiDataPage, StatChip } from '@/components/prodi/ProdiDataPage';

type Status = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

interface GraduationRow {
  id: string;
  nim: string;
  name: string;
  entryYear: number;
  status: Status;
  sksLulus: number;
  sksRequired: number;
  ipk: number | null;
  predicate: string | null;
  graduationDate: string | null;
  skNumber: string | null;
  appliedAt: string;
}

interface Extra {
  counts?: Record<string, number>;
}

const STATUS: Record<Status, { label: string; tone: string }> = {
  SUBMITTED: { label: 'Menunggu Verifikasi', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Lulus', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Ditolak', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function ProdiYudisiumPage() {
  return (
    <ProdiDataPage<GraduationRow, Extra>
      title="Pemantauan Yudisium & Kelulusan"
      subtitle="Pendaftar yudisium dari program studi Anda beserta SKS, IPK, predikat, dan status keputusan BAAK."
      icon={<Award className="w-5 h-5" />}
      endpoint="prodi/graduation"
      searchPlaceholder="Cari NIM atau nama mahasiswa..."
      noun="pendaftar"
      rowKey={(r) => r.id}
      emptyText="Belum ada pendaftar yudisium."
      filters={(extra) => [
        {
          name: 'status',
          label: 'Semua status',
          options: (Object.keys(STATUS) as Status[]).map((s) => ({
            value: s,
            label: `${STATUS[s].label} (${extra.counts?.[s] ?? 0})`,
          })),
        },
      ]}
      summary={(extra, total) => (
        <>
          <StatChip label="Sesuai filter" value={total} tone="blue" />
          <StatChip label="Menunggu" value={extra.counts?.SUBMITTED ?? 0} tone="amber" />
          <StatChip label="Lulus" value={extra.counts?.APPROVED ?? 0} tone="emerald" />
          <StatChip label="Ditolak" value={extra.counts?.REJECTED ?? 0} tone="rose" />
        </>
      )}
      columns={[
        {
          key: 'student',
          label: 'Mahasiswa',
          render: (r) => (
            <>
              <p className="font-bold text-slate-900">{r.name}</p>
              <p className="text-[11px] text-slate-400">
                <span className="font-mono text-[#1E3A8A]">{r.nim}</span> · angkatan {r.entryYear}
              </p>
            </>
          ),
        },
        {
          key: 'sks',
          label: 'SKS Lulus',
          className: 'text-center font-mono',
          render: (r) => `${r.sksLulus}/${r.sksRequired}`,
        },
        { key: 'ipk', label: 'IPK', className: 'text-center font-mono font-bold', render: (r) => r.ipk?.toFixed(2) ?? '-' },
        { key: 'applied', label: 'Mendaftar', render: (r) => fmtDate(r.appliedAt) },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS[r.status].tone}`}>
              {STATUS[r.status].label}
            </span>
          ),
        },
        {
          key: 'result',
          label: 'Hasil Kelulusan',
          render: (r) =>
            r.status === 'APPROVED' ? (
              <>
                <p className="font-semibold text-slate-800">{r.predicate}</p>
                <p className="text-[11px] text-slate-400">
                  {fmtDate(r.graduationDate)} · {r.skNumber}
                </p>
              </>
            ) : (
              '-'
            ),
        },
      ]}
    />
  );
}
