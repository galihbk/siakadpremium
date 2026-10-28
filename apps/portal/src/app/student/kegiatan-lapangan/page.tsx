'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  FieldMode,
  PeriodState,
  RegistrationStatus,
  REGISTRATION_STATUS_LABEL,
  PERIOD_STATE_LABEL,
  ChargeStatus,
  CHARGE_STATUS_LABEL,
  chargeStatusTone,
  formatRupiah,
  fieldFetch,
  formatDay,
  periodStateTone,
  registrationStatusTone,
} from '@/lib/fieldActivity';
import { FieldHistoryEvent, FieldHistoryTable } from '@/components/field/FieldHistoryTable';
import { AlertTriangle, Briefcase, CheckCircle2, Clock, RefreshCw, Send, UserCheck, Users, X } from 'lucide-react';

interface MineItem {
  category: { id: string; name: string; isGroup: boolean; requiresRegistration: boolean; hasPartners: boolean; allowOwnPartner: boolean; feeAmount: number; feeLabel: string | null; minMembers: number; maxMembers: number; minLogbook: number; description: string | null };
  mode: FieldMode;
  courses: { id: string; code: string; name: string }[];
  period: { state: PeriodState; openAt: string | null; closeAt: string | null; notes: string | null } | null;
  partners: { id: string; name: string; address: string | null; contactName: string | null; contactPhone: string | null }[];
  registrations: {
    id: string;
    courseId: string;
    status: RegistrationStatus;
    partnerId: string | null;
    placeName: string;
    placeAddress: string | null;
    fieldSupervisorName: string | null;
    plan: string | null;
    adminNote: string | null;
    submittedAt: string;
  }[];
  group: { id: string; name: string; supervisorName: string | null; members: { nim: string; name: string }[] } | null;
  history: FieldHistoryEvent[];
  charges: { courseId: string; label: string; amount: number; invoiceNo: string; status: Exclude<ChargeStatus, 'NONE'> }[];
  supervisions: { courseId: string; supervisor1Name: string | null; supervisor2Name: string | null }[];
}

