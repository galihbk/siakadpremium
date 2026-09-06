import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Institut Teknologi Nusantara (ITN) - Unggul, Berbudaya & Berdaya Saing Global',
  description: 'Situs Resmi Institut Teknologi Nusantara (ITN). Menyediakan informasi akademik, penerimaan mahasiswa baru (PMB 2027), fakultas terkemuka, riset inovasi, dan sistem informasi akademik SIAKAD.',
  keywords: ['ITN', 'Institut Teknologi Nusantara', 'SIAKAD Premium', 'Universitas Terbaik Indonesia', 'PMB 2027', 'Kuliah Teknik', 'Kampus Unggul'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-screen bg-white text-slate-800 antialiased selection:bg-[#1E3A8A] selection:text-white">
        {children}
      </body>
    </html>
  );
}
