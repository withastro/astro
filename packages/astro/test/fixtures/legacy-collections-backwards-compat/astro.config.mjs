import { defineConfig } from 'astro/config';

export default defineConfig({
	legacy: {
		collectionsBackwardsCompat: true,
	},
});
