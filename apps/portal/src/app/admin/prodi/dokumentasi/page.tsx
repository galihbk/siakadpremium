'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { PRODI_DOCS, PRODI_DOCS_VERSION } from '@/lib/docs/prodi-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={PRODI_DOCS}
      role="prodi"
      title="Panduan Admin Program Studi"
      subtitle="Memantau data prodi dan menulis berita prodi."
      version={PRODI_DOCS_VERSION}
    />
  );
}
