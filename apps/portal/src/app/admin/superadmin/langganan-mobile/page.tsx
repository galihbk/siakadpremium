'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { MOBILE_SUBSCRIPTION_ENABLED } from '@/lib/features';
import { CheckCircle2, CircleDashed, Loader2, RefreshCw, Smartphone, Users, XCircle } from 'lucide-react';

interface Pkg {
  id: string;
  name: string;
  maxStudents: number;
  price: string;
  durationMonths: number;
}

type State = 'active' | 'inactive' | 'expired';

type Status =
  | { enabled: false }
  | { enabled: true; configured: false; missing: string[] }
  | {
      enabled: true;
      configured: true;
      reachable: boolean;
      problem?: string;
      institutionName?: string;
      state?: State;
      allowed?: boolean;
      startedAt?: string | null;
      expiresAt?: string | null;
      package?: Pkg | null;
      maxStudents?: number | null;
      activeStudentCount?: number;
      remaining?: number | null;
      overCapacity?: boolean;
    };

interface Activation {
  status: 'ACTIVE';
  startedAt: string;
  expiresAt: string | null;
  package: Pkg | null;
}

/** Lama langganan yang dapat dipilih; paket bersifat tahunan, jadi kelipatan setahun. */
const DURATIONS = [12, 24, 36];

const dateFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));
const number = (value: number) => value.toLocaleString('id-ID');
const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

/** Harga untuk sekian bulan, menurut harga paket untuk lama bawaannya. Hanya tampilan; NextVersa yang menetapkan. */
const priceFor = (pkg: Pkg, months: number) => (Number(pkg.price) * months) / pkg.durationMonths;

function bannerFor(status: Status | null): { tone: string; title: string; text: string } {
  if (!status) return { tone: 'from-[#1E3A8A] to-[#1e40af]', title: 'Langganan Mobile App', text: 'Memuat status...' };
  if (!status.enabled) return { tone: 'from-slate-600 to-slate-700', title: 'Fitur ditutup', text: 'Menu ini sedang ditutup di server.' };
  if (!status.configured) {
    return { tone: 'from-amber-500 to-amber-600', title: 'Integrasi belum diatur', text: 'Server SIAKAD belum punya pengaturan untuk menghubungi NextVersa.' };
  }
  if (status.problem) return { tone: 'from-red-600 to-red-700', title: 'NextVersa menolak permintaan', text: status.problem };
  if (!status.reachable) {
    return { tone: 'from-slate-600 to-slate-700', title: 'Status belum diketahui', text: 'NextVersa tidak dapat dihubungi saat ini. Langganan tidak berubah.' };
  }
  if (status.state === 'active') {
    return {
      tone: 'from-emerald-600 to-emerald-700',
      title: status.package ? `Langganan aktif, paket ${status.package.name}` : 'Langganan aktif',
      text: status.expiresAt ? `Aplikasi mobile dapat dipakai sampai ${formatDate(status.expiresAt)}.` : 'Aplikasi mobile dapat dipakai tanpa batas waktu.',
    };
  }
  if (status.state === 'expired') {
    return {
      tone: 'from-amber-500 to-amber-600',
      title: 'Langganan berakhir',
      text: status.expiresAt ? `Masa berlaku berakhir pada ${formatDate(status.expiresAt)}. Perpanjang di bawah.` : 'Masa berlaku sudah berakhir. Perpanjang di bawah.',
    };
  }
  return { tone: 'from-amber-500 to-amber-600', title: 'Langganan belum aktif', text: 'Aplikasi mobile belum dapat dipakai oleh kampus ini. Pilih paket di bawah.' };
}

