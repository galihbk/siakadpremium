'use client';

import { useServiceUrl } from '@/lib/publicUrls';

/** Alamat portal PMB kampus ini (dari konfigurasi server atau domain yang sedang dibuka), untuk dokumen cetak. */
export function PmbUrl() {
  const url = useServiceUrl('pmb', '');
  return <>{url}</>;
}
