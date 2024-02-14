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
		async data({ seed }) {
			await seed(Author, [
				{ name: 'Ben' },
				{ name: 'Nate' },
				{ name: 'Erika' },
				{ name: 'Bjorn' },
				{ name: 'Sarah' },
			]);
			// Seed writable collections in dev mode, only
			// but in this case we do it for both, due to tests
			await seed(Themes, [
				{ name: 'dracula' },
				{ name: 'monokai', added: new Date() },
			]);
		},
	},
});
