'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
import { getApiBaseUrl } from '@/lib/api';
import { DokumenMutuTable, type QualityDocumentData } from './DokumenMutuTable';

async function getDocuments(): Promise<QualityDocumentData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/p2m/documents`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat dokumen mutu dari database (SSR):', err);
    return [];
  }
}

export default function AdminP2mDokumenPage() {
  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <ClientLoad load={getDocuments}>
        {(documents) => (
        <DokumenMutuTable initialDocuments={documents} />
        )}
      </ClientLoad>
    </PortalLayout>
  );
}
