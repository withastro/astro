import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: "server",
	adapter: vercel({
		experimentalStaticHeaders: true,
	}),
	experimental: {
		csp: true
	},
});
