'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Briefcase } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PegawaiForm, emptyPegawai, type PegawaiFormData } from '@/components/sdm/PegawaiForm';
import { getApiBaseUrl } from '@/lib/api';

export default function TambahPegawaiPage() {
  const router = useRouter();
  const apiBase = getApiBaseUrl();
  const [shiftOptions, setShiftOptions] = useState<{ id: string; name: string; isDefault: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/shifts`);
        if (res.ok) {
          const json = await res.json();
          setShiftOptions(json.data ?? json ?? []);
        }
      } catch (err) {
        console.warn('Gagal memuat daftar shift:', err);
      }
    })();
  }, [apiBase]);

  const save = async (data: PegawaiFormData) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const m = json?.message;
        throw new Error(Array.isArray(m) ? m.join(', ') : m || 'Gagal menyimpan data pegawai.');
      }
      router.push('/admin/sdm/pegawai');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan data pegawai.');
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
              <h1 className="text-lg font-black text-slate-900">Tambah Pegawai Baru</h1>
              <p className="text-xs text-slate-500">Lengkapi data profil kepegawaian, jabatan, status keaktifan, dan unit kerja penempatan.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {error}
              </div>
            )}
            <PegawaiForm
              initial={emptyPegawai()}
              shiftOptions={shiftOptions}
              saving={saving}
              submitLabel="Simpan Data Pegawai"
              onSubmit={save}
              onCancel={() => router.push('/admin/sdm/pegawai')}
            />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
