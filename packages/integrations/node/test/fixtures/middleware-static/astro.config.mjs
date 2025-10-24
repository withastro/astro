import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	output: 'hybrid',
	adapter: nodejs({
		mode: 'standalone',
		runMiddlewareForStaticPages: true,
	}),
});
