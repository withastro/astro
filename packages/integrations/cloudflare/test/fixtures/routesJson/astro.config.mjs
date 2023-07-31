import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
	adapter: cloudflare({ mode: 'directory' }),
	output: 'hybrid',
	redirects: {
		'/a/redirect': '/',
	},
	srcDir: process.env.SRC 
});
