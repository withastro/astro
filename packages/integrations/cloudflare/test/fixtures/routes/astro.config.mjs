import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';



export default defineConfig({
	adapter: cloudflare({ mode: 'directory' }),
	output: 'hybrid',
	redirects: {
		'/old': '/',
	},
});
