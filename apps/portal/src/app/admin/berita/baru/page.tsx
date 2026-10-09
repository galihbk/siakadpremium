import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaForm } from '../BeritaForm';

export default function AdminBeritaBaruPage() {
  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <BeritaForm />
    </PortalLayout>
  );
}
