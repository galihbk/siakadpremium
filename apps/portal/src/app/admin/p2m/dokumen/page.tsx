import { PortalLayout } from '@/components/layout/PortalLayout';
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

export default async function AdminP2mDokumenPage() {
  const documents = await getDocuments();

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <DokumenMutuTable initialDocuments={documents} />
    </PortalLayout>
  );
}
