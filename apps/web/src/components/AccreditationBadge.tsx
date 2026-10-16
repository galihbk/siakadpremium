import { Award } from 'lucide-react';

const TONE: Record<string, string> = {
  Unggul: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Baik Sekali': 'bg-sky-50 text-sky-700 border-sky-200',
  Baik: 'bg-amber-50 text-amber-700 border-amber-200',
};

/** Lencana akreditasi berwarna menurut peringkat. */
export function AccreditationBadge({ value, className = '' }: { value: string | null | undefined; className?: string }) {
  if (!value) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
        TONE[value] ?? 'bg-slate-50 text-slate-600 border-slate-200'
      } ${className}`}
    >
      <Award className="w-3 h-3" />
      Akreditasi {value}
    </span>
  );
}

/** Inisial untuk avatar pimpinan (abaikan gelar di depan: Dr., Prof., Ir., dst). */
export function initialsOf(name: string | null | undefined) {
  if (!name) return '?';
  const words = name
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter((w) => w && !/^(dr|prof|ir|drs|dra|h|hj|m|s)\.?$/i.test(w) && !w.endsWith('.'));
  const picked = (words.length ? words : name.split(/\s+/)).slice(0, 2);
  return picked.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}
