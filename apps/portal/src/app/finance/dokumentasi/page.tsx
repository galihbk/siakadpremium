'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { KEUANGAN_DOCS, KEUANGAN_DOCS_VERSION } from '@/lib/docs/keuangan-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={KEUANGAN_DOCS}
      role="finance"
      title="Panduan Keuangan"
      subtitle="Tagihan, verifikasi pembayaran, honor dan gaji, kas, serta anggaran."
      version={KEUANGAN_DOCS_VERSION}
    />
  );
}
