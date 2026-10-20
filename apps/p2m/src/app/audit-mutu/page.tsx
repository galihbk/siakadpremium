import type { Metadata } from 'next';
import { CalendarClock, CheckCircle2, RefreshCcw } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Audit Mutu | P2M' };

const RESULT_TONE: Record<string, string> = {
  Sesuai: 'bg-emerald-500',
  'Temuan Minor': 'bg-amber-500',
  'Temuan Mayor': 'bg-rose-500',
};

const fmtDate = (v: string) => new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

export default async function AuditMutuPage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const { stats } = data;
  const resultTotal = data.auditSummary.reduce((n, r) => n + r.count, 0);
  const followUpPct = stats.completedAudits > 0 ? Math.round((stats.followUpDone / stats.completedAudits) * 100) : null;

  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Audit Mutu Internal',
        title: 'Ringkasan hasil & jadwal audit',
        description: 'Ringkasan disajikan secara agregat. Rincian temuan per program studi bersifat internal dan hanya diakses tim P2M.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hasil audit selesai
            </h3>
            {resultTotal === 0 ? (
              <p className="text-sm text-slate-400 mt-6 text-center py-6">Belum ada audit yang selesai.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.auditSummary.map((r) => (
                  <div key={r.result}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">{r.result}</span>
                      <span className="text-slate-500">
                        {r.count} audit · {Math.round((r.count / resultTotal) * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${RESULT_TONE[r.result] ?? 'bg-slate-400'}`} style={{ width: `${(r.count / resultTotal) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {followUpPct !== null && (
                  <p className="text-xs text-slate-500 pt-2 flex items-center gap-2">
                    <RefreshCcw className="w-3.5 h-3.5" /> {stats.followUpDone} dari {stats.completedAudits} audit sudah ditindaklanjuti tuntas.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#1E3A8A]" /> Jadwal audit mendatang
            </h3>
            {data.upcomingAudits.length === 0 ? (
              <p className="text-sm text-slate-400 mt-6 text-center py-6">Belum ada jadwal audit mendatang.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {data.upcomingAudits.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.studyProgram}</p>
                      {a.faculty && <p className="text-[11px] text-slate-400 truncate">{a.faculty}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-700">{fmtDate(a.auditDate)}</p>
                      <p className="text-[10px] text-slate-400">{a.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
