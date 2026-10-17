'use client';

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';

interface Signer {
  roleLabel: string;
  name: string | null;
  nip: string | null;
  available: boolean;
}

/**
 * Blok tanda tangan dokumen resmi, penandatangannya mengikuti "Aturan Tanda Tangan" (Super Admin).
 * Satu penandatangan tampil di kanan; bila ada penandatangan kedua, ia tampil di kiri ("Mengetahui").
 * Bila jabatan belum diisi orangnya, tertulis "(belum ditetapkan)" -- tidak pernah nama karangan.
 */
export function SignatureBlock({
  documentCode,
  studentId,
  place,
  date,
}: {
  documentCode: string;
  studentId?: string | null;
  place?: string;
  date?: string;
}) {
  const [signers, setSigners] = useState<{ signer1: Signer; signer2: Signer | null } | null>(null);

  useEffect(() => {
    let live = true;
    const params = new URLSearchParams({ documentCode });
    if (studentId) params.set('studentId', studentId);
    fetch(`${getApiBaseUrl()}/document-signatures/resolve?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (live && d?.signer1) setSigners({ signer1: d.signer1, signer2: d.signer2 ?? null });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [documentCode, studentId]);

  if (!signers) return null;

  const Col = ({ s, align, heading }: { s: Signer; align: 'left' | 'right'; heading?: string }) => (
    <div className={`space-y-1 text-xs text-slate-800 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {heading && <p>{heading}</p>}
      <p className="font-bold">{s.roleLabel},</p>
      <div className="h-16" />
      <p className={`font-bold underline ${s.available ? 'text-slate-900' : 'text-slate-400 italic no-underline'}`}>
        {s.name ?? '(belum ditetapkan)'}
      </p>
      {s.nip && <p className="text-[11px] text-slate-500">NIP/NIDN. {s.nip}</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 print:border-0 print:shadow-none print:p-0 print:mt-8">
      <div className={`flex ${signers.signer2 ? 'justify-between' : 'justify-end'} gap-8`}>
        {signers.signer2 && <Col s={signers.signer2} align="left" heading="Mengetahui," />}
        <div className="space-y-1">
          {(place || date) && <p className="text-xs text-slate-800 text-right">{[place, date].filter(Boolean).join(', ')}</p>}
          <Col s={signers.signer1} align="right" />
        </div>
      </div>
    </div>
  );
}
