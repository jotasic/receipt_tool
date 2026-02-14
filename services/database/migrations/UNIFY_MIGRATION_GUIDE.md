# Unified Model Migration Guide

## Overview

This migration consolidates the separate `receipts` and `documents` tables into a unified `items` table using a 2D classification system. This provides a cleaner data model and simplifies application logic.

## Migration Strategy

### Before Migration
```
receipts (receipt_type, category_id) → report_receipts
documents (document_type)             → report_documents
```

### After Migration
```
items (classification, usage_purpose) → report_items
```

## Classification Mapping

### 2D Classification System

**Dimension 1: Classification (What)**
- `personal_card` - Personal card expenses
- `corporate_card` - Corporate card expenses
- `proof_document` - Supporting documentation

**Dimension 2: Usage Purpose (Why)**
- `meal` - Meal expenses
- `transportation` - Transportation costs
- `medical` - Medical expenses
- `other` - Other purposes

## Data Transformation

### Receipts → Items

| Source Field | Target Field | Transformation |
|--------------|--------------|----------------|
| `id` | `id` | Direct copy |
| `title` | `title` | Direct copy |
| `receipt_type` | `classification` | 'personal' → 'personal_card'<br>'corporate' → 'corporate_card' |
| `category_id` | `usage_purpose` | 'food' → 'meal'<br>'transport' → 'transportation'<br>'medical' → 'medical'<br>else → 'other' |
| `amount` | `amount` | Direct copy |
| `date` | `date` | Direct copy |
| `store_name` | `store_name` | Direct copy |
| `image_path` | `file_path` | Direct copy |
| N/A | `file_type` | Set to 'image' |
| `ocr_text` | `ocr_text` | Direct copy |
| `memo` | `memo` | Direct copy |
| `created_at` | `created_at` | Direct copy |
| `updated_at` | `updated_at` | Direct copy |

### Documents → Items

| Source Field | Target Field | Transformation |
|--------------|--------------|----------------|
| `id` | `id` | Direct copy |
| `title` | `title` | Direct copy |
| N/A | `classification` | Set to 'proof_document' |
| `document_type` | `usage_purpose` | 'medical' → 'medical'<br>else → 'other' |
| N/A | `amount` | NULL (no amount) |
| `created_at` | `date` | Use created_at as date |
| N/A | `store_name` | NULL |
| `file_path` | `file_path` | Direct copy |
| `file_type` | `file_type` | Direct copy |
| N/A | `ocr_text` | NULL |
| `memo` | `memo` | Direct copy |
| `created_at` | `created_at` | Direct copy |
| `updated_at` | `updated_at` | Direct copy |

## Migration Steps

### Step 1: Seed Usage Purposes
```sql
INSERT OR IGNORE INTO usage_purposes (id, name, name_en, icon, color, display_order)
VALUES
  ('meal', '식대', 'Meal', 'restaurant', '#FF6B6B', 1),
  ('transportation', '교통비', 'Transportation', 'car', '#4ECDC4', 2),
  ('medical', '의료비', 'Medical', 'medical', '#FCBAD3', 3),
  ('other', '기타', 'Other', 'ellipsis-horizontal', '#C7CEEA', 4);
```

### Step 2: Migrate Receipts
```sql
INSERT INTO items (
  id, title, classification, usage_purpose,
  amount, date, store_name, file_path, file_type,
  ocr_text, memo, created_at, updated_at
)
SELECT
  id,
  title,
  CASE receipt_type
    WHEN 'personal' THEN 'personal_card'
    WHEN 'corporate' THEN 'corporate_card'
    ELSE 'corporate_card'
  END as classification,
  CASE category_id
    WHEN 'food' THEN 'meal'
    WHEN 'transport' THEN 'transportation'
    WHEN 'medical' THEN 'medical'
    ELSE 'other'
  END as usage_purpose,
  amount,
  date,
  store_name,
  image_path as file_path,
  'image' as file_type,
  ocr_text,
  memo,
  created_at,
  updated_at
FROM receipts;
```

### Step 3: Migrate Documents
```sql
INSERT INTO items (
  id, title, classification, usage_purpose,
  amount, date, file_path, file_type,
  memo, created_at, updated_at
)
SELECT
  id,
  title,
  'proof_document' as classification,
  CASE document_type
    WHEN 'medical' THEN 'medical'
    ELSE 'other'
  END as usage_purpose,
  NULL as amount,
  created_at as date,
  file_path,
  file_type,
  memo,
  created_at,
  updated_at
FROM documents;
```

### Step 4: Migrate Report Associations
```sql
-- From report_receipts
INSERT INTO report_items (report_id, item_id)
SELECT report_id, receipt_id FROM report_receipts;

-- From report_documents
INSERT INTO report_items (report_id, item_id)
SELECT report_id, document_id FROM report_documents;
```

## Safety Features

### Idempotency
The migration checks if it has already been run by examining the `items` table. If items exist, the migration is skipped.

### Transaction-Based
All migration steps are wrapped in a transaction. If any step fails, all changes are rolled back.

### Data Validation
After migration, the following validations are performed:
- Item count matches (receipts + documents = items)
- No NULL classifications or usage purposes
- No NULL dates
- Report items count matches

### Error Handling
- Detailed error logging with timestamps
- Error messages included in migration result
- Stack traces captured for debugging

## Usage

