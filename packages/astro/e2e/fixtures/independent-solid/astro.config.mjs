import mdx from '@astrojs/mdx';
import solid from '@astrojs/solid-js';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [solid(), mdx()],
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	experimental: {
		isIndependent: true,
	}
});
