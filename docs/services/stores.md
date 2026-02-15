# Zustand Stores

전역 상태 관리 API

## useItemStore

```typescript
import { useItemStore } from '@/store/itemStore';

interface ItemStore {
  items: Item[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (input: CreateItemInput) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  getItemsByClassification: (classification: ItemClassification) => Item[];
  getItemsByUsagePurpose: (purpose: UsagePurpose) => Item[];
  getItemsByDateRange: (start: string, end: string) => Item[];
}
```

**Example:**
```typescript
function MyComponent() {
  const { items, fetchItems, addItem } = useItemStore();

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    await addItem({
      classification: 'personal_card',
      usagePurpose: 'meal',
      title: '점심',
      amount: 10000,
      date: '2024-02-15',
    });
  };
}
```

---

## useReportStore

```typescript
import { useReportStore } from '@/store/reportStore';

interface ReportStore {
  reports: Report[];
  loading: boolean;
  error: string | null;

  fetchReports: () => Promise<void>;
  createReport: (input: CreateReportInput) => Promise<Report>;
  submitReport: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;

  getReportsByStatus: (status: ReportStatus) => Report[];
}
```

---

## Legacy Stores (Deprecated)

| Store | 상태 | 대체 |
|-------|------|------|
| `useReceiptStore` | DEPRECATED | `useItemStore` |
| `useDocumentStore` | DEPRECATED | `useItemStore` |
