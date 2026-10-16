import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaTable } from '@/app/admin/berita/BeritaTable';

// Hanya menampilkan berita tulisan akun ini (dibatasi di API).
export default function P2MBeritaPage() {
  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <BeritaTable basePath="/admin/p2m/berita" />
    </PortalLayout>
  );
}
