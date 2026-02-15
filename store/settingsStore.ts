import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'receipt-tool-settings';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  isLoaded: boolean;

  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',
  currency: 'KRW',
  isLoaded: false,

  setTheme: async (theme) => {
    set({ theme });
    try {
      const currentSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      settings.theme = theme;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },

  setCurrency: async (currency) => {
    set({ currency });
    try {
      const currentSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      settings.currency = currency;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save currency preference:', error);
    }
  },

  loadSettings: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        set({
          theme: settings.theme || 'system',
          currency: settings.currency || 'KRW',
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },
}));
