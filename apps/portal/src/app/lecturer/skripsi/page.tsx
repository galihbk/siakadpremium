'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  ThesisProject,
  THESIS_STAGE_LABEL,
  DEFENSE_TYPE_LABEL,
  DEFENSE_RESULT_LABEL,
  thesisStageTone,
  formatDateTime,
  thesisFetch,
} from '@/lib/thesis';
import { GraduationCap, CheckCircle2, AlertTriangle, RefreshCw, X, Search, MessageSquare, CalendarDays, Check } from 'lucide-react';

interface LecturerProject extends ThesisProject {
  myRole: 'PEMBIMBING' | 'PENGUJI';
  iHaveApproved: ('PROPOSAL' | 'SKRIPSI')[];
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

export default function LecturerSkripsiPage() {
  const user = getAuthSession().user;
  const [items, setItems] = useState<LecturerProject[]>([]);
  const [lecturerId, setLecturerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PEMBIMBING' | 'PENGUJI'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await thesisFetch<{ lecturerId: string; items: LecturerProject[] }>('/lecturer');
      setItems(data.items);
      setLecturerId(data.lecturerId);
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat data bimbingan skripsi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (key: string, fn: () => Promise<unknown>, okText: string) => {
    setBusyKey(key);
    try {
      await fn();
      notify(true, okText);
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setBusyKey(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (roleFilter !== 'ALL' && p.myRole !== roleFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.student?.name || '').toLowerCase().includes(q) ||
        (p.student?.nim || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, roleFilter]);

  const pendingCount = (p: LecturerProject) =>
    p.guidances.filter((g) => g.status === 'SUBMITTED' && (g.lecturerId === lecturerId || !g.lecturerId)).length;
  const totalPending = items.reduce((n, p) => (p.myRole === 'PEMBIMBING' ? n + pendingCount(p) : n), 0);

  return (
    <PortalLayout role="lecturer" userName={user?.fullName || 'Dosen'} userIdText="Bimbingan Skripsi / Tugas Akhir">
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

        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Bimbingan Skripsi</h1>
                <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
                  Tanggapi catatan bimbingan mahasiswa, beri ACC proposal/skripsi, dan lihat jadwal seminar atau ujian yang Anda
                  uji.
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 min-w-[170px]">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Menunggu Tanggapan</p>
              <p className="text-2xl font-black mt-1">{totalPending}</p>
              <p className="text-[10px] text-slate-300 mt-1">{items.length} mahasiswa terkait</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Cari NIM, nama, atau judul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={`${inputCls} sm:w-48`} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
            <option value="ALL">Semua peran</option>
            <option value="PEMBIMBING">Sebagai pembimbing</option>
            <option value="PENGUJI">Sebagai penguji</option>
          </select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
            Belum ada mahasiswa bimbingan atau ujian skripsi yang cocok.
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((p) => {
              const open = expanded === p.id;
              const isSupervisor = p.myRole === 'PEMBIMBING';
              const phase = p.stage === 'PROPOSAL_GUIDANCE' ? 'PROPOSAL' : p.stage === 'SKRIPSI_GUIDANCE' ? 'SKRIPSI' : null;
              const alreadyApproved = phase ? p.iHaveApproved.includes(phase) : false;
              const pending = pendingCount(p);
              return (
                <li key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpanded(open ? null : p.id)}
                    className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between cursor-pointer hover:bg-slate-50/60"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900">
                        {p.student?.name} <span className="font-mono text-[#1E3A8A]">({p.student?.nim})</span>
                      </p>
                      <p className="text-[12px] text-slate-600 truncate">{p.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.student?.studyProgram}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-100 text-slate-600 border-slate-200">
                        {p.myRole === 'PEMBIMBING' ? 'Pembimbing' : 'Penguji'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${thesisStageTone(p.stage)}`}>
                        {THESIS_STAGE_LABEL[p.stage]}
                      </span>
                      {isSupervisor && pending > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                          {pending} menunggu tanggapan
                        </span>
                      )}
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 p-5 space-y-5">
                      {/* ACC */}
                      {isSupervisor && phase && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
                          <p className="text-[13px] text-teal-900">
                            {alreadyApproved ? (
                              <>
                                Anda sudah memberi <b>ACC {phase === 'PROPOSAL' ? 'proposal' : 'skripsi'}</b>
                                {p.supervisor2 ? ' -- menunggu pembimbing lainnya.' : '.'}
                              </>
                            ) : (
                              <>
                                Setelah bimbingan memadai, beri <b>ACC {phase === 'PROPOSAL' ? 'proposal' : 'skripsi'}</b> agar
                                mahasiswa dapat mendaftar {phase === 'PROPOSAL' ? 'seminar proposal' : 'ujian skripsi'}.
                              </>
                            )}
                          </p>
                          {!alreadyApproved && (
                            <button
                              disabled={busyKey === `acc-${p.id}`}
                              onClick={() =>
                                act(
                                  `acc-${p.id}`,
                                  () => thesisFetch(`/lecturer/${p.id}/approve`, { method: 'POST', body: { phase } }),
                                  `ACC ${phase === 'PROPOSAL' ? 'proposal' : 'skripsi'} diberikan.`
                                )
                              }
                              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-60 cursor-pointer shrink-0"
                            >
                              {busyKey === `acc-${p.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              ACC {phase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Seminar / ujian */}
                      {p.defenses.length > 0 && (
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <CalendarDays className="w-4 h-4" /> Seminar &amp; Ujian
                          </p>
                          <ul className="grid sm:grid-cols-2 gap-3">
                            {p.defenses.map((d) => (
                              <li key={d.id} className="border border-slate-200 rounded-xl p-3 text-[13px] space-y-0.5">
                                <p className="font-bold text-slate-900">{DEFENSE_TYPE_LABEL[d.type]}</p>
                                <p className="text-slate-600">{d.scheduledAt ? formatDateTime(d.scheduledAt) : 'Belum dijadwalkan'}</p>
                                {d.location && <p className="text-slate-500">Ruang: {d.location}</p>}
                                {d.examiners.length > 0 && (
                                  <p className="text-slate-500 text-[12px]">
                                    Penguji: {d.examiners.map((e) => e.name + (e.role === 'KETUA' ? ' (Ketua)' : '')).join(', ')}
                                  </p>
                                )}
                                {d.status === 'DONE' && d.result && (
                                  <p className="text-[12px] font-bold text-slate-800">
                                    Hasil: {DEFENSE_RESULT_LABEL[d.result]}
                                    {d.score !== null ? ` · ${d.score} (${d.gradeLetter})` : ''}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Bimbingan */}
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <MessageSquare className="w-4 h-4" /> Catatan Bimbingan ({p.guidances.length})
                        </p>
                        {p.guidances.length === 0 ? (
                          <p className="text-[13px] text-slate-400">Belum ada catatan bimbingan.</p>
                        ) : (
                          <ul className="space-y-3">
                            {p.guidances.map((g) => {
                              const canReply = isSupervisor && (!g.lecturerId || g.lecturerId === lecturerId || p.supervisorIds.includes(lecturerId));
                              return (
                                <li key={g.id} className="border border-slate-200 rounded-xl p-3 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-[13px] font-bold text-slate-900">{g.topic}</p>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                        g.status === 'REVIEWED'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}
                                    >
                                      {g.status === 'REVIEWED' ? 'Sudah ditanggapi' : 'Menunggu tanggapan'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {g.phase === 'PROPOSAL' ? 'Proposal' : 'Skripsi'} · {formatDateTime(g.meetingDate)}
                                    {g.lecturerName ? ` · ke ${g.lecturerName}` : ''}
                                  </p>
                                  {g.notes && <p className="text-[13px] text-slate-600 whitespace-pre-line">{g.notes}</p>}
                                  {g.fileUrl && (
                                    <a href={g.fileUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-[#1E3A8A] underline">
                                      Buka berkas
                                    </a>
                                  )}
                                  {g.feedback && (
                                    <div className="text-[13px] bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-blue-900">
                                      <b>Tanggapan:</b> {g.feedback}
                                    </div>
                                  )}
                                  {canReply && g.status === 'SUBMITTED' && (
                                    <div className="flex gap-2 items-start">
                                      <textarea
                                        rows={2}
                                        className={inputCls}
                                        placeholder="Tulis tanggapan / arahan revisi..."
                                        value={feedbackDraft[g.id] || ''}
                                        onChange={(e) => setFeedbackDraft((prev) => ({ ...prev, [g.id]: e.target.value }))}
                                      />
                                      <button
                                        disabled={busyKey === `fb-${g.id}` || (feedbackDraft[g.id] || '').trim().length < 2}
                                        onClick={() =>
                                          act(
                                            `fb-${g.id}`,
                                            () =>
                                              thesisFetch(`/lecturer/guidance/${g.id}/review`, {
                                                method: 'POST',
                                                body: { feedback: feedbackDraft[g.id] },
                                              }),
                                            'Tanggapan terkirim ke mahasiswa.'
                                          )
                                        }
                                        className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer shrink-0"
                                      >
                                        Kirim
                                      </button>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PortalLayout>
  );
}
