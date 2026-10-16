import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaForm } from '@/app/admin/berita/BeritaForm';

export default function P2MBeritaBaruPage() {
  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <BeritaForm basePath="/admin/p2m/berita" allowFeatured={false} badge="Admin P2M" />
    </PortalLayout>
  );
}
