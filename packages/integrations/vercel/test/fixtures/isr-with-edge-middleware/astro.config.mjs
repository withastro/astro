import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	redirects: {
		'/old': '/',
	},
	adapter: vercel({
		middlewareMode: 'edge',
		isr: {
			expiration: 120,
			exclude: ['/live'],
		},
	}),
});
