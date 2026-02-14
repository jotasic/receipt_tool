# Unified Model Implementation - Detailed Task Breakdown

## Implementation Overview

Merge Receipt and Document models into a single Item entity with 2-dimensional categorization:
- **Classification** (구분): `personal_card`, `corporate_card`, `proof_document`
- **Usage Purpose** (사용처): `meal`, `transportation`, `medical`, `other` (expandable)

**Constraint**: Maximum 3 parallel agents at a time

---

## Phase 1: Schema & Type Definitions (Day 1)

### Task 1.1: Define Unified Item TypeScript Types
**Agent**: `typescript-specialist`
**Priority**: P0
**Effort**: M
**Dependencies**: None
**Parallelizable**: Yes (can run alone)

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/types/item.ts`
- `/Users/taewookim/dev/receipt_tool/types/usagePurpose.ts`

**Specifications**:
```typescript
// types/item.ts
export type ItemClassification = 'personal_card' | 'corporate_card' | 'proof_document';

export interface Item {
  id: string;
  title: string;
  classification: ItemClassification;
  usagePurpose: string; // References usage_purposes.id

  // Amount (for card items, null for proof documents)
  amount?: number;

  // Date
  date: string;

  // Card-specific fields (from Receipt)
  storeName?: string;
  category?: string; // Still useful for meal/shopping subcategories
  items?: ItemLineItem[]; // Breakdown items

  // Document/file fields
  filePath?: string;
  fileType?: string;
  ocrText?: string;

  // Common metadata
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// types/usagePurpose.ts
export interface UsagePurpose {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}
```

**Acceptance Criteria**:
- Types compile without errors
- All fields from Receipt and Document are covered
- Classification enum includes all 3 types
- Usage purpose is extensible

---

### Task 1.2: Design usage_purposes Reference Table
**Agent**: `database-specialist`
**Priority**: P0
**Effort**: S
**Dependencies**: None
**Parallelizable**: Yes (can run with Task 1.1)

**Deliverables**:
- Schema definition in `/Users/taewookim/dev/receipt_tool/services/database/schema.ts`

**Specifications**:
```sql
CREATE TABLE IF NOT EXISTS usage_purposes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,        -- Korean name (식대, 교통비, etc.)
  name_en TEXT NOT NULL,             -- English name (meal, transportation)
  icon TEXT,                         -- Icon identifier
  color TEXT,                        -- Hex color code
  display_order INTEGER DEFAULT 0,   -- Sort order
  is_active INTEGER DEFAULT 1,       -- Soft delete flag
  created_at TEXT NOT NULL
);

-- Default values
INSERT INTO usage_purposes (id, name, name_en, icon, color, display_order, created_at) VALUES
  ('meal', '식대', 'meal', 'restaurant', '#FF6B6B', 1, datetime('now')),
  ('transportation', '교통비', 'transportation', 'car', '#4ECDC4', 2, datetime('now')),
  ('medical', '의료', 'medical', 'medical', '#FCBAD3', 3, datetime('now')),
  ('other', '기타', 'other', 'ellipsis-horizontal', '#C7CEEA', 999, datetime('now'));
