import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare(),
	output: 'server',
	experimental: {
		cache: {
			provider: {
				entrypoint: new URL('./mock-cache-provider.mjs', import.meta.url),
			},
		},
	},
});
