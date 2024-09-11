import vercel from '@astrojs/vercel/serverless';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	adapter: vercel(),
});
