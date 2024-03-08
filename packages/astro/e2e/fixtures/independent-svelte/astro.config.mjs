import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [svelte(), mdx()],
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	experimental: {
		isIndependent: true,
	}
});
