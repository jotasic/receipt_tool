/**
 * Database Migrations
 *
 * Export all migration functions for database initialization and upgrades
 */

export { migrateDocumentTypes, verifyDocumentTypeMigration } from './migrateDocumentTypes';
export {
  migrateToUnifiedModel,
  verifyUnifiedModelMigration,
  getMigrationStatistics,
  type MigrationResult,
} from './unifyModels';
