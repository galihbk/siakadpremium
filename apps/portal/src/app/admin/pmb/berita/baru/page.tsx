import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaForm } from '@/app/admin/berita/BeritaForm';

export default function PMBBeritaBaruPage() {
  return (
    <PortalLayout role="pmb" userName="" userIdText="">
      <BeritaForm basePath="/admin/pmb/berita" allowFeatured={false} badge="Panitia PMB" />
    </PortalLayout>
  );
}
