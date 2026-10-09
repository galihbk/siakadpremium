import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { AuditMutuTable, type AuditData } from './AuditMutuTable';

async function getAudits(): Promise<AuditData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/p2m/audits`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat audit mutu dari database (SSR):', err);
    return [];
  }
}

export default async function AdminP2mAuditMutuPage() {
  const audits = await getAudits();

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <AuditMutuTable initialAudits={audits} />
    </PortalLayout>
  );
}
