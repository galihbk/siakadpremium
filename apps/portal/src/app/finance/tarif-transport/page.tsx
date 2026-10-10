'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { Sunrise, Sunset, Loader2, Save } from 'lucide-react';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const formatThousands = (digits: string) => (digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '');
const onlyDigits = (value: string) => value.replace(/\D/g, '');

export default function TarifTransportPage() {
  const [ratePagi, setRatePagi] = useState('0');
  const [rateSore, setRateSore] = useState('0');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transport-rate`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data ?? json;
      setRatePagi(String(data.ratePagi || 0));
      setRateSore(String(data.rateSore || 0));
      setUpdatedAt(data.updatedAt ?? null);
    } catch (err) {
      console.error('Gagal memuat tarif transport', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transport-rate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratePagi: Number(ratePagi) || 0, rateSore: Number(rateSore) || 0 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Gagal menyimpan tarif transport', err);
      alert('Gagal menyimpan tarif transport. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6 max-w-xl">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
            Honor &amp; Pengajaran
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Tarif Uang Transport</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Satu tarif berlaku untuk semua dosen &amp; karyawan, dihitung otomatis dari absen pagi/sore harian
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex justify-center">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Sunrise className="w-3.5 h-3.5 text-amber-500" /> Tarif Absen Pagi (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatThousands(ratePagi)}
                    onChange={(e) => setRatePagi(onlyDigits(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Sunset className="w-3.5 h-3.5 text-indigo-500" /> Tarif Absen Sore (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatThousands(rateSore)}
                    onChange={(e) => setRateSore(onlyDigits(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-slate-600">Total Jika Hadir Penuh / Hari</span>
              <span className="text-sm font-black text-[#1E3A8A]">
                {formatRupiah((Number(ratePagi) || 0) + (Number(rateSore) || 0))}
              </span>
            </div>

            {updatedAt && (
              <p className="text-[11px] text-slate-400">
                Terakhir diubah: {new Date(updatedAt).toLocaleString('id-ID')}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Tarif
              </button>
              {saved && <span className="text-xs font-semibold text-emerald-600">Tersimpan</span>}
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Uang transport otomatis dijumlahkan ke Rekap Honor berdasarkan jumlah kehadiran dosen/karyawan pada menu Absensi Harian masing-masing.
            </p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
