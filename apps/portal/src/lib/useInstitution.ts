'use client';

import { useEffect, useState } from 'react';
import { FALLBACK_INSTITUTION_PROFILE, getInstitutionProfile, type InstitutionProfile } from './institution';

/** Profil institusi (nama, logo, kontak, kop) dari server; kosong (netral) selama dimuat. */
export function useInstitution(): InstitutionProfile {
  const [profile, setProfile] = useState<InstitutionProfile>(FALLBACK_INSTITUTION_PROFILE);
  useEffect(() => {
    let alive = true;
    getInstitutionProfile().then((p) => alive && setProfile(p));
    return () => {
      alive = false;
    };
  }, []);
  return profile;
}
