/**
 * Database Services Test
 *
 * Basic tests to verify service layer functionality
 */

import {
  initDatabase,
  resetDatabase,
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  createReport,
  getReports,
  linkReceiptToReport,
  recalculateReportTotal,
  getCategories,
  getDatabaseStatistics,
} from '../index';

describe('Database Services', () => {
  beforeAll(async () => {
    // Initialize fresh database for testing
    await resetDatabase();
  });

  describe('Receipt Service', () => {
    let receiptId: string;

    it('should create a receipt', async () => {
      const receipt = await createReceipt({
        title: 'Test Receipt',
        storeName: 'Test Store',
        amount: 100.5,
        date: '2024-01-01',
        category: 'food',
        items: [
          { id: 'item1', name: 'Item 1', price: 50.25, quantity: 1 },
          { id: 'item2', name: 'Item 2', price: 50.25, quantity: 1 },
        ],
      });

      expect(receipt).toBeDefined();
      expect(receipt.id).toBeDefined();
      expect(receipt.title).toBe('Test Receipt');
      expect(receipt.amount).toBe(100.5);

      receiptId = receipt.id;
    });

    it('should get all receipts', async () => {
      const receipts = await getReceipts();
      expect(receipts).toBeDefined();
      expect(receipts.length).toBeGreaterThan(0);
      expect(receipts[0].items).toBeDefined();
    });

    it('should get receipt by id', async () => {
      const receipt = await getReceiptById(receiptId);
      expect(receipt).toBeDefined();
      expect(receipt?.id).toBe(receiptId);
      expect(receipt?.items).toBeDefined();
      expect(receipt?.items?.length).toBe(2);
    });

    it('should update a receipt', async () => {
      await updateReceipt(receiptId, {
        title: 'Updated Receipt',
        amount: 150.75,
      });

      const updated = await getReceiptById(receiptId);
      expect(updated?.title).toBe('Updated Receipt');
      expect(updated?.amount).toBe(150.75);
    });

    it('should delete a receipt', async () => {
      await deleteReceipt(receiptId);
      const deleted = await getReceiptById(receiptId);
      expect(deleted).toBeNull();
    });
  });

  describe('Report Service', () => {
    let reportId: string;
    let testReceiptId: string;

    beforeAll(async () => {
      // Create a test receipt for report tests
      const receipt = await createReceipt({
        title: 'Report Test Receipt',
        storeName: 'Test Store',
        amount: 200,
        date: '2024-01-01',
        category: 'food',
      });
      testReceiptId = receipt.id;
    });

    it('should create a report', async () => {
      const report = await createReport({
        title: 'Test Report',
        receiptIds: [testReceiptId],
        totalAmount: 200,
        status: 'draft',
      });

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.title).toBe('Test Report');
      expect(report.receiptIds).toContain(testReceiptId);

      reportId = report.id;
    });

    it('should get all reports', async () => {
      const reports = await getReports();
      expect(reports).toBeDefined();
      expect(reports.length).toBeGreaterThan(0);
    });

    it('should link and recalculate report total', async () => {
      const receipt2 = await createReceipt({
        title: 'Second Receipt',
        storeName: 'Test Store',
        amount: 150,
        date: '2024-01-02',
        category: 'food',
      });

      await linkReceiptToReport(reportId, receipt2.id);
      const newTotal = await recalculateReportTotal(reportId);

      expect(newTotal).toBe(350); // 200 + 150
    });

    afterAll(async () => {
      // Clean up test data
      await deleteReceipt(testReceiptId);
    });
  });

  describe('Category Service', () => {
    it('should get all categories', async () => {
      const categories = await getCategories();
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);

      // Check for default categories
      const foodCategory = categories.find((c) => c.id === 'food');
      expect(foodCategory).toBeDefined();
      expect(foodCategory?.name).toBe('식비');
    });
  });

  describe('Database Utilities', () => {
    it('should get database statistics', async () => {
      const stats = await getDatabaseStatistics();
      expect(stats).toBeDefined();
      expect(stats.categories).toBeGreaterThan(0);
      expect(stats.databaseSize).toBeGreaterThan(0);
    });
  });
});
