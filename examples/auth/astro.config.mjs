// @ts-check

import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	adapter: node({
		mode: 'standalone',
		middlewareMode: 'on-request',
	}),
});
