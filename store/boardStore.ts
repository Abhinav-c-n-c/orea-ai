import { create } from 'zustand';
import api from '../lib/axios';
import { IBoard, ApiResponse } from '../types';

interface BoardState {
  boards: IBoard[];
  activeBoard: IBoard | null;
  isLoading: boolean;
  error: string | null;
  fetchBoards: () => Promise<void>;
  setActiveBoard: (board: IBoard) => void;
  createBoard: (name: string) => Promise<IBoard>;
  deleteBoard: (id: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  activeBoard: null,
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<ApiResponse<IBoard[]>>('/boards');
      set({ boards: data.data, isLoading: false });

      // Set first board as active if none set
      if (data.data.length > 0 && !get().activeBoard) {
        set({ activeBoard: data.data[0] });
      }
    } catch (err: unknown) {
      const error = err as import('axios').AxiosError<{ message: string }>;
      set({ error: error.response?.data?.message || 'Failed to fetch boards', isLoading: false });
    }
  },

  setActiveBoard: (board: IBoard) => {
    set({ activeBoard: board });
  },

  createBoard: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post<ApiResponse<IBoard>>('/boards', { name });
      set((state) => ({
        boards: [data.data, ...state.boards],
        activeBoard: data.data,
        isLoading: false,
      }));
      return data.data;
    } catch (err: unknown) {
      const error = err as import('axios').AxiosError<{ message: string }>;
      const message = error.response?.data?.message || 'Failed to create board';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deleteBoard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/boards/${id}`);
      set((state) => {
        const newBoards = state.boards.filter((b) => b._id !== id);
        return {
          boards: newBoards,
          activeBoard: state.activeBoard?._id === id ? newBoards[0] || null : state.activeBoard,
          isLoading: false,
        };
      });
    } catch (err: unknown) {
      const error = err as import('axios').AxiosError<{ message: string }>;
      set({ error: error.response?.data?.message || 'Failed to delete board', isLoading: false });
    }
  },
}));
