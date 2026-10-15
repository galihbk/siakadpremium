'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  ThesisProject,
  THESIS_STAGE_ORDER,
  THESIS_STAGE_LABEL,
  DEFENSE_TYPE_LABEL,
  DEFENSE_RESULT_LABEL,
  thesisStageTone,
  formatDate,
  formatDateTime,
  thesisFetch,
} from '@/lib/thesis';
import {
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
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [guidanceFile, setGuidanceFile] = useState('');
  const [guidanceLecturer, setGuidanceLecturer] = useState('');
  // form daftar sidang
  const [defenseFile, setDefenseFile] = useState('');

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

  const addGuidance = () =>
    run(
      () =>
        thesisFetch('/me/guidance', {
          method: 'POST',
          body: { topic, notes, fileUrl: guidanceFile, lecturerId: guidanceLecturer || undefined },
        }),
      'Catatan bimbingan terkirim ke dosen pembimbing.',
      () => {
        setTopic('');
        setNotes('');
        setGuidanceFile('');
      }
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
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tautan Berkas Proposal (opsional)</label>
                    <input className={inputCls} value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." />
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
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                      <div>
                        <h2 className="font-bold text-sm text-slate-900">
                          Catat Bimbingan {currentPhase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'}
                        </h2>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                          Dosen pembimbing akan menanggapi catatan Anda. Setelah semua pembimbing memberi ACC, Anda bisa mendaftar{' '}
                          {currentPhase === 'PROPOSAL' ? 'seminar proposal' : 'ujian skripsi'}.
                        </p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Topik Bimbingan</label>
                          <input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="mis. Revisi Bab 2 Tinjauan Pustaka" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Uraian / Pertanyaan</label>
                          <textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Dosen Pembimbing</label>
                          <select className={inputCls} value={guidanceLecturer} onChange={(e) => setGuidanceLecturer(e.target.value)}>
                            <option value="">Pembimbing 1 (default)</option>
                            {supervisors.map((s) => (
                              <option key={s!.id} value={s!.id}>
                                {s!.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tautan Berkas (opsional)</label>
                          <input className={inputCls} value={guidanceFile} onChange={(e) => setGuidanceFile(e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                      <button
                        onClick={addGuidance}
                        disabled={busy || topic.trim().length < 3}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer"
                      >
                        {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Kirim ke Pembimbing
                      </button>
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
                          Tautan Naskah {project.stage === 'PROPOSAL_APPROVED' ? 'Proposal' : 'Skripsi'} (opsional)
                        </label>
                        <input className={inputCls} value={defenseFile} onChange={(e) => setDefenseFile(e.target.value)} placeholder="https://..." />
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
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <MessageSquare className="w-4 h-4" /> Riwayat Bimbingan ({project.guidances.length})
                    </div>
                    {project.guidances.length === 0 ? (
                      <p className="text-[13px] text-slate-400">Belum ada catatan bimbingan.</p>
                    ) : (
                      <ul className="space-y-3">
                        {project.guidances.map((g) => (
                          <li key={g.id} className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                              <p className="text-[13px] font-bold text-slate-900">{g.topic}</p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  g.status === 'REVIEWED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {g.status === 'REVIEWED' ? 'Sudah ditanggapi' : 'Menunggu tanggapan'}
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
