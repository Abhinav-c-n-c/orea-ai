'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialLoading,
    error,
    login,
    register,
    logout,
    fetchUser,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};
