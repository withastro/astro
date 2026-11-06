import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	experimental: {
		dynamicComponents: true,
	},
});
