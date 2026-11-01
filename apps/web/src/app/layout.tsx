import type { Metadata } from 'next';
import { CopyrightBanner } from '@/components/CopyrightBanner';
import { getInstitutionProfile } from '@/lib/institution';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const campus = await getInstitutionProfile();
  const name = campus.campusName || 'Kampus';
  const short = campus.campusShortName && campus.campusShortName !== name ? ` (${campus.campusShortName})` : '';
  return {
    title: campus.tagline ? `${name} - ${campus.tagline}` : name,
    description: `Situs resmi ${name}${short}. Menyediakan informasi akademik, penerimaan mahasiswa baru, fakultas, riset inovasi, dan sistem informasi akademik SIAKAD.`,
    keywords: [name, campus.campusShortName, 'SIAKAD', 'PMB', 'Kampus'].filter(Boolean),
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
