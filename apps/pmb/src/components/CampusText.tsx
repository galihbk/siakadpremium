'use client';

import { useCampus } from '@/lib/campusProfile';
import { usePmbYear } from '@/lib/pmbYear';

/** Nama kampus dari Profil Institusi (kosong selama dimuat). */
export function CampusName({ upper = false }: { upper?: boolean }) {
  const { name } = useCampus();
  return <>{upper ? name.toUpperCase() : name}</>;
}

/** Tahun akademik gelombang PMB yang berjalan, mis. `<PmbYear prefix=" TA " />` -> " TA 2027/2028". Kosong bila belum ada gelombang. */
export function PmbYear({ prefix = ' ', suffix = '' }: { prefix?: string; suffix?: string }) {
  const year = usePmbYear();
  return year ? <>{`${prefix}${year}${suffix}`}</> : null;
}
