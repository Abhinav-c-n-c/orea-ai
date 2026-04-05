import { create } from 'zustand';
import api from '../lib/axios';
import { INote } from '../types';

interface NoteState {
  notes: INote[];
  selectedNote: INote | null;
  isLoading: boolean;
  error: string | null;
  fetchNotes: (filters?: Record<string, string>) => Promise<void>;
  fetchNoteById: (id: string) => Promise<void>;
  createNote: (note: Partial<INote>) => Promise<void>;
  updateNote: (id: string, updates: Partial<INote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setSelectedNote: (note: INote | null) => void;
  clearError: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  selectedNote: null,
  isLoading: false,
  error: null,

  fetchNotes: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      const params = new URLSearchParams(filters || {});
      const { data } = await api.get(`/notes?${params}`);
      set({ notes: data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to fetch notes', isLoading: false });
    }
  },

  fetchNoteById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get(`/notes/${id}`);
      set({ selectedNote: data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to fetch note', isLoading: false });
    }
  },

  createNote: async (note) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/notes', note);
      set((state) => ({ notes: [data.data, ...state.notes], isLoading: false }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to create note', isLoading: false });
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const { data } = await api.put(`/notes/${id}`, updates);
      set((state) => ({
        notes: state.notes.map((n) => (n._id === id ? data.data : n)),
        selectedNote: state.selectedNote?._id === id ? data.data : state.selectedNote,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to update note' });
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      set((state) => ({
        notes: state.notes.filter((n) => n._id !== id),
        selectedNote: state.selectedNote?._id === id ? null : state.selectedNote,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to delete note' });
    }
  },

  setSelectedNote: (note) => set({ selectedNote: note }),
  clearError: () => set({ error: null }),
}));
