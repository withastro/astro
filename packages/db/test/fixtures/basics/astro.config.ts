import db, { defineTable, column } from '@astrojs/db';
import { defineConfig } from 'astro/config';
import { themes } from './themes-integration';

const Author = defineTable({
	columns: {
		name: column.text(),
	},
});

// https://astro.build/config
export default defineConfig({
	integrations: [db(), themes()],
	db: {
		tables: { Author },
		unsafeDisableStudio: true,
		async data({ seed }) {
			await seed(Author, [
				{ name: 'Ben' },
				{ name: 'Nate' },
				{ name: 'Erika' },
				{ name: 'Bjorn' },
				{ name: 'Sarah' },
			]);
		},
	},
});
