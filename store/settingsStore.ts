import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  currency: string;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  currency: 'KRW',

  setTheme: (theme) => set({ theme }),
  setCurrency: (currency) => set({ currency }),
}));
