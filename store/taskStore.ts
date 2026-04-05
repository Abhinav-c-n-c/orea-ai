import { create } from 'zustand';
import api from '../lib/axios';
import { ITask, TaskStatus } from '../types';

interface TaskState {
  tasks: ITask[];
  selectedTask: ITask | null;
  isLoading: boolean;
  error: string | null;
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
  fetchTasks: (filters?: Record<string, string>) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  createTask: (task: any) => Promise<void>;
  updateTask: (id: string, updates: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  addComment: (id: string, comment: { text: string; mentions?: string[] }) => Promise<void>;
  setSelectedTask: (task: ITask | null) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  meta: null,

  fetchTasks: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      const params = new URLSearchParams(filters || {});
      const { data } = await api.get(`/tasks?${params}`);
      set({ tasks: data.data, meta: data.meta, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to fetch tasks', isLoading: false });
    }
  },

  fetchTaskById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get(`/tasks/${id}`);
      set({ selectedTask: data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to fetch task', isLoading: false });
    }
  },

  createTask: async (task) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/tasks', task);
      set((state) => ({ tasks: [data.data, ...state.tasks], isLoading: false }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to create task', isLoading: false });
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? data.data : t)),
        selectedTask: state.selectedTask?._id === id ? data.data : state.selectedTask,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to update task' });
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        selectedTask: state.selectedTask?._id === id ? null : state.selectedTask,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to delete task' });
    }
  },

  updateTaskStatus: async (id, status) => {
    await get().updateTask(id, { status } as Partial<ITask>);
  },

  addComment: async (id, comment) => {
    try {
      const { data } = await api.post(`/tasks/${id}/comments`, comment);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? data.data : t)),
        selectedTask: state.selectedTask?._id === id ? data.data : state.selectedTask,
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to add comment' });
    }
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  clearError: () => set({ error: null }),
}));
