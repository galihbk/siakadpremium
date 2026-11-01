'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { ValidasiRpsTable, type RpsRow } from '@/components/rps/ValidasiRpsTable';

async function getRpsList(): Promise<RpsRow[]> {
  try {
    const { token } = getAuthSession();
    const res = await fetch(`${getApiBaseUrl()}/prodi/rps`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat daftar RPS:', err);
    return [];
  }
}

export default function AdminProdiPengesahanRpsPage() {
  return (
    <PortalLayout role="prodi" userName="" userIdText="">
      <ClientLoad load={getRpsList}>{(rpsList) => <ValidasiRpsTable initialRps={rpsList} />}</ClientLoad>
    </PortalLayout>
  );
}
