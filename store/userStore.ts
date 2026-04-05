import { create } from 'zustand';
import api from '../lib/axios';
import { IUser, ApiResponse } from '../types';

interface UserState {
  users: IUser[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: (search?: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async (search) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100'); // Get more for the dropdown

      const { data } = await api.get<ApiResponse<IUser[]>>(`/users?${params}`);
      set({ users: data.data, isLoading: false });
    } catch (err: unknown) {
      const error = err as import('axios').AxiosError<{ message: string }>;
      set({ error: error.response?.data?.message || 'Failed to fetch users', isLoading: false });
    }
  },
}));
