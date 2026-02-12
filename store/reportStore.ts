/**
 * Report Store
 *
 * Global state management for reports using Zustand
 */

import { create } from 'zustand';
import type { Report } from '@/types';
import { loadReports } from '@/services/report';

interface ReportState {
  reports: Report[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  loadReports: () => Promise<void>;
  getReportById: (id: string) => Report | undefined;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  isLoading: false,
  error: null,

  /**
   * Set the entire reports array
   */
  setReports: (reports) => set({ reports }),

  /**
   * Add a new report to the store
   */
  addReport: (report) =>
    set((state) => ({
      reports: [...state.reports, report],
    })),

  /**
   * Update an existing report by ID
   */
  updateReport: (id, updatedReport) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id ? { ...r, ...updatedReport } : r
      ),
    })),

  /**
   * Delete a report by ID
   */
  deleteReport: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    })),

  /**
   * Set loading state
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Set error message
   */
  setError: (error) => set({ error }),

  /**
   * Load all reports from the database
   */
  loadReports: async () => {
    set({ isLoading: true, error: null });
    try {
      const reports = await loadReports();
      set({ reports, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load reports',
        isLoading: false,
      });
    }
  },

  /**
   * Get a report by ID from the current store state
   */
  getReportById: (id) => {
    return get().reports.find((r) => r.id === id);
  },
}));
