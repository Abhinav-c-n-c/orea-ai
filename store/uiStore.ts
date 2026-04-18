import { create } from 'zustand';

interface UIState {
  isNavigating: boolean;
  setIsNavigating: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNavigating: false,
  setIsNavigating: (val) => set({ isNavigating: val }),
}));
