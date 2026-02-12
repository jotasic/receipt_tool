# Report Service

Business logic layer for report operations in the Receipt Tool application.

## Overview

This service provides high-level business logic for creating, managing, and submitting expense reports. It wraps the database layer (`services/database/reportService.ts`) and adds additional business logic such as automatic total calculation and validation.

## Features

- Create reports with linked receipts
- Automatic total amount calculation
- Submit reports with timestamp tracking
- Update report details
- Add receipts to existing reports
- Report validation before submission

## Usage

### Creating a Report

```typescript
import { createReportWithReceipts } from '@/services/report';

const report = await createReportWithReceipts({
  title: 'Q1 2024 Travel Expenses',
  receiptIds: ['receipt-1', 'receipt-2', 'receipt-3'],
});

// The report is created with:
// - status: 'draft'
// - totalAmount: automatically calculated from receipts
// - all receipts properly linked
```

### Submitting a Report

```typescript
import { submitReport } from '@/services/report';

const submittedReport = await submitReport(reportId);

// Changes status to 'submitted' and sets submittedAt timestamp
```

### Loading Reports

```typescript
import { loadReports, loadReport } from '@/services/report';

// Load all reports
const allReports = await loadReports();

// Load a specific report
const report = await loadReport(reportId);
```

### Updating Report Details

```typescript
import { updateReportDetails } from '@/services/report';

const updatedReport = await updateReportDetails(reportId, {
  title: 'Updated Title',
  receiptIds: ['new-receipt-1', 'new-receipt-2'], // Will trigger recalculation
});
```

### Adding Receipts to a Report

```typescript
import { addReceiptsToReport } from '@/services/report';

const updatedReport = await addReceiptsToReport(reportId, [
  'new-receipt-1',
  'new-receipt-2',
]);

// Total amount is automatically recalculated
```

### Validating a Report

```typescript
import { validateReport } from '@/services/report';

try {
  validateReport(report);
  // Report is valid, proceed with submission
} catch (error) {
  // Handle validation error
  console.error(error.message);
}
```

### Calculate Total

```typescript
import { calculateTotal } from '@/services/report';

const total = calculateTotal([10.5, 25.0, 15.75]);
// Returns: 51.25
```

## Integration with Store

This service is designed to work seamlessly with the Zustand store:

```typescript
import { useReportStore } from '@/store';
import { createReportWithReceipts } from '@/services/report';

// In a React component
function CreateReportButton() {
  const { addReport } = useReportStore();

  const handleCreate = async () => {
    const report = await createReportWithReceipts({
      title: 'New Report',
      receiptIds: selectedReceiptIds,
    });

    addReport(report); // Add to global state
  };

  return <Button onPress={handleCreate}>Create Report</Button>;
}
```

## API Reference

### `createReportWithReceipts(data)`

Creates a new report with linked receipts and automatic total calculation.

**Parameters:**
- `data.title` (string): Report title
- `data.receiptIds` (string[]): Array of receipt IDs to link

**Returns:** Promise<Report>

### `submitReport(reportId)`

Submits a report by changing status from 'draft' to 'submitted'.

**Parameters:**
- `reportId` (string): Report ID

**Returns:** Promise<Report>

### `loadReports()`

Loads all reports from the database.

**Returns:** Promise<Report[]>

### `loadReport(reportId)`

Loads a specific report by ID.

**Parameters:**
- `reportId` (string): Report ID

**Returns:** Promise<Report | null>

### `updateReportDetails(reportId, updates)`

Updates report details. If receiptIds are updated, automatically recalculates the total.

**Parameters:**
- `reportId` (string): Report ID
- `updates` (Partial<Report>): Fields to update

**Returns:** Promise<Report>

### `addReceiptsToReport(reportId, receiptIds)`

Adds receipts to an existing report and recalculates the total.

**Parameters:**
- `reportId` (string): Report ID
- `receiptIds` (string[]): Array of receipt IDs to add

**Returns:** Promise<Report>

### `calculateTotal(amounts)`

Utility function to calculate the sum of amounts.

**Parameters:**
- `amounts` (number[]): Array of numbers to sum

**Returns:** number

### `validateReport(report)`

Validates report data before submission.

**Parameters:**
- `report` (Report): Report to validate

**Returns:** boolean (throws error if invalid)

## Error Handling

All functions throw errors with descriptive messages:

```typescript
try {
  await submitReport(reportId);
} catch (error) {
  if (error instanceof Error) {
    console.error('Submission failed:', error.message);
  }
}
```

## Related Files

- `/services/database/reportService.ts` - Database layer
- `/store/reportStore.ts` - Zustand store
- `/types/report.ts` - TypeScript types
