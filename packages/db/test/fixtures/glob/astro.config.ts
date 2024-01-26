import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';
import { asJson, createGlob } from './utils';

const Quote = defineCollection({
	fields: {
		author: field.text(),
		body: field.text(),
		file: field.text({ unique: true }),
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
