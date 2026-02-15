# Quick Reference: Category → UsagePurpose Migration

## TL;DR

**DON'T USE:** `categories`, `categoryService`
**USE INSTEAD:** `usagePurpose`, `usagePurposeService`

## Quick Migration Guide

### Getting Categories/Purposes

```typescript
// ❌ OLD (Deprecated)
import { getCategories } from '@/services/database/categoryService';
const categories = await getCategories();

// ✅ NEW (Recommended)
import { getActiveUsagePurposes } from '@/services/database/usagePurposeService';
const purposes = await getActiveUsagePurposes();
```

### Creating an Item

```typescript
// ❌ OLD (Deprecated - Receipt with category)
const receipt = await createReceipt({
  title: '점심',
  amount: 12000,
  category: 'food',  // Single dimension
  storeName: '한식당',
  date: '2024-02-15',
});

// ✅ NEW (Recommended - Item with 2D classification)
const item = await createItem({
  title: '점심',
  amount: 12000,
  classification: 'personal_card',  // Dimension 1: Payment method
  usagePurpose: 'meal',             // Dimension 2: Purpose
  storeName: '한식당',
  date: '2024-02-15',
});
```

### Filtering by Type

```typescript
// ❌ OLD
const foodReceipts = await getReceiptsByCategory('food');

// ✅ NEW
const mealItems = await getItemsByUsagePurpose('meal');

// 🎯 BETTER - 2D filtering
const personalMealItems = await getItemsByClassificationAndPurpose(
  'personal_card',
  'meal'
);
```

## 2D Classification Explained

### Dimension 1: Classification (How was it paid?)

| Value | Korean | Description |
|-------|--------|-------------|
| `personal_card` | 개인카드 | Personal credit card (needs reimbursement) |
| `corporate_card` | 법인카드 | Corporate credit card (already paid) |
| `proof_document` | 증명서류 | Supporting documents (no payment) |

### Dimension 2: UsagePurpose (What was it for?)

| Value | Korean | Description |
|-------|--------|-------------|
| `meal` | 식대 | Meal expenses |
| `other` | 기타 | Other expenses |
| `[custom]` | [사용자정의] | User-defined purposes |

## Why 2D is Better

### Old System (Category only)
```
"This is a food expense" ← Only ONE piece of information
```

### New System (Classification × Purpose)
```
"This is a PERSONAL CARD expense for MEAL"
↑ TWO pieces of information
```

### Real-World Examples

**Example 1: Personal lunch**
```typescript
{
  classification: 'personal_card',  // Paid with personal card
  usagePurpose: 'meal',             // For lunch
}
// → "Personal meal expense to be reimbursed"
```

**Example 2: Corporate dinner**
```typescript
{
  classification: 'corporate_card',  // Paid with company card
  usagePurpose: 'meal',              // For dinner
}
// → "Corporate meal expense already paid"
```

**Example 3: Medical certificate**
```typescript
{
  classification: 'proof_document',  // Supporting document
  usagePurpose: 'other',             // Medical proof
  amount: null,                      // No payment involved
}
// → "Medical certificate for submission"
```

## Common Patterns

### Pattern 1: List all personal expenses needing reimbursement
```typescript
const needsReimbursement = await getItemsByClassification('personal_card');
```

### Pattern 2: List all meal expenses (regardless of payment)
```typescript
const allMeals = await getItemsByUsagePurpose('meal');
```

### Pattern 3: List personal meal expenses only
```typescript
const personalMeals = await getItemsByClassificationAndPurpose(
  'personal_card',
  'meal'
);
```

### Pattern 4: Calculate totals by purpose
```typescript
const mealTotal = await getTotalByUsagePurpose('meal');
const otherTotal = await getTotalByUsagePurpose('other');
```

### Pattern 5: Calculate totals by classification
```typescript
const personalTotal = await getTotalByClassification('personal_card');
const corporateTotal = await getTotalByClassification('corporate_card');
```

## User-Defined Purposes

Unlike categories, UsagePurpose is extensible:

```typescript
// Create custom purpose
await createUsagePurpose({
  id: 'travel',
  name: '출장비',
  name_en: 'Travel',
  icon: 'airplane',
  color: '#4A90E2',
});

// Use it immediately
await createItem({
  classification: 'corporate_card',
  usagePurpose: 'travel',  // Custom purpose!
  title: '제주도 출장 항공권',
  amount: 150000,
  date: '2024-02-15',
});
```

## IDE Support

TypeScript shows deprecation warnings:

```typescript
// IDE shows strikethrough and warning
const categories = await getCategories();
//                       ~~~~~~~~~~~~~~
// Warning: getCategories is deprecated.
// Use getActiveUsagePurposes() instead.
```

## Backward Compatibility

✅ Old receipts with categories still work
✅ Category service still functional (but deprecated)
✅ No breaking changes
⚠️ New code should use UsagePurpose

## Need Help?

- **Full guide**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md#category-system-migration)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API docs**: Check function JSDoc comments
- **Examples**: `/services/database/INTEGRATION_EXAMPLE.ts`

## Cheat Sheet

| Old (Category) | New (UsagePurpose) |
|----------------|---------------------|
| `categoryService` | `usagePurposeService` |
| `getCategories()` | `getActiveUsagePurposes()` |
| `getCategoryById()` | `getUsagePurposeById()` |
| `createCategory()` | `createUsagePurpose()` |
| `updateCategory()` | `updateUsagePurpose()` |
| `deleteCategory()` | `deleteUsagePurpose()` |
| `Receipt.category` | `Item.usagePurpose` |
| Single dimension | 2D classification |

---

**Remember:** Category = DEPRECATED, UsagePurpose = CURRENT
