import { defineConfig } from 'astro/config';
import { db, field } from '@astro/db';

// https://astro.build/config
export default defineConfig({
	integrations: [db()],
	db: {
		collections: {
			Author: {
				fields: {
					name: field.text(),
				},
			}
		}
	}
});
