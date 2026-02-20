/**
 * Space Feature Migration (v4)
 *
 * Adds Space and Classification tables.
 * Existing data is migrated to the "회사" space.
 *
 * Idempotency guarantees:
 * - CREATE TABLE IF NOT EXISTS
 * - ALTER TABLE errors on duplicate column are swallowed
 * - INSERT OR IGNORE with deterministic IDs
 */

import * as SQLite from 'expo-sqlite';
import type { MigrationProgressCallback } from './runner';

// Deterministic seed IDs - safe to hard-code because this migration
// is applied exactly once and the IDs must remain stable across runs.
export const DEFAULT_SPACE_IDS = {
  company: 'space-company-default',
  personal: 'space-personal-default',
} as const;

export const DEFAULT_CLASSIFICATION_IDS = {
  personalCard: 'class-personal-card-default',
  corporateCard: 'class-corporate-card-default',
  proofDocument: 'class-proof-document-default',
} as const;

const {
  company: COMPANY_SPACE_ID,
  personal: PERSONAL_SPACE_ID,
} = DEFAULT_SPACE_IDS;

const {
  personalCard: CLASS_PERSONAL_CARD_ID,
  corporateCard: CLASS_CORPORATE_CARD_ID,
  proofDocument: CLASS_PROOF_DOC_ID,
} = DEFAULT_CLASSIFICATION_IDS;

export async function migrateSpaceFeature(
  db: SQLite.SQLiteDatabase,
  onProgress?: MigrationProgressCallback
): Promise<void> {
  onProgress?.({ message: '공간 기능 업데이트 중...' });

  // Step 1: Create new tables
  onProgress?.({ message: '공간 테이블 생성 중...' });
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classifications (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Step 2: Add columns to existing tables (ALTER TABLE - idempotent)
  onProgress?.({ message: '테이블 구조 업데이트 중...' });
  const alterStatements = [
    `ALTER TABLE items ADD COLUMN space_id TEXT REFERENCES spaces(id)`,
    `ALTER TABLE items ADD COLUMN classification_id TEXT REFERENCES classifications(id)`,
    `ALTER TABLE usage_purposes ADD COLUMN space_id TEXT REFERENCES spaces(id)`,
    `ALTER TABLE tags ADD COLUMN space_id TEXT REFERENCES spaces(id)`,
    `ALTER TABLE custom_fields ADD COLUMN space_id TEXT REFERENCES spaces(id)`,
  ];

  for (const sql of alterStatements) {
    try {
      await db.execAsync(sql);
    } catch (err) {
      // Column already exists - ignore (idempotent)
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('duplicate column name')) throw err;
    }
  }

  // Step 3: Seed default spaces
  onProgress?.({ message: '기본 공간 데이터 설정 중...' });

  await db.runAsync(
    `INSERT OR IGNORE INTO spaces (id, name, icon, color, display_order) VALUES (?, ?, ?, ?, ?)`,
    [COMPANY_SPACE_ID, '회사', '🏢', '#3B82F6', 0]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO spaces (id, name, icon, color, display_order) VALUES (?, ?, ?, ?, ?)`,
    [PERSONAL_SPACE_ID, '개인', '👤', '#10B981', 1]
  );

  // Step 4: Seed default classifications for 회사 공간
  await db.runAsync(
    `INSERT OR IGNORE INTO classifications (id, space_id, name, icon, color, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [CLASS_PERSONAL_CARD_ID, COMPANY_SPACE_ID, '개인카드', '💳', '#6366F1', 0]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO classifications (id, space_id, name, icon, color, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [CLASS_CORPORATE_CARD_ID, COMPANY_SPACE_ID, '법인카드', '🏢', '#F59E0B', 1]
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO classifications (id, space_id, name, icon, color, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [CLASS_PROOF_DOC_ID, COMPANY_SPACE_ID, '증빙서류', '📄', '#64748B', 2]
  );

  // Step 5: Assign 회사 공간 to existing usage_purposes
  onProgress?.({ message: '사용처 데이터 이관 중...' });
  await db.runAsync(
    `UPDATE usage_purposes SET space_id = ? WHERE space_id IS NULL`,
    [COMPANY_SPACE_ID]
  );

  // Step 6: Assign 회사 공간 to existing tags
  await db.runAsync(
    `UPDATE tags SET space_id = ? WHERE space_id IS NULL`,
    [COMPANY_SPACE_ID]
  );

  // Step 7: Assign 회사 공간 to existing custom_fields
  await db.runAsync(
    `UPDATE custom_fields SET space_id = ? WHERE space_id IS NULL`,
    [COMPANY_SPACE_ID]
  );

  // Step 8: Migrate existing items - map classification enum to classification_id FK
  const itemsCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM items WHERE space_id IS NULL'
  );

  if ((itemsCount?.count ?? 0) > 0) {
    onProgress?.({ message: '기존 항목 데이터 이관 중...' });

    await db.runAsync(
      `UPDATE items
       SET
         space_id = ?,
         classification_id = CASE classification
           WHEN 'personal_card'   THEN ?
           WHEN 'corporate_card'  THEN ?
           WHEN 'proof_document'  THEN ?
           ELSE ?
         END
       WHERE space_id IS NULL`,
      [
        COMPANY_SPACE_ID,
        CLASS_PERSONAL_CARD_ID,
        CLASS_CORPORATE_CARD_ID,
        CLASS_PROOF_DOC_ID,
        CLASS_PERSONAL_CARD_ID,
      ]
    );
  }

  onProgress?.({ message: '공간 기능 업데이트 완료' });
}
