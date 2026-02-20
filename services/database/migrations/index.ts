/**
 * Database Migrations
 *
 * Export all migration functions for database initialization and upgrades
 */

export { runMigrations, ALL_MIGRATIONS } from './runner';
export type { MigrationProgress, MigrationProgressCallback } from './runner';

export { migrateDocumentTypes, verifyDocumentTypeMigration } from './migrateDocumentTypes';
export {
  migrateToUnifiedModel,
  verifyUnifiedModelMigration,
  getMigrationStatistics,
  type MigrationResult,
} from './unifyModels';
