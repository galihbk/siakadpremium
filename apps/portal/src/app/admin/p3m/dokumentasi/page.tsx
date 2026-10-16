'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { LP3M_DOCS, LP3M_DOCS_VERSION } from '@/lib/docs/lp3m-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={LP3M_DOCS}
      role="lp3m"
      title="Panduan LP3M"
      subtitle="Penelitian, pengabdian, HAKI, dokumen, dan borang akreditasi."
      version={LP3M_DOCS_VERSION}
    />
  );
}
