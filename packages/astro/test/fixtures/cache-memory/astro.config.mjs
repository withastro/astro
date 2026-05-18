// @ts-check
import { defineConfig, memoryCache } from 'astro/config';

export default defineConfig({
	experimental: {
		cache: {
			provider: memoryCache(),
		},
	},
});
