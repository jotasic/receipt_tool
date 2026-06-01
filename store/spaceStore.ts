import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllSpaces } from '@/services/database/spaceService';
import type { Space } from '@/types/space';

const CURRENT_SPACE_KEY = '@receipt_tool/current_space_id';

interface SpaceState {
  currentSpace: Space | null;
  spaces: Space[];
  isLoaded: boolean;

  // Actions
  loadSpaces: () => Promise<void>;
  setCurrentSpace: (space: Space) => Promise<void>;
  refreshSpaces: () => Promise<void>;
}

export const useSpaceStore = create<SpaceState>((set, get) => ({
  currentSpace: null,
  spaces: [],
  isLoaded: false,

  loadSpaces: async () => {
    try {
      const spaces = await getAllSpaces();

      let currentSpace: Space | null = null;

      // AsyncStorage에서 마지막으로 선택한 공간 ID 복원
      const savedId = await AsyncStorage.getItem(CURRENT_SPACE_KEY);
      if (savedId) {
        currentSpace = spaces.find((s) => s.id === savedId) ?? null;
      }

      // 저장된 ID가 없거나 해당 공간이 삭제된 경우 첫 번째 공간 자동 선택
      if (!currentSpace && spaces.length > 0) {
        currentSpace = spaces[0];
      }

      set({ spaces, currentSpace, isLoaded: true });
    } catch (error) {
      console.error('Failed to load spaces:', error);
      set({ isLoaded: true });
    }
  },

  setCurrentSpace: async (space: Space) => {
    set({ currentSpace: space });
    try {
      await AsyncStorage.setItem(CURRENT_SPACE_KEY, space.id);
    } catch (error) {
      console.error('Failed to save current space ID:', error);
    }
  },

  refreshSpaces: async () => {
    try {
      const spaces = await getAllSpaces();
      const { currentSpace } = get();

      // currentSpace도 최신 데이터로 업데이트
      let updatedCurrentSpace: Space | null = null;
      if (currentSpace) {
        updatedCurrentSpace = spaces.find((s) => s.id === currentSpace.id) ?? null;
      }

      // currentSpace가 삭제된 경우 첫 번째 공간으로 폴백
      if (!updatedCurrentSpace && spaces.length > 0) {
        updatedCurrentSpace = spaces[0];
      }

      set({ spaces, currentSpace: updatedCurrentSpace });
    } catch (error) {
      console.error('Failed to refresh spaces:', error);
    }
  },
}));
