import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Aplikasi PMB berdiri di akar subdomain pmb.<domain>. Tautan lama (mis. email verifikasi yang sudah terkirim)
  // masih memakai awalan /pmb/ dari masa PMB menjadi bagian situs utama, jadi dialihkan ke alamat tanpa awalan.
  // Query string (token verifikasi, dsb.) ikut terbawa.
  async redirects() {
    return [
      { source: '/pmb', destination: '/', permanent: false },
      { source: '/pmb/:path*', destination: '/:path*', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/:path*`,
      },
      // Live chat (WebSocket) diteruskan ke API di jalur /ws.
      {
        source: '/ws/:path*',
        destination: `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '')}/ws/:path*`,
      },
      // Gambar publik hasil unggahan (mis. logo kampus) disajikan API di /uploads/public.
      {
        source: '/uploads/public/:path*',
        destination: `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '')}/uploads/public/:path*`,
      },
    ];
  },
};

export default nextConfig;
