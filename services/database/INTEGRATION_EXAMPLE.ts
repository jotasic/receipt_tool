/**
 * Database Service Integration Example
 *
 * This file demonstrates how to use the database service layer
 * in a real-world scenario.
 */

import {
  initDatabase,
  createReceipt,
  createReport,
  linkReceiptToReport,
  recalculateReportTotal,
  getReportById,
  getCategories,
  executeTransaction,
} from './index';

/**
 * Example 1: Initialize and create a complete receipt
 */
export async function example1_CreateReceipt() {
  // Initialize database (first time only)
  await initDatabase();

  // Create a receipt with items
  const receipt = await createReceipt({
    title: 'Lunch at Restaurant',
    storeName: 'The Great Bistro',
    amount: 45.50,
    date: new Date().toISOString().split('T')[0],
    category: 'food',
    imagePath: 'file://receipts/lunch-2024-02-11.jpg',
    ocrText: 'Receipt text from OCR...',
    receiptType: 'corporate',
    items: [
      {
        id: 'item1',
        name: 'Caesar Salad',
        price: 12.50,
        quantity: 1,
      },
      {
        id: 'item2',
        name: 'Grilled Salmon',
        price: 28.00,
        quantity: 1,
      },
      {
        id: 'item3',
        name: 'Coffee',
        price: 5.00,
        quantity: 1,
      },
    ],
  });

  console.log('Created receipt:', receipt);
  return receipt;
}

/**
 * Example 2: Create a monthly expense report
 */
export async function example2_CreateMonthlyReport() {
  // Create multiple receipts
  const receipt1 = await createReceipt({
    title: 'Gas Station',
    storeName: 'Shell',
    amount: 60.00,
    date: '2024-02-01',
    category: 'transport',
    receiptType: 'corporate',
  });

  const receipt2 = await createReceipt({
    title: 'Grocery Shopping',
    storeName: 'Safeway',
    amount: 125.30,
    date: '2024-02-05',
    category: 'food',
    receiptType: 'personal',
  });

  const receipt3 = await createReceipt({
    title: 'Electricity Bill',
    storeName: 'PG&E',
    amount: 85.50,
    date: '2024-02-10',
    category: 'utilities',
    receiptType: 'corporate',
  });

  // Create report and link receipts
  const report = await createReport({
    title: 'February 2024 Expenses',
    receiptIds: [receipt1.id, receipt2.id, receipt3.id],
    totalAmount: 0, // Will be recalculated
    status: 'draft',
  });

  // Recalculate total from linked receipts
  const totalAmount = await recalculateReportTotal(report.id);

  console.log('Created report with total:', totalAmount);
  return report;
}

/**
 * Example 3: Transaction usage - Create receipt and add to report atomically
 */
export async function example3_TransactionExample(reportId: string) {
  await executeTransaction(async () => {
    // Create new receipt
    const receipt = await createReceipt({
      title: 'Office Supplies',
      storeName: 'Staples',
      amount: 42.99,
      date: new Date().toISOString().split('T')[0],
      category: 'other',
      receiptType: 'corporate',
    });

    // Link to report
    await linkReceiptToReport(reportId, receipt.id);

    // Recalculate report total
    await recalculateReportTotal(reportId);

    // If any step fails, all changes will be rolled back
    console.log('Successfully added receipt to report');
  });
}

/**
 * Example 4: Query and display categories with statistics
 */
export async function example4_CategoryStatistics() {
  const categories = await getCategories();

  console.log('Available categories:');
  categories.forEach((category) => {
    console.log(`- ${category.name} (${category.id})`);
  });

  return categories;
}

/**
 * Example 5: Complete workflow - From receipt capture to report submission
 */
export async function example5_CompleteWorkflow() {
  // Step 1: Initialize database
  await initDatabase();

  // Step 2: Capture and create receipts throughout the month
  const receipts = [];

  for (let i = 1; i <= 5; i++) {
    const receipt = await createReceipt({
      title: `Business Expense ${i}`,
      storeName: `Vendor ${i}`,
      amount: Math.random() * 100 + 50, // Random amount between 50-150
      date: `2024-02-${String(i).padStart(2, '0')}`,
      category: ['food', 'transport', 'utilities'][i % 3],
      receiptType: 'corporate',
    });
    receipts.push(receipt);
  }

  // Step 3: Create expense report
  const report = await createReport({
    title: 'Business Trip - February 2024',
    receiptIds: receipts.map((r) => r.id),
    totalAmount: 0,
    status: 'draft',
  });

  // Step 4: Calculate total
  const totalAmount = await recalculateReportTotal(report.id);

  console.log(`Created report with ${receipts.length} receipts`);
  console.log(`Total amount: $${totalAmount.toFixed(2)}`);

  // Step 5: Submit for approval
  // (Would normally happen after user reviews)
  // await submitReport(report.id);

  // Step 6: Get final report
  const finalReport = await getReportById(report.id);

  return finalReport;
}

/**
 * Example 6: Search and filter receipts
 */
export async function example6_SearchAndFilter() {
  const {
    getReceipts,
    getReceiptsByCategory,
    getReceiptsByDateRange,
    searchReceipts,
  } = await import('./index');

  // Get all receipts
  const allReceipts = await getReceipts();
  console.log('Total receipts:', allReceipts.length);

  // Filter by category
  const foodReceipts = await getReceiptsByCategory('food');
  console.log('Food receipts:', foodReceipts.length);

  // Filter by date range
  const februaryReceipts = await getReceiptsByDateRange(
    '2024-02-01',
    '2024-02-28'
  );
  console.log('February receipts:', februaryReceipts.length);

  // Search by text
  const searchResults = await searchReceipts('grocery');
  console.log('Search results for "grocery":', searchResults.length);

  return {
    all: allReceipts,
    food: foodReceipts,
    february: februaryReceipts,
    search: searchResults,
  };
}

/**
 * Example 7: Database maintenance
 */
export async function example7_DatabaseMaintenance() {
  const {
    getDatabaseStatistics,
    checkDatabaseIntegrity,
    vacuumDatabase,
  } = await import('./index');

  // Get statistics
  const stats = await getDatabaseStatistics();
  console.log('Database statistics:', stats);

  // Check integrity
  const isHealthy = await checkDatabaseIntegrity();
  console.log('Database integrity:', isHealthy ? 'OK' : 'CORRUPTED');

  // Optimize database (should be done periodically)
  if (stats.databaseSize > 10 * 1024 * 1024) {
    // > 10MB
    console.log('Running vacuum...');
    await vacuumDatabase();
  }

  return stats;
}

// Usage in React Native component
export const exampleComponentUsage = `
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { getReceipts } from '@/services/database';
import type { Receipt } from '@/types';

export function ReceiptsScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <FlatList
      data={receipts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>$\${item.amount.toFixed(2)}</Text>
          <Text>{item.storeName}</Text>
        </View>
      )}
    />
  );
}
`;
