import { create } from 'zustand';
import api from '../lib/axios';

export interface GameRoom {
  _id: string;
  roomId: string;
  type: 'tictactoe' | 'bingo';
  players: {
    user: { _id: string; name: string; avatar?: string; email: string };
    score: number;
    _id: string;
  }[];
  status: 'waiting' | 'in_progress' | 'completed';
  winner: { _id: string; name: string } | null;
  currentTurn: { _id: string; name: string } | string | null;
  state: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface GameState {
  currentRoom: GameRoom | null;
  history: GameRoom[];
  isLoading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  createRoom: (type: 'tictactoe' | 'bingo') => Promise<GameRoom>;
  joinRoom: (roomId: string) => Promise<GameRoom>;
  getRoomDetails: (roomId: string) => Promise<GameRoom>;
  setCurrentRoom: (room: GameRoom | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRoom: null,
  history: [],
  isLoading: false,
  error: null,

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/games/history');
      set({ history: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch history', isLoading: false });
    }
  },

  createRoom: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/games/rooms', { type });
      set({ currentRoom: data.data, isLoading: false });
      return data.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to create room', isLoading: false });
      throw err;
    }
  },

  joinRoom: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/games/rooms/${roomId}/join`);
      set({ currentRoom: data.data, isLoading: false });
      return data.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to join room', isLoading: false });
      throw err;
    }
  },

  getRoomDetails: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/games/rooms/${roomId}`);
      set({ currentRoom: data.data, isLoading: false });
      return data.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to get room', isLoading: false });
      throw err;
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),
}));
