'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { PMB_DOCS, PMB_DOCS_VERSION } from '@/lib/docs/pmb-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={PMB_DOCS}
      role="pmb"
      title="Panduan Panitia PMB"
      subtitle="Alur penerimaan mahasiswa baru sampai NIM terbit."
      version={PMB_DOCS_VERSION}
    />
  );
}
