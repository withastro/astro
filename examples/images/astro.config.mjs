import { defineConfig } from 'astro/config';

// https://astro.build/config
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	// output: 'server',
	image: {
		service: 'astro/assets/services/sharp',
	},
	experimental: {
		images: true,
	},
	adapter: node({
		mode: 'standalone',
	}),
});
