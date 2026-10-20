import React from 'react';

/**
 * Lambang kampus: gambar logo yang diunggah Super Admin (logoUrl) atau, bila belum ada, inisial kampus.
 * className dipakai untuk bentuk/ukuran (mis. "w-10 h-10 rounded-xl ...") dan berlaku untuk keduanya.
 */
export function CampusLogo({
  url,
  initials,
  className = '',
}: {
  url?: string | null;
  initials: string;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={initials} className={`${className} object-contain bg-white p-0.5`} />;
  }
  return <div className={className}>{initials}</div>;
}
