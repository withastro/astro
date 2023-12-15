import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind({
			configFile: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)),
		}),
	],
	devToolbar: {
		enabled: false,
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
});
