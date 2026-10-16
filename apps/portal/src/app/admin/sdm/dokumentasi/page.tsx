'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { SDM_DOCS, SDM_DOCS_VERSION } from '@/lib/docs/sdm-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={SDM_DOCS}
      role="sdm"
      title="Panduan SDM & Kepegawaian"
      subtitle="Data pegawai, status kepegawaian dosen, shift, dan rekap absensi."
      version={SDM_DOCS_VERSION}
    />
  );
}
