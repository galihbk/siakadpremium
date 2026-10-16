'use client';

import { DocsViewer } from '@/components/docs/DocsViewer';
import { DOCS_VERSION, SUPERADMIN_DOCS } from '@/lib/docs/superadmin-docs';

export default function SuperAdminDokumentasiPage() {
  return (
    <DocsViewer
      docs={SUPERADMIN_DOCS}
      role="superadmin"
      title="Dokumentasi SIAKAD Premium"
      subtitle="Panduan lengkap untuk Super Admin: arsitektur, peran, proses bisnis, situs publik, dan operasional server."
      version={DOCS_VERSION}
      userName="Super Administrator"
      userIdText="Sistem Informasi Akademik Terpadu"
    />
  );
}
