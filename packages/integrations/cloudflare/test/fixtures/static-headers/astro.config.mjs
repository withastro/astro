import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	adapter: cloudflare({
		experimentalStaticHeaders: true
	}),
	site: "http://example.com",
	experimental: {
		csp: true
	}
});