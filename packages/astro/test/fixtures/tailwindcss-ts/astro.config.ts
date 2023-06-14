import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'url';

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind({
			configFile: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)),
		}),
	],
});
