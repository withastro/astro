import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const STUDIO_ADMIN_TABLE = 'ReservedAstroStudioAdmin';
export const STUDIO_ADMIN_TABLE_ROW_ID = 'admin';

export const adminTable = sqliteTable(STUDIO_ADMIN_TABLE, {
	id: text('id').primaryKey(),
	collections: text('collections').notNull(),
});
