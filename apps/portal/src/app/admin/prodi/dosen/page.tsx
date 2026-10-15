'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import { ProdiDataPage, StatChip } from '@/components/prodi/ProdiDataPage';

interface LecturerRow {
  id: string;
  name: string | null;
  nidn: string | null;
  position: string | null;
  employmentStatus: string | null;
  lastEducation: string | null;
  expertise: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  isAdvisor: boolean;
  adviseeCount: number;
  classes: number;
  sks: number;
}

interface Extra {
  activeYear?: string | null;
}

export default function ProdiDosenPage() {
  return (
    <ProdiDataPage<LecturerRow, Extra>
      title="Data Dosen"
      subtitle="Dosen homebase program studi Anda beserta jabatan, status kepegawaian, jumlah mahasiswa bimbingan PA, dan beban mengajar semester aktif."
      icon={<UserCheck className="w-5 h-5" />}
      endpoint="prodi/lecturers"
      defaultSortKey="name"
      searchPlaceholder="Cari nama atau NIDN/NUPTK dosen..."
      noun="dosen"
      rowKey={(r) => r.id}
      summary={(extra, total) => (
        <>
          <StatChip label="Dosen" value={total.toLocaleString('id-ID')} tone="blue" />
          {extra.activeYear && <StatChip label="Beban mengajar semester" value={extra.activeYear} />}
        </>
      )}
      columns={[
        {
          key: 'name',
          label: 'Dosen',
          sortKey: 'name',
          render: (r) => (
            <>
              <p className="font-bold text-slate-900">{r.name}</p>
              <p className="text-[11px] text-slate-400">
                {r.nidn ? <span className="font-mono">{r.nidn}</span> : 'NIDN/NUPTK belum ada'}
                {!r.isActive && <span className="ml-2 text-rose-500 font-bold">Nonaktif</span>}
              </p>
            </>
          ),
        },
        { key: 'position', label: 'Jabatan Fungsional', sortKey: 'position', render: (r) => r.position || '-' },
        { key: 'status', label: 'Status', sortKey: 'status', render: (r) => r.employmentStatus || '-' },
        {
          key: 'education',
          label: 'Pendidikan / Keahlian',
          render: (r) => (
            <>
              <p>{r.lastEducation || '-'}</p>
              {r.expertise && <p className="text-[11px] text-slate-400">{r.expertise}</p>}
            </>
          ),
        },
        {
          key: 'advisees',
          label: 'Bimbingan PA',
          className: 'text-center',
          render: (r) =>
            r.isAdvisor ? (
              <span className="font-mono font-bold">{r.adviseeCount} mhs</span>
            ) : (
              <span className="text-slate-400">Bukan PA</span>
            ),
        },
        {
          key: 'load',
          label: 'Beban Mengajar',
          className: 'text-center',
          render: (r) => (
            <span className="font-mono">
              {r.classes} kelas · {r.sks} SKS
            </span>
          ),
        },
        {
          key: 'contact',
          label: 'Kontak',
          render: (r) => (
            <>
              <p className="text-slate-600">{r.email}</p>
              <p className="text-[11px] text-slate-400">{r.phone || '-'}</p>
            </>
          ),
        },
      ]}
    />
  );
}
