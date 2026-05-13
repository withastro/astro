import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare(),
	output: 'server',
	experimental: {
		cache: {
			provider: cacheCloudflare(),
		},
		routeRules: {
			'/tagged': { maxAge: 600, tags: ['products'] },
		},
	},
});
