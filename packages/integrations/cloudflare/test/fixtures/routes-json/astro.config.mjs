import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'hybrid',
	redirects: {
		'/a/redirect': '/',
	},
});
