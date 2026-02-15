/**
 * SQLite Database Schema Definition
 *
 * Defines table structures for receipts, items, reports, and categories
 */

export const SCHEMA = {
  receipts: `
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      store_name TEXT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category_id TEXT,
      image_path TEXT,
      ocr_text TEXT,
      receipt_type TEXT DEFAULT 'corporate' CHECK(receipt_type IN ('corporate', 'personal')),
      memo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `,

  receipt_items: `
    CREATE TABLE IF NOT EXISTS receipt_items (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
    )
  `,

  reports: `
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  report_receipts: `
    CREATE TABLE IF NOT EXISTS report_receipts (
      report_id TEXT NOT NULL,
      receipt_id TEXT NOT NULL,
      PRIMARY KEY (report_id, receipt_id),
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
    )
  `,

  report_documents: `
    CREATE TABLE IF NOT EXISTS report_documents (
      report_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      PRIMARY KEY (report_id, document_id),
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `,

  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT
    )
  `,

  documents: `
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      file_type TEXT,
      document_type TEXT DEFAULT 'other',
      memo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6B7280',
      created_at TEXT NOT NULL
    )
  `,

  receipt_tags: `
    CREATE TABLE IF NOT EXISTS receipt_tags (
      receipt_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (receipt_id, tag_id),
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `,

  document_tags: `
    CREATE TABLE IF NOT EXISTS document_tags (
      document_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (document_id, tag_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `,

  custom_fields: `
    CREATE TABLE IF NOT EXISTS custom_fields (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      field_type TEXT NOT NULL CHECK(field_type IN ('text', 'number', 'date', 'select')),
      options TEXT,
      is_required INTEGER DEFAULT 0,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('receipt', 'document', 'both')),
      display_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,

  receipt_custom_values: `
    CREATE TABLE IF NOT EXISTS receipt_custom_values (
      receipt_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (receipt_id, field_id),
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
    )
  `,

  document_custom_values: `
    CREATE TABLE IF NOT EXISTS document_custom_values (
      document_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (document_id, field_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
    )
  `,

  // New unified items table with 2D classification
  items: `
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,

      -- 2D Classification
      classification TEXT NOT NULL
        CHECK(classification IN ('personal_card', 'corporate_card', 'proof_document')),
      usage_purpose TEXT NOT NULL,

      -- Financial (nullable for proof documents)
      amount REAL,
      date TEXT NOT NULL,
      store_name TEXT,

      -- File/Image
      file_path TEXT,
      file_type TEXT,
      ocr_text TEXT,

      -- Metadata
      memo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  usage_purposes: `
    CREATE TABLE IF NOT EXISTS usage_purposes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      name_en TEXT,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0
    )
  `,

  report_items: `
    CREATE TABLE IF NOT EXISTS report_items (
      report_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      PRIMARY KEY (report_id, item_id),
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    )
  `,
};

/**
 * Index definitions for query optimization
 */
export const INDEXES = {
  receipts_date: `
    CREATE INDEX IF NOT EXISTS idx_receipts_date
    ON receipts(date DESC)
  `,

  receipts_category: `
    CREATE INDEX IF NOT EXISTS idx_receipts_category
    ON receipts(category_id)
  `,

  receipt_items_receipt: `
    CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt
    ON receipt_items(receipt_id)
  `,

  reports_status: `
    CREATE INDEX IF NOT EXISTS idx_reports_status
    ON reports(status)
  `,

  reports_created: `
    CREATE INDEX IF NOT EXISTS idx_reports_created
    ON reports(created_at DESC)
  `,

  receipts_type: `
    CREATE INDEX IF NOT EXISTS idx_receipts_type
    ON receipts(receipt_type)
  `,

  documents_created: `
    CREATE INDEX IF NOT EXISTS idx_documents_created
    ON documents(created_at DESC)
  `,

  documents_type: `
    CREATE INDEX IF NOT EXISTS idx_documents_type
    ON documents(document_type)
  `,

  report_documents_report: `
    CREATE INDEX IF NOT EXISTS idx_report_documents_report
    ON report_documents(report_id)
  `,

  report_documents_document: `
    CREATE INDEX IF NOT EXISTS idx_report_documents_document
    ON report_documents(document_id)
  `,

  tags_name: `
    CREATE INDEX IF NOT EXISTS idx_tags_name
    ON tags(name)
  `,

  receipt_tags_receipt: `
    CREATE INDEX IF NOT EXISTS idx_receipt_tags_receipt
    ON receipt_tags(receipt_id)
  `,

  receipt_tags_tag: `
    CREATE INDEX IF NOT EXISTS idx_receipt_tags_tag
    ON receipt_tags(tag_id)
  `,

  document_tags_document: `
    CREATE INDEX IF NOT EXISTS idx_document_tags_document
    ON document_tags(document_id)
  `,

  document_tags_tag: `
    CREATE INDEX IF NOT EXISTS idx_document_tags_tag
    ON document_tags(tag_id)
  `,

  custom_fields_entity: `
    CREATE INDEX IF NOT EXISTS idx_custom_fields_entity
    ON custom_fields(entity_type)
  `,

  receipt_custom_values_receipt: `
    CREATE INDEX IF NOT EXISTS idx_receipt_custom_values_receipt
    ON receipt_custom_values(receipt_id)
  `,

  receipt_custom_values_field: `
    CREATE INDEX IF NOT EXISTS idx_receipt_custom_values_field
    ON receipt_custom_values(field_id)
  `,

  document_custom_values_document: `
    CREATE INDEX IF NOT EXISTS idx_document_custom_values_document
    ON document_custom_values(document_id)
  `,

  document_custom_values_field: `
    CREATE INDEX IF NOT EXISTS idx_document_custom_values_field
    ON document_custom_values(field_id)
  `,

  // Indexes for new unified items table
  items_classification: `
    CREATE INDEX IF NOT EXISTS idx_items_classification
    ON items(classification)
  `,

  items_usage_purpose: `
    CREATE INDEX IF NOT EXISTS idx_items_usage_purpose
    ON items(usage_purpose)
  `,

  items_date: `
    CREATE INDEX IF NOT EXISTS idx_items_date
    ON items(date DESC)
  `,

  report_items_report: `
    CREATE INDEX IF NOT EXISTS idx_report_items_report
    ON report_items(report_id)
  `,

  report_items_item: `
    CREATE INDEX IF NOT EXISTS idx_report_items_item
    ON report_items(item_id)
  `,
};

/**
 * Default categories to seed the database
 */
export const DEFAULT_CATEGORIES = [
  { id: 'food', name: '식비', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'transport', name: '교통비', icon: 'car', color: '#4ECDC4' },
  { id: 'shopping', name: '쇼핑', icon: 'shopping-bag', color: '#95E1D3' },
  { id: 'entertainment', name: '엔터테인먼트', icon: 'film', color: '#F38181' },
  { id: 'utilities', name: '공과금', icon: 'home', color: '#AA96DA' },
  { id: 'medical', name: '의료', icon: 'medical', color: '#FCBAD3' },
  { id: 'education', name: '교육', icon: 'book', color: '#A8D8EA' },
  { id: 'other', name: '기타', icon: 'ellipsis-horizontal', color: '#C7CEEA' },
];

/**
 * Default usage purposes for the new items table
 */
export const DEFAULT_USAGE_PURPOSES = [
  { id: 'meal', name: '식대', name_en: 'Meal', icon: 'restaurant', color: '#FF6B6B', display_order: 1 },
  { id: 'other', name: '기타', name_en: 'Other', icon: 'ellipsis-horizontal', color: '#C7CEEA', display_order: 2 },
];

/**
 * TypeScript types for database rows
 */

export interface ItemRow {
  id: string;
  title: string;
  classification: 'personal_card' | 'corporate_card' | 'proof_document';
  usage_purpose: string;  // Dynamic from usage_purposes table
  amount: number | null;
  date: string;
  store_name: string | null;
  file_path: string | null;
  file_type: string | null;
  ocr_text: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsagePurposeRow {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  color: string | null;
  is_active: number;
  display_order: number;
}

export interface ReportItemRow {
  report_id: string;
  item_id: string;
}
