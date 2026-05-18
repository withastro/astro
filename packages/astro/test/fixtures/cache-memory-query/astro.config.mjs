// @ts-check
import { defineConfig, memoryCache } from 'astro/config';

// Uses default query config — tracking params (utm_*, fbclid, etc.) are
// excluded automatically, and params are sorted.
export default defineConfig({
	experimental: {
		cache: {
			provider: memoryCache(),
		},
	},
});
