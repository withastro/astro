import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: "server",
	adapter: netlify({
		experimentalStaticHeaders: true,
	}),
	experimental: {
		csp: {
			collapseHeaders: true
		}
	},
});