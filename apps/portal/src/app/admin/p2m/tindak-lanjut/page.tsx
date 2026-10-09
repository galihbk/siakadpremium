import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { TindakLanjutTable, type AuditFollowUp } from './TindakLanjutTable';

async function getOpenAudits(): Promise<AuditFollowUp[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/p2m/audits`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const all: AuditFollowUp[] = Array.isArray(json.data) ? json.data : [];
    return all.filter((a) => a.followUpStatus !== 'Selesai');
  } catch (err) {
    console.warn('Gagal memuat tindak lanjut audit dari database (SSR):', err);
    return [];
  }
}

export default async function AdminP2mTindakLanjutPage() {
  const audits = await getOpenAudits();

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <TindakLanjutTable initialAudits={audits} />
    </PortalLayout>
  );
}
