'use client';

import { useEffect } from 'react';
import { useServiceUrl } from '@/lib/publicUrls';

/** Pendaftaran akun PMB ada di subdomain PMB; rute lama /register diteruskan ke sana. */
export default function RegisterRedirectPage() {
  const pmbUrl = useServiceUrl('pmb', '');
  useEffect(() => {
    if (pmbUrl) window.location.replace(`${pmbUrl}/daftar`);
  }, [pmbUrl]);
  return null;
}
