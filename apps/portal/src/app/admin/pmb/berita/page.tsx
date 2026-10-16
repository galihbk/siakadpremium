import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaTable } from '@/app/admin/berita/BeritaTable';

// Hanya menampilkan berita tulisan akun ini (dibatasi di API).
export default function PMBBeritaPage() {
  return (
    <PortalLayout role="pmb" userName="" userIdText="">
      <BeritaTable basePath="/admin/pmb/berita" />
    </PortalLayout>
  );
}
