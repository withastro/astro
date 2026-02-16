import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	experimental: {
		queuedRendering: { enabled: true },
	},
});
