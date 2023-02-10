import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	image: {
		service: 'astro/assets/services/sharp',
	},
});
