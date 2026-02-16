import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	experimental: {
		queuedRendering: {
			enabled: true,
			poolSize: 1000,
			cache: false
		}
	}
});
