'use client';

import { useEffect } from 'react';
import { useInstitution } from '@/lib/useInstitution';

/** Judul tab dan ikon (favicon) mengikuti profil institusi: nama kampus dan logo yang diunggah Super Admin. */
export function DocumentTitle() {
  const inst = useInstitution();
  useEffect(() => {
    if (inst.campusName) document.title = inst.campusName;
    if (inst.logoUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = inst.logoUrl;
    }
  }, [inst.campusName, inst.logoUrl]);
  return null;
}
