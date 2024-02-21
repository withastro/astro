import { defineConfig } from 'astro/config';
import db, { defineReadableTable, column } from '@astrojs/db';
import {themes} from './themes-integration';

const Author = defineReadableTable({
	columns: {
		name: column.text(),
	},
});

// https://astro.build/config
export default defineConfig({
	integrations: [db(), themes()],
	db: {
		studio: false,
		unsafeWritable: true,
		tables: { Author },
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
