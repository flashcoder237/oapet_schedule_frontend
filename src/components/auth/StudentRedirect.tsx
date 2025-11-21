'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function StudentRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isStudent } = useAuth();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading) return;

    // Si l'utilisateur est un étudiant et n'est pas déjà sur une page étudiant
    if (user && isStudent() && !pathname.startsWith('/student') && !pathname.startsWith('/login')) {
      router.push('/student/dashboard');
    }
  }, [user, loading, isStudent, pathname, router]);

  return null; // Ce composant ne rend rien
}
