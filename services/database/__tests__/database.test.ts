/**
 * Database Integration Tests
 *
 * NOTE: These are example tests. You'll need to set up Jest for expo-sqlite
 * using @expo/jest-preset or similar testing framework
 */

import {
  initDatabase,
  getDatabaseInstance,
  resetDatabase,
  DEFAULT_CATEGORIES,
} from '../index';
import type { ReceiptRow, CategoryRow } from '../index';

describe('Database Service', () => {
  beforeAll(async () => {
    // Initialize database before all tests
    await initDatabase();
  });

  afterAll(async () => {
    // Optional: cleanup after tests
    // await resetDatabase();
  });

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      const db = getDatabaseInstance();
      expect(db).not.toBeNull();
    });

    it('should have seeded default categories', async () => {
      const db = getDatabaseInstance();
      if (!db) throw new Error('Database not initialized');

      const categories = await db.getAllAsync<CategoryRow>(
        'SELECT * FROM categories'
      );

      expect(categories.length).toBe(DEFAULT_CATEGORIES.length);
      expect(categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: '식비' }),
          expect.objectContaining({ name: '교통비' }),
        ])
      );
    });
  });

  describe('Receipt Operations', () => {
    it('should insert a new receipt', async () => {
      const db = getDatabaseInstance();
      if (!db) throw new Error('Database not initialized');

      const receiptId = `test_receipt_${Date.now()}`;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO receipts (
          id, title, store_name, amount, date, category_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        receiptId,
        'Test Receipt',
        'Test Store',
        100.50,
        '2026-02-11',
        'food',
        now,
        now
      );

      const receipt = await db.getFirstAsync<ReceiptRow>(
        'SELECT * FROM receipts WHERE id = ?',
        receiptId
      );

      expect(receipt).not.toBeNull();
      expect(receipt?.title).toBe('Test Receipt');
      expect(receipt?.amount).toBe(100.50);

      // Cleanup
      await db.runAsync('DELETE FROM receipts WHERE id = ?', receiptId);
    });

    it('should cascade delete receipt items', async () => {
      const db = getDatabaseInstance();
      if (!db) throw new Error('Database not initialized');

      const receiptId = `test_receipt_cascade_${Date.now()}`;
      const itemId = `test_item_${Date.now()}`;
      const now = new Date().toISOString();

      // Insert receipt
      await db.runAsync(
        `INSERT INTO receipts (
          id, title, store_name, amount, date, category_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        receiptId,
        'Test Receipt',
        'Test Store',
        100,
        '2026-02-11',
        'food',
        now,
        now
      );

      // Insert item
      await db.runAsync(
        `INSERT INTO receipt_items (id, receipt_id, name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        itemId,
        receiptId,
        'Test Item',
        50,
        2
      );

      // Verify item exists
      let item = await db.getFirstAsync(
        'SELECT * FROM receipt_items WHERE id = ?',
        itemId
      );
      expect(item).not.toBeNull();

      // Delete receipt
      await db.runAsync('DELETE FROM receipts WHERE id = ?', receiptId);

      // Verify item was cascade deleted
      item = await db.getFirstAsync(
        'SELECT * FROM receipt_items WHERE id = ?',
        itemId
      );
      expect(item).toBeNull();
    });
  });

  describe('Report Operations', () => {
    it('should create report with multiple receipts', async () => {
      const db = getDatabaseInstance();
      if (!db) throw new Error('Database not initialized');

      const reportId = `test_report_${Date.now()}`;
      const receipt1Id = `test_receipt1_${Date.now()}`;
      const receipt2Id = `test_receipt2_${Date.now()}`;
      const now = new Date().toISOString();

      try {
        await db.execAsync('BEGIN TRANSACTION');

        // Create receipts
        for (const id of [receipt1Id, receipt2Id]) {
          await db.runAsync(
            `INSERT INTO receipts (
              id, title, store_name, amount, date, category_id,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            'Test Receipt',
            'Test Store',
            100,
            '2026-02-11',
            'food',
            now,
            now
          );
        }

        // Create report
        await db.runAsync(
          `INSERT INTO reports (id, title, total_amount, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          reportId,
          'Test Report',
          200,
          'draft',
          now,
          now
        );

        // Link receipts to report
        for (const receiptId of [receipt1Id, receipt2Id]) {
          await db.runAsync(
            `INSERT INTO report_receipts (report_id, receipt_id)
             VALUES (?, ?)`,
            reportId,
            receiptId
          );
        }

        await db.execAsync('COMMIT');

        // Verify
        const linkedReceipts = await db.getAllAsync(
          `SELECT receipt_id FROM report_receipts WHERE report_id = ?`,
          reportId
        );

        expect(linkedReceipts.length).toBe(2);

        // Cleanup
        await db.runAsync('DELETE FROM reports WHERE id = ?', reportId);
        await db.runAsync('DELETE FROM receipts WHERE id IN (?, ?)', receipt1Id, receipt2Id);
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }
    });
  });

  describe('Queries with Joins', () => {
    it('should join receipts with categories', async () => {
      const db = getDatabaseInstance();
      if (!db) throw new Error('Database not initialized');

      const receiptId = `test_receipt_join_${Date.now()}`;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO receipts (
          id, title, store_name, amount, date, category_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        receiptId,
        'Join Test',
        'Test Store',
        100,
        '2026-02-11',
        'food',
        now,
        now
      );

      const result = await db.getFirstAsync<{
        id: string;
        title: string;
        category_name: string;
      }>(
        `SELECT r.id, r.title, c.name as category_name
         FROM receipts r
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE r.id = ?`,
        receiptId
      );

      expect(result).not.toBeNull();
      expect(result?.category_name).toBe('식비');

      // Cleanup
      await db.runAsync('DELETE FROM receipts WHERE id = ?', receiptId);
    });
  });
});
