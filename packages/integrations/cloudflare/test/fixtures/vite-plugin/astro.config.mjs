// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';

export default defineConfig({
	adapter: cloudflare({
		workerEntryPoint: {
			path: 'src/worker.ts',
		},
		imageService: 'cloudflare',
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
