# Database Service

SQLite database schema and initialization for the Receipt Tool application.

## Files

- `schema.ts` - Table definitions, indexes, and default data
- `init.ts` - Database initialization and management functions
- `index.ts` - Module exports

## Usage

### Initialize Database

```typescript
import { initDatabase } from '@/services/database';

// In your App.tsx or root component
useEffect(() => {
  const setupDatabase = async () => {
    try {
      const db = await initDatabase();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  };

  setupDatabase();
}, []);
```

### Get Database Instance

```typescript
import { getDatabaseInstance } from '@/services/database';

const db = getDatabaseInstance();
if (db) {
  // Use database
  const result = await db.getAllAsync('SELECT * FROM receipts');
}
```

## Schema Overview

### Tables

1. **categories** - Receipt categories (식비, 교통비, etc.)
   - Pre-seeded with 8 default categories

2. **receipts** - Main receipt records
   - Links to categories
   - Stores OCR text and images

3. **receipt_items** - Individual items within a receipt
   - One-to-many relationship with receipts

4. **reports** - Expense reports
   - Tracks status: draft, submitted, approved, rejected

5. **report_receipts** - Junction table linking reports and receipts
   - Many-to-many relationship

### Indexes

Optimized indexes for common queries:
- Receipt date (DESC)
- Receipt category
- Receipt items by receipt ID
- Report status
- Report creation date (DESC)

## Features

- Foreign key constraints enabled
- Cascade deletes for data integrity
- Automatic default category seeding
- Singleton database instance pattern
- Comprehensive error handling

## Database Reset

```typescript
import { resetDatabase } from '@/services/database';

// WARNING: This deletes all data
await resetDatabase();
```
