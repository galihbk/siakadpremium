'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
import { getApiBaseUrl } from '@/lib/api';
import { ValidasiRpsTable, type RpsRow } from './ValidasiRpsTable';

async function getRpsList(): Promise<RpsRow[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/p2m/rps`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat daftar RPS dari database (SSR):', err);
    return [];
  }
}

export default function AdminP2mValidasiRpsPage() {
  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <ClientLoad load={getRpsList}>
        {(rpsList) => (
        <ValidasiRpsTable initialRps={rpsList} />
        )}
      </ClientLoad>
    </PortalLayout>
  );
}
