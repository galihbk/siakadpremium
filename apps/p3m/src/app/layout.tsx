import type { Metadata } from 'next';
import { CopyrightBanner } from '@/components/CopyrightBanner';
import { loadCampus } from '@/lib/data';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const campus = await loadCampus();
  const name = campus.campusName || 'Kampus';
  return {
    title: `LP3M - Penelitian & Pengabdian | ${name}`,
    description:
      'Situs resmi Lembaga Penelitian, Pengabdian kepada Masyarakat, dan Penjaminan (LP3M): kegiatan penelitian dan pengabdian, kekayaan intelektual (HAKI), serta dokumen panduan yang dapat diunduh publik.',
    ...(campus.logoUrl ? { icons: { icon: campus.logoUrl } } : {}),
  };
}

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