```

**Acceptance Criteria**:
- Table supports extensibility (new usage purposes can be added)
- Default purposes match requirements
- Indexes on display_order and is_active

---

### Task 1.3: Design Unified items Table Schema
**Agent**: `database-specialist`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 1.2 (usage_purposes must exist)
**Parallelizable**: No (waits for Task 1.2)

**Deliverables**:
- Complete schema in `/Users/taewookim/dev/receipt_tool/services/database/schema.ts`

**Specifications**:
```sql
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  classification TEXT NOT NULL CHECK(classification IN ('personal_card', 'corporate_card', 'proof_document')),
  usage_purpose_id TEXT NOT NULL,

  -- Amount (nullable for proof documents)
  amount REAL,

  -- Date
  date TEXT NOT NULL,

  -- Card-specific fields
  store_name TEXT,
  category_id TEXT,

  -- Document/file fields
  file_path TEXT,
  file_type TEXT,
  ocr_text TEXT,

  -- Common metadata
  memo TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (usage_purpose_id) REFERENCES usage_purposes(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS item_line_items (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER DEFAULT 1,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_items (
  report_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY (report_id, item_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_classification ON items(classification);
CREATE INDEX IF NOT EXISTS idx_items_usage_purpose ON items(usage_purpose_id);
CREATE INDEX IF NOT EXISTS idx_items_date ON items(date DESC);
CREATE INDEX IF NOT EXISTS idx_item_line_items_item ON item_line_items(item_id);
CREATE INDEX IF NOT EXISTS idx_report_items_report ON report_items(report_id);
CREATE INDEX IF NOT EXISTS idx_report_items_item ON report_items(item_id);
```

**Acceptance Criteria**:
- All indexes defined for query optimization
- Foreign key constraints properly set
- Schema supports both card and proof document types
- Compatible with existing categories table

---

## Phase 2: Data Migration Scripts (Day 1-2)

### Task 2.1: Create receipts → items Migration Script
**Agent**: `database-specialist`
**Priority**: P0
**Effort**: L
**Dependencies**: Task 1.3 (items table must exist)
**Parallelizable**: No

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/services/database/migrations/migrateReceiptsToItems.ts`

**Specifications**:
```typescript
export async function migrateReceiptsToItems(): Promise<MigrationResult> {
  // 1. Map receipt_type to classification
  //    'corporate' → 'corporate_card'
  //    'personal' → 'personal_card'

  // 2. Map category_id to usage_purpose_id
  //    'food' → 'meal'
  //    'transport' → 'transportation'
  //    'medical' → 'medical'
  //    default → 'other'

  // 3. Copy all fields maintaining data integrity
  // 4. Copy receipt_items to item_line_items
  // 5. Return migration statistics (count, errors)
}

export async function verifyReceiptMigration(): Promise<boolean> {
  // Verify row counts match
  // Verify no data loss
  // Verify all foreign keys valid
}
```

**Acceptance Criteria**:
- 100% of receipts migrated successfully
- All receipt_items migrated to item_line_items
- No data loss
- Verification function passes

---

### Task 2.2: Create documents → items Migration Script
**Agent**: `database-specialist`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 1.3 (items table must exist)
**Parallelizable**: Can run in parallel with Task 2.1 (different data)

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/services/database/migrations/migrateDocumentsToItems.ts`

**Specifications**:
```typescript
export async function migrateDocumentsToItems(): Promise<MigrationResult> {
  // 1. Set classification = 'proof_document'

  // 2. Map document_type to usage_purpose_id
  //    'medical' → 'medical'
  //    'certificate' → 'other' (or create new purpose?)
  //    'other' → 'other'

  // 3. Set amount = NULL (documents don't have amounts)
  // 4. Map filePath, fileType, etc.
  // 5. Return migration statistics
}

export async function verifyDocumentMigration(): Promise<boolean> {
  // Verify all documents migrated
  // Verify classification is 'proof_document'
  // Verify file paths preserved
}
```

**Acceptance Criteria**:
- 100% of documents migrated
- All classified as 'proof_document'
- File paths and metadata preserved
- Verification passes

---

### Task 2.3: Create Report Associations Migration
**Agent**: `database-specialist`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 2.1, Task 2.2 (items must exist first)
**Parallelizable**: No

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/services/database/migrations/migrateReportAssociations.ts`

**Specifications**:
```typescript
export async function migrateReportAssociations(): Promise<MigrationResult> {
  // 1. Migrate report_receipts → report_items
  //    Map receipt_id to corresponding item_id

  // 2. Migrate report_documents → report_items
  //    Map document_id to corresponding item_id

  // 3. Maintain referential integrity
  // 4. Keep old tables for rollback safety
}

export async function verifyReportAssociationMigration(): Promise<boolean> {
  // Verify count(report_receipts) + count(report_documents) = count(report_items)
  // Verify all report_ids exist
  // Verify all item_ids exist
}
```

**Acceptance Criteria**:
- All report associations migrated
- No orphaned references
- Total count matches (receipts + documents = items)

---

## Phase 3: Backend Services (Day 2-3)

### Task 3.1: Create Unified itemService.ts
**Agent**: `backend-developer`
**Priority**: P0
**Effort**: L
**Dependencies**: Task 1.1, Task 1.3 (types and schema)
**Parallelizable**: Can start after Phase 1 complete

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/services/database/itemService.ts`

**Specifications**:
- **CRUD Operations**: createItem, getItems, getItemById, updateItem, deleteItem
- **Filtering**: getItemsByClassification, getItemsByUsagePurpose, getItemsByDateRange
- **Search**: searchItems (by title, store_name)
- **Line Items**: createItemLineItem, getItemLineItems, updateItemLineItem, deleteItemLineItem
- **Statistics**: getTotalByUsagePurpose, getTotalByClassification

**Key Functions**:
```typescript
export async function createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item>;
export async function getItems(filters?: ItemFilters): Promise<Item[]>;
export async function getItemById(id: string): Promise<Item | null>;
export async function updateItem(id: string, updates: Partial<Item>): Promise<void>;
export async function deleteItem(id: string): Promise<void>;

// Filtering
export async function getItemsByClassification(classification: ItemClassification): Promise<Item[]>;
export async function getItemsByUsagePurpose(usagePurposeId: string): Promise<Item[]>;
export async function getItemsByFilters(classification?: ItemClassification, usagePurpose?: string, startDate?: string, endDate?: string): Promise<Item[]>;
```

**Acceptance Criteria**:
- All CRUD operations work
- Filtering supports AND combinations
- Line items properly handled
- TypeScript compilation passes
- Follows existing service patterns (receiptService.ts)

---

### Task 3.2: Update reportService for Unified Items
**Agent**: `backend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 3.1 (itemService must exist)
**Parallelizable**: No

**Deliverables**:
- Updated `/Users/taewookim/dev/receipt_tool/services/database/reportService.ts`

**Changes Required**:
1. Replace `receiptIds` and `documentIds` with single `itemIds: string[]`
2. Update `linkReceiptToReport` / `linkDocumentToReport` → `linkItemToReport`
3. Update `getReportReceiptIds` / `getReportDocumentIds` → `getReportItemIds`
4. Update `recalculateReportTotal` to sum items (where amount IS NOT NULL)
5. Keep backward compatibility during migration

**Acceptance Criteria**:
- Report type updated to use itemIds
- All linking functions work with items
- Total calculation handles null amounts (proof documents)
- TypeScript compilation passes

---

### Task 3.3: Create usagePurposeService.ts
**Agent**: `backend-developer`
**Priority**: P1
**Effort**: S
**Dependencies**: Task 1.2 (usage_purposes table)
**Parallelizable**: Can run with Task 3.1

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/services/database/usagePurposeService.ts`

**Specifications**:
```typescript
export async function getUsagePurposes(): Promise<UsagePurpose[]>;
export async function getActiveUsagePurposes(): Promise<UsagePurpose[]>;
export async function createUsagePurpose(purpose: Omit<UsagePurpose, 'id' | 'createdAt'>): Promise<UsagePurpose>;
export async function updateUsagePurpose(id: string, updates: Partial<UsagePurpose>): Promise<void>;
export async function deactivateUsagePurpose(id: string): Promise<void>;
```

**Acceptance Criteria**:
- CRUD operations work
- Active/inactive filtering works
- Ordered by display_order

---

### Task 3.4: Update Database Initialization
**Agent**: `backend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 2.1, 2.2, 2.3 (migrations ready)
**Parallelizable**: No

**Deliverables**:
- Updated `/Users/taewookim/dev/receipt_tool/services/database/init.ts`

**Changes**:
```typescript
export async function initializeDatabase() {
  // 1. Create tables (including new ones)
  // 2. Seed default data (categories, usage_purposes)
  // 3. Run migrations if old tables exist
  await runMigrationIfNeeded();
  // 4. Verify integrity
}

async function runMigrationIfNeeded() {
  const hasOldData = await checkForOldTables();
  if (hasOldData) {
    await migrateReceiptsToItems();
    await migrateDocumentsToItems();
    await migrateReportAssociations();
    await verifyMigrations();
  }
}
```

**Acceptance Criteria**:
- Fresh installs work without migration
- Existing data auto-migrates on first run
- Migration runs only once
- Rollback available if verification fails

---

## Phase 4: State Management (Day 2-3)

### Task 4.1: Create itemStore.ts
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 3.1 (itemService)
**Parallelizable**: Can start when itemService is done

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/store/itemStore.ts`

**Specifications**:
```typescript
interface ItemState {
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Filters
  classificationFilter: ItemClassification | null;
  usagePurposeFilter: string | null;
  dateRangeFilter: { start: string; end: string } | null;

  // Actions
  fetchItems: () => Promise<void>;
  createItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Filtering
  setClassificationFilter: (classification: ItemClassification | null) => void;
  setUsagePurposeFilter: (purposeId: string | null) => void;
  setDateRangeFilter: (range: { start: string; end: string } | null) => void;
  getFilteredItems: () => Item[];
}
```

**Acceptance Criteria**:
- Follows zustand pattern like receiptStore
- Filtering works client-side and server-side
- Loading states managed
- Error handling implemented

---

### Task 4.2: Create usagePurposeStore.ts
**Agent**: `frontend-developer`
**Priority**: P1
**Effort**: S
**Dependencies**: Task 3.3 (usagePurposeService)
**Parallelizable**: Can run with Task 4.1

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/store/usagePurposeStore.ts`

**Specifications**:
```typescript
interface UsagePurposeState {
  purposes: UsagePurpose[];
  isLoading: boolean;

  fetchPurposes: () => Promise<void>;
  getActivePurposes: () => UsagePurpose[];
}
```

**Acceptance Criteria**:
- Loads usage purposes on mount
- Provides active purposes for selectors

---

## Phase 5: UI Components (Day 3-4)

### Task 5.1: Create ClassificationSelector Component
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 1.1 (Item types)
**Parallelizable**: Can start after types are done

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/components/item/ClassificationSelector.tsx`

**Specifications**:
```typescript
interface ClassificationSelectorProps {
  value: ItemClassification;
  onChange: (classification: ItemClassification) => void;
  disabled?: boolean;
}

// Display options:
// - personal_card: "개인카드" (icon: card-outline)
// - corporate_card: "법인카드" (icon: card)
// - proof_document: "증명서류" (icon: document-text)
```

**Design**: Segmented control or radio buttons

**Acceptance Criteria**:
- All 3 classifications selectable
- Visual distinction between options
- Korean labels
- Accessible

---

### Task 5.2: Create UsagePurposeSelector Component
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 4.2 (usagePurposeStore)
**Parallelizable**: Can run with Task 5.1

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/components/item/UsagePurposeSelector.tsx`

**Specifications**:
```typescript
interface UsagePurposeSelectorProps {
  value: string; // usage_purpose_id
  onChange: (purposeId: string) => void;
  disabled?: boolean;
  allowCustom?: boolean; // Future: allow adding new purposes
}

// Loads from usagePurposeStore
// Displays: 식대, 교통비, 의료, 기타
// Shows icon and color for each
```

**Design**: Dropdown or grid selector

**Acceptance Criteria**:
- Dynamically loads from store
- Shows active purposes only
- Displays icon and color
- Sorted by display_order

---

### Task 5.3: Create Unified ItemForm Component
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: L
**Dependencies**: Task 5.1, 5.2 (selectors), Task 4.1 (itemStore)
**Parallelizable**: No

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/components/item/ItemForm.tsx`

**Specifications**:
```typescript
interface ItemFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Item>;
  onSubmit: (item: Item) => Promise<void>;
  onCancel: () => void;
}

// Form layout:
// 1. Classification selector (always visible)
// 2. Usage purpose selector (always visible)
// 3. Conditional fields based on classification:
//    - If card: amount, storeName, category, items breakdown
//    - If proof_document: hide amount/storeName, show file upload
// 4. Common fields: title, date, memo
```

**Acceptance Criteria**:
- Form adapts to classification selection
- Validation based on classification
- Image/file upload works
- Line items management (for cards)

---

### Task 5.4: Create ItemCard Component
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 1.1 (Item types)
**Parallelizable**: Can run with Task 5.3

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/components/item/ItemCard.tsx`

**Specifications**:
```typescript
interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
  selected?: boolean;
}

// Display:
// - Classification badge (개인/법인/증명)
// - Usage purpose badge with icon (식대/교통/의료/기타)
// - Title
// - Amount (if card) or "증명서류" (if proof)
// - Date
// - Store name (if available)
```

**Design**: Card with badges, follows existing ReceiptCard pattern

**Acceptance Criteria**:
- Shows all relevant info at glance
- Visual distinction between classifications
- Tappable with ripple effect
- Delete action with confirmation

---

## Phase 6: Screen Updates (Day 3-4)

### Task 6.1: Update Tab Navigation Structure
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: S
**Dependencies**: None
**Parallelizable**: Can start anytime

**Deliverables**:
- Updated `/Users/taewookim/dev/receipt_tool/app/(tabs)/_layout.tsx`

**Options**:
1. **Merge tabs**: Remove "영수증" and "증빙서류", add single "항목" (Items) tab
2. **Keep separate**: Keep tabs but route to same screen with preset filters

**Recommendation**: Option 1 (merge into single "항목" tab)

**Changes**:
```typescript
// Replace:
// - receipts tab
// - documents tab
// With:
<Tabs.Screen
  name="items"
  options={{
    title: '항목',
    tabBarIcon: ({ color, focused }) => (
      <TabBarIcon name={focused ? 'list' : 'list-outline'} color={color} />
    ),
  }}
/>
```

**Acceptance Criteria**:
- Single items tab replaces receipts + documents
- Icon appropriate
- Navigation works

---

### Task 6.2: Create Unified Item List Screen
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: L
**Dependencies**: Task 5.4 (ItemCard), Task 4.1 (itemStore)
**Parallelizable**: No

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/app/(tabs)/items.tsx`

**Specifications**:
```typescript
// Features:
// 1. Dual filter bar (Classification + Usage Purpose)
// 2. Search bar
// 3. Date range filter
// 4. Sort options (date, amount)
// 5. Infinite scroll or pagination
// 6. Pull-to-refresh
// 7. Empty state
// 8. FAB for adding new item

// Filter combinations:
// - All items
// - Personal cards only
// - Corporate cards + Meal purpose
// - Proof documents + Medical purpose
```

**Acceptance Criteria**:
- Filtering works with AND logic
- Search filters client-side
- Performance good with 1000+ items
- Pull-to-refresh updates data

---

### Task 6.3: Create Item Add Screen
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 5.3 (ItemForm)
**Parallelizable**: Can run with Task 6.2

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/app/item/add.tsx`

**Specifications**:
```typescript
// Uses ItemForm component
// Navigation: FAB from items list → add screen
// Success: Navigate back + show toast
// Cancel: Confirm if form dirty, then navigate back
```

**Acceptance Criteria**:
- Form validation works
- Image capture works (for cards)
- File picker works (for proof documents)
- Success feedback clear

---

### Task 6.4: Create Item Detail/Edit Screen
**Agent**: `frontend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 5.3 (ItemForm)
**Parallelizable**: Can run with Task 6.3

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/app/item/[id].tsx`

**Specifications**:
```typescript
// Modes: view / edit
// View mode: Shows all details, image preview, line items
// Edit mode: Uses ItemForm with initialData
// Actions: Edit, Delete, Share
```

**Acceptance Criteria**:
- View → Edit transition smooth
- Delete with confirmation
- Back button saves or warns about unsaved changes

---

### Task 6.5: Update Report Creation Flow
**Agent**: `frontend-developer`
**Priority**: P1
**Effort**: M
**Dependencies**: Task 3.2 (updated reportService)
**Parallelizable**: Can run after reportService updated

**Deliverables**:
- Updated report creation screens

**Changes**:
- Replace separate receipt/document selection with unified item selection
- Filter items by classification if needed
- Multi-select items for report
- Calculate total from items with amounts

**Acceptance Criteria**:
- Can select both card items and proof documents
- Total calculated correctly (excludes proof docs)
- Selection UI intuitive

---

## Phase 7: Data Migration Execution & Verification (Day 4-5)

### Task 7.1: Execute Data Migration with Verification
**Agent**: `database-specialist`
**Priority**: P0
**Effort**: L
**Dependencies**: All migration scripts (Task 2.1, 2.2, 2.3)
**Parallelizable**: No

**Process**:
1. Backup database
2. Run migrations in order
3. Verify each step
4. If any fails, rollback to backup
5. Log all results

**Deliverables**:
- Migration execution script
- Verification report
- Rollback procedure

**Acceptance Criteria**:
- 100% data migrated
- All verifications pass
- Rollback tested and works
- Migration idempotent (can run multiple times safely)

---

### Task 7.2: Create Data Integrity Verification Tests
**Agent**: `backend-developer`
**Priority**: P0
**Effort**: M
**Dependencies**: Task 7.1
**Parallelizable**: No

**Deliverables**:
- `/Users/taewookim/dev/receipt_tool/services/database/__tests__/itemIntegrity.test.ts`

**Test Cases**:
- Item count = receipt count + document count
- All report associations preserved
- No orphaned records
- Foreign keys valid
- Amount totals match
- File paths preserved

**Acceptance Criteria**:
- All tests pass
- Coverage > 90%
- Tests can run on production backup

---

## Phase 8: Cleanup & Testing (Day 5)

### Task 8.1: Remove Deprecated Tables
**Agent**: `database-specialist`
**Priority**: P2
**Effort**: S
**Dependencies**: Task 7.1, 7.2 (migration verified)
**Parallelizable**: No

**Process**:
1. Confirm migration successful
2. Export backup of old tables
3. Drop tables: receipts, documents, receipt_items, report_receipts, report_documents
4. Update schema.ts to remove old definitions

**Acceptance Criteria**:
- Backup created before drop
- Old tables removed
- App works without old tables
- Database size reduced

---

### Task 8.2: Deprecate Old Services
**Agent**: `backend-developer`
**Priority**: P2
**Effort**: M
**Dependencies**: Task 8.1
**Parallelizable**: Can run in parallel

**Files to Deprecate**:
- `/Users/taewookim/dev/receipt_tool/services/database/receiptService.ts`
- `/Users/taewookim/dev/receipt_tool/services/database/documentService.ts`
- `/Users/taewookim/dev/receipt_tool/store/receiptStore.ts`
- `/Users/taewookim/dev/receipt_tool/store/documentStore.ts`

**Process**:
1. Add deprecation warnings
2. Update imports to point to itemService/itemStore
3. Leave files in place for 1 release cycle
4. Then delete

**Acceptance Criteria**:
- No code uses old services
- All imports updated
- Deprecation warnings shown

---

### Task 8.3: Update All Tests
**Agent**: `backend-developer`
**Priority**: P1
**Effort**: L
**Dependencies**: All implementation tasks
**Parallelizable**: Can start when services done

**Files to Update**:
- All test files referencing receipts/documents
- Add new tests for itemService
- Add new tests for classification/usage purpose filtering

**Acceptance Criteria**:
- All tests pass
- No tests use deprecated services
- Coverage maintained or improved

---

### Task 8.4: TypeScript Compilation Verification
**Agent**: `typescript-specialist`
**Priority**: P0
**Effort**: S
**Dependencies**: All code changes
**Parallelizable**: Run continuously

**Process**:
- Run `tsc --noEmit` after each phase
- Fix type errors immediately
- Ensure no `any` types introduced

**Acceptance Criteria**:
- Zero TypeScript errors
- Zero warnings
- Strict mode passes

---

### Task 8.5: End-to-End Testing
**Agent**: `qa-specialist` (or senior dev)
**Priority**: P0
**Effort**: L
**Dependencies**: All tasks complete
**Parallelizable**: No

**Test Scenarios**:
1. Fresh install → Create items → Create report
2. Existing data → Upgrade → Verify migration → Use app
3. Create personal card item with meal purpose
4. Create corporate card item with transportation purpose
5. Create proof document with medical purpose
6. Filter by classification
7. Filter by usage purpose
8. Combined filtering
9. Add items to report
10. Calculate report total

**Acceptance Criteria**:
- All scenarios pass
- No crashes
- Data integrity maintained
- UI responsive
- Performance acceptable

---

## Execution Plan with Parallelization

### Wave 1 (Day 1 Morning) - 3 Parallel Agents
- **Agent 1 (typescript-specialist)**: Task 1.1 (Define types)
- **Agent 2 (database-specialist)**: Task 1.2 (usage_purposes table)
- **Agent 3 (database-specialist)**: Task 1.3 (items table) - waits for Agent 2

### Wave 2 (Day 1 Afternoon) - 3 Parallel Agents
- **Agent 1 (database-specialist)**: Task 2.1 (receipts migration)
- **Agent 2 (database-specialist)**: Task 2.2 (documents migration)
- **Agent 3 (backend-developer)**: Task 3.3 (usagePurposeService)

### Wave 3 (Day 2 Morning) - 3 Parallel Agents
- **Agent 1 (database-specialist)**: Task 2.3 (report associations migration)
- **Agent 2 (backend-developer)**: Task 3.1 (itemService)
- **Agent 3 (frontend-developer)**: Task 5.1 (ClassificationSelector)

### Wave 4 (Day 2 Afternoon) - 3 Parallel Agents
- **Agent 1 (backend-developer)**: Task 3.2 (update reportService)
- **Agent 2 (frontend-developer)**: Task 4.1 (itemStore)
- **Agent 3 (frontend-developer)**: Task 5.2 (UsagePurposeSelector)

### Wave 5 (Day 3 Morning) - 3 Parallel Agents
- **Agent 1 (backend-developer)**: Task 3.4 (database init)
- **Agent 2 (frontend-developer)**: Task 5.3 (ItemForm)
- **Agent 3 (frontend-developer)**: Task 5.4 (ItemCard)

### Wave 6 (Day 3 Afternoon) - 3 Parallel Agents
- **Agent 1 (frontend-developer)**: Task 6.1 (tab navigation)
- **Agent 2 (frontend-developer)**: Task 6.2 (item list screen)
- **Agent 3 (frontend-developer)**: Task 6.3 (item add screen)

### Wave 7 (Day 4 Morning) - 3 Parallel Agents
- **Agent 1 (frontend-developer)**: Task 6.4 (item detail screen)
- **Agent 2 (frontend-developer)**: Task 6.5 (report creation flow)
- **Agent 3 (frontend-developer)**: Task 4.2 (usagePurposeStore)

### Wave 8 (Day 4 Afternoon) - Sequential
- **Agent 1 (database-specialist)**: Task 7.1 (execute migration)
- **Agent 2 (backend-developer)**: Task 7.2 (integrity tests) - after 7.1

### Wave 9 (Day 5 Morning) - 3 Parallel Agents
- **Agent 1 (database-specialist)**: Task 8.1 (remove old tables)
- **Agent 2 (backend-developer)**: Task 8.2 (deprecate services)
- **Agent 3 (backend-developer)**: Task 8.3 (update tests)

### Wave 10 (Day 5 Afternoon) - Sequential
- **Agent 1 (typescript-specialist)**: Task 8.4 (TS verification)
- **Agent 2 (qa-specialist)**: Task 8.5 (E2E testing)

---

## Risk Mitigation

### Critical Risks
1. **Data Loss During Migration**
   - Mitigation: Multiple backups, verification at each step, rollback capability

2. **Type Errors Breaking Compilation**
   - Mitigation: Run TS checks after each phase, fix immediately

3. **Performance Issues with Large Datasets**
   - Mitigation: Proper indexing, pagination, lazy loading

4. **UI Confusion from Merged Model**
   - Mitigation: Clear badges, filters, onboarding tooltips

---

## Success Metrics

- **Data Integrity**: 100% of old data migrated successfully
- **Type Safety**: 0 TypeScript errors
- **Test Coverage**: >90% for new services
- **Performance**: List renders <100ms for 1000 items
- **User Experience**: No confusion in beta testing
- **Backward Compatibility**: Old data works seamlessly

---

## Rollback Plan

If critical issues found:
1. Restore database from backup
2. Revert code to previous commit
3. Keep old tables intact
4. Re-run migration after fixes

---

## Notes

- All file paths are absolute as required
- Maximum 3 agents in parallel enforced
- Each phase ends with compilation check
- Migration is one-time, idempotent operation
- Old services kept for 1 release before deletion
