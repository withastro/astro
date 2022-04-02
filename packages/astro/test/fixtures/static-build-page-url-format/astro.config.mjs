import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'http://example.com/subpath/',
	build: {
		format: 'file',
	},
});
