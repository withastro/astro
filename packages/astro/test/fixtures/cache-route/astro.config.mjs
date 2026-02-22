// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { memoryCache } from 'astro/config';

export default defineConfig({
	experimental: {
		cache: {
			provider: memoryCache(),
		},
	},
	adapter: node({
    mode: 'standalone'
  })
});
