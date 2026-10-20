import type { Metadata } from 'next';
import { CopyrightBanner } from '@/components/CopyrightBanner';
import { AuthFetchInstaller } from '@/components/AuthFetchInstaller';
import { ChatWidget } from '@/components/ChatWidget';
import { getCampusServer } from '@/lib/campusServer';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const campus = await getCampusServer();
  const name = campus.name || 'Kampus';
  return {
    title: `PMB ${name} - Penerimaan Mahasiswa Baru`,
    description: `Portal resmi Penerimaan Mahasiswa Baru (PMB) ${campus.nameWithShort || name}: gelombang pendaftaran, jalur masuk, biaya kuliah, registrasi akun, dan pemantauan hasil seleksi.`,
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
        <AuthFetchInstaller />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
