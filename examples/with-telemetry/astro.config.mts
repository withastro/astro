import node from '@astrojs/node';
import opentelemetry from '@astrojs/opentelemetry';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	integrations: [
		svelte(),
		opentelemetry({}),
		{
			name: 'test-integration',
			hooks: {
				'astro:config:setup': ({ addMiddleware }) => {
					addMiddleware({
						entrypoint: fileURLToPath(new URL('./src/middleware.ts', import.meta.url)),
						order: 'pre',
					});
				},
			},
		},
	],
	vite: {
		build: {
			sourcemap: true,
		},
	},
});
