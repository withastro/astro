import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'url';

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind({
			config: {
				path: fileURLToPath(new URL('./tailwind.config.cjs', import.meta.url)),
			},
		}),
	],
});
