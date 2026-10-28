import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare({
		imageService: 'cloudflare-binding',
	}),
	image: {
		domains: ['localhost'],
	},
	output: 'server',
	cache: {
		provider: cacheCloudflare(),
	},
});
