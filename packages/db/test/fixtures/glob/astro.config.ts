import db, { defineReadableTable, column } from '@astrojs/db';
import { defineConfig } from 'astro/config';
import { asJson, createGlob } from './utils';

const Quote = defineReadableTable({
	columns: {
		author: column.text(),
		body: column.text(),
		file: column.text({ unique: true }),
	},
});

export default defineConfig({
	db: {
		tables: { Quote },
		data({ seed, ...ctx }) {
			const glob = createGlob(ctx);
			glob('quotes/*.json', {
				into: Quote,
				parse: asJson,
			});
		},
	},
	integrations: [db()],
});
