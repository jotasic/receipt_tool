/**
 * Restore Tag space_id Migration (v7)
 *
 * The v6 migration (tagUniqueConstraint) had a bug where space_id was not
 * included in the INSERT ... SELECT statement, leaving all tags with a NULL
 * space_id. This migration recovers from that state by assigning those tags
 * to the oldest space (by created_at).
 *
 * If no spaces exist yet, the migration is a no-op.
 */

import * as SQLite from 'expo-sqlite';

export async function restoreTagSpaceId(db: SQLite.SQLiteDatabase): Promise<void> {
  // Find the oldest space to use as the default assignment target
  const defaultSpace = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM spaces ORDER BY created_at ASC LIMIT 1'
  );
  if (!defaultSpace) return; // No spaces exist — nothing to assign

  // Assign all tags that lost their space_id back to the oldest space
  await db.runAsync(
    'UPDATE tags SET space_id = ? WHERE space_id IS NULL',
    [defaultSpace.id]
  );
}
