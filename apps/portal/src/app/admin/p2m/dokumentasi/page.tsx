'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { P2M_DOCS, P2M_DOCS_VERSION } from '@/lib/docs/p2m-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={P2M_DOCS}
      role="p2m"
      title="Panduan P2M (Penjaminan Mutu)"
      subtitle="Standar mutu, audit internal, validasi RPS, tindak lanjut, dan dokumen mutu."
      version={P2M_DOCS_VERSION}
    />
  );
}
