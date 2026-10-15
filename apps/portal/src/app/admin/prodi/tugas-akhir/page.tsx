'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { ProdiDataPage, StatChip } from '@/components/prodi/ProdiDataPage';
import { ThesisStage, THESIS_STAGE_ORDER, THESIS_STAGE_LABEL, thesisStageTone } from '@/lib/thesis';

interface ThesisRow {
  id: string;
  nim: string;
  name: string;
  title: string;
  stage: ThesisStage;
  supervisor1: string | null;
  supervisor2: string | null;
  finalScore: number | null;
  finalGrade: string | null;
  submittedAt: string;
}

interface Extra {
  counts?: Record<string, number>;
}

const STAGES: ThesisStage[] = [...THESIS_STAGE_ORDER, 'PROPOSAL_REJECTED'];

export default function ProdiTugasAkhirPage() {
  return (
    <ProdiDataPage<ThesisRow, Extra>
      title="Pemantauan Tugas Akhir / Skripsi"
      subtitle="Pantau tahapan tugas akhir mahasiswa program studi Anda: proposal, dosen pembimbing, seminar, ujian, hingga nilai akhir."
      icon={<GraduationCap className="w-5 h-5" />}
      endpoint="prodi/thesis"
      searchPlaceholder="Cari NIM, nama, atau judul..."
      noun="mahasiswa"
      rowKey={(r) => r.id}
      emptyText="Belum ada pengajuan tugas akhir."
      filters={(extra) => [
        {
          name: 'stage',
          label: 'Semua tahap',
          options: STAGES.map((s) => ({ value: s, label: `${THESIS_STAGE_LABEL[s]} (${extra.counts?.[s] ?? 0})` })),
        },
      ]}
      summary={(extra, total) => {
        const all = Object.values(extra.counts || {}).reduce((n, v) => n + v, 0);
        return (
          <>
            <StatChip label="Sesuai filter" value={total} tone="blue" />
            <StatChip label="Total pengajuan" value={all} />
            <StatChip label="Selesai" value={extra.counts?.COMPLETED ?? 0} tone="emerald" />
            <StatChip label="Menunggu pembimbing" value={extra.counts?.PROPOSAL_SUBMITTED ?? 0} tone="amber" />
          </>
        );
      }}
      columns={[
        {
          key: 'student',
          label: 'Mahasiswa',
          render: (r) => (
            <>
              <p className="font-bold text-slate-900">{r.name}</p>
              <p className="font-mono text-[#1E3A8A]">{r.nim}</p>
            </>
          ),
        },
        { key: 'title', label: 'Judul', className: 'max-w-sm', render: (r) => r.title },
        {
          key: 'stage',
          label: 'Tahap',
          render: (r) => (
            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${thesisStageTone(r.stage)}`}>
              {THESIS_STAGE_LABEL[r.stage]}
            </span>
          ),
        },
        {
          key: 'supervisor',
          label: 'Pembimbing',
          render: (r) =>
            r.supervisor1 ? (
              <>
                <p>{r.supervisor1}</p>
                {r.supervisor2 && <p className="text-slate-400">{r.supervisor2}</p>}
              </>
            ) : (
              <span className="text-slate-400">Belum ditetapkan</span>
            ),
        },
        {
          key: 'grade',
          label: 'Nilai Akhir',
          className: 'text-center font-mono font-bold',
          render: (r) => (r.finalGrade ? `${r.finalGrade} (${r.finalScore})` : '-'),
        },
      ]}
    />
  );
}
