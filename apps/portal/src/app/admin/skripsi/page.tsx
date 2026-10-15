'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { TablePagination } from '@/components/ui/TablePagination';
import { useServerTable } from '@/lib/useServerTable';
import { getApiBaseUrl } from '@/lib/api';
import {
  ThesisProject,
  ThesisDefense,
  ThesisStage,
  THESIS_STAGE_ORDER,
  THESIS_STAGE_LABEL,
  DEFENSE_TYPE_LABEL,
  DEFENSE_RESULT_LABEL,
  thesisStageTone,
  formatDate,
  formatDateTime,
  thesisFetch,
} from '@/lib/thesis';
import { GraduationCap, CheckCircle2, AlertTriangle, RefreshCw, X, Search, Settings2 } from 'lucide-react';

interface LecturerOption {
  id: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  nidn?: string;
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';
const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

const lecturerLabel = (l: LecturerOption) =>
  `${[l.titlePrefix, l.fullName].filter(Boolean).join(' ')}${l.titleSuffix ? `, ${l.titleSuffix}` : ''}${l.nidn && l.nidn !== '-' ? ` (${l.nidn})` : ''}`;

export default function AdminSkripsiPage() {
  const [stageFilter, setStageFilter] = useState<'' | ThesisStage>('');
  const table = useServerTable<ThesisProject, { counts?: Record<string, number> }>({
    endpoint: 'thesis/admin',
    defaultSortKey: 'updatedAt',
    defaultPageSize: 25,
    params: { stage: stageFilter },
  });

  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = j?.data ?? j;
        if (Array.isArray(list)) setLecturers(list);
      })
      .catch(() => {});
  }, []);

  const counts = table.extra.counts || {};
  const totalAll = Object.values(counts).reduce((n, v) => n + v, 0);
  const selected = useMemo(() => table.items.find((p) => p.id === selectedId) || null, [table.items, selectedId]);

  const latestDefense = (p: ThesisProject) => (p.defenses.length ? p.defenses[p.defenses.length - 1] : null);

  return (
    <PortalLayout role="admin" userName="" userIdText="">
      <div className="space-y-6 pb-12">
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${
              toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="max-w-sm">{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Tugas Akhir / Skripsi</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-3xl leading-relaxed">
                Pantau seluruh tahapan tugas akhir mahasiswa: plotting dosen pembimbing, jadwal seminar proposal dan ujian skripsi
                beserta dosen penguji, hingga input nilai akhir.
              </p>
            </div>
          </div>
        </div>

        {/* Filter tahap */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStageFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
              stageFilter === '' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua ({totalAll})
          </button>
          {([...THESIS_STAGE_ORDER, 'PROPOSAL_REJECTED'] as ThesisStage[]).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                stageFilter === s ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {THESIS_STAGE_LABEL[s]} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Cari NIM, nama mahasiswa, atau judul..."
              value={table.searchInput}
              onChange={(e) => table.setSearchInput(e.target.value)}
            />
          </div>

          {table.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat tabel: {table.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl overflow-auto ${table.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Mahasiswa</th>
                  <th className="py-2.5 px-3">Judul</th>
                  <th className="py-2.5 px-3">Tahap</th>
                  <th className="py-2.5 px-3">Pembimbing</th>
                  <th className="py-2.5 px-3">Seminar / Ujian Terakhir</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && table.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-3 text-center text-slate-400">
                      Belum ada pengajuan tugas akhir untuk filter ini.
                    </td>
                  </tr>
                )}
                {table.items.map((p) => {
                  const d = latestDefense(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{p.student?.name}</p>
                        <p className="font-mono text-[#1E3A8A]">{p.student?.nim}</p>
                        <p className="text-[11px] text-slate-400">{p.student?.studyProgram}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs">{p.title}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${thesisStageTone(p.stage)}`}>
                          {THESIS_STAGE_LABEL[p.stage]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.supervisor1 ? (
                          <>
                            <p>{p.supervisor1.name}</p>
                            {p.supervisor2 && <p className="text-slate-400">{p.supervisor2.name}</p>}
                          </>
                        ) : (
                          <span className="text-slate-400">Belum ditetapkan</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {d ? (
                          <>
                            <p className="font-semibold">{DEFENSE_TYPE_LABEL[d.type]}</p>
                            <p className="text-[11px] text-slate-400">
                              {d.scheduledAt ? `${formatDateTime(d.scheduledAt)} · ${d.location || '-'}` : 'Menunggu jadwal'}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedId(p.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                        >
                          <Settings2 className="w-3.5 h-3.5" /> Kelola
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            totalPages={table.totalPages}
            noun="pengajuan"
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        </div>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected ? `${selected.student?.name} (${selected.student?.nim})` : ''}
        subtitle={selected ? THESIS_STAGE_LABEL[selected.stage] : ''}
        icon={<GraduationCap className="w-5 h-5" />}
        maxWidth="3xl"
      >
        {selected && (
          <ProjectManager
            project={selected}
            lecturers={lecturers}
            onDone={(text) => {
              notify(true, text);
              table.reload();
            }}
            onError={(text) => notify(false, text)}
          />
        )}
      </Modal>
    </PortalLayout>
  );
}

// ==========================================================================
// Panel kelola satu pengajuan
// ==========================================================================

function ProjectManager({
  project,
  lecturers,
  onDone,
  onError,
}: {
  project: ThesisProject;
  lecturers: LecturerOption[];
  onDone: (text: string) => void;
  onError: (text: string) => void;
}) {
  const [s1, setS1] = useState(project.supervisor1?.id || '');
  const [s2, setS2] = useState(project.supervisor2?.id || '');
  const [rejectNote, setRejectNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setS1(project.supervisor1?.id || '');
    setS2(project.supervisor2?.id || '');
  }, [project.id, project.supervisor1?.id, project.supervisor2?.id]);

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    try {
      await fn();
      onDone(okText);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const canAssign = !['PROPOSAL_REJECTED', 'COMPLETED'].includes(project.stage);
  const isNew = project.stage === 'PROPOSAL_SUBMITTED';

  return (
    <div className="space-y-6">
      {/* Ringkasan */}
      <div className="space-y-1">
        <p className="font-bold text-slate-900">{project.title}</p>
        {project.abstract && <p className="text-[13px] text-slate-600 whitespace-pre-line">{project.abstract}</p>}
        <p className="text-[11px] text-slate-400">
          {project.student?.studyProgram} · diajukan {formatDate(project.submittedAt)}
          {project.proposalFileUrl && (
            <>
              {' '}
              ·{' '}
              <a href={project.proposalFileUrl} target="_blank" rel="noreferrer" className="text-[#1E3A8A] underline">
                berkas proposal
              </a>
            </>
          )}
        </p>
      </div>

      {project.stage === 'COMPLETED' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px]">
          Tugas akhir selesai: nilai akhir <b>{project.finalScore}</b> (<b>{project.finalGrade}</b>), {formatDate(project.completedAt)}.
        </div>
      )}

      {project.stage === 'PROPOSAL_REJECTED' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px]">
          Proposal ditolak: {project.adminNote}. Menunggu mahasiswa mengajukan ulang.
        </div>
      )}

      {/* Pembimbing */}
      {canAssign && (
        <section className="space-y-3 border border-slate-200 rounded-xl p-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            {isNew ? 'Plotting Dosen Pembimbing' : 'Dosen Pembimbing'}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Pembimbing 1</label>
              <select className={inputCls} value={s1} onChange={(e) => setS1(e.target.value)}>
                <option value="">-- Pilih dosen --</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {lecturerLabel(l)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Pembimbing 2 (opsional)</label>
              <select className={inputCls} value={s2} onChange={(e) => setS2(e.target.value)}>
                <option value="">-- Tanpa pembimbing 2 --</option>
                {lecturers
                  .filter((l) => l.id !== s1)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {lecturerLabel(l)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy || !s1}
              onClick={() =>
                run(
                  () => thesisFetch(`/admin/${project.id}/supervisors`, { method: 'POST', body: { supervisor1Id: s1, supervisor2Id: s2 || null } }),
                  isNew ? 'Pembimbing ditetapkan, bimbingan proposal dimulai.' : 'Pembimbing diperbarui.'
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer"
            >
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {isNew ? 'Tetapkan Pembimbing' : 'Simpan Pembimbing'}
            </button>
          </div>
          {isNew && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className={labelCls}>Atau tolak proposal</label>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder="Alasan penolakan (wajib)"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
                <button
                  disabled={busy || rejectNote.trim().length < 3}
                  onClick={() =>
                    run(
                      () => thesisFetch(`/admin/${project.id}/reject`, { method: 'POST', body: { note: rejectNote } }),
                      'Proposal ditolak. Mahasiswa dapat mengajukan ulang.'
                    )
                  }
                  className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl disabled:opacity-60 cursor-pointer shrink-0"
                >
                  Tolak
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Seminar proposal & ujian skripsi */}
      {project.defenses.map((d) => (
        <DefenseManager key={d.id} defense={d} lecturers={lecturers} busy={busy} run={run} />
      ))}

      {/* Riwayat bimbingan (hanya baca) */}
      {project.guidances.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Riwayat Bimbingan ({project.guidances.length})
          </h3>
          <ul className="space-y-2 max-h-64 overflow-auto">
            {project.guidances.map((g) => (
              <li key={g.id} className="border border-slate-200 rounded-lg p-2.5 text-[12px]">
                <p className="font-bold text-slate-800">
                  {g.topic}{' '}
                  <span className="font-normal text-slate-400">
                    · {g.phase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'} · {formatDate(g.meetingDate)}
                    {g.lecturerName ? ` · ${g.lecturerName}` : ''}
                  </span>
                </p>
                <p className={g.status === 'REVIEWED' ? 'text-emerald-700' : 'text-amber-600'}>
                  {g.status === 'REVIEWED' ? `Ditanggapi: ${g.feedback}` : 'Menunggu tanggapan pembimbing'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DefenseManager({
  defense,
  lecturers,
  busy,
  run,
}: {
  defense: ThesisDefense;
  lecturers: LecturerOption[];
  busy: boolean;
  run: (fn: () => Promise<unknown>, okText: string) => Promise<void>;
}) {
  const toLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [when, setWhen] = useState(toLocalInput(defense.scheduledAt));
  const [location, setLocation] = useState(defense.location || '');
  const [examinerIds, setExaminerIds] = useState<string[]>(defense.examiners.map((e) => e.lecturerId));
  const [chairId, setChairId] = useState(defense.examiners.find((e) => e.role === 'KETUA')?.lecturerId || '');
  const [examinerSearch, setExaminerSearch] = useState('');
  const [result, setResult] = useState<'LULUS' | 'REVISI' | 'TIDAK_LULUS'>('LULUS');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const isUjian = defense.type === 'UJIAN';
  const title = DEFENSE_TYPE_LABEL[defense.type];

  const toggleExaminer = (id: string) => {
    setExaminerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(chairId)) setChairId(next[0] || '');
      return next;
    });
  };

  const visibleLecturers = useMemo(() => {
    const q = examinerSearch.trim().toLowerCase();
    return q ? lecturers.filter((l) => lecturerLabel(l).toLowerCase().includes(q)) : lecturers;
  }, [lecturers, examinerSearch]);

  if (defense.status === 'DONE') {
    return (
      <section className="border border-slate-200 rounded-xl p-4 space-y-1 text-[13px]">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{title} -- Selesai</h3>
        <p className="text-slate-700">
          {formatDateTime(defense.scheduledAt)} · {defense.location}
        </p>
        <p className="text-slate-500">Penguji: {defense.examiners.map((e) => e.name).join(', ')}</p>
        <p className="font-bold text-slate-900">
          Hasil: {defense.result ? DEFENSE_RESULT_LABEL[defense.result] : '-'}
          {defense.score !== null ? ` · Nilai ${defense.score} (${defense.gradeLetter})` : ''}
        </p>
        {defense.notes && <p className="text-slate-500">{defense.notes}</p>}
      </section>
    );
  }

  return (
    <section className="space-y-4 border border-slate-200 rounded-xl p-4">
      <div>
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          {title} -- {defense.status === 'REGISTERED' ? 'Menunggu Jadwal' : 'Terjadwal'}
        </h3>
        <p className="text-[11px] text-slate-400">
          Mendaftar {formatDate(defense.registeredAt)}
          {defense.fileUrl && (
            <>
              {' '}
              ·{' '}
              <a href={defense.fileUrl} target="_blank" rel="noreferrer" className="text-[#1E3A8A] underline">
                berkas naskah
              </a>
            </>
          )}
        </p>
      </div>

      {/* Jadwal & penguji */}
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tanggal &amp; Jam</label>
            <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Tempat / Ruang</label>
            <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. Ruang Sidang A" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Dosen Penguji ({examinerIds.length} dipilih)</label>
          <input
            className={`${inputCls} mb-2`}
            placeholder="Cari dosen..."
            value={examinerSearch}
            onChange={(e) => setExaminerSearch(e.target.value)}
          />
          <div className="border border-slate-200 rounded-lg max-h-44 overflow-auto divide-y divide-slate-100">
            {visibleLecturers.map((l) => {
              const checked = examinerIds.includes(l.id);
              return (
                <label key={l.id} className="flex items-center gap-2 px-3 py-1.5 text-[13px] cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={checked} onChange={() => toggleExaminer(l.id)} />
                  <span className="flex-1">{lecturerLabel(l)}</span>
                  {checked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setChairId(l.id);
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer ${
                        chairId === l.id ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {chairId === l.id ? 'Ketua' : 'Jadikan ketua'}
                    </button>
                  )}
                </label>
              );
            })}
          </div>
        </div>
        <button
          disabled={busy || !when || !location.trim() || examinerIds.length === 0}
          onClick={() =>
            run(
              () =>
                thesisFetch(`/admin/defenses/${defense.id}/schedule`, {
                  method: 'POST',
                  body: { scheduledAt: new Date(when).toISOString(), location, examinerIds, chairId: chairId || examinerIds[0] },
                }),
              `Jadwal ${title.toLowerCase()} disimpan.`
            )
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl disabled:opacity-60 cursor-pointer"
        >
          {defense.status === 'REGISTERED' ? 'Tetapkan Jadwal & Penguji' : 'Perbarui Jadwal & Penguji'}
        </button>
      </div>

      {/* Hasil / nilai */}
      {defense.status === 'SCHEDULED' && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            {isUjian ? 'Input Nilai Ujian Skripsi' : 'Input Hasil Seminar Proposal'}
          </h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Hasil</label>
              <select className={inputCls} value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
                <option value="LULUS">Lulus</option>
                {!isUjian && <option value="REVISI">Lulus dengan Revisi</option>}
                <option value="TIDAK_LULUS">Tidak Lulus</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Nilai (0-100){isUjian && result === 'LULUS' ? ' *' : ''}</label>
              <input type="number" min={0} max={100} className={inputCls} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Catatan</label>
              <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <button
            disabled={busy || (isUjian && result === 'LULUS' && score.trim() === '')}
            onClick={() =>
              run(
                () =>
                  thesisFetch(`/admin/defenses/${defense.id}/result`, {
                    method: 'POST',
                    body: { result, score: score === '' ? null : Number(score), notes },
                  }),
                isUjian ? 'Nilai ujian skripsi disimpan.' : 'Hasil seminar proposal disimpan.'
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60 cursor-pointer"
          >
            Simpan {isUjian ? 'Nilai' : 'Hasil'}
          </button>
        </div>
      )}
    </section>
  );
}
