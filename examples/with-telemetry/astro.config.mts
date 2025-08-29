import node from '@astrojs/node';
import opentelemetry from '@astrojs/opentelemetry';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	integrations: [svelte(), opentelemetry()],
	vite: {
		build: {
			sourcemap: true,
		},
	},
});
