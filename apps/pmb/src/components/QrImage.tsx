'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Kode QR sungguhan (bisa dipindai) yang berisi `text`. */
export function QrImage({ text, size = 96, className = '' }: { text: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { width: size * 3, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(''));
    return () => {
      alive = false;
    };
  }, [text, size]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} width={size} height={size} alt="Kode QR validasi dokumen" className={className} /> : <div style={{ width: size, height: size }} className={className} />;
}
