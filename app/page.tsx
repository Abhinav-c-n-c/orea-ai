'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isInitialLoading, fetchUser } = useAuthStore();
//change
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      if (isAuthenticated) {
        router.push('/tasks');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isInitialLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-surface-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}
