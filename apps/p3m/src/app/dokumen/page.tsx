import type { Metadata } from 'next';
import { DocumentLibrary } from '@/components/DocumentLibrary';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dokumen | LP3M' };

export default async function DokumenPage() {
  const { data, error, campus, portalUrl } = await loadSite();
  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Dokumen',
        title: 'Panduan, regulasi & template',
        description: 'Panduan penelitian dan pengabdian, regulasi, template proposal, dan instrumen yang dibuka untuk publik.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <DocumentLibrary documents={data.documents} />
      </section>
    </SiteShell>
  );
}
