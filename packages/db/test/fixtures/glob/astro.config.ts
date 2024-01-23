import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';
import { glob } from './utils';

const Quote = defineCollection({
	fields: {
		author: field.text(),
		body: field.text(),
	},
	data: glob('quotes/*.json', ({ content }) => {
		return JSON.parse(content);
	}),
});

export default defineConfig({
	db: {
		collections: { Quote },
	},
	integrations: [db()],
});
