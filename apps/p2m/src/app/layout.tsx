import type { Metadata } from 'next';
import { CopyrightBanner } from '@/components/CopyrightBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'P2M - Penjaminan Mutu | Institut Teknologi Nusantara',
  description:
    'Situs resmi Penjaminan Mutu (P2M): standar mutu SPMI, siklus audit mutu internal, dan dokumen mutu yang dapat diunduh publik.',
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
