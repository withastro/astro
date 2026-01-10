import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	output: 'static',
	adapter: nodejs({
		mode: 'standalone',
		runMiddlewareOnRequest: true,
	}),
	security: {
		checkOrigin: true,
	},
});
