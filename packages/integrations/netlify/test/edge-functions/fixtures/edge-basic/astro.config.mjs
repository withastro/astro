import { defineConfig } from 'astro/config';
import { netlifyEdgeFunctions } from '@astrojs/netlify';
import react from "@astrojs/react";

export default defineConfig({
	deploy: netlifyEdgeFunctions({
		dist: new URL('./dist/', import.meta.url),
	}),
	integrations: [react()],
	mode: 'server',
})
