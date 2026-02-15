import { create } from 'zustand';
import type { Document, DocumentType } from '@/types';
import { getDocuments } from '@/services/database/documentService';

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, document: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  loadDocuments: () => Promise<void>;

  // Selectors
  getDocumentsByType: (documentType: DocumentType) => Document[];
  getDocumentById: (id: string) => Document | undefined;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document]
  })),
  updateDocument: (id, updatedDocument) => set((state) => ({
    documents: state.documents.map((d) =>
      d.id === id ? { ...d, ...updatedDocument } : d
    ),
  })),
  deleteDocument: (id) => set((state) => ({
    documents: state.documents.filter((d) => d.id !== id),
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Load documents from database
  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = await getDocuments();
      set({ documents, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load documents',
        isLoading: false
      });
    }
  },

  // Selector: Get documents by type
  getDocumentsByType: (documentType) => {
    return get().documents.filter((d) => d.documentType === documentType);
  },

  // Selector: Get document by ID
  getDocumentById: (id) => {
    return get().documents.find((d) => d.id === id);
  },
}));
