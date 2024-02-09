import { defineConfig } from 'astro/config';
import db, { defineCollection, defineWritableCollection, field, sql, NOW } from '@astrojs/db';

const Author = defineCollection({
	fields: {
		name: field.text(),
	},
});

const Themes = defineWritableCollection({
	fields: {
		name: field.text(),
		added: field.date({
			default: sql`CURRENT_TIMESTAMP`
		}),
		updated: field.date({
			default: NOW
		}),
		isDark: field.boolean({ default: sql`TRUE` }),
		owner: field.text({ optional: true, default: sql`NULL` }),
	},
});

// https://astro.build/config
export default defineConfig({
	integrations: [db()],
	db: {
		studio: true,
		collections: { Author, Themes },
		async data({ seed, mode }) {
			await seed(Author, [
				{ name: 'Ben' },
				{ name: 'Nate' },
				{ name: 'Erika' },
				{ name: 'Bjorn' },
				{ name: 'Sarah' },
			]);
			// Seed writable collections in dev mode, only
			if (mode === 'dev') {
				await seed(Themes, [
					{ name: 'dracula' },
					{ name: 'monokai' },
				]);
			}
		},
	},
});
