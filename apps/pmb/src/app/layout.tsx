import type { Metadata } from 'next';
import { CopyrightBanner } from '@/components/CopyrightBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'PMB Institut Teknologi Nusantara - Penerimaan Mahasiswa Baru',
  description:
    'Portal resmi Penerimaan Mahasiswa Baru (PMB) Institut Teknologi Nusantara (ITN): gelombang pendaftaran, jalur masuk, biaya kuliah, registrasi akun, dan pemantauan hasil seleksi.',
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
