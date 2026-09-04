import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	adapter: netlify({
		staticHeaders: true
	}),
	site: "http://example.com",
	security: {
		csp: true
	}
});
