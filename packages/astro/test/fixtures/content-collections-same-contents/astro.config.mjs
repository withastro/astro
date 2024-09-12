import {defineConfig} from 'astro/config';

// https://astro.build/config
export default defineConfig({
	base: '/docs',
	vite: {
		build: {
			assetsInlineLimit: 0
		}
	},
	experimental: {
		emulateLegacyCollections: true,
	}
});
