'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { CheckCircle2, CircleDashed, ExternalLink, Loader2, Network, RefreshCw, XCircle } from 'lucide-react';

type State = 'NOT_INTEGRATED' | 'READY' | 'INTEGRATED';

interface ObeStatus {
  state: State;
  viewsInstalled: boolean;
  readerCanLogin: boolean;
  activeConnections: number;
  restKeyConfigured: boolean;
  obeDatabaseExists: boolean;
  obe: { url: string | null; health: 'UP' | 'DOWN' | 'UNKNOWN' };
  views: { name: string; rows: number | null }[];
  checkedAt: string;
}

const VIEW_LABEL: Record<string, string> = {
  institutions: 'Institusi',
  faculties: 'Fakultas',
  study_programs: 'Program studi',
  students: 'Mahasiswa',
  lecturers: 'Dosen',
  courses: 'Mata kuliah',
  curriculum_courses: 'Mata kuliah dalam kurikulum',
  academic_periods: 'Periode akademik',
  course_offerings: 'Kelas',
  enrollments: 'KRS terikat kelas',
  grade_components: 'Komponen nilai per kelas',
  grades: 'Nilai final',
  users: 'Akun yang boleh masuk OBE',
};

const BANNER: Record<State, { title: string; text: string; tone: string }> = {
  INTEGRATED: {
    title: 'Terintegrasi dengan OBE',
    text: 'OBE terhubung dan membaca data SIAKAD secara otomatis. Tidak ada yang perlu ditarik atau diunggah.',
    tone: 'from-emerald-600 to-emerald-700',
  },
  READY: {
    title: 'Siap diintegrasikan dengan OBE',
    text: 'Data untuk OBE sudah disediakan. Menunggu OBE dipasang dan terhubung di kampus ini.',
    tone: 'from-amber-500 to-amber-600',
  },
  NOT_INTEGRATED: {
    title: 'Belum terintegrasi dengan OBE',
    text: 'Kampus ini belum memakai OBE. SIAKAD berjalan seperti biasa dan tidak terpengaruh.',
    tone: 'from-slate-600 to-slate-700',
  },
};

function Row({ ok, label, hint }: { ok: boolean | null; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {ok === null ? (
        <CircleDashed className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
      ) : ok ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

export default function IntegrasiObePage() {
  const [status, setStatus] = useState<ObeStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${getApiBaseUrl()}/obe-status`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || 'Status integrasi tidak dapat dimuat.');
      setStatus(json?.data ?? json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status integrasi tidak dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const banner = status ? BANNER[status.state] : null;

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className={`bg-gradient-to-r ${banner?.tone ?? 'from-[#1E3A8A] to-[#1e40af]'} rounded-2xl p-6 sm:p-8 text-white shadow-sm`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 mb-2">
            <Network className="w-3.5 h-3.5" /> Integrasi OBE
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{banner?.title ?? 'Integrasi OBE'}</h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1">{banner?.text ?? 'Memuat status...'}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Periksa ulang
            </button>
            {status?.obe.url && (
              <a
                href={status.obe.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Buka OBE <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        {status && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold text-slate-800 mb-1">Kesiapan</h2>
              <div className="divide-y divide-slate-100">
                <Row ok={status.viewsInstalled} label="Data untuk OBE tersedia" hint="Antarmuka baca-saja di database SIAKAD (skema obe_api), dipasang otomatis saat SIAKAD menyala." />
                <Row ok={status.obeDatabaseExists} label="Database OBE disiapkan" hint="Database kosong di server yang sama; OBE membuat tabelnya sendiri saat pertama dijalankan." />
                <Row ok={status.readerCanLogin} label="Akun OBE diaktifkan" hint="Akun baca-saja yang dipakai OBE. Diaktifkan sekali saat OBE dipasang; tidak dapat mengubah data SIAKAD." />
                <Row
                  ok={status.activeConnections > 0 ? true : null}
                  label={status.activeConnections > 0 ? `OBE sedang membaca (${status.activeConnections} koneksi)` : 'Belum terlihat ada koneksi dari OBE saat ini'}
                  hint="OBE membaca secara berkala, jadi koneksi hanya tampak sesaat."
                />
                <Row
                  ok={status.obe.health === 'UNKNOWN' ? null : status.obe.health === 'UP'}
                  label={status.obe.health === 'UP' ? 'OBE menyala' : status.obe.health === 'DOWN' ? 'OBE tidak merespons' : 'Alamat OBE belum diatur'}
                  hint={status.obe.url ?? 'Isi variabel OBE_URL di server SIAKAD agar status OBE dapat diperiksa.'}
                />
                <Row ok={status.restKeyConfigured} label="Jalur REST (opsional)" hint="Untuk OBE yang berada di server lain dan membaca lewat API, bukan database." />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold text-slate-800 mb-1">Data yang tersedia untuk OBE</h2>
              <p className="text-xs text-slate-500 mb-3">Hanya jumlah baris. OBE tidak pernah menulis ke SIAKAD, dan tidak ada data pribadi seperti NIK, alamat, atau keuangan.</p>
              {status.views.length === 0 ? (
                <p className="text-sm text-slate-500">Antarmuka data belum terpasang.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {status.views.map((v) => (
                      <tr key={v.name}>
                        <td className="py-1.5 text-slate-700">{VIEW_LABEL[v.name] ?? v.name}</td>
                        <td className="py-1.5 text-right font-semibold text-slate-800 tabular-nums">{v.rows === null ? '-' : v.rows.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {status && status.state !== 'INTEGRATED' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-bold text-slate-800 mb-2">Cara mengaktifkan</h2>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
              <li>Pasang OBE di server kampus (satu instalasi untuk satu kampus).</li>
              <li>
                Beri akun database OBE hak masuk di server database SIAKAD:
                <code className="block mt-1 bg-slate-100 rounded-md px-2 py-1 text-xs">ALTER ROLE obe_reader LOGIN PASSWORD &apos;kata-sandi-kuat&apos;;</code>
              </li>
              <li>Isi alamat database SIAKAD (dengan akun itu) pada pengaturan OBE, lalu pilih jenis integrasi &quot;Database SIAKAD Premium&quot;.</li>
              <li>Isi <code className="bg-slate-100 rounded px-1 text-xs">OBE_URL</code> di server SIAKAD bila ingin status OBE tampil di sini.</li>
            </ol>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
