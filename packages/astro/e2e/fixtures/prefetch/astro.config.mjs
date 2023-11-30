import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	devOverlay: {
		enabled: false,
	},
	prefetch: true
});
