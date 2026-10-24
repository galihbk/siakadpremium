'use client';

import { FileUploadField } from '@/components/ui/FileUploadField';
import { useInstitution } from '@/lib/useInstitution';
import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  ThesisProject,
  ThesisSettings,
  DEFAULT_THESIS_SETTINGS,
  guidanceCounts,
  THESIS_STAGE_ORDER,
  THESIS_STAGE_LABEL,
  DEFENSE_TYPE_LABEL,
  DEFENSE_RESULT_LABEL,
  thesisStageTone,
  formatDate,
  formatDateTime,
  thesisFetch,
} from '@/lib/thesis';
import { Download,
  GraduationCap,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw,
  MessageSquare,
  CalendarDays,
  Users,
  Award,
  X,
  FileText,
} from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

export default function StudentSkripsiPage() {
  const user = getAuthSession().user;
  const [project, setProject] = useState<ThesisProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  // form proposal
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  // form bimbingan
  const [settings, setSettings] = useState<ThesisSettings>(DEFAULT_THESIS_SETTINGS);
  // form daftar sidang
  const [defenseFile, setDefenseFile] = useState('');

  useEffect(() => {
    thesisFetch<ThesisSettings>('/settings').then(setSettings).catch(() => undefined);
  }, []);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await thesisFetch<{ project: ThesisProject | null }>('/me');
      setProject(data.project);
      if (data.project) {
        setTitle(data.project.title);
        setAbstract(data.project.abstract || '');
        setFileUrl(data.project.proposalFileUrl || '');
      }
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat data tugas akhir.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, okText: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      notify(true, okText);
      after?.();
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const submitProposal = () =>
    run(
      () => thesisFetch('/me/proposal', { method: 'POST', body: { title, abstract, fileUrl } }),
      'Proposal berhasil diajukan. Menunggu plotting dosen pembimbing oleh BAAK.'
    );

  const registerDefense = (type: 'SEMPRO' | 'UJIAN') =>
    run(
      () => thesisFetch('/me/defense', { method: 'POST', body: { type, fileUrl: defenseFile } }),
      type === 'SEMPRO' ? 'Pendaftaran seminar proposal terkirim.' : 'Pendaftaran ujian skripsi terkirim.',
      () => setDefenseFile('')
    );

  const stage = project?.stage;
  const stageIndex = stage ? THESIS_STAGE_ORDER.indexOf(stage) : -1;
  const inGuidance = stage === 'PROPOSAL_GUIDANCE' || stage === 'SKRIPSI_GUIDANCE';
  const currentPhase = stage === 'SKRIPSI_GUIDANCE' ? 'SKRIPSI' : 'PROPOSAL';
  const supervisors = project ? [project.supervisor1, project.supervisor2].filter(Boolean) : [];
  const institution = useInstitution();
  const [cardBusy, setCardBusy] = useState(false);
  const stageIdx = project ? THESIS_STAGE_ORDER.indexOf(project.stage) : -1;
  const canCardProposal = stageIdx >= THESIS_STAGE_ORDER.indexOf('PROPOSAL_APPROVED');
  const canCardSkripsi = stageIdx >= THESIS_STAGE_ORDER.indexOf('SKRIPSI_APPROVED');
  const downloadCard = async (phase: 'PROPOSAL' | 'SKRIPSI') => {
    if (!project) return;
    setCardBusy(true);
    try {
      const { downloadGuidanceCardPdf } = await import('@/lib/academicPdf');
      const label = phase === 'PROPOSAL' ? 'Proposal' : 'Skripsi';
      const sessionsOf = (lecturerId: string) =>
        project.guidances
          .filter((g) => g.phase === phase && g.status !== 'SUBMITTED' && g.lecturerId === lecturerId)
          .sort((x, y) => new Date(x.meetingDate).getTime() - new Date(y.meetingDate).getTime())
          .map((g) => ({
            date: new Date(g.meetingDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            chapter: g.chapter || g.topic,
            notes: [g.notes, g.feedback].filter(Boolean).join(' — '),
          }));
      const approvals = project.approvals.filter((a) => a.phase === phase).map((a) => new Date(a.approvedAt).getTime());
      const approvedAt = approvals.length
        ? new Date(Math.max(...approvals)).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;
      await downloadGuidanceCardPdf({
        inst: institution,
        phaseLabel: label,
        student: { name: project.student?.name || user?.fullName || '-', nim: project.student?.nim || '-', prodi: project.student?.studyProgram || '-' },
        title: project.title,
        supervisors: [
          project.supervisor1 ? { role: 'Pembimbing 1', name: project.supervisor1.name || '-', sessions: sessionsOf(project.supervisor1.id) } : null,
          project.supervisor2 ? { role: 'Pembimbing 2', name: project.supervisor2.name || '-', sessions: sessionsOf(project.supervisor2.id) } : null,
        ].filter(Boolean) as { role: string; name: string; sessions: { date: string; chapter: string; notes: string }[] }[],
        approvedAt,
        filename: `Kartu-Bimbingan-${label}-${project.student?.nim || 'mahasiswa'}.pdf`,
      });
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal membuat kartu bimbingan.');
    } finally {
      setCardBusy(false);
    }
  };
  const supervisorRows = project
    ? ([
        project.supervisor1 ? { role: 'Pembimbing 1', ref: project.supervisor1 } : null,
        project.supervisor2 ? { role: 'Pembimbing 2', ref: project.supervisor2 } : null,
      ].filter(Boolean) as { role: string; ref: { id: string; name: string | null } }[])
    : [];
  const doneOf = (lecturerId: string) =>
    project ? project.guidances.filter((g) => g.phase === currentPhase && g.lecturerId === lecturerId && guidanceCounts(g)).length : 0;
  // Riwayat bimbingan ditampilkan per pembimbing dalam tab
  // Riwayat bimbingan: tab tahap (Proposal | Skripsi), lalu tab per pembimbing
  const hasSkripsiPhase = stageIdx >= THESIS_STAGE_ORDER.indexOf('SKRIPSI_GUIDANCE') || (project?.guidances.some((g) => g.phase === 'SKRIPSI') ?? false);
  const [phaseTab, setPhaseTab] = useState<'PROPOSAL' | 'SKRIPSI' | ''>('');
  const historyPhase: 'PROPOSAL' | 'SKRIPSI' = phaseTab === 'SKRIPSI' && hasSkripsiPhase ? 'SKRIPSI' : phaseTab === 'PROPOSAL' ? 'PROPOSAL' : hasSkripsiPhase ? 'SKRIPSI' : 'PROPOSAL';
  const phaseGuidances = project ? project.guidances.filter((g) => g.phase === historyPhase) : [];
  const [historyTab, setHistoryTab] = useState('');
  const historyGroups = project
    ? [
        ...supervisorRows.map((sv) => ({ key: sv.ref.id, label: `${sv.role} · ${sv.ref.name}`, items: phaseGuidances.filter((g) => g.lecturerId === sv.ref.id) })),
        { key: 'lain', label: 'Catatan lain', items: phaseGuidances.filter((g) => !supervisorRows.some((sv) => sv.ref.id === g.lecturerId)) },
      ].filter((grp) => grp.items.length > 0 || grp.key !== 'lain')
    : [];
  const activeHistory = historyGroups.some((grp) => grp.key === historyTab) ? historyTab : historyGroups[0]?.key;
  const minRequired = Math.max(1, currentPhase === 'PROPOSAL' ? settings.minGuidanceProposal : settings.minGuidanceSkripsi);

  const stepNote = (s: (typeof THESIS_STAGE_ORDER)[number]) => {
    if (!project) return '';
    if (s === 'PROPOSAL_GUIDANCE' && project.supervisor1) return `Pembimbing: ${project.supervisor1.name}`;
    return '';
  };

  return (
    <PortalLayout
      role="student"
      userName={user?.fullName || 'Mahasiswa'}
      userIdText={user?.nim ? `NIM: ${user.nim}` : 'Portal Mahasiswa'}
    >
      <div className="space-y-6 pb-12">
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${
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

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Tugas Akhir / Skripsi</h1>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed max-w-2xl">
                Ajukan proposal, jalani bimbingan dengan dosen pembimbing, daftar seminar proposal dan ujian skripsi, lalu pantau
                nilai akhir Anda di satu tempat.
              </p>
              {project && (
                <span className={`inline-flex mt-3 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${thesisStageTone(project.stage)}`}>
                  {THESIS_STAGE_LABEL[project.stage]}
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat...</div>
        ) : (
          <>
            {/* Stepper */}
            {project && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
                <ol className="flex items-start gap-0 min-w-[900px]">
                  {THESIS_STAGE_ORDER.map((s, i) => {
                    const done = project.stage === 'COMPLETED' || i < stageIndex;
                    const current = i === stageIndex && project.stage !== 'COMPLETED';
                    return (
                      <li key={s} className="flex-1 flex flex-col items-center text-center px-1">
                        <div className="flex items-center w-full">
                          <div className={`h-0.5 flex-1 ${i === 0 ? 'bg-transparent' : done || current ? 'bg-[#1E3A8A]' : 'bg-slate-200'}`} />
                          {done ? (
                            <CheckCircle2 className="w-6 h-6 text-[#1E3A8A] shrink-0" />
                          ) : current ? (
                            <Clock className="w-6 h-6 text-amber-500 shrink-0" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300 shrink-0" />
                          )}
                          <div
                            className={`h-0.5 flex-1 ${
                              i === THESIS_STAGE_ORDER.length - 1 ? 'bg-transparent' : done ? 'bg-[#1E3A8A]' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                        <p className={`mt-2 text-[10px] font-bold leading-tight ${current ? 'text-amber-600' : done ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
                          {THESIS_STAGE_LABEL[s]}
                        </p>
                        {stepNote(s) && <p className="text-[9px] text-slate-400 mt-0.5">{stepNote(s)}</p>}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Pengajuan / pengajuan ulang proposal */}
            {(!project || project.stage === 'PROPOSAL_REJECTED') && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    {project ? 'Ajukan Ulang Proposal' : 'Ajukan Proposal Tugas Akhir'}
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Setelah diajukan, BAAK akan menetapkan dosen pembimbing. Anda baru bisa bimbingan setelah itu.
                  </p>
                </div>
                {project?.adminNote && (
                  <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <b>Alasan penolakan:</b> {project.adminNote}
                    </span>
                  </div>
                )}
                <div className="grid gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Judul Proposal</label>
                    <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul tugas akhir" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Abstrak / Latar Belakang Singkat</label>
                    <textarea className={inputCls} rows={4} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Berkas Proposal (opsional)</label>
                    <FileUploadField value={fileUrl} onChange={setFileUrl} folder="thesis" />
                  </div>
                </div>
                <button
                  onClick={submitProposal}
                  disabled={busy || title.trim().length < 10}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {project ? 'Ajukan Ulang' : 'Ajukan Proposal'}
                </button>
              </div>
            )}

            {project && project.stage !== 'PROPOSAL_REJECTED' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Kolom utama */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Ringkasan proposal */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <FileText className="w-4 h-4" /> Judul Tugas Akhir
                    </div>
                    <p className="font-bold text-slate-900">{project.title}</p>
                    {project.abstract && <p className="text-[13px] text-slate-600 whitespace-pre-line">{project.abstract}</p>}
                    <p className="text-[11px] text-slate-400">Diajukan {formatDate(project.submittedAt)}</p>
                  </div>

                  {/* Aksi sesuai tahap */}
                  {project.stage === 'PROPOSAL_SUBMITTED' && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl border bg-blue-50 border-blue-200 text-blue-800 text-[13px]">
                      <Clock className="w-5 h-5 shrink-0" />
                      <span>
                        Proposal Anda sedang menunggu <b>plotting dosen pembimbing</b> oleh BAAK. Anda akan dapat mulai bimbingan
                        setelah pembimbing ditetapkan.
                      </span>
                    </div>
                  )}

                  {inGuidance && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-[13px] text-blue-900 space-y-1">
                      <p className="font-bold">
                        Bimbingan {currentPhase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'} (minimal {minRequired} catatan per pembimbing)
                      </p>
                      <ul className="space-y-0.5">
                        {supervisorRows.map((sv) => {
                          const n = doneOf(sv.ref.id);
                          return (
                            <li key={sv.ref.id}>
                              {sv.role} <b>{sv.ref.name}</b>: <b className={n >= minRequired ? 'text-emerald-700' : 'text-amber-700'}>{n}</b> dari {minRequired}
                            </li>
                          );
                        })}
                      </ul>
                      <p className="text-blue-800">
                        Catatan bimbingan diisi oleh dosen pembimbing setelah Anda bimbingan. Setelah syarat bimbingan terpenuhi dan semua
                        pembimbing memberi ACC, Anda bisa mendaftar {currentPhase === 'PROPOSAL' ? 'seminar proposal' : 'ujian skripsi'}.
                      </p>
                    </div>
                  )}

                  {(project.stage === 'PROPOSAL_APPROVED' || project.stage === 'SKRIPSI_APPROVED') && (
                    <div className="bg-white rounded-2xl border border-teal-200 p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <h2 className="font-bold text-sm text-slate-900">
                            {project.stage === 'PROPOSAL_APPROVED' ? 'Proposal Anda sudah di-ACC' : 'Skripsi Anda sudah di-ACC'}
                          </h2>
                          <p className="text-[12px] text-slate-500 mt-0.5">
                            Silakan daftar {project.stage === 'PROPOSAL_APPROVED' ? 'seminar proposal' : 'ujian skripsi'}. BAAK akan
                            menetapkan jadwal dan dosen penguji.
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Berkas Naskah {project.stage === 'PROPOSAL_APPROVED' ? 'Proposal' : 'Skripsi'} (opsional)
                        </label>
                        <FileUploadField value={defenseFile} onChange={setDefenseFile} folder="thesis" />
                      </div>
                      <button
                        onClick={() => registerDefense(project.stage === 'PROPOSAL_APPROVED' ? 'SEMPRO' : 'UJIAN')}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-60 cursor-pointer"
                      >
                        {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                        {project.stage === 'PROPOSAL_APPROVED' ? 'Daftar Seminar Proposal' : 'Daftar Ujian Skripsi'}
                      </button>
                    </div>
                  )}

                  {(project.stage === 'SEMPRO_REGISTERED' || project.stage === 'UJIAN_REGISTERED') && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl border bg-amber-50 border-amber-200 text-amber-800 text-[13px]">
                      <Clock className="w-5 h-5 shrink-0" />
                      <span>
                        Pendaftaran{' '}
                        {project.stage === 'SEMPRO_REGISTERED' ? 'seminar proposal' : 'ujian skripsi'} sudah diterima. Menunggu BAAK
                        menetapkan <b>jadwal dan dosen penguji</b>.
                      </span>
                    </div>
                  )}

                  {project.stage === 'COMPLETED' && (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 flex items-center gap-4">
                      <Award className="w-10 h-10 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Tugas Akhir Selesai</p>
                        <p className="text-2xl font-black text-emerald-800">
                          {project.finalGrade || '-'}{' '}
                          <span className="text-base font-bold">({project.finalScore ?? '-'})</span>
                        </p>
                        <p className="text-[11px] text-emerald-700">Diselesaikan {formatDate(project.completedAt)}</p>
                      </div>
                    </div>
                  )}

                  {/* Riwayat bimbingan */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <MessageSquare className="w-4 h-4" /> Riwayat Bimbingan
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {((historyPhase === 'PROPOSAL' && canCardProposal) || (historyPhase === 'SKRIPSI' && canCardSkripsi)) && (
                          <button
                            disabled={cardBusy}
                            onClick={() => downloadCard(historyPhase)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg disabled:opacity-60 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Kartu Bimbingan {historyPhase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Tab tahap */}
                    <div className="flex gap-2">
                      {(['PROPOSAL', ...(hasSkripsiPhase ? ['SKRIPSI'] : [])] as ('PROPOSAL' | 'SKRIPSI')[]).map((ph) => (
                        <button
                          key={ph}
                          type="button"
                          onClick={() => {
                            setPhaseTab(ph);
                            setHistoryTab('');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                            historyPhase === ph ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Bimbingan {ph === 'PROPOSAL' ? 'Proposal' : 'Skripsi'} ({project.guidances.filter((g) => g.phase === ph).length})
                        </button>
                      ))}
                    </div>
                    {phaseGuidances.length === 0 ? (
                      <p className="text-[13px] text-slate-400">Belum ada catatan bimbingan {historyPhase === 'PROPOSAL' ? 'proposal' : 'skripsi'}.</p>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                          {historyGroups.map((grp) => (
                            <button
                              key={grp.key}
                              type="button"
                              onClick={() => setHistoryTab(grp.key)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                activeHistory === grp.key
                                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {grp.label} ({grp.items.length})
                            </button>
                          ))}
                        </div>
                        {historyGroups
                          .filter((grp) => grp.key === activeHistory)
                          .map((grp) => (

                            <div key={grp.key} className="space-y-2">
                              <p className="text-[12px] font-bold text-slate-700">
                                {grp.label} <span className="font-normal text-slate-400">({grp.items.length} catatan)</span>
                              </p>
                              {grp.items.length === 0 ? (
                                <p className="text-[13px] text-slate-400">Belum ada catatan dari pembimbing ini.</p>
                              ) : (
                                <ul className="space-y-3">
                                  {grp.items.map((g) => (
                                    <li key={g.id} className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                              <p className="text-[13px] font-bold text-slate-900">{g.chapter || g.topic}</p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  g.status === 'SUBMITTED'
                                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {g.status === 'RECORDED' ? 'Dicatat dosen' : g.status === 'REVIEWED' ? 'Sudah ditanggapi' : 'Menunggu tanggapan'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {g.phase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'} · {formatDateTime(g.meetingDate)}
                              {g.lecturerName ? ` · ${g.lecturerName}` : ''}
                            </p>
                            {g.notes && <p className="text-[13px] text-slate-600 whitespace-pre-line">{g.notes}</p>}
                            {g.feedback && (
                              <div className="text-[13px] bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-blue-900">
                                <b>Tanggapan pembimbing:</b> {g.feedback}
                              </div>
                            )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Kolom samping */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Users className="w-4 h-4" /> Dosen Pembimbing
                    </div>
                    {supervisors.length === 0 ? (
                      <p className="text-[13px] text-slate-400">Belum ditetapkan.</p>
                    ) : (
                      <ul className="space-y-2">
                        {supervisors.map((s, i) => {
                          const approvedPhases = project.approvals.filter((a) => a.lecturerId === s!.id).map((a) => a.phase);
                          return (
                            <li key={s!.id} className="text-[13px]">
                              <p className="font-bold text-slate-900">{s!.name}</p>
                              <p className="text-[11px] text-slate-400">
                                Pembimbing {i + 1}
                                {s!.nidn ? ` · ${s!.nidn}` : ''}
                              </p>
                              <div className="flex gap-1.5 mt-1">
                                {approvedPhases.includes('PROPOSAL') && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">ACC Proposal</span>
                                )}
                                {approvedPhases.includes('SKRIPSI') && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">ACC Skripsi</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <CalendarDays className="w-4 h-4" /> Seminar &amp; Ujian
                    </div>
                    {project.defenses.length === 0 ? (
                      <p className="text-[13px] text-slate-400">Belum ada pendaftaran.</p>
                    ) : (
                      <ul className="space-y-3">
                        {project.defenses.map((d) => (
                          <li key={d.id} className="border border-slate-200 rounded-xl p-3 text-[13px] space-y-1">
                            <p className="font-bold text-slate-900">{DEFENSE_TYPE_LABEL[d.type]}</p>
                            <p className="text-[11px] text-slate-400">Daftar {formatDate(d.registeredAt)}</p>
                            {d.scheduledAt ? (
                              <>
                                <p className="text-slate-700">{formatDateTime(d.scheduledAt)}</p>
                                <p className="text-slate-500">Ruang: {d.location || '-'}</p>
                                <div className="text-slate-500">
                                  Penguji:
                                  <ul className="list-disc ml-5">
                                    {d.examiners.map((e) => (
                                      <li key={e.lecturerId}>
                                        {e.name} {e.role === 'KETUA' ? '(Ketua)' : ''}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            ) : (
                              <p className="text-amber-600 text-[12px]">Menunggu jadwal dari BAAK</p>
                            )}
                            {d.status === 'DONE' && (
                              <div className="mt-1 text-[12px] font-bold text-slate-800">
                                Hasil: {d.result ? DEFENSE_RESULT_LABEL[d.result] : '-'}
                                {d.score !== null ? ` · Nilai ${d.score} (${d.gradeLetter})` : ''}
                                {d.notes && <p className="font-normal text-slate-500 mt-0.5">{d.notes}</p>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
