// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
	base: '/blog/',
	output: 'server',
	adapter: cloudflare(),
	redirects: {
		'/a/redirect': '/',
		// TEST CASE FOR https://github.com/withastro/astro/issues/13165
		'/a/redirect/': '/',
	},
});
