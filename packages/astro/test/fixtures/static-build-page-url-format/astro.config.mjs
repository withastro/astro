import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	buildOptions: {
		site: 'http://example.com/subpath/',
		pageUrlFormat: 'file',
	},
});