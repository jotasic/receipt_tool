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

// Database migrations (schema migrations)
export {
  runMigrations,
  rollbackToVersion,
  checkMigrationsNeeded,
  getMigrationStatus,
} from './migrations';

// Data migrations
export {
  migrateDocumentTypes,
  verifyDocumentTypeMigration,
} from './migrations/migrateDocumentTypes';

export {
  migrateToUnifiedModel,
  verifyUnifiedModelMigration,
  getMigrationStatistics,
  type MigrationResult,
} from './migrations/unifyModels';

// Database types
export type {
  CategoryRow,
  ReceiptRow,
  ReceiptItemRow,
  ReportRow,
  ReportReceiptRow,
  ReportDocumentRow,
  ReceiptWithCategoryRow,
  ReceiptFullRow,
  ReportWithReceiptsRow,
  DocumentRow,
  TagRow,
  ReceiptTagRow,
  DocumentTagRow,
  CustomFieldRow,
  ReceiptCustomValueRow,
  DocumentCustomValueRow,
  ItemRow,
  ReportItemRow,
  UsagePurposeRow,
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
  // New unified item operations
  linkItemToReport,
  unlinkItemFromReport,
  getReportItemIds,
  getReportItems,
  getReportsByItemId,
  recalculateReportTotalFromItems,
  // Legacy receipt operations (deprecated)
  linkReceiptToReport,
  unlinkReceiptFromReport,
  getReportReceiptIds,
  getReportsByReceiptId,
  recalculateReportTotal,
  getReportStatistics,
  // Legacy document operations (deprecated)
  linkDocumentToReport,
  unlinkDocumentFromReport,
  getReportDocumentIds,
  getReportsByDocumentId,
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
  getDocumentsByType,
} from './documentService';

// Tag service operations
export {
  createTag,
  getTags,
  getTagById,
  getTagByName,
  updateTag,
  deleteTag,
  searchTags,
  addTagToReceipt,
  removeTagFromReceipt,
  getTagsForReceipt,
  getReceiptsByTag,
  setTagsForReceipt,
  addTagToDocument,
  removeTagFromDocument,
  getTagsForDocument,
  getDocumentsByTag,
  setTagsForDocument,
} from './tagService';

// Custom field service operations
export {
  createCustomField,
  getCustomFields,
  getCustomFieldsByEntityType,
  getCustomFieldById,
  updateCustomField,
  deleteCustomField,
  setReceiptCustomValue,
  getReceiptCustomValues,
  deleteReceiptCustomValue,
  setReceiptCustomValues,
  setDocumentCustomValue,
  getDocumentCustomValues,
  deleteDocumentCustomValue,
  setDocumentCustomValues,
} from './customFieldService';

// Item service operations (unified model)
export {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemsByClassification,
  getItemsByUsagePurpose,
  getItemsByDateRange,
  searchItems,
  getTotalByUsagePurpose,
  getTotalByClassification,
  getItemsByClassificationAndPurpose,
  getTotalByClassificationAndPurpose,
  getItemsRequiringSubmission,
  getExpenseItems,
  getProofDocuments,
} from './itemService';

// Usage purpose service operations
export {
  getAllUsagePurposes,
  getActiveUsagePurposes,
  getUsagePurposeById,
  createUsagePurpose,
  updateUsagePurpose,
  toggleUsagePurposeActive,
  reorderUsagePurposes,
  deleteUsagePurpose,
  isUsagePurposeInUse,
  getUsagePurposeUsageCount,
  getUsagePurposeStatistics,
} from './usagePurposeService';

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
