import { defineConfig } from 'astro/config';
import db, { defineTable, column } from '@astrojs/db';
import { asJson, createGlob } from './utils';

const Quote = defineTable({
	columns: {
		author: column.text(),
		body: column.text(),
		file: column.text({ unique: true }),
	},
});

export default defineConfig({
	db: {
		collections: { Quote },
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
