import { defineConfig } from 'astro/config';
import db, { defineCollection, field } from '@astrojs/db';
import glob from 'fast-glob';
import { readFile } from 'fs/promises';

const Quote = defineCollection({
	fields: {
		author: field.text(),
		body: field.text(),
	},
	async data() {
		const quotes = await glob('quotes/*.json');
		return Promise.all(
			quotes.map(async (quote) => {
				const data = JSON.parse(await readFile(quote, 'utf-8'));
				return {
					author: data.author,
					body: data.body,
				};
			})
		);
	},
});

export default defineConfig({
	db: {
		collections: { Quote },
	},
	integrations: [db()],
});
