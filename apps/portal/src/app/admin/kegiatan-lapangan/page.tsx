'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { SupervisionPanel } from '@/components/thesis/SupervisionPanel';
import { FieldRegistrationsPanel } from '@/components/field/FieldRegistrationsPanel';
import { FieldGroupsPanel } from '@/components/field/FieldGroupsPanel';
import { FieldPartnersPanel } from '@/components/field/FieldPartnersPanel';
import { FieldChargeBar } from '@/components/field/FieldChargeBar';
import { FieldCategory, fieldFetch, fieldMode } from '@/lib/fieldActivity';
import { getApiBaseUrl } from '@/lib/api';
import { Briefcase, Users, User } from 'lucide-react';

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold inline-flex items-center justify-center">{n}</span>;
}

export default function AdminKegiatanLapanganPage() {
  const [categories, setCategories] = useState<FieldCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string>('');
  const [academicYearName, setAcademicYearName] = useState<string | null>(null);
  const [sub, setSub] = useState<'pendaftaran' | 'pembimbing' | 'mitra'>('pendaftaran');
  const [pending, setPending] = useState<Record<string, { registrations: number; placement: number; total: number }>>({});

  // angka pekerjaan yang belum diproses per jenis; diperbarui tiap ada perubahan (event yang sama dengan lencana sidebar)
  const loadPending = useCallback(() => {
    fieldFetch<{ items: { categoryId: string; registrations: number; placement: number; total: number }[] }>('/admin/pending-count')
      .then((r) => setPending(Object.fromEntries(r.items.map((i) => [i.categoryId, i]))))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    loadPending();
    window.addEventListener('siakad:thesis-updated', loadPending);
    return () => window.removeEventListener('siakad:thesis-updated', loadPending);
  }, [loadPending]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/academic/course-categories?activeOnly=true`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const rows: FieldCategory[] = (j?.data ?? j ?? []).filter((c: FieldCategory) => c.kind === 'LAPANGAN');
        setCategories(rows);
        const wanted = new URLSearchParams(window.location.search).get('jenis');
        setActive(rows.find((c) => c.name === wanted)?.name ?? rows[0]?.name ?? '');
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const pick = (name: string) => {
    setActive(name);
    setSub('pendaftaran');
    window.history.replaceState(null, '', `?jenis=${encodeURIComponent(name)}`);
  };

  const cat = categories.find((c) => c.name === active);

  return (
    <PortalLayout role="admin" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-white/10 text-[#D4A017] mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            Kegiatan Lapangan
          </span>
          <h1 className="text-xl sm:text-2xl font-black">PLP, KKN, Kerja Praktik & Magang</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Satu tab untuk tiap jenis kegiatan. Daftar jenis diatur di menu Pengaturan.
            {academicYearName && <> &bull; Tahun akademik {academicYearName}</>}
          </p>
        </div>

        {!loading && categories.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            Belum ada jenis kegiatan lapangan yang aktif. Tambahkan di{' '}
            <Link href="/admin/pengaturan" className="font-bold text-[#1E3A8A] underline">Pengaturan</Link>.
          </div>
        )}

        {categories.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5 border-b border-slate-200">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pick(c.name)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 -mb-px cursor-pointer ${active === c.name ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {c.name}
                  <CountBadge n={pending[c.id]?.total ?? 0} />
                </button>
              ))}
            </div>

            {cat && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[11px] text-slate-700 flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  {cat.isGroup ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {cat.isGroup ? `Berkelompok ${cat.minMembers}-${cat.maxMembers} orang` : 'Perorangan'}
                </span>
                <span>{{ GROUP: cat.requiresRegistration ? 'Wajib mendaftar, kelompok dibentuk akademik' : 'Kelompok dibentuk akademik', REGISTRATION: 'Wajib mendaftar dulu', DIRECT: 'Langsung diplot pembimbing oleh BAAK' }[fieldMode(cat)]}</span>
                <span>{cat.minLogbook > 0 ? `Logbook minimal ${cat.minLogbook} entri` : 'Tanpa logbook'}</span>
                <span>{cat.courseCount} mata kuliah</span>
                <Link href="/admin/pengaturan" className="ml-auto font-bold text-[#1E3A8A] underline">Ubah aturan</Link>
              </div>
            )}

            {cat && cat.feeAmount > 0 && <FieldChargeBar key={`fee-${cat.id}`} category={cat} />}

            {cat && fieldMode(cat) === 'GROUP' && !cat.requiresRegistration && <FieldGroupsPanel key={cat.id} category={cat} />}

            {cat && cat.requiresRegistration && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['pendaftaran', 'Mahasiswa & Pendaftaran'],
                      ['pembimbing', cat.isGroup ? 'Kelompok' : 'Plotting Pembimbing'],
                      ...(cat.hasPartners ? ([['mitra', 'Mitra']] as const) : []),
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setSub(k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${sub === k ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {label}
                      {k !== 'mitra' && <span className="ml-1.5 align-middle"><CountBadge n={k === 'pendaftaran' ? pending[cat.id]?.registrations ?? 0 : pending[cat.id]?.placement ?? 0} /></span>}
                    </button>
                  ))}
                </div>
                {sub === 'pendaftaran' && <FieldRegistrationsPanel key={cat.id} category={cat} />}
                {sub === 'pembimbing' &&
                  (cat.isGroup ? (
                    <FieldGroupsPanel key={cat.id} category={cat} />
                  ) : (
                    <>
                      <p className="text-xs text-slate-600">Hanya mahasiswa yang pendaftarannya sudah disetujui yang muncul di sini.</p>
                      <SupervisionPanel key={cat.id} category={cat.name} onAcademicYear={setAcademicYearName} />
                    </>
                  ))}
                {sub === 'mitra' && cat.hasPartners && <FieldPartnersPanel key={cat.id} category={cat} />}
              </>
            )}

            {cat && fieldMode(cat) === 'DIRECT' && <SupervisionPanel key={cat.id} category={cat.name} onAcademicYear={setAcademicYearName} />}
          </>
        )}
      </div>
    </PortalLayout>
  );
}
