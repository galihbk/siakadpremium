import type { Metadata } from 'next';
import { CopyrightBanner } from '@/components/CopyrightBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'LP3M - Penelitian & Pengabdian | Institut Teknologi Nusantara',
  description:
    'Situs resmi Lembaga Penelitian, Pengabdian kepada Masyarakat, dan Penjaminan (LP3M): kegiatan penelitian dan pengabdian, kekayaan intelektual (HAKI), serta dokumen panduan yang dapat diunduh publik.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-screen bg-white text-slate-800 antialiased selection:bg-[#1E3A8A] selection:text-white">
        <CopyrightBanner />
        {children}
      </body>
    </html>
  );
}
