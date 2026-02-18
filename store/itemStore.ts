import { create } from 'zustand';
import type { Item, ItemClassification, UsagePurpose } from '@/types/item';
import { requiresSubmission, isProofDocument, isExpense } from '@/types/item';
import { getItemsWithTags } from '@/services/database/itemService';

const STALE_THRESHOLD_MS = 30_000; // 30초

interface ItemStore {
  // State
  items: Item[];
  isLoading: boolean;
  error: string | null;
  lastLoadedAt: number | null;

  // Actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  /** 항상 강제 로드 (생성/수정/삭제 후 호출) */
  loadItems: () => Promise<void>;
  /** 30초 이내 로드된 경우 스킵 (탭 전환 시 호출) */
  loadItemsIfStale: () => Promise<void>;

  // Selectors
  getItemsByClassification: (classification: ItemClassification) => Item[];
  getItemsByUsagePurpose: (usagePurpose: UsagePurpose) => Item[];
  getItemById: (id: string) => Item | undefined;
  getExpenseItems: () => Item[];
  getProofDocuments: () => Item[];
  getItemsRequiringSubmission: () => Item[];
}

export const useItemStore = create<ItemStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  lastLoadedAt: null,

  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  updateItem: (id, updatedItem) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updatedItem } : item
    ),
  })),
  deleteItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Load items from database (항상 강제 로드)
  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getItemsWithTags();
      set({ items, isLoading: false, lastLoadedAt: Date.now() });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load items',
        isLoading: false,
      });
    }
  },

  // 30초 이내 로드된 경우 스킵 (탭 전환 시 호출)
  loadItemsIfStale: async () => {
    const { lastLoadedAt, loadItems } = get();
    if (lastLoadedAt && Date.now() - lastLoadedAt < STALE_THRESHOLD_MS) {
      return;
    }
    await loadItems();
  },

  // Selectors
  getItemsByClassification: (classification) => {
    const { items } = get();
    return items.filter((item) => item.classification === classification);
  },

  getItemsByUsagePurpose: (usagePurpose) => {
    const { items } = get();
    return items.filter((item) => item.usagePurpose === usagePurpose);
  },

  getItemById: (id) => {
    const { items } = get();
    return items.find((item) => item.id === id);
  },

  getExpenseItems: () => {
    const { items } = get();
    return items.filter((item) => isExpense(item));
  },

  getProofDocuments: () => {
    const { items } = get();
    return items.filter((item) => isProofDocument(item));
  },

  getItemsRequiringSubmission: () => {
    const { items } = get();
    return items.filter((item) => requiresSubmission(item));
  },
}));
