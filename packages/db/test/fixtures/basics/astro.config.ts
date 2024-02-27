import db, { defineTable, column, sql, NOW } from '@astrojs/db';
import { defineConfig } from 'astro/config';

const Author = defineTable({
	columns: {
		name: column.text(),
	},
});

// TODO: add back integration test
const Themes = defineTable({
	columns: {
		name: column.text(),
		added: column.date({
			default: sql`CURRENT_TIMESTAMP`,
		}),
		updated: column.date({
			default: NOW,
		}),
		isDark: column.boolean({ default: sql`TRUE` }),
		owner: column.text({ optional: true, default: sql`NULL` }),
	},
});

// https://astro.build/config
export default defineConfig({
	integrations: [db()],
	db: {
		tables: { Author, Themes },
	},
});
