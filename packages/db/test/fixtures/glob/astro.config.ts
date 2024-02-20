import { defineConfig } from 'astro/config';
import db, { defineCollection, column } from '@astrojs/db';
import { asJson, createGlob } from './utils';

const Quote = defineCollection({
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
