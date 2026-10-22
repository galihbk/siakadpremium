'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { ExamScheduleView, ExamType, formatExamDate, examsFetch } from '@/lib/exams';
import { CalendarClock, AlertTriangle, Printer, Clock, MapPin, UserCheck, Info } from 'lucide-react';

interface MyExam extends ExamScheduleView {
  courseCode: string;
  courseName: string;
  sks: number;
  className: string;
}

interface MyExamsResponse {
  year: { id: string; code: string; name: string };
  student: { nim: string; name: string; studyProgram: string };
  hasUnpaidInvoice: boolean;
  unpaidCount: number;
  items: MyExam[];
  unscheduled: { courseCode: string; courseName: string; className: string }[];
}

export default function StudentUjianPage() {
  const user = getAuthSession().user;
  const [data, setData] = useState<MyExamsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ExamType>('UTS');

  useEffect(() => {
    examsFetch<MyExamsResponse>('/me')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat jadwal ujian.'))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => (data?.items || []).filter((i) => i.type === type), [data, type]);
  const counts = useMemo(
    () => ({
      UTS: (data?.items || []).filter((i) => i.type === 'UTS').length,
      UAS: (data?.items || []).filter((i) => i.type === 'UAS').length,
    }),
    [data]
  );

  return (
    <PortalLayout
      role="student"
      userName={user?.fullName || 'Mahasiswa'}
      userIdText={user?.nim ? `NIM: ${user.nim}` : 'Portal Mahasiswa'}
    >
      {/* Gaya cetak: hanya kartu ujian yang tercetak */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #kartu-ujian, #kartu-ujian * { visibility: visible !important; }
          #kartu-ujian { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="space-y-6 pb-12">
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Jadwal Ujian</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Jadwal UTS dan UAS untuk mata kuliah yang Anda ambil
                {data ? ` pada semester ${data.year.name} (${data.year.code})` : ''}. Cetak kartu ujian sebagai bukti peserta.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat...</div>
        ) : (
          data && (
            <>
              {data.hasUnpaidInvoice && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border bg-amber-50 border-amber-200 text-amber-800 text-[13px]">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>
                    Anda masih memiliki <b>{data.unpaidCount} tagihan yang belum lunas</b>. Selesaikan pembayaran agar tidak
                    terkendala saat mengikuti ujian.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(['UTS', 'UAS'] as ExamType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        type === t
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t} ({counts[t]})
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => window.print()}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak Kartu {type}
                </button>
              </div>

              {/* Kartu ujian (yang tercetak) */}
              <div id="kartu-ujian" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kartu Peserta Ujian</p>
                    <h2 className="text-lg font-black text-slate-900">
                      {type === 'UTS' ? 'Ujian Tengah Semester' : 'Ujian Akhir Semester'}
                    </h2>
                    <p className="text-xs text-slate-500">Tahun Akademik {data.year.name} ({data.year.code})</p>
                  </div>
                  <div className="text-right text-[13px]">
                    <p className="font-black text-slate-900">{data.student.name}</p>
                    <p className="font-mono text-[#1E3A8A] font-bold">{data.student.nim}</p>
                    <p className="text-xs text-slate-500">{data.student.studyProgram}</p>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                    <Info className="w-6 h-6" />
                    Jadwal {type} belum diterbitkan untuk mata kuliah Anda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-[13px]">
                      <thead className="text-slate-500 text-[11px] uppercase">
                        <tr className="border-b border-slate-200">
                          <th className="py-2 pr-3">No</th>
                          <th className="py-2 pr-3">Mata Kuliah</th>
                          <th className="py-2 pr-3">Hari / Tanggal</th>
                          <th className="py-2 pr-3">Jam</th>
                          <th className="py-2 pr-3">Ruang</th>
                          <th className="py-2">Pengawas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((e, i) => (
                          <tr key={e.id} className="align-top">
                            <td className="py-2.5 pr-3 text-slate-400">{i + 1}</td>
                            <td className="py-2.5 pr-3">
                              <p className="font-bold text-slate-900">{e.courseName}</p>
                              <p className="text-[11px] text-slate-500">
                                {e.courseCode} · Kelas {e.className} · {e.sks} SKS
                              </p>
                              {e.notes && <p className="text-[11px] text-amber-700 mt-0.5">Catatan: {e.notes}</p>}
                            </td>
                            <td className="py-2.5 pr-3 text-slate-700">{formatExamDate(e.examDate)}</td>
                            <td className="py-2.5 pr-3 text-slate-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {e.startTime} - {e.endTime}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 text-slate-700">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {e.roomName || '-'}
                              </span>
                              {e.seatNo ? (
                                <span className="block mt-1 text-[11px] font-bold text-[#1E3A8A]">Nomor kursi: {e.seatNo}</span>
                              ) : null}
                            </td>
                            <td className="py-2.5 text-slate-600">
                              <span className="inline-flex items-start gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                <span>
                                  {e.proctor1?.name || '-'}
                                  {e.proctor2 && <span className="block">{e.proctor2.name}</span>}
                                </span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                  Wajib membawa kartu ini dan identitas mahasiswa. Hadir minimal 15 menit sebelum ujian dimulai.
                </p>
              </div>

              {data.unscheduled.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Belum ada jadwal ujian ({data.unscheduled.length})
                  </p>
                  <ul className="text-[13px] text-slate-600 grid sm:grid-cols-2 gap-1">
                    {data.unscheduled.map((u) => (
                      <li key={`${u.courseCode}-${u.className}`}>
                        {u.courseCode} · {u.courseName} (Kelas {u.className})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )
        )}
      </div>
    </PortalLayout>
  );
}
