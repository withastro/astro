import { defineConfig } from 'astro/config';

export default defineConfig({
	// adapter will be set dynamically by the test
	output: 'hybrid',
	redirects: {
		'/a/redirect': '/',
	},
});
