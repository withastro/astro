import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	base: '/base',
	output: 'static',
	adapter: node(),
	integrations: [react(), mdx()],
	trailingSlash: process.env.TRAILING_SLASH ?? 'always',
	security: {
		csp: true
	}
});
