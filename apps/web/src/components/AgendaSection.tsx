import { Calendar, Users } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  semester: string;
  target: string;
  status: string;
  notes: string;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

const parseDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmtLong = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/** Agenda diambil dari Kalender Akademik (database) -- yang akan datang / sedang berlangsung. */
async function loadAgenda() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/academic/calendar-events`, { next: { revalidate: 60 } });
    if (!res.ok) return { items: [] as CalendarEvent[], failed: true };
    const json = await res.json();
    const list: CalendarEvent[] = json?.data ?? json ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = list
      .filter((e) => {
        const end = parseDate(e.endDate) ?? parseDate(e.startDate);
        return e.status !== 'Selesai' && end && end >= today;
      })
      .sort((a, b) => (parseDate(a.startDate)?.getTime() ?? 0) - (parseDate(b.startDate)?.getTime() ?? 0))
      .slice(0, 6);
    return { items, failed: false };
  } catch {
    return { items: [] as CalendarEvent[], failed: true };
  }
}

export async function AgendaSection() {
  const { items, failed } = await loadAgenda();
  const agendaList = items.flatMap((e) => {
    const start = parseDate(e.startDate);
    if (!start) return [];
    const end = parseDate(e.endDate);
    const multiDay = end && end.toDateString() !== start.toDateString();
    return [
      {
        id: e.id,
        tanggal: String(start.getDate()).padStart(2, '0'),
        bulan: MONTHS[start.getMonth()],
        judul: e.title,
        kategori: e.category,
        status: e.status,
        waktu: multiDay ? `${fmtLong(start)} s.d. ${fmtLong(end)}` : fmtLong(start),
        target: e.target,
        catatan: e.notes,
      },
    ];
  });

  return (
    <section id="agenda" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
            Kalender Akademik
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Agenda & Kegiatan Kampus
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Catat jadwal penting kegiatan akademik, seremonial, seminar riset, dan jadwal penerimaan mahasiswa baru.
          </p>
        </div>

        {/* Timeline List */}
        <div className="space-y-4">
          {agendaList.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-200 rounded-xl">
              {failed ? 'Agenda sementara tidak dapat dimuat.' : 'Belum ada agenda kegiatan yang akan datang.'}
            </p>
          )}
          {agendaList.map((agenda) => (
            <div
              key={agenda.id}
              className="bg-slate-50 hover:bg-blue-50/40 rounded-xl p-5 sm:p-6 border border-slate-200/90 hover:border-[#1E3A8A]/30 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group"
            >
              {/* Kolom Tanggal */}
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border-2 border-[#1E3A8A] shadow-xs shrink-0 text-center">
                  <span className="text-xl sm:text-2xl font-black text-[#1E3A8A] leading-none">
                    {agenda.tanggal}
                  </span>
                  <span className="text-xs font-bold text-[#D4A017] tracking-wider mt-0.5 uppercase">
                    {agenda.bulan}
                  </span>
                </div>

                {/* Kolom Detail Agenda */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
                      {agenda.kategori}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {agenda.status}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                    {agenda.judul}
                  </h3>

                  {agenda.catatan && <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{agenda.catatan}</p>}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agenda.waktu}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agenda.target}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
