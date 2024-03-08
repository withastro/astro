import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [preact(), mdx()],
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	experimental: {
		isIndependent: true,
	}
});
