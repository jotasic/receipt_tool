/**
 * Usage Purpose Unique Constraint Migration (v5)
 *
 * Changes the UNIQUE constraint on usage_purposes.name from a global UNIQUE
 * to a composite UNIQUE(name, space_id) so that the same name can exist in
 * different spaces.
 *
 * SQLite does not support ALTER TABLE ... DROP CONSTRAINT, so the table is
 * recreated using the standard SQLite rename-create-copy-drop pattern.
 *
 * Steps:
 * 1. Rename usage_purposes → usage_purposes_old
 * 2. Create new usage_purposes with UNIQUE(name, space_id)
 * 3. Copy all rows from usage_purposes_old
 * 4. Drop usage_purposes_old
 */

import * as SQLite from 'expo-sqlite';

export async function migrateUsagePurposeUniqueConstraint(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Step 1: Rename existing table
    await db.execAsync(`ALTER TABLE usage_purposes RENAME TO usage_purposes_old;`);

    // Step 2: Create new table with composite UNIQUE constraint
    await db.execAsync(`
      CREATE TABLE usage_purposes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_en TEXT,
        icon TEXT,
        color TEXT,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        space_id TEXT REFERENCES spaces(id),
        UNIQUE(name, space_id)
      );
    `);

    // Step 3: Copy all data from the old table
    await db.execAsync(`
      INSERT INTO usage_purposes (id, name, name_en, icon, color, is_active, display_order, space_id)
      SELECT id, name, name_en, icon, color, is_active, display_order, space_id
      FROM usage_purposes_old;
    `);

    // Step 4: Drop old table
    await db.execAsync(`DROP TABLE usage_purposes_old;`);
  });
}
