import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: vercel({
		instrumentation: true,
		isr: {
			exclude: ['/api/context'],
			expiration: 60,
		},
	}),
	output: 'server',
});
