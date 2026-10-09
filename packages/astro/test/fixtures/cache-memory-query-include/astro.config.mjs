// @ts-check
import { defineConfig, memoryCache } from 'astro/config';

export default defineConfig({
	cache: {
		provider: memoryCache({
			query: {
				include: ['page', 'sort'],
			},
		}),
	},
});
