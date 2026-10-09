'use client';

// JANGAN DIHAPUS: notifikasi hak cipta wajib tampil di console browser.
// Sumber teksnya ada di @siakad/utils (COPYRIGHT_NOTICE) agar konsisten
// dengan aplikasi portal dan API — ubah teksnya di sana, bukan di sini.
import { useEffect } from 'react';
import { printBrowserCopyright } from '@siakad/utils';

export function CopyrightBanner() {
  useEffect(() => {
    printBrowserCopyright();
  }, []);

  return null;
}
