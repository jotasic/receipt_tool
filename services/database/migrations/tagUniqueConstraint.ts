/**
 * Tag Unique Constraint Migration (v6)
 *
 * Changes the UNIQUE constraint on tags.name from a global UNIQUE
 * to a composite UNIQUE(name, space_id) so that the same tag name can exist in
 * different spaces.
 *
 * SQLite does not support ALTER TABLE ... DROP CONSTRAINT, so the table is
 * recreated using the standard SQLite rename-create-copy-drop pattern.
 *
 * Steps:
 * 1. Rename tags → tags_old
 * 2. Create new tags with UNIQUE(name, space_id)
 * 3. Copy all rows from tags_old
 * 4. Drop tags_old
 */

import * as SQLite from 'expo-sqlite';

export async function migrateTagUniqueConstraint(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Step 1: Rename existing table
    await db.execAsync(`ALTER TABLE tags RENAME TO tags_old;`);

    // Step 2: Create new table with composite UNIQUE constraint
    await db.execAsync(`
      CREATE TABLE tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6B7280',
        created_at TEXT NOT NULL,
        space_id TEXT REFERENCES spaces(id),
        UNIQUE(name, space_id)
      );
    `);

    // Step 3: Copy all data from the old table
    await db.execAsync(`
      INSERT INTO tags (id, name, color, created_at)
      SELECT id, name, color, created_at
      FROM tags_old;
    `);

    // Step 4: Drop old table
    await db.execAsync(`DROP TABLE tags_old;`);
  });
}
