import { defineConfig } from 'astro/config';
import { netlifyEdgeFunctions } from '@astrojs/netlify';

export default defineConfig({
	deploy: netlifyEdgeFunctions({
		dist: new URL('./dist/', import.meta.url),
	}),
	output: 'server',
})
