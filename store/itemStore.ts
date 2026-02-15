import { create } from 'zustand';
import type { Item, ItemClassification, UsagePurpose } from '@/types/item';
import { requiresSubmission, isProofDocument, isExpense } from '@/types/item';
import { getItems } from '@/services/database/itemService';
import { getTagsForItem } from '@/services/database/tagService';

interface ItemStore {
  // State
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  loadItems: () => Promise<void>;

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

  // Load items from database
  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getItems();

      // Load tags for each item
      const itemsWithTags = await Promise.all(
        items.map(async (item) => {
          const tags = await getTagsForItem(item.id);
          return { ...item, tags };
        })
      );

      set({ items: itemsWithTags, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load items',
        isLoading: false
      });
    }
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
