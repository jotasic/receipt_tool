# Database Service Quick Reference

## Quick Start

```typescript
import { initDatabase } from '@/services/database';

// Initialize once at app startup
await initDatabase();
```

## Common Operations

### Receipts

```typescript
import {
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  searchReceipts,
} from '@/services/database';

// Create
const receipt = await createReceipt({
  title: 'Lunch',
  storeName: 'Restaurant',
  amount: 45.50,
  date: '2024-02-11',
  category: 'food',
  items: [{ id: '1', name: 'Item', price: 45.50, quantity: 1 }],
});

// Read
const all = await getReceipts();
const one = await getReceiptById('id');
const results = await searchReceipts('query');

// Update
await updateReceipt('id', { title: 'New Title' });

// Delete
await deleteReceipt('id');
```

### Reports

```typescript
import {
  createReport,
  getReports,
  linkReceiptToReport,
  recalculateReportTotal,
  submitReport,
} from '@/services/database';

// Create
const report = await createReport({
  title: 'Monthly Report',
  receiptIds: ['r1', 'r2'],
  totalAmount: 0,
  status: 'draft',
});

// Link receipts
await linkReceiptToReport(report.id, 'receipt-id');

// Recalculate total
const total = await recalculateReportTotal(report.id);

// Submit
await submitReport(report.id);
```

### Categories

```typescript
import { getCategories, getCategoryStatistics } from '@/services/database';

// Get all categories
const categories = await getCategories();

// Get statistics
const stats = await getCategoryStatistics();
// [{ category, receiptCount, totalAmount }, ...]
```

## Advanced Features

### Transactions

```typescript
import { executeTransaction } from '@/services/database';

await executeTransaction(async () => {
  // Multiple operations - all succeed or all rollback
  await createReceipt({...});
  await updateReport('id', {...});
  await recalculateReportTotal('id');
});
```

### Search & Filter

```typescript
import {
  getReceiptsByCategory,
  getReceiptsByDateRange,
  searchReceipts,
} from '@/services/database';

// By category
const food = await getReceiptsByCategory('food');

// By date range
const month = await getReceiptsByDateRange('2024-02-01', '2024-02-28');

// By text
const results = await searchReceipts('grocery');
```

### Statistics

```typescript
import {
  getDatabaseStatistics,
  getCategoryStatistics,
  getReportStatistics,
} from '@/services/database';

// Database stats
const dbStats = await getDatabaseStatistics();
// { receipts, receiptItems, reports, categories, databaseSize }

// Category stats
const catStats = await getCategoryStatistics();
// [{ category, receiptCount, totalAmount }]

// Report stats
const repStats = await getReportStatistics();
// { total, draft, submitted, approved, rejected }
```

## React Native Usage

```typescript
import React, { useEffect, useState } from 'react';
import { getReceipts } from '@/services/database';

function ReceiptsScreen() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  // ... render UI
}
```

## Error Handling

```typescript
try {
  await createReceipt(data);
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly message
  Alert.alert('Error', 'Failed to save receipt');
}
```

## Database Maintenance

```typescript
import {
  getDatabaseStatistics,
  vacuumDatabase,
  checkDatabaseIntegrity,
} from '@/services/database';

// Check health
const isHealthy = await checkDatabaseIntegrity();

// Optimize
await vacuumDatabase();
```

## Available Functions

### Receipt Service (12 functions)
- `createReceipt` - Create new receipt
- `getReceipts` - Get all receipts
- `getReceiptById` - Get single receipt
- `updateReceipt` - Update receipt
- `deleteReceipt` - Delete receipt
- `getReceiptsByCategory` - Filter by category
- `getReceiptsByDateRange` - Filter by date range
- `searchReceipts` - Search by text
- `createReceiptItem` - Add item
- `getReceiptItems` - Get items
- `updateReceiptItem` - Update item
- `deleteReceiptItem` - Delete item
- `getTotalByCategoryId` - Category total

### Report Service (16 functions)
- `createReport` - Create report
- `getReports` - Get all reports
- `getReportById` - Get single report
- `updateReport` - Update report
- `deleteReport` - Delete report
- `getReportsByStatus` - Filter by status
- `submitReport` - Submit for approval
- `approveReport` - Approve report
- `rejectReport` - Reject report
- `revertReportToDraft` - Revert to draft
- `linkReceiptToReport` - Link receipt
- `unlinkReceiptFromReport` - Unlink receipt
- `getReportReceiptIds` - Get linked receipts
- `getReportsByReceiptId` - Find reports with receipt
- `recalculateReportTotal` - Recalculate total
- `getReportStatistics` - Get statistics

### Category Service (7 functions)
- `getCategories` - Get all categories
- `getCategoryById` - Get single category
- `createCategory` - Create category
- `updateCategory` - Update category
- `deleteCategory` - Delete category
- `getCategoryStatistics` - Get statistics
- `categoryNameExists` - Check duplicate

### Utils (14 functions)
- `executeTransaction` - Safe transactions
- `getDatabaseStatistics` - DB stats
- `vacuumDatabase` - Optimize
- `analyzeDatabase` - Update query stats
- `checkDatabaseIntegrity` - Check health
- `checkForeignKeys` - Check constraints
- `tableExists` - Check table
- `getTableRowCount` - Count rows
- `executeRawQuery` - Raw SQL
- `generateUniqueId` - Generate ID
- `formatDateForDb` - Format date
- `parseDateFromDb` - Parse date
- `sanitizeLikeQuery` - Escape LIKE
- `buildWhereClause` - Build WHERE

## Default Categories

- `food` - 식비 (Food)
- `transport` - 교통비 (Transport)
- `shopping` - 쇼핑 (Shopping)
- `entertainment` - 엔터테인먼트 (Entertainment)
- `utilities` - 공과금 (Utilities)
- `medical` - 의료 (Medical)
- `education` - 교육 (Education)
- `other` - 기타 (Other)

## Important Notes

1. **Always initialize**: Call `initDatabase()` once at app startup
2. **Error handling**: Wrap all DB calls in try-catch
3. **Transactions**: Use for multi-step operations
4. **Foreign keys**: Enabled automatically
5. **Cascade deletes**: Related records deleted automatically
6. **Type safety**: Full TypeScript support
7. **Indexes**: Optimized for common queries

## Need Help?

- See `INTEGRATION_EXAMPLE.ts` for complete examples
- Check `README.md` for detailed documentation
- Review `__tests__/services.test.ts` for usage patterns
