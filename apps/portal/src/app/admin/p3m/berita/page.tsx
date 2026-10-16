import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaTable } from '@/app/admin/berita/BeritaTable';

// Hanya menampilkan berita tulisan akun ini (dibatasi di API).
export default function P3MBeritaPage() {
  return (
    <PortalLayout role="lp3m" userName="" userIdText="">
      <BeritaTable basePath="/admin/p3m/berita" />
    </PortalLayout>
  );
}
