import { PortalLayout } from '@/components/layout/PortalLayout';
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

export default async function AdminP2mValidasiRpsPage() {
  const rpsList = await getRpsList();

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <ValidasiRpsTable initialRps={rpsList} />
    </PortalLayout>
  );
}
