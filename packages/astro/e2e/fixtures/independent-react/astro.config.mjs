import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [react(), mdx()],
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	experimental: {
		isIndependent: true,
	}
});
