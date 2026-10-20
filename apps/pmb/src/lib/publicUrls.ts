'use client';

import { useEffect, useState } from 'react';
import { resolveServiceUrl, type PublicUrlConfig, type ServiceName } from '@siakad/utils';
import { getApiBaseUrl } from './api';

// Alamat antar-layanan (website, portal, PMB, P2M, P3M) dibaca dari konfigurasi server (GET /app-config) saat runtime,
// bukan ditanam saat build, supaya satu image bisa dipakai banyak kampus dengan penamaan domain berbeda.
// Bila konfigurasi kosong/gagal dimuat, alamat diturunkan dari domain yang sedang dibuka (titik atau strip).
let configPromise: Promise<PublicUrlConfig> | null = null;

function loadConfig(): Promise<PublicUrlConfig> {
  if (!configPromise) {
    configPromise = fetch(`${getApiBaseUrl()}/app-config`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: { data?: PublicUrlConfig } & PublicUrlConfig) => (j?.data ?? j ?? {}) as PublicUrlConfig)
      .catch(() => ({}));
  }
  return configPromise;
}

/** Alamat dasar sebuah layanan (tanpa garis miring akhir); `fallback` dipakai sebelum halaman selesai dimuat di browser. */
export function useServiceUrl(service: ServiceName, fallback = ''): string {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    let alive = true;
    const { hostname, protocol, port } = window.location;
    setUrl(resolveServiceUrl(service, { hostname, protocol, port }));
    loadConfig().then((cfg) => {
      if (alive) setUrl(resolveServiceUrl(service, { hostname, protocol, port }, cfg));
    });
    return () => {
      alive = false;
    };
  }, [service]);

  return url;
}
