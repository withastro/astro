import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// `middlewareMode: 'edge'` with no middleware file in the project.
export default defineConfig({
	output: 'server',
	adapter: vercel({
		middlewareMode: 'edge',
		isr: {
			expiration: 120,
		},
	}),
});
