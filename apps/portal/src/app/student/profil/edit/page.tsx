'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentProfilePage from '../page';

export default function StudentEditProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/profil');
  }, [router]);

  return <StudentProfilePage />;
}
