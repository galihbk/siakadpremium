import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaForm } from '@/app/admin/berita/BeritaForm';

export default function P3MBeritaBaruPage() {
  return (
    <PortalLayout role="lp3m" userName="" userIdText="">
      <BeritaForm basePath="/admin/p3m/berita" allowFeatured={false} badge="Admin LP3M" />
    </PortalLayout>
  );
}