interface Mine {
  academicYearName: string | null;
  items: MineItem[];
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';
const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase mb-1';

// partnerId: '' (belum memilih) | id mitra dari daftar | OWN (mitra lain yang diisi sendiri)
const OWN = '__own';
const emptyForm = { courseId: '', partnerId: '', placeName: '', placeAddress: '', fieldSupervisorName: '', plan: '' };

function RegistrationCard({ item, onSaved, notify }: { item: MineItem; onSaved: () => void; notify: (ok: boolean, text: string) => void }) {
  const [form, setForm] = useState({ ...emptyForm, courseId: item.courses[0]?.id ?? '' });
  const [busy, setBusy] = useState(false);
  const state = item.period?.state ?? 'NOT_SET';
  const reg = item.registrations.find((r) => r.courseId === form.courseId);
  const sup = item.supervisions.find((s) => s.courseId === form.courseId);
  const course = item.courses.find((c) => c.id === form.courseId);

  // isi formulir dengan pendaftaran yang sudah ada (untuk diubah/diajukan ulang)
  useEffect(() => {
    setForm((f) => ({
      ...f,
      partnerId: reg?.partnerId ?? (reg && item.category.hasPartners ? OWN : ''),
      placeName: reg?.placeName ?? '',
      placeAddress: reg?.placeAddress ?? '',
      fieldSupervisorName: reg?.fieldSupervisorName ?? '',
      plan: reg?.plan ?? '',
    }));
  }, [reg?.id, reg?.status, form.courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Data pendaftaran dikunci selama menunggu/disetujui; formulir hanya muncul untuk pendaftaran baru atau yang ditolak.
  const canSubmit = state === 'OPEN' && (!reg || reg.status === 'REJECTED');
  // Tempat kegiatan: dari daftar mitra kampus, atau diisi sendiri (jenis tanpa mitra / yang membolehkan mitra lain)
  const { hasPartners, allowOwnPartner } = item.category;
  const pickedPartner = item.partners.find((p) => p.id === form.partnerId);
  const manual = !hasPartners || form.partnerId === OWN;
  const listEmptyBlocked = hasPartners && !allowOwnPartner && item.partners.length === 0;
  const needsChoice = hasPartners && !form.partnerId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { partnerId, ...rest } = form;
      const r = await fieldFetch<{ message: string }>('/me/registrations', {
        method: 'POST',
        body: partnerId && partnerId !== OWN ? { ...rest, partnerId, placeName: '', placeAddress: '' } : rest,
      });
      notify(true, r.message);
      onSaved();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal mengirim pendaftaran.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex font-bold px-2 py-0.5 rounded-md border ${periodStateTone(state)}`}>Pendaftaran {PERIOD_STATE_LABEL[state].toLowerCase()}</span>
        {item.period?.openAt && item.period.closeAt && (
          <span className="text-slate-500">
            {formatDay(item.period.openAt)} - {formatDay(item.period.closeAt)}
          </span>
        )}
      </div>
      {item.period?.notes && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{item.period.notes}</p>}
      {state === 'NOT_SET' && <p className="text-xs text-slate-500">Akademik belum membuka pendaftaran {item.category.name}. Anda akan mendapat pemberitahuan setelah dibuka.</p>}

      {item.courses.length > 1 && (
        <div>
          <label className={labelCls}>Mata kuliah</label>
          <select className={inputCls} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            {item.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {reg && (
        <div className={`rounded-xl border p-4 text-xs space-y-1.5 ${registrationStatusTone(reg.status)}`}>
          <p className="font-bold flex items-center gap-1.5">
            {reg.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : reg.status === 'REJECTED' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            Pendaftaran {REGISTRATION_STATUS_LABEL[reg.status].toLowerCase()}
          </p>
          <p className="text-slate-700">
            {reg.placeName}
            {reg.placeAddress ? `, ${reg.placeAddress}` : ''}
          </p>
          {reg.fieldSupervisorName && <p className="text-slate-600">Pembimbing lapangan: {reg.fieldSupervisorName}</p>}
          {reg.plan && <p className="text-slate-600 whitespace-pre-line">Rencana kegiatan: {reg.plan}</p>}
          {reg.status === 'PENDING' && <p className="text-slate-500">Data tidak dapat diubah selama pendaftaran diproses akademik.</p>}
          {reg.adminNote && <p className="text-slate-700">Catatan akademik: {reg.adminNote}</p>}
          {reg.status === 'APPROVED' && (
            <p className="text-slate-700 flex items-center gap-1.5 pt-1">
              <UserCheck className="w-3.5 h-3.5" />
              {item.mode === 'GROUP'
                ? 'Menunggu penempatan di kelompok oleh akademik.'
                : sup?.supervisor1Name
                  ? `Pembimbing: ${[sup.supervisor1Name, sup.supervisor2Name].filter(Boolean).join(' & ')}`
                  : 'Menunggu penetapan dosen pembimbing.'}
            </p>
          )}
        </div>
      )}

      {canSubmit && (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs font-bold text-slate-700">{reg ? 'Ajukan ulang' : `Formulir pendaftaran ${item.category.name}`}</p>
          {hasPartners && (
            <div>
              <label className={labelCls}>Mitra tujuan *</label>
              <select className={inputCls} value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} required>
                <option value="">Pilih mitra...</option>
                {item.partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {allowOwnPartner && <option value={OWN}>Mitra lain (isi sendiri)</option>}
              </select>
              {listEmptyBlocked && <p className="text-[11px] text-amber-700 mt-1">Akademik belum menyediakan daftar mitra untuk {item.category.name}. Pendaftaran dapat dilakukan setelah daftar tersedia.</p>}
              {!allowOwnPartner && !listEmptyBlocked && <p className="text-[11px] text-slate-500 mt-1">Untuk {item.category.name}, mitra hanya dapat dipilih dari daftar yang disediakan akademik.</p>}
            </div>
          )}
          {pickedPartner && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-slate-700">
              <p className="font-bold">{pickedPartner.name}</p>
              {pickedPartner.address && <p>{pickedPartner.address}</p>}
              {(pickedPartner.contactName || pickedPartner.contactPhone) && <p className="text-slate-500">Kontak: {[pickedPartner.contactName, pickedPartner.contactPhone].filter(Boolean).join(' - ')}</p>}
            </div>
          )}
          {manual && !needsChoice && (
            <>
              <div>
                <label className={labelCls}>{hasPartners ? 'Nama mitra lain *' : 'Nama tempat kegiatan *'}</label>
                <input className={inputCls} value={form.placeName} onChange={(e) => setForm({ ...form, placeName: e.target.value })} placeholder="Contoh: PT Maju Jaya" required />
              </div>
              <div>
                <label className={labelCls}>Alamat tempat kegiatan</label>
                <textarea rows={2} className={inputCls} value={form.placeAddress} onChange={(e) => setForm({ ...form, placeAddress: e.target.value })} />
              </div>
            </>
          )}
          <div>
            <label className={labelCls}>Nama pembimbing lapangan</label>
            <input className={inputCls} value={form.fieldSupervisorName} onChange={(e) => setForm({ ...form, fieldSupervisorName: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Rencana kegiatan</label>
            <textarea rows={3} className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Ringkasan kegiatan yang akan dilakukan" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={busy || listEmptyBlocked} className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-60 rounded-xl cursor-pointer">
              <Send className="w-3.5 h-3.5" /> {busy ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </div>
        </form>
      )}
      {!canSubmit && !reg && state === 'CLOSED' && course && <p className="text-xs text-slate-500">Pendaftaran {item.category.name} sudah ditutup.</p>}
    </div>
  );
}

export default function StudentKegiatanLapanganPage() {
  const [data, setData] = useState<Mine | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = useCallback((ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fieldFetch<Mine>('/me'));
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat kegiatan lapangan.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PortalLayout role="student" userName="" userIdText="">
      <div className="space-y-6 pb-12">
        {toast && (
          <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'}`}>
            {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="max-w-sm">{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Kegiatan Lapangan</h1>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed max-w-2xl">
                  PLP, KKN, Kerja Praktik, dan Magang: daftar, lihat kelompok, dan pantau dosen pembimbing Anda.
                  {data?.academicYearName && <> &bull; Tahun akademik {data.academicYearName}</>}
                </p>
              </div>
            </div>
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat...</div>
        ) : data && data.items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            Anda belum mengambil mata kuliah kegiatan lapangan (PLP, KKN, Kerja Praktik, atau Magang) di KRS tahun akademik aktif.
            Ambil mata kuliahnya di menu KRS terlebih dahulu.
          </div>
        ) : (
          data?.items.map((item) => {
            const sup = item.supervisions.find((s) => s.supervisor1Name);
            return (
              <section key={item.category.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black text-slate-900">{item.category.name}</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.courses.map((c) => `${c.code} - ${c.name}`).join(' | ')}</p>
                    {item.category.description && <p className="text-xs text-slate-600 mt-1">{item.category.description}</p>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E3A8A] border border-blue-100">
                    {item.category.isGroup ? (
                      <>
                        <Users className="w-3.5 h-3.5" /> Berkelompok {item.category.minMembers}-{item.category.maxMembers} orang
                      </>
                    ) : (
                      'Perorangan'
                    )}
                  </span>
                </div>
                <div className="p-5">
                  {item.category.feeAmount > 0 && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs space-y-1.5">
                      <p className="font-bold text-amber-900">
                        {item.category.feeLabel}: {formatRupiah(item.category.feeAmount)}
                      </p>
                      {item.charges.length === 0 ? (
                        <p className="text-slate-600">
                          Tagihan terbit otomatis saat KRS Anda disimpan dengan mata kuliah ini, terpisah dari tagihan UKT/SPP. Pembimbing atau kelompok baru ditetapkan setelah biaya lunas.
                        </p>
                      ) : (
                        item.charges.map((c) => (
                          <div key={c.courseId} className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex font-bold px-2 py-0.5 rounded-md border text-[10px] ${chargeStatusTone(c.status)}`}>{CHARGE_STATUS_LABEL[c.status]}</span>
                            <span className="text-slate-600">
                              {formatRupiah(c.amount)} &bull; {c.invoiceNo}
                              {item.courses.length > 1 ? ` (${item.courses.find((x) => x.id === c.courseId)?.code})` : ''}
                            </span>
                            {c.status === 'UNPAID' && (
                              <Link href="/student/keuangan" className="font-bold text-[#1E3A8A] underline">
                                Bayar di Tagihan &amp; Pembayaran
                              </Link>
                            )}
                            {c.status === 'VERIFYING' && <span className="text-slate-500">Bukti pembayaran sedang diverifikasi Keuangan.</span>}
                            {c.status === 'PAID' && <span className="text-emerald-700">Lunas. Anda dapat diproses ke tahap berikutnya.</span>}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {(item.mode === 'REGISTRATION' || (item.mode === 'GROUP' && item.category.requiresRegistration)) && (
                    <RegistrationCard item={item} onSaved={load} notify={notify} />
                  )}

                  {item.mode === 'GROUP' && (!item.category.requiresRegistration || item.registrations.some((r) => r.status === 'APPROVED') || item.group) && <div className={item.category.requiresRegistration ? 'mt-5 pt-5 border-t border-slate-100' : ''}>{
                    (item.group ? (
                      <div className="space-y-3 text-xs">
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#1E3A8A]" /> {item.group.name}
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-700">
                          <UserCheck className="w-3.5 h-3.5" />
                          {item.group.supervisorName ? `Pembimbing: ${item.group.supervisorName}` : 'Dosen pembimbing kelompok belum ditetapkan.'}
                        </p>
                        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {item.group.members.map((m) => (
                            <li key={m.nim} className="px-3 py-2 flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{m.name}</span>
                              <span className="font-mono text-[11px] text-slate-400">{m.nim}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        Anda belum ditempatkan di kelompok. Pembagian kelompok dilakukan oleh akademik; Anda akan mendapat pemberitahuan setelah ditetapkan.
                      </p>
                    ))}</div>}

                  {item.mode === 'DIRECT' &&
                    (sup ? (
                      <p className="text-xs text-slate-700 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        Pembimbing: {[sup.supervisor1Name, sup.supervisor2Name].filter(Boolean).join(' & ')}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-600 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        Menunggu penetapan dosen pembimbing oleh akademik. Tidak perlu mendaftar.
                      </p>
                    ))}

                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Riwayat</p>
                    <FieldHistoryTable events={item.history} showCourse={item.courses.length > 1} />
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </PortalLayout>
  );
}
