import vercel from '@astrojs/vercel/serverless';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: "server",
	adapter: vercel({
		maxDuration: 60
	})
});
