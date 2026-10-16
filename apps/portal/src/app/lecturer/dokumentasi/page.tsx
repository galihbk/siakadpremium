'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { DOSEN_DOCS, DOSEN_DOCS_VERSION } from '@/lib/docs/dosen-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={DOSEN_DOCS}
      role="lecturer"
      title="Panduan Dosen"
      subtitle="Cara memakai jadwal, absensi, nilai, RPS, bimbingan, dan pengawasan ujian."
      version={DOSEN_DOCS_VERSION}
    />
  );
}
