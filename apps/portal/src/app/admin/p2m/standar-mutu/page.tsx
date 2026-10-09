import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { StandarMutuTable, type StandardData } from './StandarMutuTable';

async function getStandards(): Promise<StandardData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/p2m/standards`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat standar mutu dari database (SSR):', err);
    return [];
  }
}

export default async function AdminP2mStandarMutuPage() {
  const standards = await getStandards();

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <StandarMutuTable initialStandards={standards} />
    </PortalLayout>
  );
}
