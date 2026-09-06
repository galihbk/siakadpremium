'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <html lang="id">
      <head>
        <title>SIAKAD Premium Portal - Institut Teknologi Nusantara</title>
        <meta
          name="description"
          content="Portal Layanan Akademik Terpadu Mahasiswa, Dosen, dan Administrator BAAK Institut Teknologi Nusantara."
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
