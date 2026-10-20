'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Briefcase, Loader2 } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PegawaiForm, toFormData, type PegawaiFormData, type PegawaiItem } from '@/components/sdm/PegawaiForm';
import { getApiBaseUrl } from '@/lib/api';

export default function EditPegawaiPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apiBase = getApiBaseUrl();

  const [pegawai, setPegawai] = useState<PegawaiItem | null>(null);
  const [shiftOptions, setShiftOptions] = useState<{ id: string; name: string; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [empRes, shiftRes] = await Promise.all([fetch(`${apiBase}/employees/${id}`, { cache: 'no-store' }), fetch(`${apiBase}/shifts`)]);
        const empJson = await empRes.json().catch(() => null);
        if (!empRes.ok) throw new Error(empJson?.message || 'Data pegawai tidak ditemukan.');
        setPegawai((empJson.data ?? empJson) as PegawaiItem);
        if (shiftRes.ok) {
          const sj = await shiftRes.json();
          setShiftOptions(sj.data ?? sj ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memuat data pegawai.');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase, id]);

  const save = async (data: PegawaiFormData) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const m = json?.message;
        throw new Error(Array.isArray(m) ? m.join(', ') : m || 'Gagal menyimpan perubahan.');
      }
      router.push('/admin/sdm/pegawai');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan perubahan.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout role="sdm" userName="Dewi Lestari, S.Psi., M.M." userIdText="Kepala Biro SDM & Kepegawaian">
      <div className="w-full space-y-4 pb-12">
        <Link href="/admin/sdm/pegawai" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1E3A8A]">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Data Pegawai
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-900 truncate">
                Edit Data Pegawai{pegawai ? ` — ${pegawai.fullName}` : ''}
              </h1>
              <p className="text-xs text-slate-500">Perbarui data profil kepegawaian, jabatan, status keaktifan, dan unit kerja penempatan.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {error}
              </div>
            )}
            {loading ? (
              <p className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat data pegawai…
              </p>
            ) : pegawai ? (
              <PegawaiForm
                initial={toFormData(pegawai)}
                shiftOptions={shiftOptions}
                saving={saving}
                submitLabel="Simpan Perubahan"
                onSubmit={save}
                onCancel={() => router.push('/admin/sdm/pegawai')}
              />
            ) : null}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
