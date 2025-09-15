// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';

export default defineConfig({
	adapter: cloudflare({
		imageService: 'cloudflare-binding',
	}),
	vite: {
		resolve: {
			alias: {
				'@images': fileURLToPath(new URL('./images', import.meta.url)),
			},
		},
	},
	integrations: [mdx(), react()],
});
