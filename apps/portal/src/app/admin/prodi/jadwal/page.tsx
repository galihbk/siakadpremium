'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { ProdiDataPage, StatChip } from '@/components/prodi/ProdiDataPage';

interface ClassRow {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  semester: number | null;
  className: string;
  lecturer: string | null;
  schedule: string;
  room: string | null;
  quota: number;
  enrolled: number;
}

interface Extra {
  year?: { id: string; name: string } | null;
}

export default function ProdiJadwalPage() {
  return (
    <ProdiDataPage<ClassRow, Extra>
      title="Jadwal & Kelas Perkuliahan"
      subtitle="Kelas yang dibuka untuk mata kuliah program studi Anda pada semester terpilih: dosen pengampu, jadwal, ruang, dan keterisian peserta."
      icon={<CalendarDays className="w-5 h-5" />}
      endpoint="prodi/classes"
      defaultSortKey="course"
      searchPlaceholder="Cari mata kuliah, kelas, atau dosen pengampu..."
      noun="kelas"
      yearSelect
      rowKey={(r) => r.id}
      emptyText="Belum ada kelas pada semester ini."
      summary={(extra, total) => (
        <>
          <StatChip label="Kelas" value={total.toLocaleString('id-ID')} tone="blue" />
          {extra.year && <StatChip label="Semester" value={extra.year.name} />}
        </>
      )}
      columns={[
        {
          key: 'course',
          label: 'Mata Kuliah',
          sortKey: 'course',
          render: (r) => (
            <>
              <p className="font-bold text-slate-900">{r.courseName}</p>
              <p className="text-[11px] text-slate-400">
                <span className="font-mono text-[#1E3A8A]">{r.courseCode}</span> · {r.sks} SKS
                {r.semester ? ` · Smt ${r.semester}` : ''}
              </p>
            </>
          ),
        },
        { key: 'className', label: 'Kelas', sortKey: 'className', render: (r) => <span className="font-semibold">{r.className}</span> },
        {
          key: 'lecturer',
          label: 'Dosen Pengampu',
          sortKey: 'lecturer',
          render: (r) => r.lecturer || <span className="text-amber-600 font-semibold">Belum ditetapkan</span>,
        },
        { key: 'schedule', label: 'Jadwal', sortKey: 'day', render: (r) => r.schedule },
        { key: 'room', label: 'Ruang', render: (r) => r.room || '-' },
        {
          key: 'enrolled',
          label: 'Peserta',
          className: 'text-center',
          render: (r) => {
            const full = r.enrolled >= r.quota;
            return (
              <span className={`font-mono font-bold ${full ? 'text-rose-600' : 'text-slate-900'}`}>
                {r.enrolled}/{r.quota}
              </span>
            );
          },
        },
      ]}
    />
  );
}
