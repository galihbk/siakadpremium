import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@siakad/ui', '@siakad/types', '@siakad/utils'],
};

export default nextConfig;
