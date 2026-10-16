'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { MAHASISWA_DOCS, MAHASISWA_DOCS_VERSION } from '@/lib/docs/mahasiswa-docs';

export default function DokumentasiPage() {
  return (
    <DocsViewer
      docs={MAHASISWA_DOCS}
      role="student"
      title="Panduan Mahasiswa"
      subtitle="Cara memakai KRS, presensi, KHS, ujian, tugas akhir, yudisium, surat, dan pembayaran."
      version={MAHASISWA_DOCS_VERSION}
    />
  );
}
