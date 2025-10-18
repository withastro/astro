import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	experimental: {
		llm: {
			optimizePageResponse: true,
		},
	},
});
