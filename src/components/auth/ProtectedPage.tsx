// src/components/auth/ProtectedPage.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { PageLoading } from '@/components/ui/loading';

interface ProtectedPageProps {
  children: React.ReactNode;
  allowTeacher?: boolean;
  requireAdmin?: boolean;
  requireManageSchedules?: boolean;
}

export default function ProtectedPage({
  children,
  allowTeacher = false,
  requireAdmin = false,
  requireManageSchedules = false
}: ProtectedPageProps) {
  const { user, isTeacher, isAdmin, canManageSchedules, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/');
      return;
    }

    // Vérifier si l'enseignant peut accéder
    if (isTeacher() && !allowTeacher) {
      router.push('/schedule'); // Rediriger vers la page emploi du temps
      return;
    }

    // Vérifier si admin requis
    if (requireAdmin && !isAdmin()) {
      router.push('/');
      return;
    }

    // Vérifier si permission de gestion des emplois du temps requise
    if (requireManageSchedules && !canManageSchedules()) {
      router.push('/schedule');
      return;
    }
  }, [user, loading, allowTeacher, requireAdmin, requireManageSchedules, router, isTeacher, isAdmin, canManageSchedules]);

  if (loading) {
    return <PageLoading message="Vérification des permissions..." />;
  }

  if (!user) {
    return null;
  }

  // Afficher message d'accès refusé pour les enseignants
  if (isTeacher() && !allowTeacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive">
          <h2 className="text-2xl font-bold text-destructive mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
