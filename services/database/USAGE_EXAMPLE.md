# Database Usage Examples

## Initialization

```typescript
// In App.tsx or your root component
import { useEffect, useState } from 'react';
import { initDatabase } from '@/services/database';
import type { SQLiteDatabase } from 'expo-sqlite';

function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setupDatabase() {
      try {
        await initDatabase();
        setDbReady(true);
        console.log('Database ready');
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    }

    setupDatabase();
  }, []);

  if (!dbReady) {
    return <LoadingScreen />;
  }

  return <MainApp />;
}
```

## Query Examples

### 1. Fetch All Receipts with Categories

```typescript
import { getDatabaseInstance } from '@/services/database';
import type { ReceiptWithCategoryRow } from '@/services/database';

async function getAllReceipts() {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  const receipts = await db.getAllAsync<ReceiptWithCategoryRow>(`
    SELECT
      r.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM receipts r
    LEFT JOIN categories c ON r.category_id = c.id
    ORDER BY r.date DESC
  `);

  return receipts;
}
```

### 2. Insert a New Receipt

```typescript
import { getDatabaseInstance } from '@/services/database';

async function createReceipt(receipt: {
  title: string;
  storeName: string;
  amount: number;
  date: string;
  categoryId: string;
  imagePath?: string;
}) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  const id = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO receipts (
      id, title, store_name, amount, date, category_id,
      image_path, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    receipt.title,
    receipt.storeName,
    receipt.amount,
    receipt.date,
    receipt.categoryId,
    receipt.imagePath || null,
    now,
    now
  );

  return id;
}
```

### 3. Insert Receipt with Items (Transaction)

```typescript
async function createReceiptWithItems(
  receipt: {
    title: string;
    storeName: string;
    amount: number;
    date: string;
    categoryId: string;
  },
  items: Array<{ name: string; price: number; quantity: number }>
) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  try {
    // Start transaction
    await db.execAsync('BEGIN TRANSACTION');

    // Insert receipt
    await db.runAsync(
      `INSERT INTO receipts (
        id, title, store_name, amount, date, category_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      receiptId,
      receipt.title,
      receipt.storeName,
      receipt.amount,
      receipt.date,
      receipt.categoryId,
      now,
      now
    );

    // Insert items
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.runAsync(
        `INSERT INTO receipt_items (id, receipt_id, name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        itemId,
        receiptId,
        item.name,
        item.price,
        item.quantity
      );
    }

    // Commit transaction
    await db.execAsync('COMMIT');
    return receiptId;
  } catch (error) {
    // Rollback on error
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

### 4. Update Receipt

```typescript
async function updateReceipt(
  id: string,
  updates: Partial<{
    title: string;
    storeName: string;
    amount: number;
    date: string;
    categoryId: string;
  }>
) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.storeName) {
    fields.push('store_name = ?');
    values.push(updates.storeName);
  }
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  if (updates.date) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.categoryId) {
    fields.push('category_id = ?');
    values.push(updates.categoryId);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE receipts SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}
```

### 5. Delete Receipt (Cascade Deletes Items)

```typescript
async function deleteReceipt(id: string) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  // Items are automatically deleted due to CASCADE
  await db.runAsync('DELETE FROM receipts WHERE id = ?', id);
}
```

### 6. Get Receipts by Category

```typescript
async function getReceiptsByCategory(categoryId: string) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<ReceiptRow>(
    'SELECT * FROM receipts WHERE category_id = ? ORDER BY date DESC',
    categoryId
  );
}
```

### 7. Get Receipts by Date Range

```typescript
async function getReceiptsByDateRange(startDate: string, endDate: string) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  return await db.getAllAsync<ReceiptRow>(
    `SELECT * FROM receipts
     WHERE date BETWEEN ? AND ?
     ORDER BY date DESC`,
    startDate,
    endDate
  );
}
```

### 8. Create Report with Receipts

```typescript
async function createReport(
  title: string,
  receiptIds: string[],
  totalAmount: number
) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  try {
    await db.execAsync('BEGIN TRANSACTION');

    // Insert report
    await db.runAsync(
      `INSERT INTO reports (id, title, total_amount, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      reportId,
      title,
      totalAmount,
      'draft',
      now,
      now
    );

    // Link receipts
    for (const receiptId of receiptIds) {
      await db.runAsync(
        `INSERT INTO report_receipts (report_id, receipt_id)
         VALUES (?, ?)`,
        reportId,
        receiptId
      );
    }

    await db.execAsync('COMMIT');
    return reportId;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

### 9. Get Report with All Receipts

```typescript
async function getReportWithReceipts(reportId: string) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  // Get report
  const report = await db.getFirstAsync<ReportRow>(
    'SELECT * FROM reports WHERE id = ?',
    reportId
  );

  if (!report) return null;

  // Get associated receipts
  const receipts = await db.getAllAsync<ReceiptWithCategoryRow>(`
    SELECT
      r.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM receipts r
    LEFT JOIN categories c ON r.category_id = c.id
    INNER JOIN report_receipts rr ON r.id = rr.receipt_id
    WHERE rr.report_id = ?
    ORDER BY r.date DESC
  `, reportId);

  return { ...report, receipts };
}
```

### 10. Get Statistics

```typescript
async function getMonthlyStats(year: number, month: number) {
  const db = getDatabaseInstance();
  if (!db) throw new Error('Database not initialized');

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const stats = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_color: string;
    total: number;
    count: number;
  }>(`
    SELECT
      c.id as category_id,
      c.name as category_name,
      c.color as category_color,
      SUM(r.amount) as total,
      COUNT(r.id) as count
    FROM receipts r
    LEFT JOIN categories c ON r.category_id = c.id
    WHERE r.date BETWEEN ? AND ?
    GROUP BY c.id, c.name, c.color
    ORDER BY total DESC
  `, startDate, endDate);

  return stats;
}
```

## Best Practices

1. Always check if database is initialized before queries
2. Use transactions for multi-table operations
3. Use prepared statements (parameterized queries) to prevent SQL injection
4. Handle errors appropriately with try-catch
5. Close database on app termination (handled by init.ts)
6. Use TypeScript types for type safety
