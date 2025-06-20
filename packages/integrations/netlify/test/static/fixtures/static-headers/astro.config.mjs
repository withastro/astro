import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	adapter: netlify({
		experimentalStaticHeaders: true
	}),
	site: "http://example.com",
	experimental: {
		csp: true
	}
});
