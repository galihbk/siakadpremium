import { Award, BadgeCheck, Building2, CalendarDays, FileText, Landmark } from 'lucide-react';

interface Props {
  campusShort?: string;
  accreditation?: string;
  accreditationSk?: string;
  accreditationValidUntil?: string;
  ptStatus?: string;
  npsn?: string;
  ptCode?: string;
  establishmentYear?: number;
  establishmentSk?: string;
  foundationName?: string;
}

/** Akreditasi & legalitas institusi -- seluruhnya dari Profil Institusi; tidak tampil bila belum diisi. */
export function KeunggulanSection({
  campusShort = 'Kampus Kami',
  accreditation,
  accreditationSk,
  accreditationValidUntil,
  ptStatus,
  npsn,
  ptCode,
  establishmentYear,
  establishmentSk,
  foundationName,
}: Props) {
  const items = [
    accreditation && {
      icon: Award,
      tag: 'Akreditasi Institusi',
      title: `Akreditasi ${accreditation}`,
      desc: [accreditationSk, accreditationValidUntil && `Berlaku sampai ${accreditationValidUntil}`].filter(Boolean).join(' · '),
    },
    ptStatus && {
      icon: BadgeCheck,
      tag: 'Status',
      title: ptStatus,
      desc: [npsn && `NPSN ${npsn}`, ptCode && `Kode PT ${ptCode}`].filter(Boolean).join(' · '),
    },
    establishmentYear && establishmentYear > 0
      ? {
          icon: CalendarDays,
          tag: 'Pendirian',
          title: `Berdiri sejak ${establishmentYear}`,
          desc: establishmentSk || '',
        }
      : null,
    foundationName && {
      icon: Landmark,
      tag: 'Badan Penyelenggara',
      title: foundationName,
      desc: '',
    },
  ].filter(Boolean) as { icon: typeof Award; tag: string; title: string; desc: string }[];

  if (items.length === 0) return null;

  return (
    <section id="keunggulan" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
            <Building2 className="w-3.5 h-3.5" /> Legalitas {campusShort}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Akreditasi & Legalitas Institusi</h2>
          <p className="text-base text-slate-600 leading-relaxed">Informasi resmi status, akreditasi, dan pendirian kampus.</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${items.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.tag} className="bg-white rounded-xl p-7 border border-slate-200/90 shadow-subtle">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">{item.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                {item.desc && (
                  <p className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <span>{item.desc}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
