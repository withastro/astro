import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';
import { asJson, glob } from './utils';

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
		data({ set }) {
			set(Quote, glob('quotes/*.json', asJson));
		},
	},
	integrations: [db()],
});
