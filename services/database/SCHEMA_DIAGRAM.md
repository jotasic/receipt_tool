# Database Schema Diagram

```
┌─────────────────────┐
│    categories       │
├─────────────────────┤
│ id (PK)            │◄─────┐
│ name (UNIQUE)      │      │
│ icon               │      │
│ color              │      │
└─────────────────────┘      │
                             │
                             │ FK: category_id
                             │
┌─────────────────────┐      │
│     receipts        │      │
├─────────────────────┤      │
│ id (PK)            │◄─────┼─────┐
│ title              │      │     │
│ store_name         │      │     │
│ amount             │      │     │
│ date               │      │     │
│ category_id (FK)   ├──────┘     │
│ image_path         │            │
│ ocr_text           │            │
│ created_at         │            │
│ updated_at         │            │
└─────────────────────┘            │
         △                         │
         │                         │
         │ FK: receipt_id          │
         │                         │
┌─────────────────────┐            │
│  receipt_items      │            │
├─────────────────────┤            │
│ id (PK)            │            │
│ receipt_id (FK)    ├────────────┘
│ name               │
│ price              │
│ quantity           │
└─────────────────────┘


┌─────────────────────┐            ┌─────────────────────┐
│      reports        │            │  report_receipts    │
├─────────────────────┤            ├─────────────────────┤
│ id (PK)            │◄───────────┤ report_id (PK, FK) │
│ title              │            │ receipt_id (PK, FK)├──┐
│ total_amount       │            └─────────────────────┘  │
│ status             │                                     │
│ submitted_at       │                                     │
│ created_at         │            ┌─────────────────────┐  │
│ updated_at         │            │     receipts        │  │
└─────────────────────┘            │ (see above)         │◄─┘
                                   └─────────────────────┘
```

## Relationships

1. **categories → receipts**: One-to-Many
   - One category can have many receipts
   - Each receipt belongs to one category

2. **receipts → receipt_items**: One-to-Many
   - One receipt can have many items
   - Each item belongs to one receipt
   - CASCADE DELETE: Deleting a receipt deletes all its items

3. **reports ↔ receipts**: Many-to-Many
   - One report can contain many receipts
   - One receipt can be in many reports
   - Junction table: `report_receipts`
   - CASCADE DELETE: Deleting a report removes associations

## Default Categories

| ID | Name | Icon | Color |
|---|---|---|---|
| food | 식비 | restaurant | #FF6B6B |
| transport | 교통비 | car | #4ECDC4 |
| shopping | 쇼핑 | shopping-bag | #95E1D3 |
| entertainment | 엔터테인먼트 | film | #F38181 |
| utilities | 공과금 | home | #AA96DA |
| medical | 의료 | medical | #FCBAD3 |
| education | 교육 | book | #A8D8EA |
| other | 기타 | ellipsis-horizontal | #C7CEEA |

## Indexes

Performance optimizations:
- `idx_receipts_date`: Fast date-based queries (DESC order)
- `idx_receipts_category`: Quick category filtering
- `idx_receipt_items_receipt`: Efficient item lookups per receipt
- `idx_reports_status`: Status-based filtering
- `idx_reports_created`: Chronological report ordering (DESC)
