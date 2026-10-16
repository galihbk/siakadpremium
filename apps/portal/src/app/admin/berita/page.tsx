import { PortalLayout } from '@/components/layout/PortalLayout';
import { BeritaTable } from './BeritaTable';

// Daftar berita (termasuk draf) hanya untuk admin -- dimuat di browser memakai token login,
// bukan di server, karena endpoint-nya sekarang dikunci per role.
export default function AdminBeritaPage() {
  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <BeritaTable />
    </PortalLayout>
  );
}
