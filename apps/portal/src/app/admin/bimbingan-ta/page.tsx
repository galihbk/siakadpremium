import { redirect } from 'next/navigation';

// Menu ini sudah dipecah: skripsi/TA di Tugas Akhir / Skripsi, PLP/KKN/KP/Magang di Kegiatan Lapangan.
// Rute dipertahankan agar bookmark lama tidak patah.
export default function AdminBimbinganTaRedirect() {
  redirect('/admin/skripsi');
}
