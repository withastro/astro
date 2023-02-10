import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	base: '/docs',
	integrations: [mdx()],
	vite: {
		build: {
			assetsInlineLimit: 0
		}
	}
});
