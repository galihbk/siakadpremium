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
    // Gambar logo tampil apa adanya: hanya ukuran yang dipakai; bingkai/latar/sudut/bayangan khusus inisial dibuang.
    const size = className
      .split(/\s+/)
      .filter((c) => /^([a-z]+:)?(w|h|min-w|min-h|max-w|max-h)-/.test(c) || c === 'shrink-0')
      .join(' ');
    return <img src={url} alt={initials} className={`${size} object-contain`} />;
  }
  return <div className={className}>{initials}</div>;
}
