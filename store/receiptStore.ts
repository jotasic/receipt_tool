import { create } from 'zustand';
import type { Receipt } from '@/types';
import { getReceipts } from '@/services/database/receiptService';

interface ReceiptState {
  receipts: Receipt[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setReceipts: (receipts: Receipt[]) => void;
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (id: string, receipt: Partial<Receipt>) => void;
  deleteReceipt: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  loadReceipts: () => Promise<void>;
}

export const useReceiptStore = create<ReceiptState>((set) => ({
  receipts: [],
  isLoading: false,
  error: null,

  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) => set((state) => ({
    receipts: [...state.receipts, receipt]
  })),
  updateReceipt: (id, updatedReceipt) => set((state) => ({
    receipts: state.receipts.map((r) =>
      r.id === id ? { ...r, ...updatedReceipt } : r
    ),
  })),
  deleteReceipt: (id) => set((state) => ({
    receipts: state.receipts.filter((r) => r.id !== id),
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Load receipts from database
  loadReceipts: async () => {
    set({ isLoading: true, error: null });
    try {
      const receipts = await getReceipts();
      set({ receipts, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load receipts',
        isLoading: false
      });
    }
  },
}));
