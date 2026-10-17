'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
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

export default function AdminP2mTindakLanjutPage() {
  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <ClientLoad load={getOpenAudits}>
        {(audits) => (
        <TindakLanjutTable initialAudits={audits} />
        )}
      </ClientLoad>
    </PortalLayout>
  );
}
