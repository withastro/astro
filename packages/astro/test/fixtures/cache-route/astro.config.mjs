// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

export default defineConfig({
	experimental: {
		cache: {
			driver: '@astrojs/node/cache'
		},
	},
	adapter: node({
    mode: 'standalone'
  })
});
