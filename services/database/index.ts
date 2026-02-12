/**
 * Database Service Module
 *
 * Central export point for all database-related functionality
 */

// Database initialization
export {
  initDatabase,
  getDatabaseInstance,
  closeDatabase,
  resetDatabase,
  DB_NAME,
  DATABASE_NAME,
} from './init';

export { getDatabase } from './getDatabase';

// Schema definitions
export { SCHEMA, INDEXES, DEFAULT_CATEGORIES } from './schema';

// Database migrations
export {
  runMigrations,
  rollbackToVersion,
  checkMigrationsNeeded,
  getMigrationStatus,
} from './migrations';

// Database types
export type {
  CategoryRow,
  ReceiptRow,
  ReceiptItemRow,
  ReportRow,
  ReportReceiptRow,
  ReceiptWithCategoryRow,
  ReceiptFullRow,
  ReportWithReceiptsRow,
  DocumentRow,
} from './types';

// Receipt service operations
export {
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  getReceiptsByCategory,
  getReceiptsByDateRange,
  searchReceipts,
  createReceiptItem,
  getReceiptItems,
  updateReceiptItem,
  deleteReceiptItem,
  getTotalByCategoryId,
} from './receiptService';

// Report service operations
export {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByStatus,
  submitReport,
  approveReport,
  rejectReport,
  revertReportToDraft,
  linkReceiptToReport,
  unlinkReceiptFromReport,
  getReportReceiptIds,
  getReportsByReceiptId,
  recalculateReportTotal,
  getReportStatistics,
} from './reportService';

// Category service operations
export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStatistics,
  categoryNameExists,
} from './categoryService';

// Document service operations
export {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  searchDocuments,
} from './documentService';

// Database utility functions
export {
  executeTransaction,
  tableExists,
  getTableRowCount,
  executeRawQuery,
  getDatabaseStatistics,
  vacuumDatabase,
  analyzeDatabase,
  checkDatabaseIntegrity,
  checkForeignKeys,
  generateUniqueId,
  formatDateForDb,
  parseDateFromDb,
  sanitizeLikeQuery,
  buildWhereClause,
} from './utils';
