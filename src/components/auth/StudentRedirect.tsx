'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

export function StudentRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isStudent } = useAuth();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return;

    // Si l'utilisateur est un étudiant et n'est pas déjà sur une page étudiant
    if (user && isStudent() && !pathname.startsWith('/student')) {
      router.push('/student/dashboard');
    }
  }, [user, isLoading, isStudent, pathname, router]);

  return null; // Ce composant ne rend rien
}
