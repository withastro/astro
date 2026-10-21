import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: vercel(),
	output: 'server',
	outDir: '../dist',
});
