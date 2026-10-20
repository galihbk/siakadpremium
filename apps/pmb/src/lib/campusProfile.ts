'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from './api';
import { toCampusInfo, type CampusInfo, type CampusProfile } from './campusInfo';

export type { CampusInfo, CampusProfile } from './campusInfo';

let profilePromise: Promise<CampusProfile | null> | null = null;

function loadProfile(): Promise<CampusProfile | null> {
  if (!profilePromise) {
    profilePromise = fetch(`${getApiBaseUrl()}/landing-page`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        return d && typeof d === 'object' ? (d as CampusProfile) : null;
      })
      .catch(() => null);
  }
  return profilePromise;
}

/** Profil kampus (nama, singkatan, logo, kontak) dari pengaturan institusi; `null` selama dimuat / bila gagal. */
export function useCampusProfile(): CampusProfile | null {
  const [profile, setProfile] = useState<CampusProfile | null>(null);
  useEffect(() => {
    let alive = true;
    loadProfile().then((p) => alive && setProfile(p));
    return () => {
      alive = false;
    };
  }, []);
  return profile;
}

/** Sama seperti useCampusProfile, tetapi selalu mengembalikan objek (kosong selama dimuat) agar mudah dipakai di teks. */
export function useCampus(): CampusInfo {
  return toCampusInfo(useCampusProfile());
}
