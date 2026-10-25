'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ThesisSettings, DEFAULT_THESIS_SETTINGS } from '@/lib/thesis';
import { examsFetch } from '@/lib/exams';
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
  `${[l.titlePrefix, l.fullName].filter(Boolean).join(' ')}${l.titleSuffix ? `, ${l.titleSuffix}` : ''}`;

export default function AdminSkripsiPage() {
  const [stageFilter, setStageFilter] = useState<'' | ThesisStage>('');
  const table = useServerTable<ThesisProject, { counts?: Record<string, number> }>({
    endpoint: 'thesis/admin',
    defaultSortKey: 'updatedAt',
    defaultPageSize: 25,
    params: { stage: stageFilter },
  });

  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [supervisorLoad, setSupervisorLoad] = useState<Record<string, number>>({});
  // Pengaturan bimbingan (per kampus): minimal bimbingan sebelum ACC & daftar bab
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ThesisSettings>(DEFAULT_THESIS_SETTINGS);
  const [settingsDraft, setSettingsDraft] = useState({ minP: '1', minS: '1', chapters: '', gradeStatus: 'FINAL' });
  const [pendingGrades, setPendingGrades] = useState(0);
  const [syncBusy, setSyncBusy] = useState(false);
  const loadPendingGrades = useCallback(() => {
    thesisFetch<{ pending: number }>('/admin/grades/pending').then((d) => setPendingGrades(d.pending)).catch(() => undefined);
  }, []);
  useEffect(() => {
    loadPendingGrades();
  }, [loadPendingGrades]);
  const syncGrades = async () => {
    setSyncBusy(true);
    try {
      const r = await thesisFetch<{ checked: number; applied: number; stillPending: number }>('/admin/grades/sync', { method: 'POST' });
      notify(true, `${r.applied} nilai ditulis ke KRS, ${r.stillPending} masih tertunda (dari ${r.checked} sidang).`);
      loadPendingGrades();
      table.reload();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menerapkan nilai.');
    } finally {
      setSyncBusy(false);
    }
  };
  const [settingsBusy, setSettingsBusy] = useState(false);
  useEffect(() => {
    thesisFetch<ThesisSettings>('/settings').then(setSettings).catch(() => undefined);
  }, []);
  const openSettings = () => {
    setSettingsDraft({ minP: String(settings.minGuidanceProposal), minS: String(settings.minGuidanceSkripsi), chapters: settings.chapters.join('\n'), gradeStatus: settings.gradeStatus || 'FINAL' });
    setSettingsOpen(true);
  };
  const saveSettings = async () => {
    setSettingsBusy(true);
    try {
      const saved = await thesisFetch<ThesisSettings>('/admin/settings', {
        method: 'PUT',
        body: {
          minGuidanceProposal: Number(settingsDraft.minP),
          minGuidanceSkripsi: Number(settingsDraft.minS),
          chapters: settingsDraft.chapters.split('\n').map((c) => c.trim()).filter(Boolean),
          gradeStatus: settingsDraft.gradeStatus,
        },
      });
      setSettings(saved);
      setSettingsOpen(false);
      notify(true, 'Pengaturan bimbingan tersimpan.');
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.');
    } finally {
      setSettingsBusy(false);
    }
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  const loadSupervisorLoad = useCallback(() => {
    thesisFetch<{ load: Record<string, number> }>('/admin/supervisor-load')
      .then((d) => setSupervisorLoad(d.load || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadSupervisorLoad();
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
          <div className="flex items-start justify-between gap-4 flex-wrap">
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
            <div className="flex flex-wrap items-center gap-2">
              {pendingGrades > 0 && (
                <button
                  disabled={syncBusy}
                  onClick={syncGrades}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {syncBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />} Terapkan {pendingGrades} Nilai Tertunda ke KRS
                </button>
              )}
              <button
                onClick={openSettings}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" /> Pengaturan
              </button>
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
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Pengaturan Bimbingan Tugas Akhir"
        subtitle="Aturan ini berlaku untuk semua mahasiswa dan dosen pembimbing"
        icon={<Settings2 className="w-5 h-5" />}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Minimal bimbingan proposal sebelum ACC</label>
              <input type="number" min={0} max={50} className={inputCls} value={settingsDraft.minP} onChange={(e) => setSettingsDraft({ ...settingsDraft, minP: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Minimal bimbingan skripsi sebelum ACC</label>
              <input type="number" min={0} max={50} className={inputCls} value={settingsDraft.minS} onChange={(e) => setSettingsDraft({ ...settingsDraft, minS: e.target.value })} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 -mt-2">Dosen baru bisa memberi ACC setelah jumlah catatan bimbingan terpenuhi. Nilai terkecil yang berlaku adalah 1.</p>
          <div>
            <label className={labelCls}>Daftar bab / bagian (satu per baris)</label>
            <textarea rows={7} className={inputCls} value={settingsDraft.chapters} onChange={(e) => setSettingsDraft({ ...settingsDraft, chapters: e.target.value })} />
            <p className="text-[11px] text-slate-500 mt-1">Muncul sebagai pilihan "Bab yang dibahas" saat dosen mencatat bimbingan. Dosen tetap bisa memilih "Lainnya".</p>
          </div>
          <div>
            <label className={labelCls}>Status nilai yang ditulis ke KRS dari hasil seminar/ujian</label>
            <select className={inputCls} value={settingsDraft.gradeStatus} onChange={(e) => setSettingsDraft({ ...settingsDraft, gradeStatus: e.target.value })}>
              <option value="FINAL">FINAL (langsung tercatat di KHS/transkrip)</option>
              <option value="DRAFT">DRAFT (menunggu difinalkan dosen pengampu)</option>
            </select>
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-1.5 text-[12px] text-slate-600">
            <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Nilai seminar &amp; ujian ke mata kuliah</p>
            <p>
              Ditentukan oleh <b>Kategori Tugas Akhir &amp; Lapangan</b> pada mata kuliah (menu Kurikulum &amp; Mata Kuliah): kategori <b>Seminar Proposal</b> menerima
              nilai seminar proposal, dan kategori <b>Skripsi/TA</b> menerima nilai ujian skripsi. Nilai ditulis ke KRS mahasiswa pada mata kuliah itu.
            </p>
            <p>
              Bila prodi tidak punya mata kuliah berkategori <b>Seminar Proposal</b>, seminar hanya menjadi syarat melanjutkan ke skripsi (tanpa nilai).
              KRS tidak pernah dibuat otomatis; nilai ditahan sampai mahasiswa mengambil mata kuliahnya.
            </p>
          </div>
          <div className="flex justify-end">
            <button disabled={settingsBusy} onClick={saveSettings} className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer">
              {settingsBusy && <RefreshCw className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </div>
        </div>
      </Modal>

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
            supervisorLoad={supervisorLoad}
            onDone={(text) => {
              notify(true, text);
              table.reload();
              loadSupervisorLoad();
              window.dispatchEvent(new Event('siakad:thesis-updated'));
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
  supervisorLoad,
  onDone,
  onError,
}: {
  project: ThesisProject;
  lecturers: LecturerOption[];
  supervisorLoad: Record<string, number>;
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
      const res: any = await fn();
      onDone(res?.warnings?.length ? `${okText} Perhatian: ${res.warnings.join(' ')}` : okText);
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
              <SearchableSelect
                value={s1}
                onChange={setS1}
                options={lecturers.map((l) => ({ value: l.id, label: `${lecturerLabel(l)} — membimbing ${supervisorLoad[l.id] ?? 0}` }))}
                placeholder="-- Pilih dosen --"
                searchPlaceholder="Cari nama dosen..."
              />
            </div>
            <div>
              <label className={labelCls}>Pembimbing 2 (opsional)</label>
              <SearchableSelect
                value={s2}
                onChange={setS2}
                options={lecturers
                  .filter((l) => l.id !== s1)
                  .map((l) => ({ value: l.id, label: `${lecturerLabel(l)} — membimbing ${supervisorLoad[l.id] ?? 0}` }))}
                placeholder="-- Tanpa pembimbing 2 --"
                searchPlaceholder="Cari nama dosen..."
                emptyLabel="-- Tanpa pembimbing 2 --"
              />
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
  // Ruang diambil dari master ruang (nama ruang + gedung)
  const [rooms, setRooms] = useState<{ id: string; name: string; buildingName: string; capacity: number }[]>([]);
  useEffect(() => {
    examsFetch<{ rooms: { id: string; name: string; buildingName: string; capacity: number }[] }>('/admin/options')
      .then((d) => setRooms(d.rooms))
      .catch(() => undefined);
  }, []);
  const roomLabel = (r: { name: string; buildingName: string }) => `${r.name} (${r.buildingName})`;
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
        {defense.gradeSyncNote && (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 text-[12px] rounded-lg px-3 py-2 border ${
              defense.gradeSyncedAt && defense.gradeSyncNote.startsWith('Nilai ')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : defense.gradeSyncedAt
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span>{defense.gradeSyncNote}</span>
            {!defense.gradeSyncedAt && (
              <button
                disabled={busy}
                onClick={() => run(() => thesisFetch(`/admin/defenses/${defense.id}/grade`, { method: 'POST' }), 'Penerapan nilai dicoba ulang.')}
                className="font-bold underline cursor-pointer"
              >
                Coba terapkan
              </button>
            )}
          </div>
        )}
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
            <select className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">-- Pilih ruang --</option>
              {location && !rooms.some((r) => roomLabel(r) === location) && <option value={location}>{location}</option>}
              {rooms.map((r) => (
                <option key={r.id} value={roomLabel(r)}>
                  {roomLabel(r)} · kap. {r.capacity}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Dipilih dari master ruang.</p>
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
