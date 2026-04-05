'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isInitialLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialLoading, router]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
