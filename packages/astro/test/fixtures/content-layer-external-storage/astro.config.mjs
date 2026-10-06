// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		collectionStorage: {
			type: 'external',
			driver: {
				entrypoint: new URL('./json-driver.mjs', import.meta.url),
				config: {
					file: fileURLToPath(new URL('./.astro/external-content.json', import.meta.url)),
				},
			},
		},
	},
});
