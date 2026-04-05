import { create } from 'zustand';
import api from '../lib/axios';
import { IUser, LoginCredentials, RegisterData } from '../types';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialLoading: true,
  error: null,

  login: async (credentials) => {
    try {
      console.log('Logging in with:', credentials.email);
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/login', credentials);
      console.log('Login response:', data);
      const { user, accessToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false, isInitialLoading: false });
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Login failed',
        isLoading: false,
        isInitialLoading: false,
      });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const { data: response } = await api.post('/auth/register', data);
      const { user, accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user, isAuthenticated: true, isLoading: false, isInitialLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Registration failed',
        isLoading: false,
        isInitialLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialLoading: false });
    }
  },

  fetchUser: async () => {
    try {
      set({ isInitialLoading: true });
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isInitialLoading: false, isAuthenticated: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user, isAuthenticated: true, isInitialLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isInitialLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
}));
