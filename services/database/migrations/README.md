# Database Migrations

This directory contains database migration scripts for handling schema changes and data transformations.

## Overview

Migrations are designed to be:
- **Idempotent**: Safe to run multiple times
- **Transactional**: Changes are wrapped in transactions for safety
- **Logged**: All migrations provide detailed console output
- **Error-handled**: Failures rollback cleanly

## Current Migrations

### migrateDocumentTypes

**Purpose**: Migrate deprecated document types to 'other'

**Background**: The application removed support for three document types:
- `contract` (계약서) - Contracts
- `estimate` (견적서) - Estimates
- `invoice` (청구서) - Invoices

These are being replaced with a simpler type system focused on HR/financial documents:
- `medical` - Medical documents and receipts
- `certificate` - Verification certificates
- `other` - All other documents

**What it does**:
1. Checks if the documents table exists
2. Finds all documents with deprecated types (contract, estimate, invoice)
3. Updates them to `document_type = 'other'`
4. Updates the `updated_at` timestamp
5. Logs the number of documents migrated

**When it runs**: Automatically during database initialization, after tables are created but before the app starts using data.

**Usage**:

```typescript
import { migrateDocumentTypes } from './migrations/migrateDocumentTypes';

// Run migration
await migrateDocumentTypes(db);

// Verify migration completed successfully
import { verifyDocumentTypeMigration } from './migrations/migrateDocumentTypes';
const isValid = await verifyDocumentTypeMigration(db);
console.log('Migration valid:', isValid);
```

**SQL Executed**:
```sql
UPDATE documents
SET document_type = 'other',
    updated_at = datetime('now')
WHERE document_type IN ('contract', 'estimate', 'invoice')
```

## Integration

Migrations are automatically called during database initialization in `/services/database/init.ts`:

```typescript
// Seed default categories
await seedDefaultCategories(db);

// Run data migrations
await migrateDocumentTypes(db);

dbInstance = db;
```

This ensures migrations run:
- After all tables and indexes are created
- After default data is seeded
- Before the database instance is returned to the app

## Testing

Run the migration tests:

```bash
npm test services/database/migrations/__tests__/migrateDocumentTypes.test.ts
```

Test coverage includes:
- Migrating deprecated types to 'other'
- Not affecting valid document types
- Idempotency (safe to run multiple times)
- Handling empty tables
- Handling non-existent tables
- Updating timestamps
- Transaction rollback on errors
- Verification function

## Adding New Migrations

When creating a new migration:

1. Create a new file in this directory: `migrateSomething.ts`
2. Export a migration function:
   ```typescript
   export async function migrateSomething(db: SQLite.SQLiteDatabase): Promise<void> {
     // Implementation
   }
   ```
3. Make it idempotent (check if migration already applied)
4. Wrap operations in transactions
5. Add comprehensive error handling
6. Include detailed logging
7. Create tests in `__tests__/`
8. Add to `init.ts` in the appropriate order
9. Export from `index.ts`
10. Document in this README

## Migration Patterns

### Check-Before-Modify Pattern
```typescript
// Check if migration needed
const count = await db.getFirstAsync<{ count: number }>(
  'SELECT COUNT(*) FROM table WHERE condition'
);

if (count && count.count === 0) {
  console.log('No migration needed');
  return;
}

// Proceed with migration
```

### Transaction Pattern
```typescript
await db.execAsync('BEGIN TRANSACTION');

try {
  // Perform updates
  await db.runAsync('UPDATE ...');
  await db.execAsync('COMMIT');
  console.log('Migration successful');
} catch (error) {
  await db.execAsync('ROLLBACK');
  throw error;
}
```

### Table Existence Check
```typescript
const tableExists = await db.getFirstAsync<{ count: number }>(
  `SELECT COUNT(*) as count FROM sqlite_master
   WHERE type='table' AND name='table_name'`
);

if (!tableExists || tableExists.count === 0) {
  console.log('Table does not exist, skipping');
  return;
}
```

## Best Practices

1. **Always use transactions** for data modifications
2. **Check table existence** before operating on it
3. **Make migrations idempotent** - safe to run multiple times
4. **Log everything** - start, progress, completion, errors
5. **Handle errors gracefully** - rollback and provide clear messages
6. **Test thoroughly** - unit tests with in-memory database
7. **Verify results** - provide verification functions
8. **Update timestamps** - when modifying records
9. **Document changes** - explain why and what

## Troubleshooting

### Migration fails during init
- Check console logs for specific error
- Verify database file permissions
- Ensure foreign key constraints are satisfied
- Check for conflicting data

### Migration runs but data unchanged
- Verify SQL WHERE clause is correct
- Check if data matches expected format
- Run verification function to confirm

### Migration runs multiple times
- This is intentional - migrations should be idempotent
- Check console logs to see if any documents were actually updated
- If count is 0, migration was already applied
