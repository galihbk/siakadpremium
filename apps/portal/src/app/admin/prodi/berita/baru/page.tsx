import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaForm } from '@/app/admin/berita/BeritaForm';

export default function ProdiBeritaBaruPage() {
  return (
    <PortalLayout role="prodi" userName="" userIdText="">
      <BeritaForm basePath="/admin/prodi/berita" allowFeatured={false} badge="Admin Prodi" />
    </PortalLayout>
  );
}