### Automatic Migration (Recommended)
The migration runs automatically during database initialization:
```typescript
import { initDatabase } from './services/database';

const db = await initDatabase();
// Migration runs automatically
```

### Manual Migration
For manual control:
```typescript
import { migrateToUnifiedModel } from './services/database/migrations/unifyModels';
import { getDatabase } from './services/database';

const db = getDatabase();
const result = await migrateToUnifiedModel(db);

if (result.success) {
  console.log('Migration successful:', {
    receipts: result.receiptsCount,
    documents: result.documentsCount,
    reportLinks: result.reportLinksCount,
  });
} else {
  console.error('Migration failed:', result.errors);
}
```

### Verification
```typescript
import { verifyUnifiedModelMigration } from './services/database/migrations/unifyModels';

const isValid = await verifyUnifiedModelMigration(db);
console.log('Migration valid:', isValid);
```

### Statistics
```typescript
import { getMigrationStatistics } from './services/database/migrations/unifyModels';

const stats = await getMigrationStatistics(db);
console.log('Migration statistics:', {
  total: stats.itemsTotal,
  fromReceipts: stats.receiptSource,
  fromDocuments: stats.documentSource,
  classifications: stats.classificationBreakdown,
  purposes: stats.purposeBreakdown,
});
```

## Backup Recommendation

**IMPORTANT:** Before running this migration in production, create a backup of your database:

```typescript
import * as FileSystem from 'expo-file-system';

const dbPath = `${FileSystem.documentDirectory}SQLite/receipt_tool.db`;
const backupPath = `${FileSystem.documentDirectory}SQLite/receipt_tool_backup_${Date.now()}.db`;

await FileSystem.copyAsync({
  from: dbPath,
  to: backupPath,
});
```

## Post-Migration

After successful migration:

1. **Legacy tables remain** - The original `receipts` and `documents` tables are NOT dropped to allow for rollback if needed
2. **New code uses items** - Update application code to use the `items` table
3. **Report associations unified** - Use `report_items` instead of `report_receipts` and `report_documents`
4. **Old tables can be dropped later** - Once verified, legacy tables can be removed in a future migration

## Rollback Strategy

If you need to rollback:

1. The original `receipts` and `documents` tables remain untouched
2. Simply drop the `items`, `usage_purposes`, and `report_items` tables
3. Application code will fall back to using the original tables

## Testing

Run the test suite to verify migration behavior:
```bash
npm test -- migrations/__tests__/unifyModels.test.ts
```

## Migration Result Interface

```typescript
interface MigrationResult {
  success: boolean;           // Overall success status
  receiptsCount: number;      // Number of receipts migrated
  documentsCount: number;     // Number of documents migrated
  reportLinksCount: number;   // Number of report associations migrated
  errors: string[];           // Array of error messages (if any)
  timestamp: string;          // ISO timestamp of migration
}
```

## Example Results

### Successful Migration
```json
{
  "success": true,
  "receiptsCount": 150,
  "documentsCount": 45,
  "reportLinksCount": 95,
  "errors": [],
  "timestamp": "2026-02-15T08:00:00.000Z"
}
```

### Failed Migration
```json
{
  "success": false,
  "receiptsCount": 0,
  "documentsCount": 0,
  "reportLinksCount": 0,
  "errors": ["Required table 'items' does not exist"],
  "timestamp": "2026-02-15T08:00:00.000Z"
}
```

## Troubleshooting

### Issue: Migration keeps running
**Solution:** Check if items table is empty. Migration is idempotent based on items table content.

### Issue: Validation fails with count mismatch
**Solution:** Check for duplicate IDs between receipts and documents tables.

### Issue: Invalid classification/purpose errors
**Solution:** Check category_id and receipt_type values in source tables match expected values.

### Issue: Foreign key constraint errors
**Solution:** Ensure all report_id values in report_receipts/report_documents exist in reports table.

## Performance Considerations

- For large datasets (>10,000 items), migration may take several seconds
- All operations are in a single transaction for consistency
- Indexes are created after table creation for faster bulk inserts
- Consider running during low-usage periods

## Schema Changes

This migration introduces three new tables:

### usage_purposes
Stores available usage purpose categories
```sql
CREATE TABLE usage_purposes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
)
```

### items
Unified table for all items (receipts + documents)
```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  classification TEXT NOT NULL CHECK(classification IN ('personal_card', 'corporate_card', 'proof_document')),
  usage_purpose TEXT NOT NULL CHECK(usage_purpose IN ('meal', 'transportation', 'medical', 'other')),
  amount REAL,
  date TEXT NOT NULL,
  store_name TEXT,
  file_path TEXT,
  file_type TEXT,
  ocr_text TEXT,
  memo TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### report_items
Unified report associations
```sql
CREATE TABLE report_items (
  report_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (report_id, item_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
)
```

## Benefits of Unified Model

1. **Simplified Queries** - Single table for all items instead of joining receipts and documents
2. **Consistent API** - One set of CRUD operations for all items
3. **Better Filtering** - 2D classification allows flexible filtering (e.g., all meal expenses regardless of payment method)
4. **Easier Reports** - Single join to get all report items
5. **Future-Proof** - Easy to add new classifications or purposes without schema changes
6. **Type Safety** - CHECK constraints ensure valid values
7. **Performance** - Fewer joins and better index utilization
