import { defineConfig } from 'astro/config';

export default defineConfig({
	cache: {
		provider: { entrypoint: new URL('./cdn-provider.mjs', import.meta.url) },
	},
	routeRules: {
		'/': { maxAge: 300, tags: ['route-rule'] },
		'/private': { maxAge: 300, tags: ['route-rule'] },
	},
});
