import { defineDB, defineTable, column, sql, NOW } from 'astro:db';

const Author = defineTable({
	columns: {
		name: column.text(),
	},
});

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

export default defineDB({
	tables: { Author, Themes },
});
