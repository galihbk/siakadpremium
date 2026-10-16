'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { BAAK_DOCS, BAAK_DOCS_VERSION } from '@/lib/docs/baak-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={BAAK_DOCS}
      role="admin"
      title="Panduan BAAK"
      subtitle="Operasional akademik: data induk, penjadwalan, KRS, nilai, tugas akhir, yudisium, surat, berita, dan Feeder."
      version={BAAK_DOCS_VERSION}
    />
  );
}
