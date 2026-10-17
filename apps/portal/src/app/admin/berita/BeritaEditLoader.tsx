'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { BeritaForm } from './BeritaForm';
import type { ArticleData } from './BeritaTable';

type Role = React.ComponentProps<typeof PortalLayout>['role'];

/** Memuat satu berita di browser (butuh token) lalu menampilkan form edit. Dipakai semua peran penulis berita. */
export function BeritaEditLoader({
  role,
  basePath,
  allowFeatured,
  badge,
}: {
  role: Role;
  basePath?: string;
  allowFeatured?: boolean;
  badge?: string;
}) {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${getApiBaseUrl()}/landing-page/articles/${id}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        const json = await r.json();
        return (json.data || json) as ArticleData;
      })
      .then((a) => live && setArticle(a))
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
    };
  }, [id]);

  return (
    <PortalLayout role={role} userName="" userIdText="">
      {missing ? (
        <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <h1 className="text-base font-bold text-slate-800">Berita tidak ditemukan</h1>
          <p className="text-sm text-slate-500 mt-1">Berita mungkin sudah dihapus atau Anda tidak memiliki akses.</p>
        </div>
      ) : !article ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin text-[#1E3A8A]" /> Memuat berita...
        </div>
      ) : (
        <BeritaForm article={article} basePath={basePath} allowFeatured={allowFeatured} badge={badge} />
      )}
    </PortalLayout>
  );
}
