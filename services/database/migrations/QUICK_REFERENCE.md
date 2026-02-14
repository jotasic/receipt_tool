# Document Type Migration - Quick Reference

## What This Migration Does

Converts deprecated document types to 'other':
- `contract` (계약서) → `other`
- `estimate` (견적서) → `other`
- `invoice` (청구서) → `other`

## Quick Commands

```bash
# Check migration status
npx ts-node services/database/migrations/runMigration.ts check

# Preview changes (dry run)
npx ts-node services/database/migrations/runMigration.ts dry-run

# Run migration
npx ts-node services/database/migrations/runMigration.ts migrate

# Verify migration
npx ts-node services/database/migrations/runMigration.ts verify

# Run tests
npm test services/database/migrations/__tests__/migrateDocumentTypes.test.ts
```

## Code Usage

### Import
```typescript
import { migrateDocumentTypes, verifyDocumentTypeMigration } from '@/services/database';
```

### Basic Usage
```typescript
// Run migration
await migrateDocumentTypes(db);
```

### With Verification
```typescript
await migrateDocumentTypes(db);
const isValid = await verifyDocumentTypeMigration(db);
console.log('Success:', isValid);
```

## Integration

The migration runs automatically during database initialization:

```typescript
// In init.ts:
await seedDefaultCategories(db);
await migrateDocumentTypes(db);  // Runs here
dbInstance = db;
```

## Key Features

✅ **Idempotent** - Safe to run multiple times
✅ **Transactional** - Automatic rollback on error
✅ **Logged** - Detailed console output
✅ **Safe** - Checks table existence first
✅ **Tested** - Comprehensive test coverage

## File Locations

| File | Path |
|------|------|
| Migration | `/services/database/migrations/migrateDocumentTypes.ts` |
| Tests | `/services/database/migrations/__tests__/migrateDocumentTypes.test.ts` |
| Integration | `/services/database/init.ts` (line 119) |
| CLI Tool | `/services/database/migrations/runMigration.ts` |

## Console Output

### Success
```
[Migration] Starting document type migration...
[Migration] Found 5 document(s) with deprecated types to migrate
[Migration] Successfully migrated 5 document(s) to 'other' type
[Migration] Document type migration completed successfully
```

### No Migration Needed
```
[Migration] Starting document type migration...
[Migration] No documents with deprecated types found
```

### Error
```
[Migration] Document type migration failed: <error message>
[Migration] Error details: { message, stack, timestamp }
```

## SQL

```sql
-- What the migration runs:
UPDATE documents
SET document_type = 'other',
    updated_at = datetime('now')
WHERE document_type IN ('contract', 'estimate', 'invoice')
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration not running | Check import in `init.ts` |
| No documents migrated | Run `check` command to see status |
| Migration fails | Check console logs for error details |
| Want to verify | Run `verify` command or call `verifyDocumentTypeMigration()` |

## Documentation

- **README.md** - Full documentation
- **USAGE_EXAMPLE.ts** - Code examples
- **MIGRATION_SUMMARY.md** - Implementation details
- **QUICK_REFERENCE.md** - This file

## Support

For questions or issues:
1. Check the README.md for detailed documentation
2. Review USAGE_EXAMPLE.ts for code patterns
3. Run the dry-run command to preview changes
4. Check test suite for expected behavior
