'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { GraduationCap, Loader2, Save } from 'lucide-react';

interface RateItem {
  degreeLevel: string;
  ratePerSks: number;
}

const LEVEL_LABEL: Record<string, string> = {
  D3: 'Diploma 3 (D3)',
  D4: 'Diploma 4 (D4)',
  S1: 'Sarjana (S1)',
  S2: 'Magister (S2)',
  S3: 'Doktor (S3)',
  PROFESI: 'Profesi',
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const formatThousands = (digits: string) => (digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '');
const onlyDigits = (value: string) => value.replace(/\D/g, '');

export default function TarifHonorJenjangPage() {
  const [rates, setRates] = useState<RateItem[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingLevel, setSavingLevel] = useState<string | null>(null);
  const [savedLevel, setSavedLevel] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/honor-rate-jenjang`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: RateItem[] = json.data ?? json ?? [];
      setRates(data);
      setForm(Object.fromEntries(data.map((r) => [r.degreeLevel, String(r.ratePerSks || 0)])));
    } catch (err) {
      console.error('Gagal memuat tarif honor jenjang', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (degreeLevel: string) => {
    setSavingLevel(degreeLevel);
    setSavedLevel(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/honor-rate-jenjang/${degreeLevel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratePerSks: Number(form[degreeLevel]) || 0 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
      setSavedLevel(degreeLevel);
      setTimeout(() => setSavedLevel(null), 2000);
    } catch (err) {
      console.error('Gagal menyimpan tarif honor jenjang', err);
      alert('Gagal menyimpan tarif. Coba lagi.');
    } finally {
      setSavingLevel(null);
    }
  };

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6 max-w-2xl">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
            Honor &amp; Pengajaran
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Tarif Honor per Jenjang</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Honor per SKS dihitung otomatis berdasarkan jenjang program studi dari mata kuliah yang diajar
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex justify-center">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {rates.map((r) => (
                <div key={r.degreeLevel} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-none">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{LEVEL_LABEL[r.degreeLevel] ?? r.degreeLevel}</p>
                    <p className="text-[11px] text-slate-400">Saat ini: {formatRupiah(r.ratePerSks)} / SKS</p>
                  </div>
                  <div className="relative w-40 flex-none">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatThousands(form[r.degreeLevel] ?? '0')}
                      onChange={(e) => setForm((f) => ({ ...f, [r.degreeLevel]: onlyDigits(e.target.value) }))}
                      className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <button
                    onClick={() => handleSave(r.degreeLevel)}
                    disabled={savingLevel === r.degreeLevel}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-60 cursor-pointer flex-none"
                  >
                    {savingLevel === r.degreeLevel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedLevel === r.degreeLevel ? (
                      'Tersimpan'
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Simpan
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
              Honor Mengajar/Bulan tiap dosen = jumlah dari (SKS kelas &times; Tarif Jenjang Kelas &times; 14 pertemuan &divide; 6 kali pembayaran), dijumlah dari semua kelas yang diampu lintas jenjang/prodi. Jenjang kelas ditentukan dari program studi mata kuliah; jika kosong, memakai jenjang program studi dosen bersangkutan.
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
