# Unified Model Migration - Quick Reference

## TL;DR

Consolidates `receipts` + `documents` → `items` table with 2D classification.

## Classification Mapping

### Receipts → Items
```
receipt_type: 'personal'  → classification: 'personal_card'
receipt_type: 'corporate' → classification: 'corporate_card'
category_id:  'food'      → usage_purpose:  'meal'
category_id:  'transport' → usage_purpose:  'transportation'
category_id:  'medical'   → usage_purpose:  'medical'
category_id:  *           → usage_purpose:  'other'
```

### Documents → Items
```
All documents            → classification: 'proof_document'
document_type: 'medical' → usage_purpose:  'medical'
document_type: *         → usage_purpose:  'other'
```

## Usage

### Auto (during init)
```typescript
import { initDatabase } from './services/database';
const db = await initDatabase(); // Migration runs automatically
```

### Manual
```typescript
import { migrateToUnifiedModel } from './services/database';
const result = await migrateToUnifiedModel(db);
```

### Verify
```typescript
import { verifyUnifiedModelMigration } from './services/database';
const isValid = await verifyUnifiedModelMigration(db);
```

### Stats
```typescript
import { getMigrationStatistics } from './services/database';
const stats = await getMigrationStatistics(db);
```

## Safety Features

- **Idempotent** - Safe to run multiple times
- **Transactional** - Rollback on error
- **Validated** - Data integrity checks
- **Logged** - Detailed error messages

## New Schema

### items table
```sql
- id: TEXT PRIMARY KEY
- title: TEXT NOT NULL
- classification: 'personal_card' | 'corporate_card' | 'proof_document'
- usage_purpose: 'meal' | 'transportation' | 'medical' | 'other'
- amount: REAL (nullable for proof_document)
- date: TEXT NOT NULL
- store_name: TEXT
- file_path: TEXT
- file_type: TEXT
- ocr_text: TEXT
- memo: TEXT
- created_at: TEXT NOT NULL
- updated_at: TEXT NOT NULL
```

### usage_purposes table
```sql
- id: TEXT PRIMARY KEY
- name: TEXT NOT NULL (Korean)
- name_en: TEXT (English)
- icon: TEXT
- color: TEXT
- is_active: INTEGER
- display_order: INTEGER
```

### report_items table
```sql
- report_id: TEXT
- item_id: TEXT
- PRIMARY KEY (report_id, item_id)
```

## Example Queries

### Get all meal expenses
```sql
SELECT * FROM items
WHERE usage_purpose = 'meal'
ORDER BY date DESC;
```

### Get corporate card items
```sql
SELECT * FROM items
WHERE classification = 'corporate_card'
ORDER BY date DESC;
```

### Get corporate meal expenses
```sql
SELECT * FROM items
WHERE classification = 'corporate_card'
  AND usage_purpose = 'meal'
ORDER BY date DESC;
```

### Get items in report
```sql
SELECT i.* FROM items i
JOIN report_items ri ON ri.item_id = i.id
WHERE ri.report_id = ?
ORDER BY i.date DESC;
```

### Get total by classification
```sql
SELECT classification, SUM(amount) as total
FROM items
WHERE amount IS NOT NULL
GROUP BY classification;
```

### Get total by purpose
```sql
SELECT usage_purpose, SUM(amount) as total
FROM items
WHERE amount IS NOT NULL
GROUP BY usage_purpose;
```

## Migration Result

```typescript
interface MigrationResult {
  success: boolean;
  receiptsCount: number;
  documentsCount: number;
  reportLinksCount: number;
  errors: string[];
  timestamp: string;
}
```

## Backup Before Migration

```typescript
import * as FileSystem from 'expo-file-system';

const backup = async () => {
  await FileSystem.copyAsync({
    from: `${FileSystem.documentDirectory}SQLite/receipt_tool.db`,
    to: `${FileSystem.documentDirectory}SQLite/receipt_tool_backup.db`,
  });
};
```

## Files

- **Migration:** `/services/database/migrations/unifyModels.ts`
- **Guide:** `/services/database/migrations/UNIFY_MIGRATION_GUIDE.md`
- **Tests:** `/services/database/migrations/__tests__/unifyModels.test.ts`

## Support

For detailed information, see `UNIFY_MIGRATION_GUIDE.md`
