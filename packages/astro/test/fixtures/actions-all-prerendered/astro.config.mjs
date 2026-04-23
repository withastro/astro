import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	security: {
		checkOrigin: false,
	},
});
