import React from 'react';
import { CampusLogo } from '@/components/common/CampusLogo';
import type { InstitutionProfile } from '@/lib/institution';

/**
 * KOP surat resmi sesuai pengaturan Super Admin (Profil Institusi > Pengaturan Identitas > KOP Surat Resmi):
 * baris 1 (yayasan), baris 2 (nama institusi), baris 3 (alamat/kontak), logo kampus di kiri,
 * dan garis pemisah tunggal atau ganda (tebal-tipis).
 * Memakai gaya inline agar tampil sama persis saat dijadikan PDF.
 */
export function KopSurat({
  inst,
  doubleBorder,
}: {
  inst: Pick<InstitutionProfile, 'kopLine1' | 'kopLine2' | 'kopContact' | 'campusName' | 'foundationName' | 'contactAddress' | 'contactPhone' | 'website' | 'logoUrl' | 'logoInitials'> & { doubleBorderKop?: boolean };
  /** Menimpa pengaturan garis ganda dari profil bila diisi. */
  doubleBorder?: boolean;
}) {
  const line1 = inst.kopLine1 || inst.foundationName || '';
  const line2 = (inst.kopLine2 || inst.campusName || '').toUpperCase();
  const line3 =
    inst.kopContact || [inst.contactAddress, inst.contactPhone && `Telp. ${inst.contactPhone}`, inst.website].filter(Boolean).join(' | ');
  const double = doubleBorder ?? inst.doubleBorderKop ?? true;

  return (
    <div style={{ color: '#0f172a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '8px' }}>
        <CampusLogo
          url={inst.logoUrl}
          initials={inst.logoInitials}
          className="w-[72px] h-[72px] shrink-0 rounded-full bg-[#1E3A8A] text-white font-black text-lg flex items-center justify-center"
        />
        <div style={{ flex: 1, textAlign: 'center' }}>
          {line1 && (
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#475569' }}>{line1}</div>
          )}
          <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1.2 }}>{line2}</div>
          {line3 && <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{line3}</div>}
        </div>
        {/* penyeimbang lebar logo agar teks tepat di tengah halaman */}
        <div style={{ width: '72px', flexShrink: 0 }} />
      </div>
      <div style={{ borderTop: double ? '3px solid #0f172a' : '2px solid #0f172a' }} />
      {double && <div style={{ borderTop: '1px solid #0f172a', marginTop: '2px' }} />}
    </div>
  );
}
