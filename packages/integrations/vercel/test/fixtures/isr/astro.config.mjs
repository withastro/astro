import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
	output: "server",
	adapter: vercel({
		isr: {
			bypassToken: "1c9e601d-9943-4e7c-9575-005556d774a8",
			expiration: 120,
			exclude: ["/two"]
		}
	})
});
