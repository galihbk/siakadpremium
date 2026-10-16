import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaTable } from '@/app/admin/berita/BeritaTable';

// Admin Prodi hanya melihat dan mengelola berita yang ia tulis sendiri (dibatasi di API).
export default function ProdiBeritaPage() {
  return (
    <PortalLayout role="prodi" userName="" userIdText="">
      <BeritaTable basePath="/admin/prodi/berita" />
    </PortalLayout>
  );
}