export default function LanggananMobilePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [packages, setPackages] = useState<Pkg[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Activation | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    const { token } = getAuthSession();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const read = useCallback(
    async (path: string) => {
      const res = await fetch(`${getApiBaseUrl()}/mobile-subscription${path}`, { cache: 'no-store', headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message;
        throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Data tidak dapat dimuat.');
      }
      return json?.data ?? json;
    },
    [authHeaders],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next: Status = await read('');
      setStatus(next);
      if (next.enabled && next.configured && next.reachable && !next.problem) {
        const list: Pkg[] = await read('/packages');
        setPackages(list);
        // Awalnya paket yang sedang dipakai, atau yang terkecil yang masih cukup untuk mahasiswa aktif.
        setSelectedId((current) => {
          if (current && list.some((p) => p.id === current)) return current;
          const used = next.activeStudentCount ?? 0;
          return (next.package && list.find((p) => p.id === next.package?.id)?.id) ?? list.find((p) => p.maxStudents >= used)?.id ?? list[0]?.id ?? null;
        });
      } else {
        setPackages(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Data tidak dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, [read]);

  useEffect(() => {
    if (MOBILE_SUBSCRIPTION_ENABLED) void load();
  }, [load]);

  const selected = useMemo(() => packages?.find((p) => p.id === selectedId) ?? null, [packages, selectedId]);
  const ready = status?.enabled === true && status.configured === true && status.reachable && !status.problem;
  const used = ready ? (status.activeStudentCount ?? 0) : 0;
  const isActive = ready && status.state === 'active';
  const tooSmall = (pkg: Pkg) => pkg.maxStudents < used;

  /** Mengirim aktivasi setelah pengguna menyetujui di modal. */
  const activate = async () => {
    if (!selected) return;

    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/mobile-subscription/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ packageId: selected.id, durationMonths: months }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message;
        throw new Error(Array.isArray(message) ? message.join(' ') : message || 'Langganan gagal diaktifkan.');
      }
      setResult(json?.data ?? json);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Langganan gagal diaktifkan.');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  if (!MOBILE_SUBSCRIPTION_ENABLED) {
    return (
      <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
        <div className="max-w-xl mx-auto mt-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h1 className="text-lg font-black text-slate-800">Halaman ditutup</h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">Langganan Mobile App sedang ditutup sementara.</p>
        </div>
      </PortalLayout>
    );
  }

  const { tone, title, text } = bannerFor(status);
  const maxStudents = ready ? status.maxStudents : null;
  const percent = maxStudents ? Math.min(100, Math.round((used / maxStudents) * 100)) : 0;

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className={`bg-gradient-to-r ${tone} rounded-2xl p-6 sm:p-8 text-white shadow-sm`}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 mb-2">
            <Smartphone className="w-3.5 h-3.5" /> Langganan Mobile App
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1">{text}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Periksa ulang
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
          Menu ini bersifat <strong>sementara</strong> dan akan ditutup kembali.
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl px-4 py-3">
            Langganan aktif{result.package ? ` (paket ${result.package.name})` : ''}
            {result.expiresAt ? ` sampai ${formatDate(result.expiresAt)}` : ' tanpa batas waktu'}.
          </div>
        )}

        {status && status.enabled && !status.configured && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-bold text-slate-800 mb-1">Yang perlu diisi di server</h2>
            <p className="text-xs text-slate-500 mb-3">Isi variabel berikut pada file .env API SIAKAD, lalu jalankan ulang API. Nilainya tidak pernah ditampilkan di sini.</p>
            <ul className="space-y-1.5">
              {status.missing.map((name) => (
                <li key={name} className="flex items-center gap-2 text-sm text-slate-700">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <code className="bg-slate-100 rounded px-1.5 py-0.5 text-xs">{name}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ready && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-bold text-slate-800 mb-3">Langganan saat ini</h2>
                <div className="flex items-start gap-3">
                  {isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : status.state === 'expired' ? (
                    <CircleDashed className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {isActive ? 'Aktif' : status.state === 'expired' ? 'Berakhir' : 'Belum aktif'}
                      {status.package ? ` · Paket ${status.package.name}` : ''}
                    </p>
                    {status.institutionName && <p className="text-xs text-slate-500 mt-0.5">{status.institutionName}</p>}
                  </div>
                </div>

                {status.startedAt && (
                  <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Mulai</dt>
                      <dd className="font-semibold text-slate-800">{formatDate(status.startedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Berakhir</dt>
                      <dd className="font-semibold text-slate-800">{status.expiresAt ? formatDate(status.expiresAt) : 'Tanpa batas waktu'}</dd>
                    </div>
                  </dl>
                )}

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                      <Users className="w-4 h-4 text-slate-500" /> Mahasiswa aktif
                    </span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {number(used)}
                      {maxStudents !== null && maxStudents !== undefined ? ` dari ${number(maxStudents)}` : ''}
                    </span>
                  </div>
                  {maxStudents ? (
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Pemakaian kapasitas">
                      <div className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : percent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-500 mt-2">
                    Dihitung otomatis oleh NextVersa dari mahasiswa yang berstatus aktif di SIAKAD dan memakai aplikasi. Tidak diisi manual.
                    {maxStudents !== null && maxStudents !== undefined && status.remaining !== null && status.remaining !== undefined
                      ? ` Sisa kursi: ${number(status.remaining)}.`
                      : ' Langganan ini tidak memiliki batas mahasiswa.'}
                  </p>
                  {status.overCapacity && (
                    <p className="text-xs text-red-600 mt-1.5">Mahasiswa aktif melebihi kapasitas paket. Pilih paket yang lebih besar saat memperpanjang.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-bold text-slate-800 mb-1">{isActive ? 'Perpanjang atau ganti paket' : 'Pilih paket'}</h2>
                <p className="text-xs text-slate-500 mb-3">
                  {isActive ? 'Masa berlaku ditambah dari tanggal berakhir saat ini.' : 'Langganan dimulai hari ini.'} Kapasitas dan harga ditetapkan NextVersa.
                </p>

                {packages === null ? (
                  <p className="text-sm text-slate-500">Memuat paket...</p>
                ) : packages.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada paket yang tersedia. Hubungi NextVersa.</p>
                ) : (
                  <div className="space-y-2" role="radiogroup" aria-label="Paket langganan">
                    {packages.map((pkg) => {
                      const disabled = tooSmall(pkg) || submitting;
                      const on = pkg.id === selectedId;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={disabled}
                          onClick={() => setSelectedId(pkg.id)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                            on ? 'border-[#1E3A8A] bg-blue-50 ring-1 ring-[#1E3A8A]' : 'border-slate-200 hover:border-slate-400'
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-bold text-slate-800">{pkg.name}</span>
                            <span className="text-sm font-semibold text-slate-800 tabular-nums">
                              {rupiah(Number(pkg.price))} <span className="text-xs font-normal text-slate-500">/ {pkg.durationMonths} bulan</span>
                            </span>
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            Hingga {number(pkg.maxStudents)} mahasiswa aktif
                            {tooSmall(pkg) ? ` · kurang dari ${number(used)} mahasiswa aktif saat ini` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4" role="radiogroup" aria-label="Lama langganan">
                  {DURATIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={months === value}
                      onClick={() => setMonths(value)}
                      disabled={submitting}
                      className={`text-sm font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
                        months === value ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {value} bulan
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={!selected || tooSmall(selected) || submitting}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#1E3A8A] text-white hover:bg-[#1e40af] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting
                    ? 'Memproses...'
                    : selected
                      ? `${isActive ? 'Perpanjang' : 'Aktifkan'} ${selected.name} · ${months} bulan · ${rupiah(priceFor(selected, months))}`
                      : 'Pilih paket'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirming && selected !== null}
        onClose={() => setConfirming(false)}
        onConfirm={() => activate()}
        isLoading={submitting}
        type="info"
        title={isActive ? 'Perpanjang Langganan' : 'Aktifkan Langganan'}
        confirmText={isActive ? 'Ya, Perpanjang' : 'Ya, Aktifkan'}
        message={
          selected && (
            <dl className="space-y-2 text-slate-700">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Paket</dt>
                <dd className="font-semibold text-slate-900 text-right">
                  {selected.name} · hingga {number(selected.maxStudents)} mahasiswa aktif
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Lama</dt>
                <dd className="font-semibold text-slate-900">{months} bulan</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Total</dt>
                <dd className="font-bold text-slate-900">{rupiah(priceFor(selected, months))}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Mulai</dt>
                <dd className="font-semibold text-slate-900 text-right">
                  {isActive && status.expiresAt ? `Disambung dari ${formatDate(status.expiresAt)}` : 'Hari ini'}
                </dd>
              </div>
            </dl>
          )
        }
      />
    </PortalLayout>
  );
}
