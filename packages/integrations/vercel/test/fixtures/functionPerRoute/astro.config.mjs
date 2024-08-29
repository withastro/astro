import vercel from '@astrojs/vercel/serverless';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: vercel({
		functionPerRoute: true
	}),
	output: "server"
});
