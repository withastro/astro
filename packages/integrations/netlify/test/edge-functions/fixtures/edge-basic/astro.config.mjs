import { defineConfig } from 'astro/config';
import { netlifyEdgeFunctions } from '@astrojs/netlify';

export default defineConfig({
	adapter: netlifyEdgeFunctions({
		dist: new URL('./dist/', import.meta.url),
	}),
	experimental: {
		ssr: true
	}
})
