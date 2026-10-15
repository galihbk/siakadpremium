'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { ProdiDataPage, StatChip } from '@/components/prodi/ProdiDataPage';

interface StudentRow {
  id: string;
  nim: string;
  name: string;
  email: string;
  phone: string | null;
  entryYear: number;
  semester: number;
  status: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT' | 'TRANSFERRED';
  advisor: string | null;
  sksLulus: number;
  ipk: number | null;
}

interface Extra {
  statusCounts?: Record<string, number>;
  entryYears?: { year: number; count: number }[];
}

const STATUS: Record<StudentRow['status'], { label: string; tone: string }> = {
  ACTIVE: { label: 'Aktif', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LEAVE: { label: 'Cuti', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  GRADUATED: { label: 'Lulus', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  DROPOUT: { label: 'DO', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  TRANSFERRED: { label: 'Pindah', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function ProdiMahasiswaPage() {
  return (
    <ProdiDataPage<StudentRow, Extra>
      title="Data Mahasiswa"
      subtitle="Seluruh mahasiswa program studi Anda beserta angkatan, status, dosen PA, SKS lulus, dan IPK."
      icon={<Users className="w-5 h-5" />}
      endpoint="prodi/students"
      defaultSortKey="nim"
      searchPlaceholder="Cari NIM atau nama mahasiswa..."
      noun="mahasiswa"
      rowKey={(r) => r.id}
      emptyText="Belum ada mahasiswa yang cocok."
      filters={(extra) => [
        {
          name: 'status',
          label: 'Semua status',
          options: Object.entries(STATUS).map(([value, v]) => ({
            value,
            label: `${v.label} (${extra.statusCounts?.[value] ?? 0})`,
          })),
        },
        {
          name: 'entryYear',
          label: 'Semua angkatan',
          options: (extra.entryYears || []).map((y) => ({ value: String(y.year), label: `${y.year} (${y.count})` })),
        },
      ]}
      summary={(extra, total) => (
        <>
          <StatChip label="Sesuai filter" value={total.toLocaleString('id-ID')} tone="blue" />
          {Object.entries(extra.statusCounts || {}).map(([k, v]) => (
            <StatChip key={k} label={STATUS[k as StudentRow['status']]?.label || k} value={v.toLocaleString('id-ID')} />
          ))}
        </>
      )}
      columns={[
        {
          key: 'nim',
          label: 'NIM',
          sortKey: 'nim',
          render: (r) => <span className="font-mono font-bold text-[#1E3A8A]">{r.nim}</span>,
        },
        {
          key: 'name',
          label: 'Nama',
          sortKey: 'name',
          render: (r) => (
            <>
              <p className="font-bold text-slate-900">{r.name}</p>
              <p className="text-[11px] text-slate-400">{r.email}</p>
            </>
          ),
        },
        { key: 'entryYear', label: 'Angkatan', sortKey: 'entryYear', render: (r) => r.entryYear },
        { key: 'semester', label: 'Smt', sortKey: 'semester', className: 'text-center', render: (r) => r.semester },
        {
          key: 'status',
          label: 'Status',
          sortKey: 'status',
          render: (r) => (
            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS[r.status].tone}`}>
              {STATUS[r.status].label}
            </span>
          ),
        },
        {
          key: 'advisor',
          label: 'Dosen PA',
          render: (r) => r.advisor || <span className="text-slate-400">Belum ditetapkan</span>,
        },
        { key: 'sks', label: 'SKS Lulus', className: 'text-center font-mono', render: (r) => r.sksLulus },
        {
          key: 'ipk',
          label: 'IPK',
          className: 'text-center font-mono font-bold',
          render: (r) => (
            <span className={r.ipk !== null && r.ipk < 2 ? 'text-rose-600' : 'text-slate-900'}>
              {r.ipk !== null ? r.ipk.toFixed(2) : '-'}
            </span>
          ),
        },
      ]}
    />
  );
}
