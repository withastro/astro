// @ts-check
import { defineConfig, memoryCache } from 'astro/config';

export default defineConfig({
	cache: {
		provider: memoryCache(),
	},
});
