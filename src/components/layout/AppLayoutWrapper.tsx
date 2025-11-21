'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppLayout from './AppLayout';
import { LoadingSpinner } from '@/components/ui/loading';
import { StudentRedirect } from '@/components/auth/StudentRedirect';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading on server and during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Check if we're on a student route
  const isStudentRoute = pathname?.startsWith('/student');

  // Student routes use their own layout, don't wrap with AppLayout
  if (isStudentRoute) {
    return (
      <>
        <StudentRedirect />
        {children}
      </>
    );
  }

  // Only render AppLayout for non-student routes (admin/teacher)
  return (
    <>
      <StudentRedirect />
      <AppLayout>{children}</AppLayout>
    </>
  );
}