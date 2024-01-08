import { defineConfig } from 'astro/config';
import db, { field } from '@astrojs/db';

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
